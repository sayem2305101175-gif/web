# Velosnak Backend Plan

This document describes the current backend shape, how the frontend connects to it, and the next implementation steps for turning the local API into a cleaner production-ready service.

## Purpose

- Serve shoe catalog data to the storefront.
- Accept order submissions and recalculate totals on the server.
- Protect order read access behind an admin key.
- Persist orders to disk for local development and handoff.

## Current Backend Scope

Core entrypoint:

- `backend/src/server.js`

Current data sources:

- `backend/src/data/shoes.js` for catalog data
- `backend/data/orders.json` for persisted orders
- `backend/.env` for runtime config

Current frontend clients:

- `src/services/apiClient.ts`
- `src/services/shoeService.ts`
- `src/services/orderService.ts`
- `src/pages/Home.tsx`
- `src/components/CartDrawer.tsx`

## Visual Backend Build

### 1. Backend Structure Map

This graph shows how the current backend is built today. Even though most logic lives in one file, the runtime responsibilities are still separable into config, routing, validation, catalog lookup, auth, and persistence.

```mermaid
flowchart TD
    Start["backend/src/server.js"] --> EnvLoad["loadEnvFile()"]
    Start --> Config["config object"]
    Start --> Http["createServer()"]
    Start --> ShoeIndex["shoeIndex from shoes.js"]

    EnvLoad --> Config
    Config --> Cors["setCorsHeaders()"]
    Config --> OrdersFile["resolveOrdersFile()"]

    Http --> Routes["Route dispatch by method + pathname"]

    Routes --> Health["GET /api/health"]
    Routes --> Shoes["GET /api/shoes"]
    Routes --> ShoeById["GET /api/shoes/:id"]
    Routes --> Orders["POST /api/orders"]
    Routes --> AdminOrders["GET /api/orders"]
    Routes --> AdminOrderById["GET /api/orders/:id"]

    Shoes --> ShoeFilter["resolveShoes(url)"]
    ShoeById --> ShoeIndex
    Orders --> Body["readRequestBody()"]
    Orders --> OrderValidation["normalizeOrderPayload()"]
    OrderValidation --> ShoeIndex
    OrderValidation --> OrderWrite["saveOrders()"]

    AdminOrders --> AdminAuth["requireAdminAccess()"]
    AdminOrderById --> AdminAuth
    AdminAuth --> SafeCompare["timingSafeEqual()"]
    AdminOrders --> OrderRead["loadOrders()"]
    AdminOrderById --> OrderRead

    ShoeFilter --> ShoeData["src/data/shoes.js"]
    ShoeIndex --> ShoeData
    OrderRead --> OrderData["data/orders.json"]
    OrderWrite --> OrderData
```

## Connection Graph

```mermaid
flowchart LR
    subgraph Frontend
        Home["Home.tsx"]
        Cart["CartDrawer.tsx"]
        ShoeSvc["shoeService.ts"]
        OrderSvc["orderService.ts"]
        ApiClient["apiClient.ts"]
    end

    subgraph Backend
        Server["backend/src/server.js"]
        Shoes["backend/src/data/shoes.js"]
        Orders["backend/data/orders.json"]
        Env["backend/.env"]
    end

    Admin["Admin Client / Script"]

    Home --> ShoeSvc
    Cart --> OrderSvc
    ShoeSvc --> ApiClient
    OrderSvc --> ApiClient

    ApiClient -->|"GET /api/health"| Server
    ApiClient -->|"GET /api/shoes"| Server
    ApiClient -->|"GET /api/shoes/:id"| Server
    ApiClient -->|"POST /api/orders"| Server

    Admin -->|"GET /api/orders\nGET /api/orders/:id\nX-Admin-Key"| Server

    Env --> Server
    Server --> Shoes
    Server --> Orders
```

### 2. Order Request Sequence

This sequence diagram shows the most important backend path: how an order moves from the storefront into backend validation and file storage.

```mermaid
sequenceDiagram
    participant User
    participant Cart as CartDrawer.tsx
    participant OrderSvc as orderService.ts
    participant Api as apiClient.ts
    participant Server as backend/src/server.js
    participant Catalog as src/data/shoes.js
    participant Store as data/orders.json

    User->>Cart: Click "Place order"
    Cart->>OrderSvc: createOrder(snapshot)
    OrderSvc->>Api: POST /api/orders
    Api->>Server: JSON request body
    Server->>Server: readRequestBody()
    Server->>Server: normalizeOrderPayload()
    Server->>Catalog: verify shoe ids, sizes, prices
    Catalog-->>Server: matched shoe records
    Server->>Server: recalculate subtotal, shipping, total
    Server->>Store: load existing orders
    Server->>Store: write new order at top of list
    Store-->>Server: saved
    Server-->>Api: 201 Created + normalized order
    Api-->>OrderSvc: OrderSnapshot
    OrderSvc-->>Cart: persisted order
    Cart-->>User: confirmation UI
```

### 3. Admin Read Access Graph

This graph shows the protected branch for reading orders back out of storage.

```mermaid
flowchart LR
    Admin["Admin Client"] --> Header["X-Admin-Key header"]
    Header --> Endpoint["GET /api/orders or /api/orders/:id"]
    Endpoint --> Guard["requireAdminAccess()"]
    Guard --> Compare["timingSafeEqual()"]
    Compare -->|valid| Load["loadOrders()"]
    Compare -->|invalid| Unauthorized["401 response"]
    Load --> Json["data/orders.json"]
    Json --> Response["200 JSON response"]
```

## Runtime Flow

### Catalog Read Flow

1. `Home.tsx` asks `shoeService.ts` for shoes.
2. `shoeService.ts` calls `apiClient.ts` when `VITE_API_BASE_URL` is configured.
3. `apiClient.ts` sends `GET /api/shoes` or `GET /api/shoes/:id`.
4. `backend/src/server.js` filters against `src/data/shoes.js`.
5. The backend returns normalized JSON to the frontend.

### Order Create Flow

1. `CartDrawer.tsx` builds an order snapshot on the client.
2. `orderService.ts` sends `POST /api/orders`.
3. `backend/src/server.js` validates the payload.
4. The backend resolves each item against `shoeIndex` from `src/data/shoes.js`.
5. The backend recalculates subtotal, shipping, and total.
6. The backend creates a server order id and timestamp.
7. The backend writes the final order to `backend/data/orders.json`.
8. The created order is returned to the frontend and cached in local storage.

### Admin Read Flow

1. An admin client sends `GET /api/orders` or `GET /api/orders/:id`.
2. The request must include `X-Admin-Key`.
3. The backend compares the header against `ADMIN_API_KEY` using `timingSafeEqual`.
4. On success, the backend reads `backend/data/orders.json` and returns the requested data.

## Route Inventory

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Health check and timestamp | None |
| `GET` | `/api/shoes` | List shoes with optional filters | None |
| `GET` | `/api/shoes/:id` | Get one shoe by id | None |
| `POST` | `/api/orders` | Create a validated order | None |
| `GET` | `/api/orders` | Read all stored orders | `X-Admin-Key` |
| `GET` | `/api/orders/:id` | Read one stored order | `X-Admin-Key` |

## Configuration

Environment values already supported:

- `PORT`
- `HOST`
- `CORS_ORIGIN`
- `ORDERS_FILE`
- `ADMIN_API_KEY`

Frontend dependency:

- `VITE_API_BASE_URL` must point at the backend base URL for live API use.

## Strengths In The Current Design

- Server recalculates order pricing instead of trusting client totals.
- Admin read endpoints are isolated from public create endpoints.
- The backend can run without external services.
- Local persistence is simple enough for demos and handoff.
- Private network and loopback CORS handling already exists.

## Current Constraints

- All route handling is in one file.
- Catalog data is static and in-memory.
- Orders are persisted to a JSON file instead of a database.
- There is no structured logging, rate limiting, or request tracing.
- Admin access is a single shared API key.
- No test coverage exists for backend routes or validation logic.

## Implementation Plan

### Phase 1: Stabilize The Current Service

- Split `server.js` into route handlers, config, validation, and persistence modules.
- Add backend tests for health, shoe listing, order validation, and admin auth.
- Introduce a shared response format for errors and success payloads.

### Phase 2: Improve Data Layer

- Move order read/write logic into a repository module.
- Add a storage interface so JSON can later be replaced with SQLite or Postgres.
- Add catalog query helpers instead of filtering directly inside the route layer.

### Phase 3: Tighten Security And Operations

- Add rate limiting on `POST /api/orders`.
- Add request ids and structured logs.
- Replace shared admin key auth with user-based admin auth if the app grows.
- Add stricter CORS environment validation for deployment environments.

### Phase 4: Prepare For Production

- Add database-backed order storage.
- Add inventory and stock mutation rules.
- Add metrics, log shipping, and deployment health checks.
- Add CI checks for backend tests before release.

## Recommended File Split

Suggested target structure:

```text
backend/
  src/
    server.js
    config/
      env.js
    routes/
      healthRoutes.js
      shoeRoutes.js
      orderRoutes.js
    services/
      orderService.js
      shoeService.js
    repositories/
      orderRepository.js
      shoeRepository.js
    utils/
      cors.js
      http.js
      validation.js
```

## Priority Next Steps

1. Extract backend logic from `server.js` into route and service modules.
2. Add route-level tests for `POST /api/orders` and admin order retrieval.
3. Replace JSON persistence with a repository abstraction.
4. Add structured logging around request start, validation failure, and file write failure.
