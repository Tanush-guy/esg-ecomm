import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { OrderRecord } from '../shared/orders.js';
import { config } from './config.js';

let transporter: Transporter | null = null;

export function emailNotificationsEnabled() {
  return Boolean(
    config.notifyEmailTo &&
      config.smtpHost &&
      config.smtpUser &&
      config.smtpPass,
  );
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  }

  return transporter;
}

function buildOrderEmailHtml(order: OrderRecord) {
  const itemsMarkup = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">INR ${item.lineTotal.toFixed(2)}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; color: #111827;">
      <h2>New Order Received</h2>
      <p><strong>Order:</strong> ${order.orderNumber}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Customer:</strong> ${order.customer.name}</p>
      <p><strong>Email:</strong> ${order.customer.email}</p>
      <p><strong>Phone:</strong> ${order.customer.phone}</p>
      <p><strong>Address:</strong><br />${order.customer.address.replace(/\n/g, '<br />')}</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr>
            <th style="padding: 8px 0; border-bottom: 2px solid #d1d5db; text-align: left;">Item</th>
            <th style="padding: 8px 0; border-bottom: 2px solid #d1d5db; text-align: center;">Qty</th>
            <th style="padding: 8px 0; border-bottom: 2px solid #d1d5db; text-align: right;">Line Total</th>
          </tr>
        </thead>
        <tbody>${itemsMarkup}</tbody>
      </table>
      <p style="margin-top: 16px;"><strong>Subtotal:</strong> INR ${order.subtotal.toFixed(2)}</p>
      <p><strong>Shipping:</strong> INR ${order.shipping.toFixed(2)}</p>
      <p><strong>Handling:</strong> INR ${order.handling.toFixed(2)}</p>
      <p><strong>Total:</strong> INR ${order.total.toFixed(2)}</p>
    </div>
  `;
}

function buildOrderEmailText(order: OrderRecord) {
  const itemLines = order.items
    .map((item) => `- ${item.productName} x${item.quantity} = INR ${item.lineTotal.toFixed(2)}`)
    .join('\n');

  return [
    'New order received',
    `Order: ${order.orderNumber}`,
    `Status: ${order.status}`,
    '',
    'Customer',
    `Name: ${order.customer.name}`,
    `Email: ${order.customer.email}`,
    `Phone: ${order.customer.phone}`,
    `Address: ${order.customer.address}`,
    '',
    'Items',
    itemLines,
    '',
    `Subtotal: INR ${order.subtotal.toFixed(2)}`,
    `Shipping: INR ${order.shipping.toFixed(2)}`,
    `Handling: INR ${order.handling.toFixed(2)}`,
    `Total: INR ${order.total.toFixed(2)}`,
  ].join('\n');
}

export async function sendOrderNotification(order: OrderRecord) {
  if (!emailNotificationsEnabled()) {
    return;
  }

  await getTransporter().sendMail({
    from: config.smtpFrom,
    to: config.notifyEmailTo,
    replyTo: order.customer.email,
    subject: `New order ${order.orderNumber} from ${order.customer.name}`,
    text: buildOrderEmailText(order),
    html: buildOrderEmailHtml(order),
  });
}
