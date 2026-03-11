# Velosnak Backend

Lightweight API service for local development and backend handoff.

## Docs

- Backend plan and connection graph: `BACKEND_PLAN.md`

## Endpoints

- `GET /api/health`
- `GET /api/shoes`
- `GET /api/shoes/:id`
- `GET /api/orders` (`X-Admin-Key` required)
- `GET /api/orders/:id` (`X-Admin-Key` required)
- `POST /api/orders`

## Run

1. Copy `.env.example` to `.env` if you want custom values
2. Start the service:
   - `npm run backend:dev` (from project root), or
   - `npm --prefix backend run dev`

Default URL is `http://localhost:4000`.

## Notes

- The backend loads `backend/.env` automatically when present.
- Order creation recalculates items, subtotal, shipping, and total from the server catalog.
- Order read endpoints are intended for admin use only and require the `X-Admin-Key` header to match `ADMIN_API_KEY`.
