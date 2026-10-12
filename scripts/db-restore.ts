import { resolveDatabaseFile } from '../server/config/database-file.ts'
import { restoreDatabase } from '../server/ops/backup.ts'

const args = process.argv.slice(2)
const values: Record<string, string> = {}
let force = false
for (let index = 0; index < args.length; index++) {
  const arg = args[index]
  if (arg === '--force') force = true
  else if ((arg === '--from' || arg === '--to') && args[index + 1] && !args[index + 1].startsWith('--')) values[arg] = args[++index]
  else { console.error('Usage: npm run db:restore -- --from <backup.db> [--to <database.db>] [--force]'); process.exit(1) }
}
if (!values['--from']) { console.error('--from is required'); process.exit(1) }

const target = values['--to'] ?? resolveDatabaseFile()
console.log('Stop the STC server before restoring over the live database file.')
try {
  console.log('Restored to: ' + await restoreDatabase({ from: values['--from'], to: target, force }))
} catch (error) {
  console.error('Restore failed: ' + (error instanceof Error ? error.message : String(error)))
  process.exitCode = 1
}
