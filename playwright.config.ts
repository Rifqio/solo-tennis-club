import { defineConfig } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

export default defineConfig({
  testDir: './tests/e2e', workers: 1, fullyParallel: false, retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4310', trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile-chromium', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'desktop-chromium', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'npx tsx tests/e2e/support/e2e-server.ts', url: 'http://127.0.0.1:4310/api/public/schedule',
    reuseExistingServer: false, timeout: 120000,
    // Demo mode: members sign in with the code shown on screen (the payment specs need a real member).
    env: { STC_DEMO: '1', STC_PORT: '4310', STC_DATABASE_FILE: resolve(tmpdir(), 'stc-e2e', randomUUID() + '.db') },
  },
})
