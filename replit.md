# Replit.md

## Overview

This is a checkout page application built with React and Express. The project provides a simple Stripe-powered payment flow with a home page displaying a Stripe Buy Button and a thank-you confirmation page after successful purchases. The application includes analytics tracking integration for conversion monitoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript with ESM modules
- **Build Process**: esbuild bundles server code, Vite bundles client
- **Development**: tsx for TypeScript execution, Vite dev server with HMR

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains database table definitions
- **Migrations**: Drizzle Kit manages migrations in `./migrations` directory
- **Current Storage**: In-memory storage implementation (`MemStorage` class) for development, designed to be swapped with database implementation
- **Database Push**: Use `npm run db:push` to sync schema with database

### Project Structure
```
client/           # React frontend
  src/
    components/ui/  # shadcn/ui components
    pages/          # Route components (home, thank-you, not-found)
    hooks/          # Custom React hooks
    lib/            # Utilities and query client
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route registration
  storage.ts      # Data storage interface
  static.ts       # Static file serving (production)
  vite.ts         # Vite dev server integration
shared/           # Shared code between client/server
  schema.ts       # Drizzle database schema
```

### Key Design Decisions
1. **Monorepo Structure**: Client and server share a single repository with shared types/schema
2. **Type Safety**: Drizzle-zod generates Zod schemas from database tables for validation
3. **API Pattern**: All API routes prefixed with `/api`, JSON request/response
4. **Development Mode**: Vite dev server proxied through Express for unified development
5. **Production Build**: Client bundled to `dist/public`, server to `dist/index.cjs`

## External Dependencies

### Payment Processing
- **Stripe**: Two integration methods available, toggled on the home page:
  - **Buy Button** (client-side embed): Publishable key and buy button ID in `client/src/pages/home.tsx`
  - **Checkout Session** (server-side): `POST /api/create-checkout-session` in `server/routes.ts` — requires `STRIPE_SECRET_KEY` environment secret; uses inline price_data (amount/name configurable in routes.ts)
- After Checkout Session payment, Stripe redirects to `/thank-you?session_id={CHECKOUT_SESSION_ID}`

### Analytics/Tracking
- **Pluvus**: Conversion tracking script loaded in index.html
- Thank-you page sends success events with session ID and click ID

### Database
- **PostgreSQL**: Required database (connection via `DATABASE_URL` environment variable)
- **connect-pg-simple**: Session storage for Express (available but not currently configured)

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Data fetching and caching
- `zod`: Runtime type validation
- `wouter`: Client-side routing
- Full Radix UI component suite for accessible UI primitives