# Chase Light Frontend

GitHub Repository Activity Tracker - Frontend Application

## Overview

This is the frontend application for Chase Light, built with Nuxt.js and implementing server-side authentication with Auth0 and PostgreSQL session management.

## Features

- 🔒 **Server-Side Authentication**: Auth0 integration with PostgreSQL session storage
- 🎨 **Modern UI**: Built with Tailwind CSS and Vue 3 Composition API
- 🔐 **Protected Routes**: Route-level authentication middleware
- 🌐 **GitHub API Integration**: Proxy endpoints for secure API calls
- 📱 **Responsive Design**: Mobile-first responsive design

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Auth0 account and application setup

## Environment Setup

1. Copy the environment file:

```bash
cp .env.example .env
```

2. Configure the following environment variables:

```env
# Auth0 Configuration
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_AUDIENCE=your-auth0-api-identifier

# Session Secret (generate a secure random string)
NUXT_SESSION_SECRET=your-very-long-random-session-secret-key-here

# Database Connection
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Application URL
NUXT_PUBLIC_BASE_URL=http://localhost:3000

# Authentication Logging (Optional - for debugging)
AUTH_LOG_LEVEL=info                # error/warn/info/debug
AUTH_DEBUG_SENSITIVE=false         # Enable sensitive info logging (dev only)
```

## Installation

Install dependencies:

```bash
pnpm install
```

## Database Setup

1. Ensure PostgreSQL is running
2. Create the database and tables using the SQL scripts in `/database/init/`
3. Update the DATABASE_URL in your .env file

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Authentication Flow

1. **Login**: Users are redirected to Auth0 for authentication
2. **Callback**: Auth0 callback creates a server-side session in PostgreSQL
3. **Session Management**: Encrypted cookies manage session state
4. **Protected Routes**: Middleware validates sessions for protected pages
5. **API Access**: GitHub API access via authenticated proxy endpoints

## Available Routes

- `/` - Public home page
- `/dashboard` - Protected dashboard (requires authentication)
- `/profile` - Protected user profile page (requires authentication)
- `/auth/login` - Initiate Auth0 login flow
- `/auth/test-login` - Test login page (development only) - automatically creates session and redirects to dashboard

## API Endpoints

### Authentication

- `GET /api/auth/callback` - Handle Auth0 callback
- `POST /api/auth/logout` - Logout and clear session
- `GET /api/auth/session` - Get current session info

### Protected APIs

- `GET /api/protected/test` - Test protected endpoint
- `GET /api/github/user` - Get GitHub user info (proxied)
- `GET /api/github/repos` - Get GitHub repositories (proxied)

## Architecture

```
Frontend (Nuxt.js)
├── Server-side Authentication (Auth0)
├── PostgreSQL Session Storage
├── Protected Routes & Middleware
├── GitHub API Proxy Endpoints
└── Responsive UI Components
```

## Security Features

- Server-side session management
- Encrypted session cookies (httpOnly, secure, sameSite)
- CSRF protection with state parameters
- Token validation and refresh
- Automatic session cleanup

## Production

Build the application for production:

```bash
pnpm build
```

Preview production build:

```bash
pnpm preview
```

## Documentation

For more information about the authentication architecture, see `/docs/adr/ADR001-auth.md`.

Check out the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) for framework details.
