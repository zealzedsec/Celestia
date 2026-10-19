import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { computeSynastry } from '@/lib/celestial/synastry'
import { offsetForWallTime } from '@/lib/celestial/timezone'
import { birthInputSchema, jsonError, NO_STORE, readJson, serverError, zodMessage } from '@/lib/api'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({ a: birthInputSchema, b: birthInputSchema, swap: z.boolean().optional().default(false) })

// POST /api/synastry — weave two natal charts into cross-aspects, house overlays & a resonance score
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await readJson(req))
  if (!parsed.success) return jsonError(zodMessage(parsed.error))
  const norm = (c: z.infer<typeof birthInputSchema>, fallback: string) => ({
    name: c.name || fallback,
    birthDate: c.birthDate,
    lat: c.lat,
    lon: c.lon,
    locationName: c.locationName,
    tzOffsetMinutes: c.timeZone ? offsetForWallTime(c.birthDate, c.timeZone) : c.tzOffsetMinutes,
  })
  try {
    const a = norm(parsed.data.a, 'The First')
    const b = norm(parsed.data.b, 'The Second')
    const payload = parsed.data.swap ? computeSynastry(b, a) : computeSynastry(a, b)
    return NextResponse.json(payload, { headers: NO_STORE })
  } catch (err) {
    return serverError('synastry', err, 'Failed to weave the charts')
  }
}
