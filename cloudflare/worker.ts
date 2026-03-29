import { calculateTotals, products as seedProducts } from '../src/data/products';
import { orderStatuses, publicOrderSources } from '../shared/orders';

type D1Meta = {
  changes?: number;
  last_row_id?: number;
};

type D1RunResult<Row = Record<string, unknown>> = {
  results?: Row[];
  meta: D1Meta;
  success?: boolean;
};

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<Row = Record<string, unknown>>(column?: string): Promise<Row | null>;
  run<Row = Record<string, unknown>>(): Promise<D1RunResult<Row>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<Row = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<Array<D1RunResult<Row>>>;
  exec(query: string): Promise<unknown>;
}

type Env = {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  JWT_SECRET: string;
};

type ProductRow = {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  inventory_count: number;
  sold_count: number;
  is_active: number;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  id: string;
  order_number: string;
  request_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  status: string;
  subtotal: number;
  tax: number;
  shipping: number;
  handling: number;
  total: number;
  item_count: number;
  source: string;
  email_notification_status: string;
  email_notification_error: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
};

type OrderItemRow = {
  id?: number;
  order_id: string;
  product_id: number;
  product_name: string;
  category: string;
  image: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

type ProductMutationInput = {
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  inventoryCount: number;
  soldCount: number;
  isActive: boolean;
};

type CreateOrderInput = {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  requestId: string;
  startedAt: number;
  botField: string;
  source: (typeof publicOrderSources)[number];
};

const adminTokenLifetimeSeconds = 60 * 60 * 12;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const allowedOrigins = new Set([
  'https://essentialgoods.netlify.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]);

const schemaStatements = [
  `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      inventory_count INTEGER NOT NULL DEFAULT 0,
      sold_count INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      request_id TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      status TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      shipping REAL NOT NULL,
      handling REAL NOT NULL,
      total REAL NOT NULL,
      item_count INTEGER NOT NULL,
      source TEXT NOT NULL,
      email_notification_status TEXT NOT NULL,
      email_notification_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      delivered_at TEXT
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL,
      image TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      line_total REAL NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS order_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,
  'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
  'CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)',
  'CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email)',
  'CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)',
];

let schemaPromise: Promise<void> | null = null;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = getCorsHeaders(request);

    if (!isOriginAllowed(request)) {
      return json({ message: 'Origin not allowed.' }, 403, corsHeaders);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      await ensureSchema(env);
      return await routeRequest(request, env, corsHeaders);
    } catch (error) {
      console.error('Worker request failed:', error);
      return json({ message: 'Internal server error.' }, 500, corsHeaders);
    }
  },
};

async function routeRequest(request: Request, env: Env, corsHeaders: HeadersInit) {
  const url = new URL(request.url);
  const { pathname, searchParams } = url;

  if (request.method === 'GET' && pathname === '/api/health') {
    return json(
      {
        ok: true,
        service: 'essential-goods-edge-api',
        time: new Date().toISOString(),
      },
      200,
      corsHeaders,
    );
  }

  if (request.method === 'GET' && pathname === '/api/products') {
    return json({ products: await listPublicProducts(env) }, 200, corsHeaders);
  }

  if (request.method === 'POST' && pathname === '/api/orders') {
    const body = await parseJson(request);
    const payload = validateCreateOrderPayload(body);

    if (!payload.ok) {
      return json({ message: payload.message }, 400, corsHeaders);
    }

    if (Date.now() - payload.value.startedAt < 2500) {
      return json({ message: 'Order rejected by anti-bot protection.' }, 400, corsHeaders);
    }

    try {
      const result = await createOrder(env, payload.value);
      return json({ duplicate: result.wasDuplicate, order: result.order }, result.wasDuplicate ? 200 : 201, corsHeaders);
    } catch (error) {
      return json({ message: error instanceof Error ? error.message : 'Unable to create order.' }, 400, corsHeaders);
    }
  }

  if (request.method === 'POST' && pathname === '/api/admin/login') {
    const body = await parseJson(request);
    const record = asRecord(body);
    const password = parseString(record?.password, 8, 200);

    if (!password) {
      return json({ message: 'Password is required.' }, 400, corsHeaders);
    }

    if (!(await isValidAdminPassword(password, env.ADMIN_PASSWORD))) {
      return json({ message: 'Incorrect admin password.' }, 401, corsHeaders);
    }

    return json(
      {
        token: await issueAdminToken(env.JWT_SECRET),
        expiresInSeconds: adminTokenLifetimeSeconds,
      },
      200,
      corsHeaders,
    );
  }

  const tokenError = await requireAdmin(request, env.JWT_SECRET);

  if (tokenError) {
    return json({ message: tokenError }, 401, corsHeaders);
  }

  if (request.method === 'GET' && pathname === '/api/admin/products') {
    return json(await listAdminProducts(env), 200, corsHeaders);
  }

  if (request.method === 'POST' && pathname === '/api/admin/products') {
    const body = await parseJson(request);
    const product = validateProductPayload(body);

    if (!product.ok) {
      return json({ message: product.message }, 400, corsHeaders);
    }

    const created = await createProduct(env, product.value);
    return json({ product: created }, 201, corsHeaders);
  }

  const adminProductMatch = pathname.match(/^\/api\/admin\/products\/(\d+)$/);

  if (adminProductMatch && request.method === 'PATCH') {
    const productId = Number(adminProductMatch[1]);
    const body = await parseJson(request);
    const product = validateProductPayload(body);

    if (!product.ok) {
      return json({ message: product.message }, 400, corsHeaders);
    }

    const updated = await updateProduct(env, productId, product.value);

    if (!updated) {
      return json({ message: 'Product not found.' }, 404, corsHeaders);
    }

    return json({ product: updated }, 200, corsHeaders);
  }

  if (adminProductMatch && request.method === 'DELETE') {
    const productId = Number(adminProductMatch[1]);
    const deleted = await deleteProduct(env, productId);

    if (!deleted) {
      return json({ message: 'Product not found.' }, 404, corsHeaders);
    }

    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method === 'GET' && pathname === '/api/admin/orders') {
    const page = clampInteger(searchParams.get('page'), 1, 100000, 1);
    const limit = clampInteger(searchParams.get('limit'), 1, 100, 20);
    const search = parseSearch(searchParams.get('search'));
    const status = parseOrderStatus(searchParams.get('status'));

    if (search === null) {
      return json({ message: 'Invalid search query.' }, 400, corsHeaders);
    }

    if (status === null) {
      return json({ message: 'Invalid status filter.' }, 400, corsHeaders);
    }

    return json(
      await listOrders(env, {
        page,
        limit,
        search,
        status: status === 'ALL' ? undefined : status,
      }),
      200,
      corsHeaders,
    );
  }

  const adminOrderMatch = pathname.match(/^\/api\/admin\/orders\/([a-f0-9-]+)\/status$/i);

  if (adminOrderMatch && request.method === 'PATCH') {
    const body = await parseJson(request);
    const record = asRecord(body);
    const status = parseOrderStatus(record?.status);

    if (!status || status === 'ALL') {
      return json({ message: 'Invalid status.' }, 400, corsHeaders);
    }

    const updated = await updateOrderStatus(env, adminOrderMatch[1], status);

    if (!updated) {
      return json({ message: 'Order not found.' }, 404, corsHeaders);
    }

    return json({ order: updated }, 200, corsHeaders);
  }

  return json({ message: 'Not found.' }, 404, corsHeaders);
}

async function ensureSchema(env: Env) {
  if (!schemaPromise) {
    schemaPromise = initializeDatabase(env).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  await schemaPromise;
}

function getCorsHeaders(request: Request) {
  const origin = request.headers.get('Origin');
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  });

  if (origin && allowedOrigins.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }

  return headers;
}

function isOriginAllowed(request: Request) {
  const origin = request.headers.get('Origin');
  return !origin || allowedOrigins.has(origin);
}

function json(data: unknown, status: number, corsHeaders: HeadersInit) {
  const headers = new Headers(corsHeaders);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { status, headers });
}

async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function parseString(value: unknown, min: number, max: number) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max ? trimmed : null;
}

function parseEmail(value: unknown) {
  const email = parseString(value, 5, 120);
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function parseInteger(value: unknown, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    return null;
  }

  return value;
}

function parseNumber(value: unknown, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    return null;
  }

  return value;
}

function clampInteger(value: string | null, min: number, max: number, fallback: number) {
  const parsed = value ? Number(value) : fallback;

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

function parseSearch(value: string | null) {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  return trimmed.length <= 100 ? trimmed : null;
}

function parseOrderStatus(value: unknown) {
  if (value === 'ALL') {
    return 'ALL' as const;
  }

  if (typeof value === 'string' && orderStatuses.includes(value as (typeof orderStatuses)[number])) {
    return value as (typeof orderStatuses)[number];
  }

  if (value == null || value === '') {
    return 'ALL' as const;
  }

  return null;
}

function parseOrderSource(value: unknown) {
  if (typeof value === 'string' && publicOrderSources.includes(value as (typeof publicOrderSources)[number])) {
    return value as (typeof publicOrderSources)[number];
  }

  return null;
}

function buildOrderNumber() {
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 5).toUpperCase();
  return `EG-${dateStamp}-${suffix}`;
}

function nowIso() {
  return new Date().toISOString();
}

async function initializeDatabase(env: Env) {
  await env.DB.batch(schemaStatements.map((statement) => env.DB.prepare(statement)));

  const countRow = await env.DB.prepare('SELECT COUNT(*) AS count FROM products').first<{ count: number }>();

  if (Number(countRow?.count ?? 0) > 0) {
    return;
  }

  const timestamp = nowIso();

  for (const product of seedProducts) {
    await env.DB
      .prepare(`
        INSERT INTO products (
          id,
          name,
          price,
          image,
          category,
          description,
          inventory_count,
          sold_count,
          is_active,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        product.id,
        product.name,
        product.price,
        product.image,
        product.category,
        product.description,
        product.inventoryCount,
        product.soldCount,
        product.isActive ? 1 : 0,
        timestamp,
        timestamp,
      )
      .run();
  }
}

async function listPublicProducts(env: Env) {
  const result = await env.DB
    .prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY category ASC, updated_at DESC')
    .run<ProductRow>();

  return (result.results ?? []).map(mapProductRow);
}

async function listAdminProducts(env: Env) {
  const result = await env.DB
    .prepare('SELECT * FROM products ORDER BY updated_at DESC, id DESC')
    .run<ProductRow>();

  return {
    products: (result.results ?? []).map(mapProductRow),
    summary: await getProductSummary(env),
  };
}

async function getProductSummary(env: Env) {
  const row = await env.DB
    .prepare(`
      SELECT
        COUNT(*) AS total_products,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_products,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive_products,
        SUM(CASE WHEN inventory_count <= 5 THEN 1 ELSE 0 END) AS low_stock_products,
        SUM(inventory_count) AS total_inventory_units,
        SUM(sold_count) AS total_sold_units
      FROM products
    `)
    .first<Record<string, number | null>>();

  return {
    totalProducts: Number(row?.total_products ?? 0),
    activeProducts: Number(row?.active_products ?? 0),
    inactiveProducts: Number(row?.inactive_products ?? 0),
    lowStockProducts: Number(row?.low_stock_products ?? 0),
    totalInventoryUnits: Number(row?.total_inventory_units ?? 0),
    totalSoldUnits: Number(row?.total_sold_units ?? 0),
  };
}

async function getProductById(env: Env, productId: number) {
  const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(productId).first<ProductRow>();
  return row ? mapProductRow(row) : null;
}

async function createProduct(env: Env, input: ProductMutationInput) {
  const timestamp = nowIso();
  const result = await env.DB
    .prepare(`
      INSERT INTO products (
        name,
        price,
        image,
        category,
        description,
        inventory_count,
        sold_count,
        is_active,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      input.name,
      input.price,
      input.image,
      input.category,
      input.description,
      input.inventoryCount,
      input.soldCount,
      input.isActive ? 1 : 0,
      timestamp,
      timestamp,
    )
    .run();

  return getProductById(env, Number(result.meta.last_row_id));
}

async function updateProduct(env: Env, productId: number, input: ProductMutationInput) {
  const existing = await getProductById(env, productId);

  if (!existing) {
    return null;
  }

  await env.DB
    .prepare(`
      UPDATE products
      SET name = ?,
          price = ?,
          image = ?,
          category = ?,
          description = ?,
          inventory_count = ?,
          sold_count = ?,
          is_active = ?,
          updated_at = ?
      WHERE id = ?
    `)
    .bind(
      input.name,
      input.price,
      input.image,
      input.category,
      input.description,
      input.inventoryCount,
      input.soldCount,
      input.isActive ? 1 : 0,
      nowIso(),
      productId,
    )
    .run();

  return getProductById(env, productId);
}

async function deleteProduct(env: Env, productId: number) {
  const result = await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(productId).run();
  return Number(result.meta.changes ?? 0) > 0;
}

function mapProductRow(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    image: row.image,
    category: row.category,
    description: row.description,
    inventoryCount: Number(row.inventory_count),
    soldCount: Number(row.sold_count),
    isActive: Boolean(row.is_active),
  };
}

async function getProductRowsByIds(env: Env, productIds: number[]) {
  if (productIds.length === 0) {
    return [] as ProductRow[];
  }

  const placeholders = productIds.map(() => '?').join(', ');
  const result = await env.DB
    .prepare(`SELECT * FROM products WHERE id IN (${placeholders})`)
    .bind(...productIds)
    .run<ProductRow>();

  return result.results ?? [];
}

async function normalizeItems(env: Env, items: CreateOrderInput['items']) {
  const quantities = new Map<number, number>();

  for (const item of items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  const productIds = Array.from(quantities.keys());
  const products = await getProductRowsByIds(env, productIds);
  const productMap = new Map(products.map((product) => [product.id, product]));

  const normalized = productIds.map((productId) => {
    const quantity = quantities.get(productId) ?? 0;
    const product = productMap.get(productId);

    if (!product || !product.is_active) {
      throw new Error(`Product ${productId} is not currently available.`);
    }

    if (quantity > 10) {
      throw new Error(`Quantity for ${product.name} exceeds the allowed limit.`);
    }

    if (product.inventory_count < quantity) {
      throw new Error(`Only ${product.inventory_count} unit(s) left for ${product.name}.`);
    }

    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      image: product.image,
      unitPrice: product.price,
      quantity,
      lineTotal: Number((product.price * quantity).toFixed(2)),
    };
  });

  const totalUnits = normalized.reduce((sum, item) => sum + item.quantity, 0);

  if (normalized.length === 0 || totalUnits === 0) {
    throw new Error('Order must include at least one item.');
  }

  if (totalUnits > 25) {
    throw new Error('Order exceeds the maximum allowed quantity.');
  }

  return normalized;
}

async function createOrder(env: Env, payload: CreateOrderInput) {
  const existingOrder = await getOrderByRequestId(env, payload.requestId);

  if (existingOrder) {
    return {
      order: existingOrder,
      wasDuplicate: true,
    };
  }

  const normalizedItems = await normalizeItems(env, payload.items);
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const totals = calculateTotals(subtotal);
  const itemCount = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
  const orderId = crypto.randomUUID();
  const orderNumber = buildOrderNumber();
  const createdAt = nowIso();

  const statements: D1PreparedStatement[] = [
    env.DB
      .prepare(`
        INSERT INTO orders (
          id,
          order_number,
          request_id,
          customer_name,
          customer_email,
          customer_phone,
          customer_address,
          status,
          subtotal,
          tax,
          shipping,
          handling,
          total,
          item_count,
          source,
          email_notification_status,
          email_notification_error,
          created_at,
          updated_at,
          delivered_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        orderId,
        orderNumber,
        payload.requestId,
        payload.customer.name,
        payload.customer.email,
        payload.customer.phone,
        payload.customer.address,
        'PENDING',
        totals.subtotal,
        totals.tax,
        totals.shipping,
        totals.handling,
        totals.total,
        itemCount,
        payload.source,
        'skipped',
        null,
        createdAt,
        createdAt,
        null,
      ),
  ];

  const insertItem = env.DB.prepare(`
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      category,
      image,
      unit_price,
      quantity,
      line_total
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateInventory = env.DB.prepare(`
    UPDATE products
    SET inventory_count = inventory_count - ?,
        sold_count = sold_count + ?,
        updated_at = ?
    WHERE id = ? AND inventory_count >= ?
  `);

  for (const item of normalizedItems) {
    statements.push(
      insertItem.bind(
        orderId,
        item.productId,
        item.productName,
        item.category,
        item.image,
        item.unitPrice,
        item.quantity,
        item.lineTotal,
      ),
    );
    statements.push(updateInventory.bind(item.quantity, item.quantity, createdAt, item.productId, item.quantity));
  }

  statements.push(
    env.DB
      .prepare(`
        INSERT INTO order_events (order_id, event_type, event_message, created_at)
        VALUES (?, ?, ?, ?)
      `)
      .bind(orderId, 'ORDER_CREATED', 'Order created from storefront checkout.', createdAt),
  );

  const results = await env.DB.batch(statements);

  for (let index = 2; index < results.length - 1; index += 2) {
    const inventoryResult = results[index];

    if (Number(inventoryResult.meta.changes ?? 0) === 0) {
      throw new Error('Unable to reserve stock for one or more items.');
    }
  }

  const created = await getOrderById(env, orderId);

  if (!created) {
    throw new Error('Failed to load the order after creation.');
  }

  return {
    order: created,
    wasDuplicate: false,
  };
}

async function listOrders(
  env: Env,
  options: {
    page: number;
    limit: number;
    search: string;
    status?: (typeof orderStatuses)[number];
  },
) {
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (options.status) {
    clauses.push('status = ?');
    params.push(options.status);
  }

  if (options.search) {
    const term = `%${options.search.trim()}%`;
    clauses.push(`
      (
        order_number LIKE ?
        OR customer_name LIKE ?
        OR customer_email LIKE ?
        OR customer_phone LIKE ?
      )
    `);
    params.push(term, term, term, term);
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const offset = (options.page - 1) * options.limit;

  const totalRow = await env.DB
    .prepare(`SELECT COUNT(*) AS count FROM orders ${whereClause}`)
    .bind(...params)
    .first<{ count: number }>();

  const orderRowsResult = await env.DB
    .prepare(`SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .bind(...params, options.limit, offset)
    .run<OrderRow>();

  const orderRows = orderRowsResult.results ?? [];
  const itemMap = await getItemRowsForOrderIds(env, orderRows.map((row) => row.id));

  return {
    orders: orderRows.map((row) => mapOrderRow(row, itemMap.get(row.id) ?? [])),
    summary: await getOrderSummary(env),
    pagination: {
      page: options.page,
      limit: options.limit,
      total: Number(totalRow?.count ?? 0),
      pages: Math.max(1, Math.ceil(Number(totalRow?.count ?? 0) / options.limit)),
    },
  };
}

async function getOrderSummary(env: Env) {
  const row = await env.DB
    .prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) AS processing,
        SUM(CASE WHEN status = 'SHIPPED' THEN 1 ELSE 0 END) AS shipped,
        SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled
      FROM orders
    `)
    .first<Record<string, number | null>>();

  return {
    total: Number(row?.total ?? 0),
    pending: Number(row?.pending ?? 0),
    processing: Number(row?.processing ?? 0),
    shipped: Number(row?.shipped ?? 0),
    delivered: Number(row?.delivered ?? 0),
    cancelled: Number(row?.cancelled ?? 0),
  };
}

async function updateOrderStatus(env: Env, orderId: string, status: (typeof orderStatuses)[number]) {
  const currentOrder = await getOrderById(env, orderId);

  if (!currentOrder) {
    return null;
  }

  const updatedAt = nowIso();
  const deliveredAt = status === 'DELIVERED' ? updatedAt : null;

  await env.DB.batch([
    env.DB
      .prepare(`
        UPDATE orders
        SET status = ?, updated_at = ?, delivered_at = ?
        WHERE id = ?
      `)
      .bind(status, updatedAt, deliveredAt, orderId),
    env.DB
      .prepare(`
        INSERT INTO order_events (order_id, event_type, event_message, created_at)
        VALUES (?, ?, ?, ?)
      `)
      .bind(orderId, 'STATUS_UPDATED', `Order status changed from ${currentOrder.status} to ${status}.`, updatedAt),
  ]);

  return getOrderById(env, orderId);
}

async function getOrderById(env: Env, orderId: string) {
  const orderRow = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first<OrderRow>();

  if (!orderRow) {
    return null;
  }

  const itemsResult = await env.DB
    .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC')
    .bind(orderId)
    .run<OrderItemRow>();

  return mapOrderRow(orderRow, itemsResult.results ?? []);
}

async function getOrderByRequestId(env: Env, requestId: string) {
  const row = await env.DB
    .prepare('SELECT id FROM orders WHERE request_id = ?')
    .bind(requestId)
    .first<{ id: string }>();

  return row ? getOrderById(env, row.id) : null;
}

async function getItemRowsForOrderIds(env: Env, orderIds: string[]) {
  const grouped = new Map<string, OrderItemRow[]>();

  if (orderIds.length === 0) {
    return grouped;
  }

  const placeholders = orderIds.map(() => '?').join(', ');
  const result = await env.DB
    .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id ASC`)
    .bind(...orderIds)
    .run<OrderItemRow>();

  for (const row of result.results ?? []) {
    const items = grouped.get(row.order_id) ?? [];
    items.push(row);
    grouped.set(row.order_id, items);
  }

  return grouped;
}

function mapOrderRow(orderRow: OrderRow, itemRows: OrderItemRow[]) {
  return {
    id: orderRow.id,
    orderNumber: orderRow.order_number,
    customer: {
      name: orderRow.customer_name,
      email: orderRow.customer_email,
      phone: orderRow.customer_phone,
      address: orderRow.customer_address,
    },
    items: itemRows.map((item) => ({
      productId: Number(item.product_id),
      productName: item.product_name,
      category: item.category,
      image: item.image,
      unitPrice: Number(item.unit_price),
      quantity: Number(item.quantity),
      lineTotal: Number(item.line_total),
    })),
    status: orderRow.status,
    subtotal: Number(orderRow.subtotal),
    tax: Number(orderRow.tax),
    shipping: Number(orderRow.shipping),
    handling: Number(orderRow.handling),
    total: Number(orderRow.total),
    itemCount: Number(orderRow.item_count),
    source: orderRow.source,
    emailNotificationStatus: orderRow.email_notification_status,
    emailNotificationError: orderRow.email_notification_error,
    createdAt: orderRow.created_at,
    updatedAt: orderRow.updated_at,
    deliveredAt: orderRow.delivered_at,
  };
}

function validateCreateOrderPayload(input: unknown) {
  const body = asRecord(input);
  const customer = asRecord(body?.customer);
  const items = Array.isArray(body?.items) ? body.items : null;
  const requestId = parseString(body?.requestId, 10, 100);
  const startedAt = typeof body?.startedAt === 'number' && Number.isFinite(body.startedAt) ? body.startedAt : null;
  const botField = typeof body?.botField === 'string' ? body.botField : null;
  const source = parseOrderSource(body?.source);

  if (!customer || !items || !requestId || startedAt === null || botField === null || !source) {
    return { ok: false as const, message: 'Invalid order payload.' };
  }

  const parsedCustomer = {
    name: parseString(customer.name, 2, 80),
    email: parseEmail(customer.email),
    phone: parseString(customer.phone, 7, 25),
    address: parseString(customer.address, 8, 500),
  };

  if (!parsedCustomer.name || !parsedCustomer.email || !parsedCustomer.phone || !parsedCustomer.address) {
    return { ok: false as const, message: 'Invalid customer details.' };
  }

  if (items.length < 1 || items.length > 20) {
    return { ok: false as const, message: 'Invalid order items.' };
  }

  const parsedItems = items.map((item) => {
    const record = asRecord(item);
    const productId = parseInteger(record?.productId, 1, 1000000000);
    const quantity = parseInteger(record?.quantity, 1, 10);

    if (productId === null || quantity === null) {
      return null;
    }

    return { productId, quantity };
  });

  if (parsedItems.some((item) => item === null)) {
    return { ok: false as const, message: 'Invalid order items.' };
  }

  if (botField.length > 0) {
    return { ok: false as const, message: 'Order rejected by anti-bot protection.' };
  }

  return {
    ok: true as const,
    value: {
      customer: parsedCustomer,
      items: parsedItems as CreateOrderInput['items'],
      requestId,
      startedAt,
      botField,
      source,
    },
  };
}

function validateProductPayload(input: unknown) {
  const body = asRecord(input);

  if (!body) {
    return { ok: false as const, message: 'Invalid product payload.' };
  }

  const product = {
    name: parseString(body.name, 2, 120),
    price: parseNumber(body.price, 0, 1000000),
    image: parseString(body.image, 5, 1000),
    category: parseString(body.category, 2, 80),
    description: parseString(body.description, 10, 5000),
    inventoryCount: parseInteger(body.inventoryCount, 0, 1000000),
    soldCount: parseInteger(body.soldCount, 0, 1000000),
    isActive: typeof body.isActive === 'boolean' ? body.isActive : null,
  };

  if (
    !product.name ||
    product.price === null ||
    !product.image ||
    !product.category ||
    !product.description ||
    product.inventoryCount === null ||
    product.soldCount === null ||
    product.isActive === null
  ) {
    return { ok: false as const, message: 'Invalid product payload.' };
  }

  return {
    ok: true as const,
    value: product as ProductMutationInput,
  };
}

async function requireAdmin(request: Request, secret: string) {
  const authorization = request.headers.get('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return 'Missing admin token.';
  }

  const token = authorization.slice('Bearer '.length);
  const payload = await verifySignedToken(token, secret);

  if (!payload || payload.role !== 'admin') {
    return 'Invalid or expired admin token.';
  }

  return null;
}

async function issueAdminToken(secret: string) {
  const payload = {
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + adminTokenLifetimeSeconds,
    iat: Math.floor(Date.now() / 1000),
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = await createSignature(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

async function verifySignedToken(token: string, secret: string) {
  const parts = token.split('.');

  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = parts;
  const expectedSignature = await createSignature(encodedPayload, secret);

  if (!constantTimeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as {
      role?: string;
      exp?: number;
    };

    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function isValidAdminPassword(candidate: string, actual: string) {
  const [left, right] = await Promise.all([digest(candidate), digest(actual)]);
  return constantTimeEqual(left, right);
}

async function createSignature(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function digest(value: string) {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(hash));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function encodeBase64Url(value: string) {
  return bytesToBase64Url(encoder.encode(value));
}

function decodeBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return decoder.decode(bytes);
}
