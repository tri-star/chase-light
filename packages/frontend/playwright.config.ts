import { defineConfig, devices } from '@playwright/test'

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Global setup - runs before all tests */
  // globalSetup: require.resolve('./global-setup'),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project
    { 
      name: 'setup', 
      testMatch: /.*\.setup\.ts/,
      // teardown: 'cleanup',
    },

    // Cleanup project  
    // {
    //   name: 'cleanup',
    //   testMatch: /.*\.cleanup\.ts/,
    // },

    // Tests that require authentication
    {
      name: 'chromium-authenticated',
      use: { 
        ...devices['Desktop Chrome'],
        // Use prepared auth state
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /.*\.authenticated\.spec\.ts/,
    },

    // Tests that don't require authentication (public pages)
    {
      name: 'chromium-public',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /.*\.public\.spec\.ts/,
    },

    // Tests for unauthenticated API access
    // {
    //   name: 'chromium-unauthenticated',
    //   use: { 
    //     ...devices['Desktop Chrome'],
    //     // 明示的に認証状態をクリア
    //     storageState: { cookies: [], origins: [] }
    //   },
    //   testMatch: '**/*.unauthenticated.spec.ts',
    // },

    // Mobile tests (optional)
    // {
    //   name: 'mobile-chrome',
    //   use: { 
    //     ...devices['Pixel 5'],
    //     storageState: 'playwright/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    //   testMatch: /.*\.mobile\.spec\.ts/,
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})