# Velosnak Atelier

Premium sneaker storefront built with React, Vite, Tailwind CSS, and 3D product presentation.

## Local Development

Prerequisites: Node.js 20+

1. Install dependencies with `npm install`
2. Add environment values in `.env.local`:
   - `GEMINI_API_KEY` for the optional diagnostics panel
   - `VITE_API_BASE_URL=http://localhost:4000` to enable backend API usage
3. Optionally copy `backend/.env.example` to `backend/.env` and set `ADMIN_API_KEY` for protected order reads
4. Start the backend with `npm run backend:dev`
5. Start the frontend with `npm run dev`

## Available Scripts

- `npm run dev` starts the local development server
- `npm run backend:dev` starts the local backend API
- `npm run backend:start` starts backend without watch mode
- `npm run build` creates a production build
- `npm run lint` runs ESLint
- `npm test` runs the Vitest suite

## Current Scope

The front end now includes:

- curated product data with pricing, sizes, materials, and shipping notes
- size-aware bag management with order snapshot capture
- saved items and a collector desk surface
- production-ready metadata and responsive landing sections
- API integration for products and orders when backend is configured

Backend service now includes:

- health check endpoint
- shoe listing/filtering endpoints
- order create/read endpoints with file persistence
- CORS and environment-based configuration
- server-side order recalculation so client totals and prices are not trusted
- admin-only access for stored order retrieval

## Vercel Deployment

The frontend is ready to deploy on Vercel from the project root.

Recommended Vercel settings:

- Framework preset: `Vite`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

Environment variables:

- Optional: `GEMINI_API_KEY`
- For live backend usage: `VITE_API_BASE_URL=https://your-backend-domain`

Production note:

- If `VITE_API_BASE_URL` is not set, the site runs in storefront preview mode.
- Product browsing still works using the frontend catalog data.
- Checkout stays disabled until a live backend is connected.

Backend note:

- The current backend stores orders in `backend/data/orders.json`.
- That local JSON persistence is fine for local development but not durable on Vercel serverless.
- For live checkout in production, deploy the backend to a durable Node host or move order storage to a real database first.
