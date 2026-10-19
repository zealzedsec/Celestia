#!/usr/bin/env node
// After `next build`: copy static assets & public/ into the standalone server so `npm start` works.
// (Cross-platform replacement for `cp -r`, which does not exist on Windows runners.)
import { cpSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const standalone = join(root, '.next', 'standalone')
if (!existsSync(standalone)) {
  console.error('✗ .next/standalone missing — is output: "standalone" set in next.config.ts?')
  process.exit(1)
}
cpSync(join(root, '.next', 'static'), join(standalone, '.next', 'static'), { recursive: true })
cpSync(join(root, 'public'), join(standalone, 'public'), { recursive: true })
console.log('✓ standalone server assembled')
