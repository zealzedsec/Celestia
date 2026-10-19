#!/usr/bin/env node
// Stage everything the desktop app ships besides Electron itself:
//   desktop-build/server/    the Next.js standalone server (+ static assets, public/, Prisma engines)
//   desktop-build/template.db an empty database with the current schema, copied on first launch
// Run after `next build`.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const standalone = join(root, '.next', 'standalone')
const out = join(root, 'desktop-build')
const server = join(out, 'server')

if (!existsSync(join(standalone, 'server.js'))) {
  console.error('✗ .next/standalone/server.js not found — run `next build` first')
  process.exit(1)
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

console.log('• copying standalone server')
// keep Next's relative links relative (Node would otherwise rewrite them as absolute paths into
// this build machine). Windows cannot create symlinks without admin rights, so copy targets there.
const linkMode = process.platform === 'win32' ? { dereference: true } : { verbatimSymlinks: true }
cpSync(standalone, server, { recursive: true, ...linkMode })
cpSync(join(root, '.next', 'static'), join(server, '.next', 'static'), { recursive: true })
cpSync(join(root, 'public'), join(server, 'public'), { recursive: true })

// never ship developer env files or a developer database
for (const f of readdirSync(server)) if (f.startsWith('.env')) rmSync(join(server, f))
rmSync(join(server, 'db'), { recursive: true, force: true })

// make sure every portable Prisma query engine travels with the server
const engineSrc = join(root, 'node_modules', '.prisma', 'client')
const engineDst = join(server, 'node_modules', '.prisma', 'client')
mkdirSync(engineDst, { recursive: true })
for (const f of readdirSync(engineSrc)) {
  if (/^(libquery_engine|query_engine)/.test(f) || f === 'schema.prisma') cpSync(join(engineSrc, f), join(engineDst, f))
}

// prune what the Node server never loads: Prisma's WASM query engines/compilers (edge & driver
// adapters only — we use the native library engine), type declarations and source maps
console.log('• pruning unused runtime files')
const prune = (dir, test) => {
  if (!existsSync(dir)) return 0
  let n = 0
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) n += prune(p, test)
    else if (test(e.name, p)) { rmSync(p); n++ }
  }
  return n
}
let pruned = prune(join(server, 'node_modules', '@prisma', 'client', 'runtime'), (f) => /^query_(compiler|engine)_bg\./.test(f) || /^(edge|edge-esm|react-native|wasm)/.test(f))
pruned += prune(join(server, 'node_modules'), (f) => f.endsWith('.d.ts') || f.endsWith('.d.mts') || f.endsWith('.map'))
pruned += prune(engineDst, (f) => /^query_engine_bg\./.test(f) || f === 'libquery_engine-debian-openssl-1.1.x.so.node')
console.log(`  removed ${pruned} files`)

// Privacy: Next.js and Prisma bake the build machine's absolute paths (which include the user's
// name and folder layout) into generated metadata. They are not needed at runtime — rewrite them
// to a neutral path, then refuse to continue if any build path or home directory survives.
console.log('• scrubbing build-machine paths')
const NEUTRAL = '/celestia'
// every spelling a path can take in generated files: native, forward-slashed and JSON-escaped
const spellings = (p) => [p, p.replace(/\\/g, '/'), p.replace(/\\/g, '\\\\')]
const forbidden = [...new Set([root, homedir()].filter((p) => p && p.length > 3).flatMap(spellings))].sort((a, b) => b.length - a.length)
const textFile = /\.(js|cjs|mjs|json|prisma|html|txt|md|map|css)$/i
let scrubbed = 0
const scrub = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isSymbolicLink()) continue
    if (e.isDirectory()) { scrub(p); continue }
    if (!textFile.test(e.name)) continue
    const before = readFileSync(p, 'utf8')
    let after = before
    for (const f of forbidden) after = after.split(f).join(NEUTRAL)
    if (after !== before) { writeFileSync(p, after); scrubbed++ }
  }
}
scrub(server)
console.log(`  rewrote ${scrubbed} files`)
const leaks = []
const audit = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isSymbolicLink()) continue
    if (e.isDirectory()) { audit(p); continue }
    const buf = readFileSync(p)
    for (const f of forbidden) if (buf.includes(f)) leaks.push(`${p.slice(server.length + 1)} contains ${f}`)
  }
}
audit(server)
if (leaks.length) {
  console.error('✗ build-machine paths would ship in the desktop app:\n  ' + leaks.join('\n  '))
  process.exit(1)
}

console.log('• creating template database')
const templateDb = join(out, 'template.db')
execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'db', 'push', '--skip-generate'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: `file:${templateDb.replace(/\\/g, '/')}` },
  shell: process.platform === 'win32',
})

const size = (p) => {
  let total = 0
  for (const f of readdirSync(p, { withFileTypes: true })) total += f.isDirectory() ? size(join(p, f.name)) : statSync(join(p, f.name)).size
  return total
}
console.log(`✓ desktop-build ready — server ${(size(server) / 1e6).toFixed(1)} MB, template ${(statSync(templateDb).size / 1e3).toFixed(0)} kB`)
