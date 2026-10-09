import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import type { TestProject } from 'vitest/node'
import { projectRoot } from '../../server/config/database-file.ts'

declare module 'vitest' {
  export interface ProvidedContext { templateDatabaseFile: string }
}

// Migrate one template database per run. Each test file copies it instead of running `prisma migrate deploy`
// itself: ~15 schema-engine processes starting at once on Windows intermittently failed to initialize (0xC0000142).
export default function setup(project: TestProject) {
  const root = resolve(tmpdir(), 'lafu-tests')
  mkdirSync(root, { recursive: true })
  const templateDatabaseFile = resolve(root, 'template-' + randomUUID() + '.db')
  execFileSync(process.execPath, [resolve(projectRoot, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: projectRoot, env: { ...process.env, LAFU_DATABASE_FILE: templateDatabaseFile }, stdio: 'pipe', timeout: 60000,
  })
  project.provide('templateDatabaseFile', templateDatabaseFile)
  return () => { for (const suffix of ['', '-wal', '-shm', '-journal']) rmSync(templateDatabaseFile + suffix, { force: true }) }
}
