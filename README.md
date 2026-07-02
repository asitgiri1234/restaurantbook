# Restaurant Reservation Management System

A full-stack application for managing restaurant table reservations, with **role-based
access** for two audiences:

- **Customers** — register, book a table for a date + time slot, view their reservations, and cancel them.
- **Administrators** — view/filter every reservation, update or cancel any of them, and manage the restaurant's tables.

The system prevents double-bookings and capacity conflicts, validates every booking
attempt, and cleanly separates the customer and admin experiences.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Repository Structure](#repository-structure)
3. [Live Demo](#live-demo)
4. [Local Setup](#local-setup)
5. [Environment Variables](#environment-variables)
6. [Seeding & Default Admin](#seeding--default-admin)
7. [API Reference](#api-reference)
8. [Data Model & Design Decisions](#data-model--design-decisions)
9. [Reservation & Availability Logic](#reservation--availability-logic)
10. [Role-Based Access Control](#role-based-access-control-user-vs-admin)
11. [Deployment](#deployment)
12. [Assumptions](#assumptions)
13. [Known Limitations](#known-limitations)
14. [Future Improvements](#future-improvements)

---

## Tech Stack

| Layer     | Technology                                     |
| --------- | ---------------------------------------------- |
| Frontend  | React (Vite) + React Router + Axios            |
| Backend   | Node.js + Express                              |
| Database  | MongoDB + Mongoose ODM                         |
| Auth      | JWT (stateless), bcrypt password hashing       |
| Validation| Zod (request bodies & query params)            |

---

## Repository Structure

```
restaurantbook/
├── server/                     # Express REST API
│   ├── src/
│   │   ├── config/             # DB connection, domain constants (roles, slots)
│   │   ├── models/             # Mongoose schemas: User, Table, Reservation
│   │   ├── middleware/         # auth (JWT + RBAC), validation, error handler
│   │   ├── controllers/        # Route handlers
│   │   ├── services/           # availabilityService (conflict/capacity logic)
│   │   ├── routes/             # Express routers
│   │   ├── validators/         # Zod schemas
│   │   ├── utils/              # ApiError, asyncHandler, token helpers
│   │   ├── seed.js             # Seeds admin + tables
│   │   ├── app.js              # Express app factory
│   │   └── server.js           # Entry point
│   └── .env.example
├── client/                     # React SPA
│   ├── src/
│   │   ├── api/                # Axios instance + interceptors
│   │   ├── context/            # AuthContext
│   │   ├── components/         # Navbar, ProtectedRoute, Alert
│   │   ├── pages/              # Login, Register, Customer & Admin views
│   │   └── utils/
│   └── .env.example
├── render.yaml                 # Backend deploy blueprint (Render)
└── README.md
```

---

## Live Demo

| Service   | URL                                             |
| --------- | ----------------------------------------------- |
| Frontend  | _`<add your Vercel/Netlify URL here>`_          |
| Backend   | _`<add your Render URL here>`/api/health_       |

> Deployment steps are in the [Deployment](#deployment) section. Update these links
> once deployed.

**Demo credentials (after seeding):**

- **Admin:** `admin@restaurantbook.com` / `Admin@123`
- **Customer:** register a fresh account from the UI.

---

## Local Setup

**Prerequisites:** Node.js ≥ 18, and a MongoDB database (local `mongod`, or a free
MongoDB Atlas cluster).

### 1. Backend

```bash
cd server
cp .env.example .env         # then edit .env with your values
npm install
npm run seed                 # creates the admin user + tables
npm run dev                  # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd client
cp .env.example .env         # VITE_API_URL should point at the backend
npm install
npm run dev                  # starts on http://localhost:5173
```

Open http://localhost:5173, register a customer, or log in with the seeded admin.

---

## Environment Variables

### `server/.env`

| Variable         | Description                                        | Example                                    |
| ---------------- | -------------------------------------------------- | ------------------------------------------ |
| `PORT`           | API port                                           | `5000`                                     |
| `NODE_ENV`       | `development` / `production`                       | `development`                              |
| `MONGO_URI`      | MongoDB connection string                          | `mongodb://127.0.0.1:27017/restaurantbook` |
| `JWT_SECRET`     | Secret for signing JWTs (use a long random string) | `a-long-random-secret`                     |
| `JWT_EXPIRES_IN` | Token lifetime                                     | `7d`                                       |
| `CLIENT_ORIGIN`  | Allowed CORS origin(s), comma-separated            | `http://localhost:5173`                    |
| `ADMIN_NAME`     | Seed admin name                                    | `Admin`                                    |
| `ADMIN_EMAIL`    | Seed admin email                                   | `admin@restaurantbook.com`                 |
| `ADMIN_PASSWORD` | Seed admin password                                | `Admin@123`                                |

### `client/.env`

| Variable       | Description               | Example                     |
| -------------- | ------------------------- | --------------------------- |
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:5000/api` |

> **No secrets are committed.** Only `.env.example` files (with placeholders) are in
> version control; real `.env` files are git-ignored.

---

## Seeding & Default Admin

`npm run seed` (in `server/`) is **idempotent** and:

- Creates one **admin** account using `ADMIN_*` env vars (password is bcrypt-hashed).
- Upserts **8 tables** with varied capacities (2–8 seats) across locations.

Roles cannot be self-assigned at registration — every public sign-up creates a
`customer`. Admins exist only via the seed (or by promoting a user directly in the DB).

---

## API Reference

Base path: `/api`. All protected routes expect `Authorization: Bearer <token>`.
Responses share the shape `{ success, ... }` (or `{ success: false, message, details? }` on error).

| Method | Endpoint                        | Access    | Description                                          |
| ------ | ------------------------------- | --------- | ---------------------------------------------------- |
| POST   | `/auth/register`                | Public    | Register a customer, returns JWT                     |
| POST   | `/auth/login`                   | Public    | Log in, returns JWT                                  |
| GET    | `/auth/me`                      | Auth      | Current user                                         |
| GET    | `/reservations/slots`           | Auth      | Configured time slots                                |
| GET    | `/reservations/availability`    | Auth      | Tables available for `?date=&timeSlot=&guests=`      |
| POST   | `/reservations`                 | Customer  | Create a reservation                                 |
| GET    | `/reservations/me`              | Customer  | Own reservations                                     |
| DELETE | `/reservations/:id`             | Owner/Admin | Cancel a reservation                               |
| GET    | `/reservations?date=&status=`   | Admin     | All reservations, filterable                          |
| PATCH  | `/reservations/:id`             | Admin     | Update any reservation (re-validated)                |
| GET    | `/tables`                       | Auth      | List tables (active for customers, all for admins)   |
| POST   | `/tables`                       | Admin     | Create a table                                       |
| PATCH  | `/tables/:id`                   | Admin     | Update / (de)activate a table                        |
| DELETE | `/tables/:id`                   | Admin     | Delete a table (blocked if it has confirmed bookings)|

**HTTP status codes** are used deliberately: `200/201` success, `400` validation/capacity,
`401` unauthenticated, `403` wrong role, `404` not found, `409` conflict (double-booking / duplicate email).

---

## Data Model & Design Decisions

### `User`
`name`, `email` (unique), `password` (bcrypt-hashed, never returned), `role` (`customer` | `admin`).

### `Table`
`name` (unique, e.g. `T3`), `capacity`, `location`, `isActive` (soft on/off switch so a
table can be pulled from service without deleting its history).

### `Reservation`
`user` → User, `table` → Table, `date` (`YYYY-MM-DD` string), `timeSlot` (enum),
`guests`, `status` (`confirmed` | `cancelled`).

**Key decisions:**

1. **Fixed time slots instead of arbitrary start/end times.** Bookings occupy one of a
   fixed set of daily slots (e.g. `18:00-19:30`). This makes "overlap" mean exactly
   "same table, same date, same slot" — unambiguous and easy to verify, which is the
   assignment's primary evaluation area.

2. **Date stored as a normalized `YYYY-MM-DD` string.** Only the day matters for slot
   conflicts, so storing a string avoids timezone drift where a `Date` could shift a
   booking across midnight depending on server/client offset.

3. **Cancellation is a soft state change** (`status: cancelled`), not a delete. This
   preserves history and, crucially, frees the slot so it can be re-booked.

4. **Database-level double-booking guard** — see below.

---

## Reservation & Availability Logic

This is enforced in **two layers**:

### Layer 1 — Application checks (friendly errors)
On create/update, `availabilityService.assertTableBookable()` verifies:

- The table exists and is **active** → else `404`.
- **Capacity ≥ guests** → else `400` with a message like *"Table T1 seats 2, but 4 guests were requested."*
- **No existing `confirmed` reservation** for the same `(table, date, timeSlot)` → else `409`.

The `GET /reservations/availability` endpoint powers the customer UI: it returns every
active table annotated with `available` + a `reason` (`"Already booked for this slot"` /
`"Not enough capacity"`), so users only ever pick a valid table.

### Layer 2 — Database uniqueness (race-condition proof)
The `Reservation` collection has a **partial unique index**:

```js
{ table: 1, date: 1, timeSlot: 1 }  // unique, WHERE status = 'confirmed'
```

If two requests pass the application check simultaneously, the database still rejects the
second insert with a duplicate-key error (translated to a `409`). Cancelled reservations
are excluded from the index, so cancelling a booking correctly re-opens the slot. This
guarantees no double-booking can slip through under concurrency.

**Admin updates** re-run the full validation and exclude the reservation being edited
from the conflict check (so it isn't treated as conflicting with itself).

---

## Role-Based Access Control (User vs Admin)

- **Authentication** — `protect` middleware validates the JWT, loads the user, and
  attaches it to the request. Missing/invalid/expired tokens → `401`.
- **Authorization** — `authorize('admin')` guards admin-only routes → `403` for customers.
- **Ownership** — customers can cancel only their own reservations; admins can cancel any.
  This is enforced inside the controller, not just by route.
- **Server is the source of truth** — roles are never trusted from the client; the JWT is
  verified and the role read from the persisted user on every request.

**Frontend** mirrors this with `ProtectedRoute` (redirects unauthenticated users to
login, and routes each role to its own home). The admin console is visually distinct
(blue accent bar, `ADMIN` badge, separate nav) so the two experiences never blur.

---

## Deployment

The app is designed for a split deployment: **backend on Render**, **frontend on
Vercel/Netlify**, **database on MongoDB Atlas**.

### 1. Database — MongoDB Atlas
Create a free cluster, add a database user, allow network access (`0.0.0.0/0` for a demo),
and copy the connection string.

### 2. Backend — Render
- `render.yaml` is included as a Blueprint. In Render: **New → Blueprint → select this repo**.
- Set the secret env vars in the dashboard: `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`
  (your frontend URL), and the `ADMIN_*` values.
- After the first deploy, run the seed once (Render **Shell**: `npm run seed`) to create
  the admin and tables.
- Health check: `GET https://<your-api>.onrender.com/api/health`.

### 3. Frontend — Vercel (or Netlify)
- Import the repo, set **Root Directory** to `client`.
- Build command `npm run build`, output dir `dist`.
- Env var `VITE_API_URL = https://<your-api>.onrender.com/api`.
- SPA routing is handled by `client/vercel.json` (and `public/_redirects` for Netlify).

> After deploying the frontend, set the backend's `CLIENT_ORIGIN` to the frontend URL so
> CORS allows it, and update the [Live Demo](#live-demo) links above.

---

## Assumptions

- **Single restaurant** with a fixed set of tables (seeded).
- **Fixed daily time slots**; a slot is either free or taken for a given table/date.
- Every public registration is a **customer**; admins are provisioned via seed.
- **Guests must fit a single table** — parties are not split across multiple tables.
- A reservation is for **one table, one slot, one day**; no recurring bookings.
- No timezone selection — dates are treated as calendar days.

---

## Known Limitations

- No email verification, password reset, or refresh-token rotation (JWT expiry only).
- Availability uses discrete slots, not arbitrary durations, so it can't model, say, a
  2-hour booking that spans two slots.
- No pagination on the admin reservations list (fine for demo-scale data).
- The seed's default admin password is a placeholder — change it for any real use.
- No automated test suite (endpoints were verified manually end-to-end during development).

---

## Future Improvements

- Automated tests (Jest + Supertest for the API, React Testing Library for the UI).
- Configurable, duration-based slots and per-table opening hours.
- Auto-assign the best-fit table for a party instead of manual selection.
- Pagination, search, and CSV export on the admin dashboard.
- Email/SMS confirmations and reminders.
- Refresh tokens + httpOnly cookie storage instead of localStorage.
- Waitlist when a slot is full, and analytics (occupancy, peak slots).
