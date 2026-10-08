import { defineConfig } from 'prisma/config'
import { databaseUrl } from './server/config/database-file.ts'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: databaseUrl() },
})
