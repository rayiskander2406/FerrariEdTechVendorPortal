# Deployment Guide

Complete guide for deploying the SchoolDay Vendor Portal.

---

## Table of Contents

- [Environment Overview](#environment-overview)
- [Local Development](#local-development)
- [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Production Deployment](#production-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Observability](#monitoring--observability)
- [Troubleshooting](#troubleshooting)

---

## Environment Overview

| Environment | Purpose | Database | Auth |
|-------------|---------|----------|------|
| **Development** | Local development | Mock DB or Local PostgreSQL | Demo mode |
| **Test** | CI/automated tests | In-memory | Mock |
| **Staging** | Pre-production testing | PostgreSQL | Real keys |
| **Production** | Live system | PostgreSQL + Vault | Production keys |

---

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+
- Docker (for PostgreSQL)
- Git

### Quick Start

```bash
# 1. Clone repository
git clone <repo-url>
cd FerrariEdTechVendorPortal

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Start with mock database (fastest)
echo "USE_MOCK_DB=true" >> .env
npm run dev

# OR start with real PostgreSQL
docker compose up -d
npm run db:seed
npm run dev
```

### Development Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run typecheck

# Linting
npm run lint

# Database operations
npm run db:seed        # Seed demo data
npm run db:seed:clear  # Clear data
npx prisma studio      # Database GUI
```

---

## Docker Setup

### Start Databases

```bash
# Start PostgreSQL (main + vault)
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop databases
docker compose down

# Stop and remove volumes (reset data)
docker compose down -v
```

### Docker Compose Services

| Service | Port | Purpose |
|---------|------|---------|
| `db` | 5434 | Main PostgreSQL database |
| `vault` | 5433 | Vault database (tokenization) |

### Connection Strings

```env
# Main database
DATABASE_URL=postgresql://schoolday:schoolday_dev_password@localhost:5434/schoolday_dev

# Vault database
VAULT_DATABASE_URL=postgresql://vault:schoolday_vault_password@localhost:5433/schoolday_vault
```

---

## Environment Variables

### Required Variables

| Variable | Description | Required In |
|----------|-------------|-------------|
| `DATABASE_URL` | PostgreSQL connection | Production |
| `ANTHROPIC_API_KEY` | Claude API key | Production |
| `NODE_ENV` | Environment (development/test/production) | All |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VAULT_DATABASE_URL` | Vault database | None |
| `DATABASE_READ_URL` | Read replica | None |
| `PORT` | Server port | 3000 |
| `LOG_LEVEL` | Logging level | info |
| `USE_MOCK_DB` | Use in-memory DB | false |
| `SHADOW_MODE` | Schema validation | false |

### External Services

| Variable | Service | Purpose |
|----------|---------|---------|
| `UPSTASH_REDIS_REST_URL` | Upstash | Distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash | Auth token |
| `SENTRY_DSN` | Sentry | Error tracking |
| `SENDGRID_API_KEY` | SendGrid | Email delivery |
| `TWILIO_ACCOUNT_SID` | Twilio | SMS delivery |
| `TWILIO_AUTH_TOKEN` | Twilio | Auth token |
| `TWILIO_PHONE_NUMBER` | Twilio | Sender number |

### Environment Files

```
.env.example     # Template (committed)
.env             # Local development (gitignored)
.env.local       # Local overrides (gitignored)
.env.test        # Test environment (gitignored)
```

---

## Database Setup

### Initial Setup

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Generate Prisma client
npx prisma generate

# 3. Run migrations
npx prisma migrate dev

# 4. Seed demo data
npm run db:seed
```

### Migration Commands

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

### Database Schema

```
Main Database (36 models)
├── Vendor, PodsApplication
├── ApiKey, VendorSession
├── SandboxCredentials, IntegrationConfig
├── CommunicationMessage, MessageBatch
├── UsageRecord, AuditLog
└── ... (Ed-Fi models)

Vault Database (6 models)
├── TokenMapping
├── AccessLog
├── RateLimitEntry
└── SecurityAlert
```

---

## Production Deployment

### Pre-Deployment Checklist

#### Security

- [ ] Set `NODE_ENV=production`
- [ ] Configure real `DATABASE_URL` with SSL
- [ ] Set production `ANTHROPIC_API_KEY`
- [ ] Enable HTTPS only
- [ ] Configure CORS for production domains
- [ ] Rotate all demo/test credentials
- [ ] Enable rate limiting with Redis
- [ ] Set secure cookie flags

#### Database

- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Verify connection to production database
- [ ] Configure connection pooling
- [ ] Set up read replica (optional)
- [ ] Enable SSL for database connections

#### Observability

- [ ] Configure Sentry for error tracking
- [ ] Set up logging with proper log levels
- [ ] Configure health check endpoints
- [ ] Set up alerting for critical errors

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Vercel Environment Variables

Set these in the Vercel dashboard or via CLI:

```bash
vercel env add DATABASE_URL production
vercel env add ANTHROPIC_API_KEY production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
```

### Docker Production Deployment

```dockerfile
# Dockerfile (production)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build and run
docker build -t schoolday-portal .
docker run -p 3000:3000 --env-file .env.production schoolday-portal
```

### Health Checks

Configure your load balancer/orchestrator to check:

| Endpoint | Purpose | Expected |
|----------|---------|----------|
| `GET /api/health` | Full health check | 200 + JSON |
| `GET /api/health/live` | Liveness probe | 200 |
| `GET /api/health/ready` | Readiness probe | 200 |

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci

      - run: npx prisma generate

      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

      - run: npm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          NODE_ENV: test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Branch Strategy

| Branch | Purpose | Deployment |
|--------|---------|------------|
| `main` | Production | Auto-deploy to production |
| `develop` | Integration | Auto-deploy to staging |
| `feature/*` | Feature work | Preview deployments |
| `hotfix/*` | Critical fixes | Fast-track to production |

---

## Monitoring & Observability

### Health Endpoints

```bash
# Full health check
curl https://your-domain.com/api/health

# Response
{
  "status": "healthy",
  "components": {
    "database": "healthy",
    "cache": "healthy"
  },
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": "2025-12-06T12:00:00.000Z"
}
```

### Metrics Endpoint

```bash
# Prometheus metrics
curl https://your-domain.com/api/metrics
```

### Logging

Logs are structured JSON (Pino format):

```json
{
  "level": "info",
  "time": 1701864000000,
  "msg": "Request completed",
  "requestId": "req_abc123",
  "method": "POST",
  "path": "/api/cpaas/messages",
  "statusCode": 201,
  "duration": 150
}
```

### Recommended Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | > 1% 5xx errors | Critical |
| Slow Response | p99 > 3s | Warning |
| Database Down | Health check fails | Critical |
| Rate Limit Exceeded | > 100 429s/min | Warning |
| API Key Failures | > 10 401s/min | Warning |

---

## Troubleshooting

### Common Issues

#### Database Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
1. Check if PostgreSQL is running: `docker compose ps`
2. Verify `DATABASE_URL` in `.env`
3. Check port is not blocked: `lsof -i :5434`

#### Prisma Client Not Generated

```
Error: @prisma/client did not initialize yet
```

**Solution**:
```bash
npx prisma generate
```

#### Migration Failed

```
Error: P3009 migrate found failed migrations
```

**Solution**:
```bash
# Development: reset and re-migrate
npx prisma migrate reset

# Production: check migration status
npx prisma migrate status
```

#### Rate Limit Issues

```
Error: Rate limit exceeded (429)
```

**Solution**:
1. Check `X-RateLimit-Remaining` header
2. Implement exponential backoff
3. Upgrade tier for higher limits

#### Mock Database Not Working

```
Error: Cannot read properties of undefined
```

**Solution**:
1. Ensure `USE_MOCK_DB=true` is set
2. Restart development server
3. Check for conflicting `DATABASE_URL`

### Debug Mode

Enable verbose logging:

```bash
# Set log level to debug
LOG_LEVEL=debug npm run dev

# Enable Prisma query logging
DEBUG=prisma:query npm run dev
```

### Support

For deployment issues:
1. Check this guide
2. Review error logs
3. Use `/help-me` command
4. Contact the development team

---

## Appendix

### Port Reference

| Port | Service |
|------|---------|
| 3000 | Next.js application |
| 5432 | PostgreSQL (standard) |
| 5433 | Vault PostgreSQL |
| 5434 | Main PostgreSQL |

### File Locations

| Purpose | Location |
|---------|----------|
| Environment template | `.env.example` |
| Docker config | `docker-compose.yml` |
| Prisma schema | `prisma/schema.prisma` |
| Vault schema | `prisma/vault.schema.prisma` |
| Health endpoints | `app/api/health/` |

---

**Last Updated**: December 6, 2025
