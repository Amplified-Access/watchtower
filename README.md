# Watchtower

Watchtower is an incident monitoring and reporting platform built for civil society organizations. It enables structured reporting of security incidents, real-time alerting, geolocation-based mapping, and AI-assisted analysis — with support for multiple languages and role-based access control.

## Features

- Incident reporting with severity classification and geolocation
- Real-time alert subscriptions and notifications
- Interactive incident maps
- Role-based dashboards (Watcher, Admin, Super Admin)
- Anonymous and organization-based reporting
- AI-powered insights and dataset analysis
- Multilingual support (10 languages including Swahili, Kinyarwanda, Amharic, and more)

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | Go, Clean Architecture, REST            |
| Frontend | Next.js 15, TypeScript, tRPC, Tailwind  |
| Database | PostgreSQL                              |
| Auth     | Better Auth                             |
| Storage  | AWS S3 / Cloudflare R2                  |

## Project Structure

```
watchtower/
├── backend/                        # Go REST API
│   ├── cmd/api/                    # Application entrypoint
│   ├── internal/
│   │   ├── domain/                 # Entities, repository interfaces, domain errors
│   │   ├── usecase/                # Business logic (alerts, incidents, reports, insights...)
│   │   ├── adapter/                # HTTP handlers, middleware, presenters, repositories
│   │   ├── database/               # Database connection and configuration
│   │   └── server/                 # Server setup and route registration
│   └── docker-compose.yml          # Local database container
│
└── frontend/                       # Next.js application
    ├── src/
    │   ├── app/                    # App Router — auth, admin, watcher, and public routes
    │   ├── features/               # Feature modules (maps, alerts, reports, insights...)
    │   ├── components/             # Shared UI components
    │   ├── _trpc/                  # tRPC client, routers, and middleware
    │   └── lib/                    # Auth, AI, AWS, and utility helpers
    └── messages/                   # i18n locale files (en, fr, sw, rw, am, lg, ur, ...)
```

## Getting Started

### Prerequisites

- Go 1.21+
- Node.js 20+ with pnpm
- Docker (for local database)

### Backend

```bash
cd backend

# Start the database container
make docker-run

# Run with live reload
make watch

# Run tests
make test
```

### Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The frontend will be available at `http://localhost:3000`.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
