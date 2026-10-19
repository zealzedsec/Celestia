import { afterEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

const make = (method: string, headers: Record<string, string> = {}, host = '127.0.0.1:4000') =>
  new NextRequest(`http://${host}/api/journal`, { method, headers: { host, ...headers } })

afterEach(() => { delete process.env.CELESTIA_ALLOWED_HOSTS })

describe('API request guard', () => {
  it('lets same-origin JSON writes and plain reads through', () => {
    expect(proxy(make('GET')).status).toBe(200)
    expect(proxy(make('POST', { 'content-type': 'application/json', origin: 'http://127.0.0.1:4000', 'sec-fetch-site': 'same-origin' })).status).toBe(200)
  })
  it('refuses "simple" text/plain posts that would skip the CORS preflight (CSRF)', () => {
    expect(proxy(make('POST', { 'content-type': 'text/plain' })).status).toBe(415)
  })
  it('refuses cross-site and foreign-origin writes', () => {
    expect(proxy(make('POST', { 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' })).status).toBe(403)
    expect(proxy(make('DELETE', { origin: 'http://evil.example' })).status).toBe(403)
  })
  it('enforces the host allow-list when configured (DNS rebinding)', () => {
    process.env.CELESTIA_ALLOWED_HOSTS = '127.0.0.1:4000'
    expect(proxy(make('GET')).status).toBe(200)
    expect(proxy(make('GET', {}, 'rebind.evil.example:4000')).status).toBe(421)
  })
})
