/** The animated CELESTIA sigil — a gilded sun with an orbiting violet world */
export function Sigil({ size = 40 }: { size?: number }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 46 46">
        <defs>
          <radialGradient id="sigilCore" cx="38%" cy="34%" r="80%">
            <stop offset="0%" stopColor="#f7e6b0" />
            <stop offset="55%" stopColor="#e9cb7c" />
            <stop offset="100%" stopColor="#a87f2e" />
          </radialGradient>
        </defs>
        <circle cx="23" cy="23" r="21" fill="none" stroke="rgba(233,203,124,0.55)" strokeWidth="1" />
        <circle cx="23" cy="23" r="21" fill="none" stroke="rgba(233,203,124,0.16)" strokeWidth="3" />
        <circle cx="23" cy="23" r="14" fill="none" stroke="rgba(167,139,250,0.45)" strokeWidth="0.7" className="orbit-spin" strokeDasharray="3 4" />
        <circle cx="23" cy="23" r="6.5" fill="url(#sigilCore)" />
        <circle cx="23" cy="23" r="6.5" fill="none" stroke="rgba(255,244,214,0.7)" strokeWidth="0.6" />
        <g className="orbit-spin-fast">
          <circle cx="37" cy="23" r="2" fill="#a78bfa" />
          <circle cx="37" cy="23" r="3.4" fill="none" stroke="rgba(167,139,250,0.35)" strokeWidth="0.5" />
        </g>
        <circle cx="10" cy="15.5" r="1.3" fill="#d3dcea" />
        <circle cx="14.5" cy="33" r="1" fill="#e9cb7c" />
      </svg>
    </span>
  )
}
