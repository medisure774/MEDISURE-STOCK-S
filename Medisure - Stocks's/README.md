# Medisure — Stock Management System

A lightweight, browser-only stock dashboard for Medisure's daily inventory management. No server required — ships as a pure static site.

## Features

- **Staff Login** — role-based access (Admin / Employee)
- **Excel Upload** — Admin can upload `.xls` / `.xlsx` / `.csv` daily stock sheets
- **Live Dashboard** — search, filter, and sort stock by name, SKU, category, status
- **Offline-capable** — stock data persists in `localStorage`; no internet required after first load

## Stack

| Layer   | Technology            |
|---------|-----------------------|
| UI      | HTML5 + Vanilla JS    |
| Styling | Vanilla CSS           |
| Parsing | [SheetJS](https://sheetjs.com/) (CDN) |
| Auth    | Session Storage (client-side) |
| Hosting | [Vercel](https://vercel.com) |

## Project Structure

```
├── index.html        # Login page
├── dashboard.html    # Stock dashboard
├── css/
│   └── style.css
├── js/
│   ├── auth.js       # Login / session logic
│   └── app.js        # Dashboard & Excel parsing
├── assets/
│   └── logo.png
└── vercel.json       # Vercel deployment config
```

## Default Credentials

| Role     | Username   | Password         |
|----------|------------|------------------|
| Admin    | `admin`    | `medisure@admin` |
| Employee | `employee` | `medisure@2024`  |

> ⚠️ Change these credentials in `js/auth.js` before deploying to a public URL.

## Deploying to Vercel

### Option A — Vercel Dashboard (recommended)

1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import the repo.
3. Leave all build settings as default (Vercel detects it as a static site automatically).
4. Click **Deploy**.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

## Local Development

No build step needed — just open `index.html` in a browser, or use Live Server:

```bash
npx serve .
```
