# Watchtower

Watchtower is an incident monitoring and reporting platform built for civil society organizations. It enables structured reporting of security incidents, real-time alerting, geolocation-based mapping, and AI-assisted analysis; with support for multiple languages and role-based access control.

## Features

- Incident reporting with severity classification and geolocation
- Real-time alert subscriptions and notifications (email, SMS)
- Interactive incident maps with heatmap visualization
- Role-based dashboards (Watcher, Admin, Super Admin)
- Anonymous and organization-based reporting
- AI-powered insights and dataset analysis
- Multilingual support (10 languages: English, French, Swahili, Kinyarwanda, Amharic, Luganda, Urdu, and more)

## Tech Stack

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| Backend    | Go 1.25, Clean Architecture, REST                   |
| Frontend   | Next.js 15, TypeScript, tRPC, Tailwind CSS          |
| Database   | PostgreSQL (Neon)                                   |
| Cache      | Redis (Railway)                                     |
| Auth       | Better Auth                                         |
| Storage    | Cloudflare R2 (S3-compatible)                       |
| Notifications | AWS SNS, Mailjet                                 |
| AI         | Google Generative AI                                |
| Monitoring | Sentry                                              |
| Deploy     | Railway (backend), Vercel (frontend)                |

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
│   ├── docs/                       # Auto-generated Swagger API docs
│   └── docker-compose.yml          # Local database container
│
└── frontend/                       # Next.js application
    ├── src/
    │   ├── app/                    # App Router — auth, admin, watcher, and public routes
    │   ├── features/               # Feature modules (maps, alerts, reports, insights...)
    │   ├── components/             # Shared UI components
    │   ├── _trpc/                  # tRPC client, routers, and middleware
    │   ├── db/                     # Drizzle ORM schemas
    │   └── lib/                    # Auth, AI, AWS, and utility helpers
    ├── messages/                   # i18n locale files (en, fr, sw, rw, am, lg, ur, ...)
    └── docs/                       # Frontend architecture docs
```

## Getting Started

### Prerequisites

- Go 1.25+
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

The API will be available at `http://localhost:8080`. Swagger UI is at `http://localhost:8080/swagger/`.

### Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The frontend will be available at `http://localhost:3000`.

## Development

### Pre-commit Hooks

This project uses [Husky](https://typicode.github.io/husky/) to enforce quality checks before every commit. The pre-commit hook runs automatically and covers both services:

- **Frontend**: ESLint, Jest test suite, Next.js build
- **Backend**: `go vet`, `go test ./...`, `go build`

All checks must pass for the commit to proceed.

### CI/CD and Branching

All work is merged into `main` via pull requests. The `staging` and `production` branches are then rebased from `main` to promote changes:

```
feature-branch → main (via PR)
main → staging  (rebase to promote to staging)
main → production (rebase to promote to production)
```

Both services have dedicated environments on their respective platforms:

| Service  | Platform | Staging                    | Production                    |
|----------|----------|----------------------------|-------------------------------|
| Backend  | Railway  | Deploys on push to `staging` | Deploys on push to `production` |
| Frontend | Vercel   | Deploys on push to `staging` | Deploys on push to `production` |

The GitHub Actions pipeline runs `go test ./...` before every backend deploy.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
