# Essential Goods Full Stack

This project now includes:

- The existing React storefront
- A backend API with order storage in SQLite
- A hidden admin route at `/admin` that is not linked from the storefront
- Admin product management for name, category, price, image, description, stock, sold count, and visibility
- Delivery tracking with `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, and `CANCELLED`
- Anti-bot protection with rate limiting, honeypot validation, and minimum form fill time
- Optional email notifications through SMTP or Gmail app password settings

## Run locally

1. Copy `.env.example` to `.env`
2. Set `ADMIN_PASSWORD` and `JWT_SECRET`
3. Run `npm install`
4. Run `npm run dev`

The storefront runs through Vite and the API runs on `http://localhost:3001`.

## Production

- Build with `npm run build`
- Start with `npm start`
- The server serves the built frontend and API from one process
- Set `HOST=0.0.0.0` and deploy on a public Node host, VPS, or container platform for worldwide access
- Put the app behind HTTPS and a real domain in production

## Gmail notifications

To send order emails to Gmail, use Gmail SMTP values in `.env`:

```env
NOTIFY_EMAIL_TO=yourgmail@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Essential Goods <yourgmail@gmail.com>"
```

## Admin dashboard

- Path: `/admin`
- Login password: `ADMIN_PASSWORD`
- The storefront does not show a public admin link

## Database

- Local database file: `storage/orders.db`
- Products, orders, and items are created automatically when the server starts
- The initial catalog seeds once from the bundled product list, then the admin panel becomes the source of truth
