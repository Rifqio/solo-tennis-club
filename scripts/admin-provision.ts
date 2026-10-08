import { createInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'
import { createPrismaClient, initializeDatabase } from '../server/db.ts'
import { resolveDatabaseFile } from '../server/config/database-file.ts'
import { provisionAdmin, deactivateAdmin } from '../server/auth/provisioning.ts'
async function readPassword(stdin: boolean): Promise<string> {
  if (stdin) {
    let text = ''
    for await (const chunk of process.stdin) {
      text += String(chunk)
      if (text.length > 1024) throw new Error('Password input is too long')
    }
    return text.replace(/\r?\n$/, '')
  }
  if (!process.stdin.isTTY) throw new Error('Use --password-stdin for non-interactive input')
  const muted = new Writable({ write(_chunk, _encoding, done) { done() } })
  const reader = createInterface({ input: process.stdin, output: muted, terminal: true })
  try {
    process.stdout.write('Password: ')
    const first = await reader.question('')
    process.stdout.write('\nRepeat password: ')
    const second = await reader.question('')
    process.stdout.write('\n')
    if (first !== second) throw new Error('Passwords do not match')
    return first
  } finally { reader.close() }
}
async function main() {
  const args = process.argv.slice(2), values: Record<string, string> = {}, flags = new Set<string>()
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (['--password-stdin', '--deactivate'].includes(arg)) flags.add(arg)
    else if (['--email', '--name'].includes(arg) && args[index + 1] && !args[index + 1].startsWith('--')) values[arg] = args[++index]
    else throw new Error('Unknown or incomplete argument')
  }
  if (!values['--email']) throw new Error('--email is required')
  const prisma = createPrismaClient(resolveDatabaseFile())
  try {
    await initializeDatabase(prisma)
    let outcome: string
    if (flags.has('--deactivate')) { await deactivateAdmin(prisma, values['--email']); outcome = 'deactivated' }
    else {
      if (!values['--name']) throw new Error('--name is required')
      outcome = await provisionAdmin(prisma, { email: values['--email'], displayName: values['--name'], password: await readPassword(flags.has('--password-stdin')) })
    }
    console.log(outcome + ' ' + values['--email'].trim().toLowerCase())
  } finally { await prisma.$disconnect() }
}
main().catch(error => { console.error(error instanceof Error && !('code' in error) ? error.message : 'Administrator operation failed'); process.exitCode = 1 })
