# E2E Testing with Playwright

This directory contains end-to-end tests for the Chase Light frontend application using Playwright.

## Test Structure

### Test Categories

1. **Public Tests** (`*.public.spec.ts`)

   - Tests for pages that don't require authentication
   - Homepage functionality
   - Public API endpoints

2. **Authenticated Tests** (`*.authenticated.spec.ts`)

   - Tests for protected pages and features
   - Dashboard, profile pages
   - Protected API endpoints
   - Requires authentication setup

3. **Mobile Tests** (`*.mobile.spec.ts`)
   - Mobile-specific responsive tests
   - Touch interactions

### Setup Files

- `auth.setup.ts` - Creates test user session using test login endpoint
- `auth.cleanup.ts` - Cleans up test sessions after tests complete

## Authentication Strategy

We use a **test-specific authentication page** (`/auth/test-login`) that:

- Only works in development/test environments
- Creates a valid PostgreSQL session for testing
- Bypasses the actual Auth0 flow for faster, more reliable tests
- Provides consistent test data
- Automatically redirects to the dashboard after session creation

### Benefits

- **Fast**: No external Auth0 API calls
- **Reliable**: No network dependencies
- **Consistent**: Same test user data every time
- **Isolated**: Tests don't affect real user data

## Running Tests

### Prerequisites

1. Install Playwright browsers:

```bash
pnpm test:e2e:install
```

2. Start the development server:

```bash
pnpm dev
```

3. Ensure PostgreSQL is running and DATABASE_URL is configured

### Test Commands

```bash
# Run all tests
pnpm test:e2e

# Run tests with UI mode
pnpm test:e2e:ui

# Run tests in debug mode
pnpm test:e2e:debug

# View test report
pnpm test:e2e:report
```

### Test Projects

- `setup` - Runs authentication setup
- `cleanup` - Cleans up test data
- `chromium-authenticated` - Authenticated tests in Chrome
- `chromium-public` - Public tests in Chrome
- `mobile-chrome` - Mobile tests

## Test Data

The authentication setup creates a test user with:

```json
{
  "userId": "test-user-123",
  "email": "test@example.com",
  "name": "Test User",
  "avatar": "https://github.com/playwright-test.png",
  "provider": "github"
}
```

## Environment Variables

The tests use the same environment variables as the main application:

- `DATABASE_URL` - PostgreSQL connection string
- `NUXT_SESSION_SECRET` - Session encryption key
- `NODE_ENV` - Should be 'development' or 'test'

## CI/CD Considerations

For CI environments:

1. Set `NODE_ENV=test`
2. Ensure PostgreSQL is available
3. Install browsers with `pnpm test:e2e:install`
4. Run tests with `pnpm test:e2e`

## Troubleshooting

### Common Issues

1. **Tests fail with authentication errors**

   - Ensure PostgreSQL is running
   - Check DATABASE_URL configuration
   - Verify NUXT_SESSION_SECRET is set

2. **Tests timeout**

   - Increase timeout in playwright.config.ts
   - Check if development server is running
   - Verify baseURL in config

3. **Browser installation issues**
   - Run `pnpm test:e2e:install` manually
   - Check available disk space
   - Try different browser versions

### Debug Mode

Use debug mode to step through tests:

```bash
pnpm test:e2e:debug tests/dashboard.authenticated.spec.ts
```

This opens the Playwright Inspector for interactive debugging.

## Future Enhancements

1. **Phase 2: Auth0 M2M Authentication**

   - Implement Machine-to-Machine authentication
   - More realistic authentication testing
   - Better production parity

2. **Visual Testing**

   - Screenshot comparisons
   - Cross-browser visual regression testing

3. **Performance Testing**
   - Page load time assertions
   - Network monitoring
   - Bundle size validation
