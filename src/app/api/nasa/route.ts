import { NextRequest, NextResponse } from 'next/server'
import { TtlCache } from '@/lib/api'

export const dynamic = 'force-dynamic'

interface NasaItem {
  nasaId: string
  title: string
  description: string
  date: string
  center: string
  photographer: string
  thumb: string
  medium: string
}

// 30-minute TTL, bounded so arbitrary queries cannot grow memory without limit
const cache = new TtlCache<NasaItem[]>(30 * 60 * 1000, 64)

/**
 * NASA Image & Video Library (images-api.nasa.gov) — official public archive
 * of NASA photography from Apollo, Cassini, Hubble, Voyager, ISS & more.
 * Server-side fetch with in-memory TTL cache to stay polite & fast.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const q = (sp.get('q') ?? 'nebula').trim().slice(0, 80) || 'nebula'
    const yearRaw = sp.get('year_start') ?? ''
    const yearStart = /^\d{4}$/.test(yearRaw) ? yearRaw : ''

    const key = `${q}|${yearStart}`
    const hit = cache.get(key)
    if (hit) return NextResponse.json({ query: q, items: hit, cached: true })

    const url = new URL('https://images-api.nasa.gov/search')
    url.searchParams.set('q', q)
    url.searchParams.set('media_type', 'image')
    url.searchParams.set('page_size', '12')
    if (yearStart) url.searchParams.set('year_start', yearStart)

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(9000),
    })
    if (!res.ok) throw new Error(`NASA archive responded ${res.status}`)

    const json = await res.json()
    const rawItems: Array<Record<string, unknown>> = json?.collection?.items ?? []

    const items: NasaItem[] = rawItems
      .map((item) => {
        const data = (item?.data as Array<Record<string, unknown>> | undefined)?.[0]
        const links = (item?.links as Array<Record<string, unknown>> | undefined) ?? []
        const thumbLink = links.find((l) => l.render === 'image')
        if (!data || !thumbLink) return null
        const nasaId = String(data.nasa_id ?? '')
        return {
          nasaId,
          title: String(data.title ?? 'Untitled'),
          description: String(data.description ?? '').slice(0, 420),
          date: String(data.date_created ?? '').slice(0, 10),
          center: String(data.center ?? ''),
          photographer: String(data.secondary_creator ?? ''),
          thumb: String(thumbLink.href ?? ''),
          medium: nasaId ? `https://images-assets.nasa.gov/image/${nasaId}/${nasaId}~medium.jpg` : '',
        }
      })
      .filter((x): x is NasaItem => x !== null)
      .slice(0, 12)

    cache.set(key, items)
    return NextResponse.json({ query: q, items, cached: false })
  } catch (e) {
    console.error('[nasa]', e)
    return NextResponse.json({ error: 'The NASA archive is unreachable right now' }, { status: 502 })
  }
}
