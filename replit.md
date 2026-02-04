# Afrokaviar

## Overview

Afrokaviar is a premium Afro-futurist culture operating system for the diaspora. The platform enables users to watch TV, listen to radio, discover music drops, and join live events. It features a music marketplace where users can browse, purchase, and manage songs, along with social features for sharing and discovering tracks.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for UI animations
- **File Uploads**: Uppy with AWS S3 integration for direct uploads via presigned URLs

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Build**: esbuild for server bundling, Vite for client
- **API Pattern**: RESTful JSON API under `/api/*` routes

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` exports models from `shared/models/`
- **Object Storage**: Google Cloud Storage via Replit's sidecar service for file uploads
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Authentication
- **Provider**: Replit OpenID Connect (OIDC) authentication
- **Session Management**: Express sessions with PostgreSQL store
- **User Management**: Auto-creates admin user for specific email on first login
- **Protected Routes**: `isAuthenticated` middleware for API protection

### Database Schema Models
- **Auth**: Users and sessions (mandatory for Replit Auth)
- **Music**: Songs with metadata, reactions, and favorites
- **Social**: Social tracks with saves and reports
- **Library**: User library items with playback progress and storage tracking
- **Orders**: Order management with items and entitlements
- **Admin**: Admin user roles and permissions
- **Channels**: TV channel health tracking with online status and last checked timestamps

### TV Channel Health System
- **Stream Validation**: HEAD/GET requests with fallback to test if IPTV streams are accessible
- **Background Checks**: Runs every 2 hours to validate all channel URLs
- **Consecutive Failures**: Channels marked offline after 3 consecutive failures
- **API Endpoints**: GET /api/channels (with ?online=true filter), POST /api/channels/:id/check
- **Client Fallback**: Graceful error UI when streams fail to load, with retry option

### Key Design Patterns
- **Shared Types**: Schema definitions in `shared/` are used by both client and server
- **Path Aliases**: `@/` for client source, `@shared/` for shared code
- **Storage Interface**: `IStorage` interface abstracts database operations
- **Presigned URL Uploads**: Two-step flow - request URL from backend, upload directly to storage

## External Dependencies

### Third-Party Services
- **Replit Auth**: OpenID Connect authentication via Replit's identity service
- **Replit Object Storage**: Google Cloud Storage accessed through Replit's sidecar (port 1106)
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **Acumbamail**: Transactional email service for sending invite emails (requires `ACUMBAMAIL_AUTH_TOKEN` secret)

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `ISSUER_URL`: OIDC issuer (defaults to Replit's OIDC endpoint)
- `REPL_ID`: Replit environment identifier

### Key NPM Packages
- **UI**: Radix UI primitives, shadcn/ui components, Lucide icons
- **Data**: Drizzle ORM, drizzle-zod for validation
- **Auth**: Passport.js with openid-client, express-session
- **Storage**: @google-cloud/storage, @uppy/aws-s3
- **Utilities**: Zod for validation, date-fns, nanoid