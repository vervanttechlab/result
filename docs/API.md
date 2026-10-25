# API — Barako Brew

Base URL: `http://localhost:3000` (json-server now, the real back-end later). All bodies are JSON.

| Method | Endpoint | Purpose | Request body | Success | Errors |
|---|---|---|---|---|---|
| GET | /menu | List all menu items | – | 200, JSON array | 500 |
| GET | /menu?category=Hot | Filter by category | – | 200, JSON array | 500 |
| GET | /menu/:id | One item | – | 200, JSON object | 404 |
| POST | /orders | Place an order | `{items: [{id, qty}], subtotal, discount, total, pickupName, pickupTime, date}` with header `X-CSRF-Token` | 201, created order with `id` | 400, 500 |
| POST | /messages | Send a contact message | `{name, email, message, date}` with header `X-CSRF-Token` | 201, created object with `id` | 400, 500 |

## Data shapes

Menu item:

```json
{ "id": 1, "name": "Kapeng Barako", "category": "Hot", "price": 95, "image": "images/barako.webp", "available": true }
```

- `category`: "Hot", "Cold" or "Pastry"
- `price`: number in PHP, greater than 0
- `available`: false shows "Sold out"

Message:

```json
{ "name": "Juan", "email": "juan@example.com", "message": "Open on Sunday?", "date": "2026-10-26T08:00:00.000Z" }
```

Order:

```json
{ "items": [{ "id": 1, "qty": 2 }, { "id": 5, "qty": 1 }], "subtotal": 255, "discount": 0, "total": 255, "pickupName": "Juan", "pickupTime": "10:30", "date": "2026-10-26T08:00:00.000Z" }
```

## Offline fallback

If the API cannot be reached, the front end reads `data/menu.json`, a copy of the GET /menu response.

## Notes for the back-end team

- Validate every field again on the server (length, email format, required consent, pickup time).
- **Recompute prices and totals on the server** from its own menu prices. The totals sent by the browser are for display only and can be edited by anyone.
- Issue and check the CSRF token on the server; reject POSTs without a valid token.
- Serve over HTTPS with the security headers listed in RISK-ASSESSMENT.md.

Endpoint check: tested with `api.http` (REST Client) on <date>; results match this table.
