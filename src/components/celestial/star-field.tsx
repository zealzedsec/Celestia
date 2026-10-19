'use client'

import { usePreferences } from '@/lib/celestial/preferences'
import { useMemo } from 'react'

/**
 * Cinematic celestial backdrop — three rendered layers:
 *   1. Nebula veils: blurred aurora clouds drifting on long orbits
 *   2. Star field: two parallax depths of twinkling stars (a few "majors")
 *   3. Shooting stars: sparse meteors on independent timers
 *
 * Deterministic 32-bit LCG (Math.imul) — bit-exact across server & client
 * engines, so SSR and CSR produce identical markup (no hydration mismatch).
 */
/** Deterministic LCG factory — module scope so render-scope stays immutable. */
function createRng(seed: number) {
  let s = seed
  return () => {
    s = (Math.imul(s, 48271) >>> 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function StarField() {
  const ambience = usePreferences((s) => s.ambience)
  const { stars, majors, nebulas, meteors } = useMemo(() => {
    const rnd = createRng(1337)

    const stars: { top: number; left: number; size: number; dur: number; peak: number; gold: boolean }[] = []
    for (let i = 0; i < 150; i++) {
      const r1 = rnd(), r2 = rnd(), r3 = rnd(), r4 = rnd(), r5 = rnd(), r6 = rnd()
      stars.push({
        top: r1 * 100,
        left: r2 * 100,
        size: r3 < 0.86 ? r3 * 1.5 + 0.4 : r3 * 2.2 + 1.1,
        dur: r4 * 5.5 + 2.5,
        peak: r5 * 0.55 + 0.25,
        gold: r6 < 0.2,
      })
    }

    const majors: { top: number; left: number; size: number; dur: number; hue: string }[] = []
    for (let i = 0; i < 9; i++) {
      const r1 = rnd(), r2 = rnd(), r3 = rnd(), r4 = rnd()
      const hue = r4 < 0.4 ? '#e9cb7c' : r4 < 0.75 ? '#ffffff' : '#bfe6ff'
      majors.push({
        top: r1 * 88 + 3,
        left: r2 * 92 + 4,
        size: r3 * 1.6 + 2.2,
        dur: r3 * 4 + 3.5,
        hue,
      })
    }

    const nebulas: { top: string; left: string; w: number; h: number; dur: number; bg: string }[] = [
      { top: '-14%', left: '58%', w: 780, h: 560, dur: 105, bg: 'radial-gradient(closest-side, rgba(96, 62, 168, 0.20), rgba(96, 62, 168, 0.07) 55%, transparent 75%)' },
      { top: '48%', left: '-18%', w: 900, h: 640, dur: 130, bg: 'radial-gradient(closest-side, rgba(44, 28, 92, 0.24), rgba(44, 28, 92, 0.08) 55%, transparent 78%)' },
      { top: '72%', left: '52%', w: 640, h: 440, dur: 96, bg: 'radial-gradient(closest-side, rgba(200, 156, 84, 0.06), rgba(200, 156, 84, 0.025) 55%, transparent 75%)' },
      { top: '6%', left: '4%', w: 560, h: 400, dur: 118, bg: 'radial-gradient(closest-side, rgba(126, 96, 210, 0.10), rgba(126, 96, 210, 0.04) 55%, transparent 75%)' },
    ]

    const meteors: { top: number; left: number; angle: number; dx: string; dy: string; dur: number; delay: number }[] = []
    for (let i = 0; i < 4; i++) {
      const r1 = rnd(), r2 = rnd(), r3 = rnd(), r4 = rnd()
      meteors.push({
        top: r1 * 30 + 2,
        left: r2 * 55 + 8,
        angle: 24 + r3 * 22,
        dx: `${(28 + r3 * 26).toFixed(1)}vw`,
        dy: `${(16 + r4 * 20).toFixed(1)}vh`,
        dur: 5.2 + r4 * 4,
        delay: r4 * 14,
      })
    }

    return { stars, majors, nebulas, meteors }
  }, [])

  if (ambience === 'off') return null
  const subtle = ambience === 'subtle'

  return (
    <div className={`starfield ${subtle ? 'starfield-subtle' : ''}`} aria-hidden="true">
      {/* Layer 1 — nebula veils */}
      {nebulas.map((n, i) => (
        <span
          key={`neb-${i}`}
          className="nebula"
          style={{
            top: n.top,
            left: n.left,
            width: `${n.w}px`,
            height: `${n.h}px`,
            background: n.bg,
            ['--dur' as string]: `${n.dur}s`,
          }}
        />
      ))}

      {/* Layer 2 — twinkling stars */}
      {(subtle ? stars.filter((_, i) => i % 2 === 0) : stars).map((s, i) => (
        <span
          key={`star-${i}`}
          className="star"
          style={{
            top: `${s.top.toFixed(3)}%`,
            left: `${s.left.toFixed(3)}%`,
            width: `${s.size.toFixed(3)}px`,
            height: `${s.size.toFixed(3)}px`,
            ['--dur' as string]: `${s.dur.toFixed(3)}s`,
            ['--peak' as string]: s.peak.toFixed(3),
            background: s.gold ? '#e9cb7c' : '#ffffff',
            boxShadow: s.gold ? '0 0 6px rgba(233,203,124,0.8)' : '0 0 4px rgba(255,255,255,0.6)',
          }}
        />
      ))}

      {/* Layer 2b — bright major stars with cross-glow */}
      {majors.map((s, i) => (
        <span
          key={`major-${i}`}
          className="star star-major"
          style={{
            top: `${s.top.toFixed(3)}%`,
            left: `${s.left.toFixed(3)}%`,
            width: `${s.size.toFixed(2)}px`,
            height: `${s.size.toFixed(2)}px`,
            ['--dur' as string]: `${s.dur.toFixed(2)}s`,
            ['--peak' as string]: '0.95',
            background: s.hue,
            boxShadow: `0 0 12px 2px ${s.hue}66`,
          }}
        />
      ))}

      {/* Layer 3 — shooting stars */}
      {!subtle && meteors.map((m, i) => (
        <span
          key={`meteor-${i}`}
          className="shooting-star"
          style={{
            top: `${m.top.toFixed(2)}%`,
            left: `${m.left.toFixed(2)}%`,
            ['--angle' as string]: `${m.angle.toFixed(1)}deg`,
            ['--dx' as string]: m.dx,
            ['--dy' as string]: m.dy,
            ['--shoot-dur' as string]: `${m.dur.toFixed(2)}s`,
            ['--delay' as string]: `${m.delay.toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  )
}
