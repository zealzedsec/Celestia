#!/usr/bin/env node
// Production web server launcher (cross-platform `npm start`).
// Binds to this computer only by default — the journal is personal. To share CELESTIA on your
// network deliberately, set HOSTNAME=0.0.0.0. Set an absolute DATABASE_URL for production.
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const server = join(root, '.next', 'standalone', 'server.js')
if (!existsSync(server)) {
  console.error('✗ No production build found — run `npm run build` first')
  process.exit(1)
}
process.env.HOSTNAME ||= '127.0.0.1'
process.env.PORT ||= '3000'
process.env.NEXT_TELEMETRY_DISABLED ||= '1'
console.log(`✦ CELESTIA → http://${process.env.HOSTNAME === '0.0.0.0' ? 'localhost' : process.env.HOSTNAME}:${process.env.PORT}`)
createRequire(import.meta.url)(server)
