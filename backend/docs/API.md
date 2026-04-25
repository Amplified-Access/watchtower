# API Reference

The Watchtower backend exposes a REST API under `/api/v1`.

## Interactive Docs

Swagger UI is served at `/swagger/` when the server is running. The raw specs are in this directory:

- [`swagger.json`](./swagger.json)
- [`swagger.yaml`](./swagger.yaml)

The specs are generated from inline annotations in the handler and entrypoint files. Regenerate them with:

```bash
swag init -g cmd/api/main.go
```

## Authentication

Protected routes require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are issued by Better Auth and validated by the backend middleware.

## Route Groups

| Prefix                   | Auth required | Description                                      |
|--------------------------|---------------|--------------------------------------------------|
| `/api/v1/`               | No            | Public incidents, organizations, reports, insights |
| `/api/v1/`               | Yes           | Reporting, alert subscriptions, notifications    |
| `/api/v1/admin/`         | Admin role    | Organization management, form and incident config |
| `/api/v1/super-admin/`   | Super Admin   | Platform analytics, admin oversight              |

## Rate Limits

| Route group   | Limit         |
|---------------|---------------|
| Public        | 60 req/min    |
| Strict public | 10 req/min    |
| Authenticated | 200 req/min   |

Limits are enforced per IP using a Redis-backed sliding window. Responses include standard `X-RateLimit-*` headers.

## Domain Areas

| Area              | Description                                              |
|-------------------|----------------------------------------------------------|
| Incidents         | CRUD, status transitions, severity, geolocation          |
| Reports           | Draft/published report management                        |
| Alert Subscriptions | Email/SMS alerts with frequency and location filters   |
| Organizations     | Organization registry and membership                     |
| Datasets          | Dataset listing and download tracking                    |
| Insights          | AI-assisted insights with tags and slug-based access     |
| Users             | Profile and role management                              |
| Admin             | Organization-scoped admin operations                     |
| Super Admin       | Platform-wide analytics and admin management             |

## Error Format

All errors follow a consistent JSON envelope:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "incident not found"
  }
}
```

Domain errors (defined in `internal/domain/errors/`) map to HTTP status codes in the presenter layer.
