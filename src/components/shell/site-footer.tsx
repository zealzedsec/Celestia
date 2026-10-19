export function SiteFooter({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <footer className="site-footer max-w-7xl mx-auto mt-14 pt-6">
      <div className="sigil-divider mb-4 text-[11px] tracking-[0.4em] uppercase">As above · so below</div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="text-[var(--gilded)]">✧</span>
          <span><span className="text-foreground/80 font-medium">CELESTIA</span> — computed live from arcsecond-grade ephemeris</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 uppercase tracking-widest text-[9.5px]">
          <span title="VSOP87/ELP-grade planetary theory">astronomy-engine</span>
          <span title="Bright-star firmament">HYG v4.1 stars</span>
          <span title="Live deep-space imagery">NASA image library</span>
          <span title="Historical time-zone rules">IANA tz database</span>
        </div>
        <button onClick={onOpenPalette} className="hover:text-[var(--gilded)] transition-colors">⌘K conjure</button>
      </div>
    </footer>
  )
}
