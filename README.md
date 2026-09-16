# 🪔 DevaMart — Puja & Astrology E-commerce Platform

A complete, production-ready spiritual store inspired by your PoojaBox app, with **two separate apps**
(user store + admin panel) sharing **one API server** and **one database**, plus **WebSocket live sync**.

| App | URL (local) | Purpose |
|-----|-------------|---------|
| 🛍️ User Store | http://localhost:5173 | Explore, shop, cart, checkout (COD/UPI), order tracking, chatbot |
| 🛕 Admin Panel | http://localhost:5174 | Live dashboard, orders & status, product/category management, customers |
| ⚙️ API Server | http://localhost:4000 | REST + Socket.io + SQLite database |

> Admin and user are fully separated. Admin login only works on the admin link, user login only on the
> user link, and the admin API rejects user tokens with `403 Forbidden`.

## ✨ Features

- **Theme** — warm cream background with deep red & gold accents (inspired by mypoojabox.in)
- **Auth** — sign up / login (JWT), separate admin portal
- **Catalogue** — 77 seeded products across 5 categories:
  Puja Samagri & Kits (20+ kits), Bigraha/Idols (15), Rudraksha & Malas (15), Healing Crystals (10), Décor & Furniture (10)
- **Puja Kits** — researched item checklists + instructions (in descriptions), not random boxes
- **Cart & Checkout** — full delivery address with PIN validation, free shipping above ₹499
- **Payments** — Cash on Delivery **and** Online (Google Pay / PhonePe / Paytm / UPI simulation UI, pluggable to a live gateway)
- **Order Tracking** — public tracking page with timeline: Packed → Shipped → On The Way → Delivered (live via Socket.io)
- **Chatbot "Devam"** — in-built knowledge base answers questions on kits, prices, rudraksha authenticity, COD/UPI, returns, tracking, contact & more
- **Admin live sync** — new order / status change / product change push to the dashboard instantly via WebSocket
- **Admin analytics** — today's revenue, total sales, COD outstanding, orders by status, 7-day revenue trend, products per category
- **Placeholders** — every product gets a branded auto-generated SVG image (works offline); admin can set a real image URL anytime

## 🔑 Default logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@devamart.in | Admin@1234 |
| Demo user | demo@devamart.in | User@1234 |

## 🚀 Quick start (Windows)

```bat
cd devamart
start-all.bat
```
Opens three console windows (API, User store, Admin panel). Then visit the links above.

Or manually, in three terminals:

```bash
cd server      && npm install && npm run seed && npm run dev   # :4000
cd client-user && npm install && npm run dev                    # :5173
cd client-admin && npm install && npm run dev                   # :5174
```

## ✅ Run the API test suite

```bash
cd server
npm test
```
Boots the API on :4100 with a throwaway database and verifies **85 checks**
(auth, role boundaries, cart, COD & online orders, payment simulation, status flow,
admin CRUD, live sockets, chatbot, content pages).

## 🔌 API map

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/signup` · `/api/auth/login` | public |
| POST | `/api/auth/admin-login` | admin only |
| GET | `/api/auth/me` | user + admin (by role) |
| GET | `/api/products?category=&q=&sort=&featured=` / `GET /api/products/:id` · `GET /api/categories` | public |
| GET/POST/PATCH/DELETE | `/api/cart` | user |
| POST | `/api/orders` (COD or online) · `GET /api/orders` · `GET /api/orders/:id` | user |
| GET | `/api/orders/track/:orderNo` | public |
| POST | `/api/payment/init` · `POST /api/payment/:orderId/complete` | user |
| GET | `/api/admin/stats` · `/api/admin/orders` | admin |
| PATCH | `/api/admin/orders/:id/status` · `/api/admin/orders/:id/payment` | admin |
| GET/POST/PATCH/DELETE | `/api/admin/products` · `/api/admin/products/:id` | admin |
| GET/POST/PATCH | `/api/admin/categories` · `/api/admin/categories/:id` | admin |
| GET | `/api/admin/customers` | admin |
| POST | `/api/chat` · `GET /api/chat/welcome` | public |
| GET | `/api/content/terms|privacy|about|contact` · `POST /api/content/contact` | public |
| GET | `/api/health` | public |

## 🔐 Security
- Passwords hashed with bcrypt; JWT (7-day) with role claims
- `requireAuth('admin')` middleware on every admin route; user tokens → `403`
- User app and admin app use separate token storage keys
- No user can reach admin routes; admin is blocked from the user login endpoint

## 🧾 Go-live checklist (production)
1. Edit `server/.env` → strong `JWT_SECRET`, real `CORS_ORIGINS` (your deployed user/admin URLs).
2. Point payments to a real UPI gateway (Razorpay/PhonePe) — keep the same order flow; replace the simulated `complete` call with a verified webhook callback.
3. Set `UPI_ID` for QR-based UPI collection if needed.
4. Serve the built apps from the API (`npm run build` in each client, then the API serves them automatically), or host the three folders separately.
5. Put real product images via the admin panel.