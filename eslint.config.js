import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'server/generated', 'playwright-report', 'test-results', 'tmp', '.playwright-mcp']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['server/**', 'scripts/**', 'tests/**', '*.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['server/**/*.router.ts', 'server/**/*.controller.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['**/*.repository.ts'], message: 'HTTP handlers call services; repositories belong to the service layer.' }],
      }],
    },
  },
  {
    files: ['server/**/*.service.ts', 'server/**/*.repository.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'express', message: 'Keep HTTP types and behavior in controllers and middleware.' }],
        patterns: [{ group: ['**/*.controller.ts', '**/*.router.ts'], message: 'Services and repositories must not depend on HTTP handlers.' }],
      }],
    },
  },
  {
    files: ['server/**/*.service.ts', 'server/**/*.controller.ts', 'server/**/*.router.ts'],
    rules: {
      'no-restricted-syntax': ['error',
        {
          selector: 'CallExpression[callee.object.object.name=/^(database|prisma|db|tx|transaction)$/]',
          message: 'Move database queries into a feature repository.',
        },
        {
          selector: 'CallExpression[callee.property.name=/^\\$(transaction|queryRaw|executeRaw|queryRawUnsafe|executeRawUnsafe)$/]',
          message: 'Use the database transaction boundary or a repository for database operations.',
        },
      ],
    },
  },
])
