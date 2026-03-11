# Velosnak Atelier Vercel Publish Plan

This plan is written against the current codebase in this repository.

Current deployment reality:

- The frontend is already Vercel-friendly because it is a standard Vite build.
- The backend is not ready for a direct Vercel move in its current form because it runs as a long-lived Node HTTP server and persists orders to `backend/data/orders.json`.
- Vercel serverless functions do not provide durable local filesystem storage, so order writes to JSON will not persist reliably after deployment.

## Recommended Deployment Strategy

Use a two-step rollout instead of trying to force the current backend onto Vercel immediately.

### Recommended path

1. Deploy the frontend to Vercel first.
2. Keep the backend off Vercel for now, or temporarily disable live ordering in production.
3. Migrate backend storage to a real database.
4. After storage is fixed, either:
   - move the backend to Vercel Functions, or
   - keep the backend on a separate service and point the frontend at it.

This is the safest and fastest path because it gives you a live site without pretending the current backend persistence model is production-safe.

## What Exists Today

Frontend:

- Build command: `npm run build`
- Output directory: `dist`
- Environment file: `.env.local`
- API base URL variable: `VITE_API_BASE_URL`

Backend:

- Entrypoint: `backend/src/server.js`
- Runtime model: raw `node:http` server with `server.listen(...)`
- Storage: `backend/data/orders.json`
- Backend env vars:
  - `PORT`
  - `HOST`
  - `CORS_ORIGIN`
  - `ORDERS_FILE`
  - `ADMIN_API_KEY`

## Practical Deployment Options

### Option A: Frontend on Vercel now, backend not public yet

Use this if the immediate goal is to get the storefront live quickly.

How it works:

- Deploy only the Vite frontend to Vercel.
- Do not set `VITE_API_BASE_URL` in Vercel yet.
- The app will still render product data from the frontend fallback in `src/services/shoeService.ts`.
- Order submission will stay unavailable because `src/services/orderService.ts` requires a configured backend.

Pros:

- Fastest path to a live public site.
- No backend refactor required before launch.
- Low deployment risk.

Cons:

- Checkout cannot be used in production yet.
- Admin order retrieval is unavailable.

Recommendation:

- Use this first if your goal is a portfolio/demo/public preview launch.

### Option B: Frontend on Vercel, backend on another service

Use this if you want live ordering soon without refactoring the backend into Vercel Functions immediately.

How it works:

- Deploy the frontend to Vercel.
- Deploy the backend separately to a Node-friendly host such as Render, Railway, Fly.io, or a VPS.
- Replace JSON file persistence with durable storage on that backend host.
- Set `VITE_API_BASE_URL` in Vercel to the deployed backend base URL.
- Update backend `CORS_ORIGIN` to allow the Vercel frontend domain.

Pros:

- Faster than a full serverless rewrite.
- Keeps the backend execution model closer to what exists now.
- Supports live ordering once storage is durable.

Cons:

- Two deployments to manage.
- Cross-origin configuration is required.

Recommendation:

- Use this if live ordering matters more than keeping everything inside Vercel.

### Option C: Full stack on Vercel

Use this only after backend changes are made.

Required backend changes:

- Replace `backend/data/orders.json` with real storage such as Neon Postgres, Supabase Postgres, Vercel Postgres, or another managed database.
- Convert the backend from a listening Node server into Vercel-compatible request handlers.
- Split API routes into serverless endpoints such as:
  - `api/health`
  - `api/shoes`
  - `api/shoes/[id]`
  - `api/orders`
  - `api/orders/[id]`
- Move shared logic into reusable modules so route handlers stay thin.

Pros:

- Single hosting platform.
- Simple frontend-to-API routing once done correctly.

Cons:

- More engineering work up front.
- The current backend implementation cannot be moved as-is.

Recommendation:

- Use this only after the data layer is fixed.

## Best Practical Plan For This Repo

### Phase 1: Publish the storefront shell on Vercel

Goal:

- Get the branded site live quickly with product browsing working.

Actions:

1. Ensure the frontend builds cleanly.
2. Create a Vercel project from the repo root.
3. Set framework preset to Vite if Vercel does not auto-detect it.
4. Use:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Do not set `VITE_API_BASE_URL` yet unless a real backend is deployed.
6. Deploy as a preview first, then promote to production when the preview looks correct.

Expected result:

- Homepage, browsing, product detail flows, and non-backend UI should work.
- Ordering should remain disabled unless the backend is deployed separately.

### Phase 2: Decide the production backend shape

Pick one of these before enabling checkout:

- Separate backend host plus database
- Vercel Functions plus database

Do not ship the current JSON-file backend as if it were production-safe on Vercel.

### Phase 3: Make the backend production-safe

Minimum required changes:

1. Replace JSON file storage with a database.
2. Move order reads and writes behind a repository layer.
3. Add backend tests for:
   - `GET /api/health`
   - `GET /api/shoes`
   - `POST /api/orders`
   - `GET /api/orders`
4. Add structured error responses and logging.
5. Tighten CORS to the real frontend domain.
6. Keep `ADMIN_API_KEY` only as a temporary control, not a long-term admin model.

Suggested database choices:

- `Neon` if you want simple Postgres with Vercel compatibility.
- `Supabase` if you want Postgres plus dashboard and auth options later.
- `Vercel Postgres` if you want to stay inside the Vercel ecosystem.

### Phase 4: Connect the frontend to the live backend

After a real backend is deployed:

1. Set `VITE_API_BASE_URL` in Vercel project settings.
2. Set backend `CORS_ORIGIN` to the exact frontend domain:
   - preview domain if testing
   - production domain after go-live
3. Redeploy frontend.
4. Verify:
   - product listing from backend
   - product details from backend
   - order creation
   - admin order retrieval with `X-Admin-Key`

### Phase 5: Production hardening

Before treating the app as production-ready:

1. Add rate limiting to `POST /api/orders`.
2. Add request IDs and structured logs.
3. Add monitoring and health checks.
4. Add CI to run frontend build and backend tests before deploy.
5. Replace shared admin key auth if admin usage grows.

## Exact Vercel Configuration For The Frontend

For the current frontend-only deployment, use:

- Root directory: project root
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

Environment variables:

- Optional: `GEMINI_API_KEY`
- Later, when backend exists: `VITE_API_BASE_URL=https://your-backend-domain`

Do not set `VITE_API_BASE_URL=http://localhost:4000` in Vercel.

## Backend Changes Required For Full Vercel Adoption

The current file [`backend/src/server.js`](/home/sayem/Downloads/web%20shoe/backend/src/server.js) blocks a clean full-stack Vercel deployment for two reasons:

1. It starts a persistent server with `server.listen(...)`.
2. It writes orders to local disk with `writeFile(...)`.

To make the backend Vercel-compatible, refactor toward this shape:

```text
api/
  health.js
  shoes.js
  shoes/[id].js
  orders/index.js
  orders/[id].js
backend/
  src/
    services/
    repositories/
    utils/
```

Serverless route handlers should call shared service modules, not duplicate business logic inside each endpoint.

## Deployment Checklist

### Immediate checklist

- [ ] Confirm whether this launch is demo-only or needs live checkout.
- [ ] Deploy frontend to Vercel from the repo root.
- [ ] Verify the preview build visually.
- [ ] Decide backend strategy before enabling ordering.

### If launching frontend-only

- [ ] Leave `VITE_API_BASE_URL` unset in Vercel.
- [ ] Confirm order button behavior is acceptable for public users.
- [ ] Add clear UI messaging if ordering is intentionally unavailable.

### If launching with live checkout

- [ ] Migrate orders to a real database.
- [ ] Deploy backend on a durable platform or rewrite to Vercel Functions.
- [ ] Configure frontend `VITE_API_BASE_URL`.
- [ ] Configure backend `CORS_ORIGIN`.
- [ ] Test order creation end to end.

## Recommended Order Of Work

1. Publish the frontend on Vercel first.
2. Decide whether checkout must work at launch.
3. If yes, do not use JSON-file persistence on Vercel.
4. Add durable backend storage.
5. Connect frontend to the live backend.
6. Harden logging, auth, and rate limits.

## Bottom Line

The storefront can be published on Vercel immediately.

The current backend should not be published to Vercel as-is because local JSON order storage is not durable there.

If you want the fastest correct rollout:

- publish the frontend on Vercel now
- keep checkout disabled or move the backend elsewhere temporarily
- migrate order storage to a database
- then connect production ordering
