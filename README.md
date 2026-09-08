# Artisan Kitchen & Bar — Multi-Role Restaurant Ordering System

A production-grade, multi-role Restaurant Ordering System built with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM, and Socket.io WebSockets.

---

## Architecture & Unified Roles

All three applications share a single codebase, database, and backend, role-gated server-side:

1. **Customer App (Mobile-First, No Login Required):**
   * **Branch Selection:** GPS Haversine distance calculation and nearest highlight.
   * **Location Capture:** Dual-path selection — **"I'm inside"** (active dining table chips) vs **"I'm outside"** (GPS coordinates reverse-geocoded via OpenStreetMap Nominatim with free-text fallback for curb pickup).
   * **Image-First Menu Grid:** Square photo cards, hero items, category tabs, and modifier detail sheet.
   * **Live Order Tracking:** Real-time WebSocket status updates (`received` → `preparing` → `ready` → `completed`).

2. **Counter Employee App (Branch-Scoped, Login Required):**
   * **Kitchen Ticket Rail:** 3-column live queue (**Received**, **Preparing**, **Ready**) with live order counts.
   * **Physical Ticket Styling:** White cards with perforated torn top edge, monospace order IDs, and elapsed timers.
   * **Visual Location Badges:** Map thumbnail & street landmark for outdoor GPS orders; table pill badges for inside dining.
   * **Audio & Visual Alerts:** Audible kitchen chime synthesizer and alert banners on incoming orders.

3. **Administrator & Owner Dashboard (Full Access):**
   * **Multi-Branch Live Feed:** Real-time queue view with branch switcher.
   * **Menu Management:** Full CRUD for categories, menu items, modifiers, and per-branch availability/stock overrides (`BranchMenuItem`).
   * **Branch Inventory:** Raw ingredients stock list, restock logging (`InventoryTransaction`), and low-stock threshold alerts.
   * **Staff Management:** Create/deactivate staff, assign roles (`employee` vs `admin`) and branch scoping.
   * **Branch & Table Management:** Branch locations, geographic coordinates, and active tables.
   * **Sales Reports & Analytics:** Lifetime order transactions, revenue KPIs, and payment method breakdowns filterable by branch, date range, and status.

---

## Tech Stack

* **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
* **Backend:** Next.js API Routes with JWT authentication & server-side authorization guards
* **Database & ORM:** PostgreSQL, Prisma ORM
* **Real-time:** Socket.io WebSockets (room-based architecture for branches and customer order tracking)
* **Maps & Geolocation:** Browser Geolocation API + OpenStreetMap Nominatim reverse geocoding

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Start Database & Seed Data
```bash
npm run db:start    # Starts PostgreSQL database server
npm run db:push     # Pushes Prisma schema to database
npm run db:seed     # Seeds branches, tables, menu, inventory, and demo orders
```

### 4. Run Application
```bash
npm run dev         # Launches Next.js web app & WebSocket layer on http://localhost:3000
```

---

## Demo Credentials

* **Counter Staff (Downtown):** `downtown@restaurant.com` / `password123`
* **Counter Staff (Uptown):** `uptown@restaurant.com` / `password123`
* **Administrator Portal:** `admin@restaurant.com` / `admin123`
