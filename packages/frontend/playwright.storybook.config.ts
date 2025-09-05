import { defineConfig, devices } from '@playwright/test'

// Playwright config dedicated to running VRT against Storybook
// Runs a Storybook dev server on port 6006 and captures screenshots per story
export default defineConfig({
  testDir: './components',
  testMatch: '**/*.vrt.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:6006',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'storybook dev -p 6006 -c .storybook',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
