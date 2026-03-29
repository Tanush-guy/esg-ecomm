# Essential Goods Full Stack

This project now includes:

- The existing React storefront
- A backend API with order storage in SQLite
- A hidden admin route at `/admin` that is not linked from the storefront
- Admin product management for name, category, price, image, description, stock, sold count, and visibility
- Delivery tracking with `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, and `CANCELLED`
- Anti-bot protection with rate limiting, honeypot validation, and minimum form fill time
- Optional email notifications through SMTP or Gmail app password settings
- Netlify-ready frontend config and separate public backend support

## Run locally

1. Copy `.env.example` to `.env`
2. Set `ADMIN_PASSWORD` and `JWT_SECRET`
3. Run `npm install`
4. Run `npm run dev`

The storefront runs through Vite and the API runs on `http://localhost:3001`.

## Production

Recommended deployment for your current setup:

- Frontend: Netlify
- Backend: a public Node host or container host
- Database: current SQLite works on one server, but for future scale use managed Postgres

Frontend on Netlify:

1. Connect this GitHub repo to your Netlify site
2. Netlify will use `netlify.toml`
3. Set `VITE_API_BASE_URL` in Netlify to your public backend URL
4. Redeploy the site

Backend on a public host:

1. Copy `.env.example` to `.env`
2. Set `HOST=0.0.0.0`
3. Set `ALLOWED_ORIGINS=https://essentialgoods.netlify.app`
4. Build with `npm run build`
5. Start with `npm start`

You can also deploy the backend with the included `Dockerfile`.
If you keep SQLite in production, use a host with a persistent disk. If your host uses ephemeral storage, move the database to a managed service.

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
- Protect the admin route with a strong password and HTTPS in production

## Database

- Local database file: `storage/orders.db`
- Products, orders, and items are created automatically when the server starts
- The initial catalog seeds once from the bundled product list, then the admin panel becomes the source of truth

## Netlify domain

- `https://essentialgoods.netlify.app/` is your public Netlify subdomain and is already reachable worldwide
- If you later buy a custom domain, add it in Netlify Domain management and update DNS there
