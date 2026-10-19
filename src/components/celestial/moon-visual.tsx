'use client'

import { useId } from 'react'

/**
 * True-phase moon renderer v2 — realistic lunar surface.
 * Terminator = half-ellipse with semi-axis R·|cos(phaseAngle)|:
 *   new(0°)→terminator hugs the lit limb (nothing lit) · quarter(90°)→straight · full(180°)→whole disc lit.
 * Northern-hemisphere convention: waxing lights the right limb, waning lights the left.
 * Surface now carries maria shading, craters with rim highlights, limb darkening
 * and a soft halo — all deterministic SVG (no runtime randomness).
 */
const CRATERS = [
  { cx: -18, cy: -14, r: 9 },   // maria-scale dark seas
  { cx: 10, cy: 8, r: 12 },
  { cx: 22, cy: -20, r: 6 },
  { cx: -8, cy: 26, r: 7 },
  { cx: 26, cy: 18, r: 4 },
  { cx: -30, cy: 10, r: 5 },
  { cx: -14, cy: 2, r: 3.2 },
  { cx: 16, cy: -6, r: 2.4 },
  { cx: 4, cy: -26, r: 3.6 },
  { cx: -24, cy: -28, r: 2.6 },
  { cx: 30, cy: 2, r: 2.2 },
  { cx: -2, cy: 14, r: 1.8 },
]

export function MoonVisual({ phaseAngle, size = 160, glow = true, waxing }: { phaseAngle: number; size?: number; glow?: boolean; waxing?: boolean }) {
  const R = 50
  // React useId guarantees unique SVG defs even when two moons share angle & size
  const uid = `mv${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const a = ((phaseAngle % 360) + 360) % 360
  const k = Math.cos((a * Math.PI) / 180)
  const rx = Math.abs(k) * R
  const wax = waxing ?? a <= 180

  let path = ''
  if (a === 0) {
    path = '' // new moon — fully dark
  } else if (a === 180) {
    // full moon — whole disc
    path = `M 0 ${-R} A ${R} ${R} 0 1 1 0 ${R} A ${R} ${R} 0 1 1 0 ${-R}`
  } else if (a < 90) {
    // waxing crescent — right limb + terminator bulging right
    path = `M 0 ${-R} A ${R} ${R} 0 0 1 0 ${R} A ${rx.toFixed(2)} ${R} 0 0 0 0 ${-R}`
  } else if (a < 180) {
    // waxing gibbous — right limb + terminator bulging left
    path = `M 0 ${-R} A ${R} ${R} 0 0 1 0 ${R} A ${rx.toFixed(2)} ${R} 0 0 1 0 ${-R}`
  } else if (a < 270) {
    // waning gibbous — left limb + terminator bulging right
    path = `M 0 ${-R} A ${R} ${R} 0 0 0 0 ${R} A ${rx.toFixed(2)} ${R} 0 0 0 0 ${-R}`
  } else {
    // waning crescent — left limb + terminator bulging left
    path = `M 0 ${-R} A ${R} ${R} 0 0 0 0 ${R} A ${rx.toFixed(2)} ${R} 0 0 1 0 ${-R}`
  }

  const lit = a > 0.5 && a < 359.5

  return (
    <svg width={size} height={size} viewBox="-62 -64 124 124" role="img" aria-label="Moon phase rendering">
      <defs>
        {/* lunar surface: brighter highlands centre-upper-left, gentle shading */}
        <radialGradient id={`surface-${uid}`} cx="40%" cy="36%" r="80%">
          <stop offset="0%" stopColor="#f7f4ec" />
          <stop offset="45%" stopColor="#e2ddcf" />
          <stop offset="80%" stopColor="#bfb9a9" />
          <stop offset="100%" stopColor="#938e80" />
        </radialGradient>
        {/* limb darkening over the lit crescent */}
        <radialGradient id={`limb-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="72%" stopColor="rgba(20,16,36,0)" />
          <stop offset="100%" stopColor="rgba(20,16,36,0.5)" />
        </radialGradient>
        {/* soft halo */}
        <radialGradient id={`halo-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(233,203,124,0.32)" />
          <stop offset="62%" stopColor="rgba(233,203,124,0.10)" />
          <stop offset="100%" stopColor="rgba(233,203,124,0)" />
        </radialGradient>
        <radialGradient id={`crater-${uid}`} cx="38%" cy="34%" r="75%">
          <stop offset="0%" stopColor="rgba(93,90,82,0.55)" />
          <stop offset="78%" stopColor="rgba(93,90,82,0.4)" />
          <stop offset="100%" stopColor="rgba(93,90,82,0.12)" />
        </radialGradient>
        <clipPath id={`clip-${uid}`}>
          <circle cx="0" cy="0" r={R} />
        </clipPath>
      </defs>

      {glow && <circle cx="0" cy="0" r="60" fill={`url(#halo-${uid})`} />}

      {/* dark disc (earthshine side) */}
      <circle cx="0" cy="0" r={R} fill="#141024" stroke="rgba(167,139,250,0.25)" strokeWidth="0.8" />

      {/* lit region with texture */}
      {lit && path && (
        <g clipPath={`url(#clip-${uid})`}>
          <path d={path} fill={`url(#surface-${uid})`} />
          {/* mare + crater texture, clipped to lit part */}
          <g clipPath={`url(#litclip-${uid})`}>
            {CRATERS.map((c, i) => (
              <g key={i}>
                <circle cx={c.cx} cy={c.cy} r={c.r} fill={`url(#crater-${uid})`} />
                {/* rim highlight on lower-right of each crater */}
                <path
                  d={`M ${c.cx - c.r * 0.62} ${c.cy + c.r * 0.5} A ${c.r} ${c.r} 0 0 0 ${c.cx + c.r * 0.72} ${c.cy + c.r * 0.45}`}
                  fill="none" stroke="rgba(255,252,240,0.35)" strokeWidth={Math.max(0.4, c.r * 0.09)}
                />
              </g>
            ))}
          </g>
          {/* limb darkening tint over lit area */}
          <path d={path} fill={`url(#limb-${uid})`} />
          {/* terminator softening */}
          <path d={path} fill="none" stroke="rgba(255,249,230,0.28)" strokeWidth="0.6" />
        </g>
      )}

      {/* inner clip for the lit region only (texture must not spill onto dark side) */}
      <defs>
        <clipPath id={`litclip-${uid}`}>
          <path d={path || 'M 0 0'} />
        </clipPath>
      </defs>

      <circle cx="0" cy="0" r={R} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.6" />
      {a !== 0 && a !== 180 && (
        <text x="0" y={-R - 8} textAnchor="middle" fontSize="7.5" fill={wax ? 'rgba(233,203,124,0.9)' : 'rgba(167,139,250,0.95)'} fontFamily="serif" letterSpacing="1">
          {wax ? '☽ waxing' : '☾ waning'}
        </text>
      )}
    </svg>
  )
}
