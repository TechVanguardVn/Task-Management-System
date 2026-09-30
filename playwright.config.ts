import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100'
const useExistingServer = Boolean(process.env.E2E_BASE_URL)

export default defineConfig({
    testDir: './test/e2e',
    fullyParallel: false,
    globalSetup: './test/e2e/global-setup.ts',
    reporter: 'list',
    use: {
        baseURL,
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: useExistingServer
        ? undefined
        : {
              command: 'npm run build && npm run start -- --port 3100',
              url: baseURL,
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
          },
})