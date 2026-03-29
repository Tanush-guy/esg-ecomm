import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import { calculateTotals, products as seedProducts } from '../src/data/products.js';
import type { Product } from '../src/data/products.js';
import type {
  EmailNotificationStatus,
  OrderRecord,
  OrderRequestItem,
  OrderSource,
  OrderStatus,
  OrderSummary,
} from '../shared/orders.js';
import { config } from './config.js';

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
  order_id: string;
  product_id: number;
  product_name: string;
  category: string;
  image: string;
  unit_price: number;
  quantity: number;
  line_total: number;
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

type CreateOrderParams = {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: OrderRequestItem[];
  requestId: string;
  source: OrderSource;
  emailNotificationStatus: EmailNotificationStatus;
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

type ListOrdersParams = {
  page: number;
  limit: number;
  search: string;
  status?: OrderStatus;
};

type CreateOrderResult = {
  order: OrderRecord;
  wasDuplicate: boolean;
};

function ensureStorageDirectory(filePath: string) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function buildOrderNumber() {
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `EG-${dateStamp}-${suffix}`;
}

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    image: row.image,
    category: row.category,
    description: row.description,
    inventoryCount: row.inventory_count,
    soldCount: row.sold_count,
    isActive: Boolean(row.is_active),
  };
}

function mapOrderRow(orderRow: OrderRow, itemRows: OrderItemRow[]): OrderRecord {
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
      productId: item.product_id,
      productName: item.product_name,
      category: item.category,
      image: item.image,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      lineTotal: item.line_total,
    })),
    status: orderRow.status as OrderStatus,
    subtotal: orderRow.subtotal,
    tax: orderRow.tax,
    shipping: orderRow.shipping,
    handling: orderRow.handling,
    total: orderRow.total,
    itemCount: orderRow.item_count,
    source: orderRow.source as OrderSource,
    emailNotificationStatus: orderRow.email_notification_status as EmailNotificationStatus,
    emailNotificationError: orderRow.email_notification_error,
    createdAt: orderRow.created_at,
    updatedAt: orderRow.updated_at,
    deliveredAt: orderRow.delivered_at,
  };
}

ensureStorageDirectory(config.databaseFile);

const database = new Database(config.databaseFile);
database.pragma('journal_mode = WAL');
database.pragma('foreign_keys = ON');
database.pragma('synchronous = NORMAL');
database.pragma('busy_timeout = 5000');

database.exec(`
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
  );

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
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    image TEXT NOT NULL,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    line_total REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS order_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_message TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
  CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
  CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
`);

const countProductsStatement = database.prepare('SELECT COUNT(*) AS count FROM products');
const insertSeedProductStatement = database.prepare(`
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
`);

const insertSeedProductsTransaction = database.transaction((items: Product[]) => {
  const timestamp = nowIso();

  for (const item of items) {
    insertSeedProductStatement.run(
      item.id,
      item.name,
      item.price,
      item.image,
      item.category,
      item.description,
      item.inventoryCount,
      item.soldCount,
      item.isActive ? 1 : 0,
      timestamp,
      timestamp,
    );
  }
});

const productCountRow = countProductsStatement.get() as { count: number };

if (productCountRow.count === 0) {
  insertSeedProductsTransaction(seedProducts);
}

const insertOrderStatement = database.prepare(`
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
`);

const insertOrderItemStatement = database.prepare(`
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

const insertOrderEventStatement = database.prepare(`
  INSERT INTO order_events (order_id, event_type, event_message, created_at)
  VALUES (?, ?, ?, ?)
`);

const updateInventoryStatement = database.prepare(`
  UPDATE products
  SET inventory_count = inventory_count - ?,
      sold_count = sold_count + ?,
      updated_at = ?
  WHERE id = ? AND inventory_count >= ?
`);

const insertProductStatement = database.prepare(`
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
`);

const updateProductStatement = database.prepare(`
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
`);

function getProductRowsByIds(productIds: number[]) {
  if (productIds.length === 0) {
    return [];
  }

  const placeholders = productIds.map(() => '?').join(', ');
  return database
    .prepare(`SELECT * FROM products WHERE id IN (${placeholders})`)
    .all(...productIds) as ProductRow[];
}

function getItemRowsForOrderIds(orderIds: string[]) {
  if (orderIds.length === 0) {
    return new Map<string, OrderItemRow[]>();
  }

  const placeholders = orderIds.map(() => '?').join(', ');
  const rows = database
    .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id ASC`)
    .all(...orderIds) as OrderItemRow[];

  const grouped = new Map<string, OrderItemRow[]>();

  for (const row of rows) {
    const items = grouped.get(row.order_id) ?? [];
    items.push(row);
    grouped.set(row.order_id, items);
  }

  return grouped;
}

function normalizeItems(items: OrderRequestItem[]) {
  const quantities = new Map<number, number>();

  for (const item of items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  const productRows = getProductRowsByIds(Array.from(quantities.keys()));
  const productMap = new Map(productRows.map((row) => [row.id, row]));

  const normalized = Array.from(quantities.entries()).map(([productId, quantity]) => {
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

export function listPublicProducts() {
  const rows = database
    .prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY category ASC, updated_at DESC')
    .all() as ProductRow[];

  return rows.map(mapProductRow);
}

export function listAdminProducts() {
  const rows = database
    .prepare('SELECT * FROM products ORDER BY updated_at DESC, id DESC')
    .all() as ProductRow[];

  return {
    products: rows.map(mapProductRow),
    summary: getProductSummary(),
  };
}

export function getProductSummary() {
  const row = database
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
    .get() as Record<string, number | null>;

  return {
    totalProducts: Number(row.total_products ?? 0),
    activeProducts: Number(row.active_products ?? 0),
    inactiveProducts: Number(row.inactive_products ?? 0),
    lowStockProducts: Number(row.low_stock_products ?? 0),
    totalInventoryUnits: Number(row.total_inventory_units ?? 0),
    totalSoldUnits: Number(row.total_sold_units ?? 0),
  };
}

export function getProductById(productId: number) {
  const row = database.prepare('SELECT * FROM products WHERE id = ?').get(productId) as ProductRow | undefined;
  return row ? mapProductRow(row) : null;
}

export function createProduct(input: ProductMutationInput) {
  const timestamp = nowIso();
  const result = insertProductStatement.run(
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
  );

  return getProductById(Number(result.lastInsertRowid));
}

export function updateProduct(productId: number, input: ProductMutationInput) {
  const existingProduct = getProductById(productId);

  if (!existingProduct) {
    return null;
  }

  updateProductStatement.run(
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
  );

  return getProductById(productId);
}

export function deleteProduct(productId: number) {
  const existingProduct = getProductById(productId);

  if (!existingProduct) {
    return false;
  }

  database.prepare('DELETE FROM products WHERE id = ?').run(productId);
  return true;
}

export function getOrderById(orderId: string) {
  const orderRow = database.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderRow | undefined;

  if (!orderRow) {
    return null;
  }

  const itemRows = database
    .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC')
    .all(orderId) as OrderItemRow[];

  return mapOrderRow(orderRow, itemRows);
}

function getOrderByRequestId(requestId: string) {
  const orderRow = database
    .prepare('SELECT * FROM orders WHERE request_id = ?')
    .get(requestId) as OrderRow | undefined;

  return orderRow ? getOrderById(orderRow.id) : null;
}

const insertOrderTransaction = database.transaction(
  (
    orderId: string,
    orderNumber: string,
    params: CreateOrderParams,
    subtotal: number,
    tax: number,
    shipping: number,
    handling: number,
    total: number,
    itemCount: number,
    createdAt: string,
    itemRows: ReturnType<typeof normalizeItems>,
  ) => {
    insertOrderStatement.run(
      orderId,
      orderNumber,
      params.requestId,
      params.customer.name,
      params.customer.email,
      params.customer.phone,
      params.customer.address,
      'PENDING',
      subtotal,
      tax,
      shipping,
      handling,
      total,
      itemCount,
      params.source,
      params.emailNotificationStatus,
      null,
      createdAt,
      createdAt,
      null,
    );

    for (const item of itemRows) {
      insertOrderItemStatement.run(
        orderId,
        item.productId,
        item.productName,
        item.category,
        item.image,
        item.unitPrice,
        item.quantity,
        item.lineTotal,
      );

      const inventoryUpdate = updateInventoryStatement.run(
        item.quantity,
        item.quantity,
        createdAt,
        item.productId,
        item.quantity,
      );

      if (inventoryUpdate.changes === 0) {
        throw new Error(`Unable to reserve stock for ${item.productName}.`);
      }
    }

    insertOrderEventStatement.run(orderId, 'ORDER_CREATED', 'Order created from storefront checkout.', createdAt);
  },
);

export function createOrder(params: CreateOrderParams): CreateOrderResult {
  const existingOrder = getOrderByRequestId(params.requestId);

  if (existingOrder) {
    return { order: existingOrder, wasDuplicate: true };
  }

  const normalizedItems = normalizeItems(params.items);
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const totals = calculateTotals(subtotal);
  const itemCount = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
  const orderId = randomUUID();
  const orderNumber = buildOrderNumber();
  const createdAt = nowIso();

  insertOrderTransaction(
    orderId,
    orderNumber,
    params,
    totals.subtotal,
    totals.tax,
    totals.shipping,
    totals.handling,
    totals.total,
    itemCount,
    createdAt,
    normalizedItems,
  );

  const createdOrder = getOrderById(orderId);

  if (!createdOrder) {
    throw new Error('Failed to load the order after creation.');
  }

  return { order: createdOrder, wasDuplicate: false };
}

export function listOrders({ page, limit, search, status }: ListOrdersParams) {
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (status) {
    clauses.push('status = ?');
    params.push(status);
  }

  if (search) {
    const term = `%${search.trim()}%`;
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
  const offset = (page - 1) * limit;

  const totalRow = database
    .prepare(`SELECT COUNT(*) AS count FROM orders ${whereClause}`)
    .get(...params) as { count: number };

  const orderRows = database
    .prepare(`SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as OrderRow[];

  const itemMap = getItemRowsForOrderIds(orderRows.map((row) => row.id));

  return {
    orders: orderRows.map((row) => mapOrderRow(row, itemMap.get(row.id) ?? [])),
    summary: getOrderSummary(),
    pagination: {
      page,
      limit,
      total: totalRow.count,
      pages: Math.max(1, Math.ceil(totalRow.count / limit)),
    },
  };
}

export function getOrderSummary(): OrderSummary {
  const row = database
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
    .get() as Record<string, number | null>;

  return {
    total: Number(row.total ?? 0),
    pending: Number(row.pending ?? 0),
    processing: Number(row.processing ?? 0),
    shipped: Number(row.shipped ?? 0),
    delivered: Number(row.delivered ?? 0),
    cancelled: Number(row.cancelled ?? 0),
  };
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  const currentOrder = getOrderById(orderId);

  if (!currentOrder) {
    return null;
  }

  const updatedAt = nowIso();
  const deliveredAt = status === 'DELIVERED' ? updatedAt : null;

  database
    .prepare(`
      UPDATE orders
      SET status = ?, updated_at = ?, delivered_at = ?
      WHERE id = ?
    `)
    .run(status, updatedAt, deliveredAt, orderId);

  insertOrderEventStatement.run(
    orderId,
    'STATUS_UPDATED',
    `Order status changed from ${currentOrder.status} to ${status}.`,
    updatedAt,
  );

  return getOrderById(orderId);
}

export function updateEmailNotificationStatus(
  orderId: string,
  status: EmailNotificationStatus,
  errorMessage: string | null = null,
) {
  database
    .prepare(`
      UPDATE orders
      SET email_notification_status = ?, email_notification_error = ?, updated_at = ?
      WHERE id = ?
    `)
    .run(status, errorMessage, nowIso(), orderId);
}
