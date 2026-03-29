export const orderStatuses = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const publicOrderSources = ['cart', 'buyNow'] as const;
export type OrderSource = (typeof publicOrderSources)[number];

export const emailNotificationStatuses = ['queued', 'sent', 'failed', 'skipped'] as const;
export type EmailNotificationStatus = (typeof emailNotificationStatuses)[number];

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface OrderRequestItem {
  productId: number;
  quantity: number;
}

export interface CreateOrderPayload {
  customer: OrderCustomer;
  items: OrderRequestItem[];
  requestId: string;
  startedAt: number;
  botField: string;
  source: OrderSource;
}

export interface OrderItemSnapshot {
  productId: number;
  productName: string;
  category: string;
  image: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customer: OrderCustomer;
  items: OrderItemSnapshot[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  handling: number;
  total: number;
  itemCount: number;
  source: OrderSource;
  emailNotificationStatus: EmailNotificationStatus;
  emailNotificationError: string | null;
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
}

export interface OrderSummary {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminOrdersResponse {
  orders: OrderRecord[];
  summary: OrderSummary;
  pagination: PaginationInfo;
}

export interface AdminLoginPayload {
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  expiresInSeconds: number;
}

export interface OrderStatusUpdatePayload {
  status: OrderStatus;
}
