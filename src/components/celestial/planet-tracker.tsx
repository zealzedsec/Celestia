'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSky, fmtTime } from '@/lib/celestial/use-sky'
import { PLANET_BY_ID } from '@/lib/celestial/data'
import { Skeleton } from '@/components/ui/skeleton'
import { SkyMap } from './sky-map'
import { NasaArchiveDialog } from './nasa-archive'
import { AlertTriangle, Globe2, Eye, Camera, Table2, Orbit } from 'lucide-react'

type Tab = 'ephemeris' | 'dome'

export function PlanetTracker() {
  const { data: sky, loading, error } = useSky(60000)
  const [tab, setTab] = useState<Tab>('ephemeris')
  const [selected, setSelected] = useState<string | null>(null)
  const [nasaBody, setNasaBody] = useState<string | null>(null)

  if (loading && !sky) return <div className="grid gap-4"><Skeleton className="h-96 celestial-card" /></div>
  if (error || !sky) return <div className="celestial-card p-6 flex items-center gap-3 text-destructive"><AlertTriangle className="h-5 w-5" /> Planet engine offline ({error}).</div>

  const bodies = sky.allBodies
  const sel = selected ? bodies.find((b) => b.id === selected) : null

  return (
    <div className="space-y-4">
      {/* Module tabs */}
      <div className="flex items-center gap-2">
        {([
          { id: 'ephemeris', label: 'Ephemeris & Aspects', icon: Table2 },
          { id: 'dome', label: 'Sky Dome', icon: Orbit },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs uppercase tracking-widest transition-all ${
              tab === id
                ? 'border-[rgba(233,203,124,0.55)] text-[var(--gilded)] bg-[rgba(233,203,124,0.07)] glow-gold'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === 'dome' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <SkyMap />
        </motion.div>
      )}

      {tab === 'ephemeris' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-4">
          {/* Main positions table */}
          <div className="celestial-card p-4">
            <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground px-2 pb-3 flex items-center justify-between">
              <span>Geocentric Ephemeris — true ecliptic of date</span>
              <button
                onClick={() => setNasaBody(bodies.find((b) => b.id === 'moon')?.name ?? 'Moon')}
                className="normal-case tracking-normal flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-[var(--gilded)] transition-colors"
              >
                <Camera className="h-3.5 w-3.5" /> cosmic archive
              </button>
            </div>
            <div className="overflow-x-auto scroll-ethereal">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border/60">
                    <th className="py-2 px-2">Body</th>
                    <th className="py-2 px-2">Position</th>
                    <th className="py-2 px-2">Motion</th>
                    <th className="py-2 px-2">Distance</th>
                    <th className="py-2 px-2">RA / Dec</th>
                    <th className="py-2 px-2">Altitude</th>
                    <th className="py-2 px-2">Rise</th>
                    <th className="py-2 px-2">Set</th>
                    <th className="py-2 px-2">Mag</th>
                    <th className="py-2 px-2" aria-label="Archive" />
                  </tr>
                </thead>
                <tbody>
                  {bodies.map((p, i) => {
                    const meta = PLANET_BY_ID[p.id]
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.035, duration: 0.3 }}
                        onClick={() => setSelected(selected === p.id ? null : p.id)}
                        className={`border-b border-border/30 cursor-pointer transition-colors hover:bg-primary/5 ${selected === p.id ? 'bg-primary/10' : ''}`}
                      >
                        <td className="py-2 px-2">
                          <span className="text-lg mr-1.5 inline-block" style={{ color: meta.color, textShadow: `0 0 12px ${meta.color}66` }}>{p.glyph}</span>
                          <span className="font-medium">{p.name}</span>
                          {p.retrograde && <span className="ml-1.5 text-[10px] text-destructive align-top">℞</span>}
                        </td>
                        <td className="py-2 px-2 tabular"><span className="text-[var(--gilded)]">{p.formattedDegree.split(' ')[0]}</span> {p.sign}</td>
                        <td className="py-2 px-2 tabular text-xs text-muted-foreground">{p.speed >= 0 ? '+' : ''}{p.speed.toFixed(3)}°/d</td>
                        <td className="py-2 px-2 tabular text-xs">
                          {p.id === 'sun' || p.id === 'moon' ? `${(p.distanceKm / 1000).toFixed(0)}k km` : `${p.distanceAU.toFixed(3)} AU`}
                        </td>
                        <td className="py-2 px-2 tabular text-xs text-muted-foreground">{fmtH(p.raHours)} {p.decDeg >= 0 ? '+' : ''}{p.decDeg.toFixed(1)}°</td>
                        <td className="py-2 px-2 tabular text-xs">
                          <span className={p.isAboveHorizon ? 'text-[var(--gilded)]' : 'text-muted-foreground'}>{p.altitude >= 0 ? '↑' : '↓'} {Math.abs(p.altitude).toFixed(1)}°</span>
                        </td>
                        <td className="py-2 px-2 tabular text-xs text-muted-foreground">{fmtTime(p.riseTime)}</td>
                        <td className="py-2 px-2 tabular text-xs text-muted-foreground">{fmtTime(p.setTime)}</td>
                        <td className="py-2 px-2 tabular text-xs text-muted-foreground">{p.magnitude !== null ? p.magnitude.toFixed(1) : '—'}</td>
                        <td className="py-2 px-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setNasaBody(p.name) }}
                            title={`NASA imagery of ${p.name}`}
                            className="rounded-md p-1.5 text-muted-foreground/60 hover:text-[var(--gilded)] hover:bg-primary/10 transition-colors"
                          >
                            <Camera className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {sel && (
              <div className="mt-3 mx-1 rounded-lg border border-[rgba(233,203,124,0.3)] bg-secondary/30 p-4 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="font-display text-lg mb-1" style={{ color: PLANET_BY_ID[sel.id].color }}>{sel.glyph} {sel.name} — occult vitals</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{PLANET_BY_ID[sel.id].retroMeaning}</div>
                  <div className="mt-2 text-xs space-y-1">
                    <div>Constellation (IAU 88): <span className="text-[var(--astral)]">{sel.constellation}</span></div>
                    <div>Ecliptic latitude: <span className="tabular">{sel.latitude.toFixed(3)}°</span> · Azimuth: <span className="tabular">{sel.azimuth.toFixed(1)}°</span></div>
                    <div>Meridian transit: <span className="tabular">{fmtTime(sel.transitTime)}</span></div>
                    <div>Elemental dress: <span className="text-[var(--gilded)]">{sel.element}</span> · {sel.modality}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">Alchemical signature</div>
                  <div className="text-sm space-y-1">
                    <div><span className="text-muted-foreground">Metal:</span> {PLANET_BY_ID[sel.id].metal}</div>
                    <div><span className="text-muted-foreground">Day:</span> {PLANET_BY_ID[sel.id].day} · <span className="text-muted-foreground">Archangel:</span> {PLANET_BY_ID[sel.id].archangel}</div>
                    <div className="text-xs text-muted-foreground italic">“{PLANET_BY_ID[sel.id].process}”</div>
                  </div>
                  <button
                    onClick={() => setNasaBody(sel.name)}
                    className="mt-3 flex items-center gap-1.5 rounded-full border border-[rgba(233,203,124,0.4)] px-3 py-1 text-[11px] uppercase tracking-widest text-[var(--gilded)] hover:bg-[rgba(233,203,124,0.08)] transition-colors"
                  >
                    <Camera className="h-3 w-3" /> view NASA plates
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Aspect grid */}
            <div className="celestial-card p-4">
              <div className="flex items-center gap-2 px-2 pb-3">
                <Eye className="h-4 w-4" style={{ color: 'var(--gilded)' }} />
                <span className="eyebrow">Live Aspect Web — sorted by exactness</span>
              </div>
              <div className="space-y-1.5 max-h-80 overflow-y-auto scroll-ethereal pr-1">
                {sky.aspects.map((a, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span style={{ color: PLANET_BY_ID[a.a]?.color }}>{PLANET_BY_ID[a.a]?.glyph}</span>
                      <span>{a.aName}</span>
                      <span className="text-base" style={{ color: a.nature === 'harmonious' ? '#8fd4a8' : a.nature === 'challenging' ? '#e2543e' : 'var(--gilded)' }}>{a.glyph}</span>
                      <span>{a.bName}</span>
                      <span style={{ color: PLANET_BY_ID[a.b]?.color }}>{PLANET_BY_ID[a.b]?.glyph}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">{a.type}</span>
                      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden hidden sm:block">
                        <div className="h-full rounded-full" style={{ width: `${Math.round(a.exactness * 100)}%`, background: a.nature === 'harmonious' ? '#8fd4a8' : a.nature === 'challenging' ? '#e2543e' : 'var(--gilded)' }} />
                      </div>
                      <span className="tabular w-20 text-right text-muted-foreground">{a.orb.toFixed(2)}° {a.applying ? '→' : '←'}</span>
                    </div>
                  </div>
                ))}
                {sky.aspects.length === 0 && <div className="text-sm text-muted-foreground px-3 py-6 text-center">No major aspects within orb — a rare silence in the web.</div>}
              </div>
            </div>

            {/* Retrogrades + visibility */}
            <div className="space-y-4">
              <div className="celestial-card p-4">
                <div className="eyebrow px-2 pb-3">Retrograde Watch</div>
                <div className="space-y-1.5">
                  {bodies.filter((p) => p.id !== 'sun' && p.id !== 'moon').map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span style={{ color: PLANET_BY_ID[p.id].color }}>{p.glyph}</span> {p.name}
                      </span>
                      {p.retrograde ? (
                        <span className="text-xs text-destructive">℞ retrograde · {Math.abs(p.speed).toFixed(3)}°/day backward</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">direct · {p.speed.toFixed(3)}°/day forward</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="celestial-card p-4">
                <div className="flex items-center gap-2 px-2 pb-3">
                  <Globe2 className="h-4 w-4" style={{ color: 'var(--gilded)' }} />
                  <span className="eyebrow">Above the Horizon Now</span>
                </div>
                <div className="flex flex-wrap gap-2 px-1">
                  {bodies.filter((p) => p.isAboveHorizon).map((p) => (
                    <span key={p.id} className="rounded-full border border-[rgba(233,203,124,0.35)] px-3 py-1 text-sm" style={{ color: PLANET_BY_ID[p.id].color }}>
                      {p.glyph} {p.name} <span className="tabular text-[11px] text-muted-foreground">{p.altitude.toFixed(0)}°</span>
                    </span>
                  ))}
                  {bodies.every((p) => !p.isAboveHorizon) && <span className="text-sm text-muted-foreground">All wanderers below the horizon.</span>}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* NASA Cosmic Archive */}
      <NasaArchiveDialog bodyName={nasaBody ?? 'Moon'} open={!!nasaBody} onOpenChange={(v) => !v && setNasaBody(null)} />
    </div>
  )
}

function fmtH(h: number): string {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${String(hh).padStart(2, '0')}h${String(mm).padStart(2, '0')}`
}
