import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';
import { adminTokenLifetimeSeconds, isValidAdminPassword, issueAdminToken, requireAdmin } from './auth.js';
import { config, validateRuntimeConfig } from './config.js';
import {
  createOrder,
  createProduct,
  deleteProduct,
  getOrderById,
  listAdminProducts,
  listOrders,
  listPublicProducts,
  updateEmailNotificationStatus,
  updateOrderStatus,
  updateProduct,
} from './db.js';
import { emailNotificationsEnabled, sendOrderNotification } from './email.js';
import { orderStatuses, publicOrderSources } from '../shared/orders.js';

validateRuntimeConfig();

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (config.allowedOrigins.length === 0) {
        callback(null, true);
        return;
      }

      if (config.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: false,
  }),
);
app.use(compression());
app.use(express.json({ limit: '25kb' }));
app.use(express.urlencoded({ extended: false, limit: '25kb' }));

const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again shortly.' },
});

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many order attempts. Please wait before trying again.' },
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many admin login attempts. Please wait before trying again.' },
});

app.use('/api', globalApiLimiter);

const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(120),
    phone: z.string().trim().min(7).max(25),
    address: z.string().trim().min(8).max(500),
  }),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(20),
  requestId: z.string().uuid(),
  startedAt: z.number().int().positive(),
  botField: z.string().max(0),
  source: z.enum(publicOrderSources),
});

const adminLoginSchema = z.object({
  password: z.string().min(8).max(200),
});

const statusFilterSchema = z.enum(['ALL', ...orderStatuses] as const);

const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).default(''),
  status: statusFilterSchema.default('ALL'),
});

const updateStatusSchema = z.object({
  status: z.enum(orderStatuses),
});

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  price: z.number().nonnegative().max(1000000),
  image: z.string().trim().min(5).max(1000),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(5000),
  inventoryCount: z.number().int().min(0).max(1000000),
  soldCount: z.number().int().min(0).max(1000000),
  isActive: z.boolean(),
});

async function notifyOrderByEmail(orderId: string) {
  try {
    const order = getOrderById(orderId);

    if (!order) {
      return;
    }

    await sendOrderNotification(order);
    updateEmailNotificationStatus(order.id, 'sent');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email error';
    console.error(`Failed to send order email for ${orderId}:`, error);
    updateEmailNotificationStatus(orderId, 'failed', message);
  }
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'essential-goods-api',
    time: new Date().toISOString(),
  });
});

app.get('/api/products', (_req, res) => {
  res.json({
    products: listPublicProducts(),
  });
});

app.post('/api/orders', checkoutLimiter, (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: 'Invalid order payload.',
      issues: parsed.error.flatten(),
    });
    return;
  }

  const body = parsed.data;
  const elapsedMs = Date.now() - body.startedAt;

  if (elapsedMs < 2500) {
    res.status(400).json({ message: 'Order rejected by anti-bot protection.' });
    return;
  }

  try {
    const emailStatus = emailNotificationsEnabled() ? 'queued' : 'skipped';
    const result = createOrder({
      customer: body.customer,
      items: body.items,
      requestId: body.requestId,
      source: body.source,
      emailNotificationStatus: emailStatus,
    });

    res.status(result.wasDuplicate ? 200 : 201).json({
      duplicate: result.wasDuplicate,
      order: result.order,
    });

    if (!result.wasDuplicate && emailNotificationsEnabled()) {
      void notifyOrderByEmail(result.order.id);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown order error';
    res.status(400).json({ message });
  }
});

app.post('/api/admin/login', adminLoginLimiter, (req, res) => {
  const parsed = adminLoginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: 'Password is required.' });
    return;
  }

  if (!isValidAdminPassword(parsed.data.password)) {
    res.status(401).json({ message: 'Incorrect admin password.' });
    return;
  }

  res.json({
    token: issueAdminToken(),
    expiresInSeconds: adminTokenLifetimeSeconds,
  });
});

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const parsed = listOrdersQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid query parameters.' });
    return;
  }

  const { page, limit, search, status } = parsed.data;

  res.json(
    listOrders({
      page,
      limit,
      search,
      status: status === 'ALL' ? undefined : status,
    }),
  );
});

app.get('/api/admin/products', requireAdmin, (_req, res) => {
  res.json(listAdminProducts());
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const parsed = productSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid product payload.' });
    return;
  }

  const product = createProduct(parsed.data);
  res.status(201).json({ product });
});

app.patch('/api/admin/products/:productId', requireAdmin, (req, res) => {
  const parsed = productSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid product payload.' });
    return;
  }

  const productIdValue = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const productId = Number(productIdValue);

  if (!Number.isInteger(productId) || productId <= 0) {
    res.status(400).json({ message: 'Invalid product id.' });
    return;
  }

  const product = updateProduct(productId, parsed.data);

  if (!product) {
    res.status(404).json({ message: 'Product not found.' });
    return;
  }

  res.json({ product });
});

app.delete('/api/admin/products/:productId', requireAdmin, (req, res) => {
  const productIdValue = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const productId = Number(productIdValue);

  if (!Number.isInteger(productId) || productId <= 0) {
    res.status(400).json({ message: 'Invalid product id.' });
    return;
  }

  const deleted = deleteProduct(productId);

  if (!deleted) {
    res.status(404).json({ message: 'Product not found.' });
    return;
  }

  res.status(204).send();
});

app.patch('/api/admin/orders/:orderId/status', requireAdmin, (req, res) => {
  const parsed = updateStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid status.' });
    return;
  }

  const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
  const updatedOrder = updateOrderStatus(orderId, parsed.data.status);

  if (!updatedOrder) {
    res.status(404).json({ message: 'Order not found.' });
    return;
  }

  res.json({ order: updatedOrder });
});

const distDirectory = path.resolve(process.cwd(), 'dist');
const indexHtmlPath = path.join(distDirectory, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
  app.use(express.static(distDirectory));

  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      next();
      return;
    }

    res.sendFile(indexHtmlPath);
  });
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

app.listen(config.port, config.host, () => {
  console.log(`Essential Goods API listening on http://${config.host}:${config.port}`);
  console.log(`Admin dashboard path: ${config.adminPath}`);
  if (!emailNotificationsEnabled()) {
    console.log('Email notifications are disabled until SMTP settings are configured.');
  }
});
