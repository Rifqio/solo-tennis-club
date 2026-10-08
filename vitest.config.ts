import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  resolve: { alias: { '@shared': fileURLToPath(new URL('./shared', import.meta.url)), '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'node', include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'], testTimeout: 30000, hookTimeout: 60000 },
})
