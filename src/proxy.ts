import { NextResponse, type NextRequest } from 'next/server'

/**
 * Request guard for the API.
 *
 * CELESTIA often runs as a local server (the desktop app, `npm start`). Any web page the user
 * visits can fire requests at localhost, so:
 *  - writes must be same-origin JSON: `text/plain` "simple" requests skip the CORS preflight and
 *    could otherwise create journal entries from a hostile site (CSRF);
 *  - with CELESTIA_ALLOWED_HOSTS set (the desktop app sets it), any other Host header is refused,
 *    which defeats DNS-rebinding attacks against the local port.
 */
const WRITE = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function proxy(req: NextRequest) {
  const allowed = process.env.CELESTIA_ALLOWED_HOSTS?.split(',').map((h) => h.trim()).filter(Boolean)
  const host = req.headers.get('host') ?? ''
  if (allowed?.length && !allowed.includes(host)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 421 })
  }

  if (WRITE.has(req.method)) {
    const site = req.headers.get('sec-fetch-site')
    if (site && site !== 'same-origin' && site !== 'none') {
      return NextResponse.json({ error: 'Cross-site request refused' }, { status: 403 })
    }
    const origin = req.headers.get('origin')
    if (origin) {
      let originHost = ''
      try { originHost = new URL(origin).host } catch { /* malformed */ }
      if (originHost !== host) return NextResponse.json({ error: 'Cross-origin request refused' }, { status: 403 })
    }
    if (req.method !== 'DELETE' && !(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 })
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
