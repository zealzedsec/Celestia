// Shared helpers for the API routes: validation, uniform JSON errors, small TTL caches.
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isValidTimeZone, isValidWallTime } from '@/lib/celestial/timezone'
import { HOUSE_SYSTEMS } from '@/lib/celestial/houses'

export const DEFAULT_LOCATION = { lat: -26.2041, lon: 28.0473, name: 'Johannesburg' }

export const NO_STORE = { 'Cache-Control': 'no-store' }

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status, headers: NO_STORE })
}

/** Log the real cause server-side; never leak stack traces or internals to the client. */
export function serverError(scope: string, err: unknown, message: string) {
  console.error(`[${scope}]`, err)
  return jsonError(message, 500)
}

export const latSchema = z.coerce.number().finite().min(-90).max(90)
export const lonSchema = z.coerce.number().finite().min(-180).max(180)

/** Reads ?lat & ?lon (default: the observatory's home) and an optional ?name */
export function parseLocation(sp: URLSearchParams): { lat: number; lon: number; name?: string } | { error: string } {
  const lat = latSchema.safeParse(sp.get('lat') ?? DEFAULT_LOCATION.lat)
  const lon = lonSchema.safeParse(sp.get('lon') ?? DEFAULT_LOCATION.lon)
  if (!lat.success || !lon.success) return { error: 'Invalid coordinates — latitude −90…90, longitude −180…180' }
  const name = sp.get('name')?.slice(0, 80) || undefined
  return { lat: lat.data, lon: lon.data, name }
}

/** Optional ?t=ISO time-travel parameter, bounded to the ephemeris range we trust */
export function parseInstant(raw: string | null, minYear = 1800, maxYear = 2200): Date | { error: string } {
  if (!raw) return new Date()
  const t = new Date(raw)
  if (Number.isNaN(t.getTime())) return { error: 'Invalid t parameter — use an ISO 8601 timestamp' }
  const y = t.getUTCFullYear()
  if (y < minYear || y > maxYear) return { error: `Time machine range is ${minYear}–${maxYear}` }
  return t
}

export const birthInputSchema = z.object({
  name: z.string().trim().max(80).optional().default(''),
  birthDate: z.string().refine(isValidWallTime, 'birthDate must be a real date in the form YYYY-MM-DDTHH:mm'),
  lat: z.number().finite().min(-90).max(90),
  lon: z.number().finite().min(-180).max(180),
  locationName: z.string().trim().max(80).optional().default('Custom location'),
  tzOffsetMinutes: z.number().int().min(-840).max(840).optional().default(0),
  timeZone: z.string().max(64).refine(isValidTimeZone, 'Unknown IANA time zone').optional().nullable(),
})

export const houseSystemSchema = z.enum(HOUSE_SYSTEMS.map((h) => h.id) as [string, ...string[]])

export function zodMessage(err: z.ZodError): string {
  const issue = err.issues[0]
  if (!issue) return 'Invalid request'
  const path = issue.path.join('.')
  return path ? `${path}: ${issue.message}` : issue.message
}

/** Parse a JSON body without throwing on garbage */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    return undefined
  }
}

/** Tiny bounded TTL cache (insertion-ordered eviction) */
export class TtlCache<V> {
  private map = new Map<string, { at: number; value: V }>()
  constructor(private ttlMs: number, private max = 64) {}
  get(key: string): V | undefined {
    const hit = this.map.get(key)
    if (!hit) return undefined
    if (Date.now() - hit.at > this.ttlMs) {
      this.map.delete(key)
      return undefined
    }
    return hit.value
  }
  set(key: string, value: V) {
    this.map.delete(key)
    this.map.set(key, { at: Date.now(), value })
    while (this.map.size > this.max) this.map.delete(this.map.keys().next().value as string)
  }
}

/** Prisma "record not found" (P2025) */
export function isNotFound(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2025'
}
