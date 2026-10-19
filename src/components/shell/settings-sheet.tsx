'use client'

import { useRef, useState } from 'react'
import { RotateCcw, Download, Upload, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useCelestiaStore } from '@/lib/celestial/use-sky'
import { desktopBridge } from '@/lib/desktop'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { usePreferences, type AmbiencePref, type MotionPref, type TimeDisplayPref } from '@/lib/celestial/preferences'
import { HOUSE_SYSTEMS, type HouseSystem } from '@/lib/celestial/houses'

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="segmented grid" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button key={o.v} role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)} className={`segmented-item ${value === o.v ? 'segmented-item-active' : ''}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="py-3.5 border-b border-white/[0.05] last:border-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm">{title}</div>
          {hint && <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{hint}</div>}
        </div>
        {children}
      </div>
    </div>
  )
}

const ALERT_KINDS: { id: string; label: string }[] = [
  { id: 'moonphase', label: 'Lunations' }, { id: 'eclipse', label: 'Eclipses' }, { id: 'retrograde', label: 'Stations' },
  { id: 'ingress', label: 'Ingresses' }, { id: 'season', label: 'Seasons' }, { id: 'elongation', label: 'Elongations' },
]

export function SettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const p = usePreferences()
  const observatory = useCelestiaStore((s) => s.location)
  const fileRef = useRef<HTMLInputElement>(null)
  const [restoring, setRestoring] = useState(false)

  const toggleAlerts = async (on: boolean) => {
    if (!on) return p.set({ alerts: false })
    if (typeof Notification === 'undefined') return toast({ title: 'Notifications are not available here', variant: 'destructive' })
    const perm = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
    if (perm !== 'granted') return toast({ title: 'Notifications are blocked', description: 'Allow them for CELESTIA in your system settings.', variant: 'destructive' })
    p.set({ alerts: true })
    toast({ title: 'Event alerts on', description: `You will be notified ${p.alertLeadMinutes} minutes before chosen events while CELESTIA is open.` })
  }

  const restore = async (file: File) => {
    setRestoring(true)
    try {
      const text = await file.text()
      const res = await fetch('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: text })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error)
      toast({ title: 'Archive restored', description: `${j.journal} journal entries and ${j.charts} charts merged.` })
    } catch (e) {
      toast({ title: 'Restore failed', description: e instanceof Error ? e.message : undefined, variant: 'destructive' })
    } finally {
      setRestoring(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[92vw] max-w-md overflow-y-auto scroll-ethereal">
        <SheetHeader>
          <SheetTitle className="font-display tracking-[0.16em]">Observatory Settings</SheetTitle>
          <SheetDescription>Saved in this browser only.</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-8">
          <h3 className="eyebrow mt-2 mb-1">Time</h3>
          <Row title="24-hour clock" hint="Applies to every time shown in the observatory.">
            <Switch checked={p.clock24} onCheckedChange={(v) => p.set({ clock24: v })} aria-label="24-hour clock" />
          </Row>
          <Row title="Show seconds" hint="On the live clock in the top bar.">
            <Switch checked={p.showSeconds} onCheckedChange={(v) => p.set({ showSeconds: v })} aria-label="Show seconds" />
          </Row>
          <div className="py-3.5 border-b border-white/[0.05]">
            <div className="text-sm mb-1">Times shown in</div>
            <div className="text-[11px] text-muted-foreground mb-2">Sunrise, hours and events in the observatory’s own zone{observatory.tz ? ` (${observatory.tz.replace(/_/g, ' ')})` : ''}, or this computer’s.</div>
            <Segmented<TimeDisplayPref> label="Times shown in" value={p.timeDisplay} onChange={(v) => p.set({ timeDisplay: v })}
              options={[{ v: 'observatory', label: `${observatory.name.split(/[ ,(]/)[0]} time` }, { v: 'system', label: 'My local time' }]} />
          </div>

          <h3 className="eyebrow mt-6 mb-1">Event alerts</h3>
          <Row title="Notify me before events" hint="Desktop notifications while CELESTIA is open.">
            <Switch checked={p.alerts} onCheckedChange={toggleAlerts} aria-label="Event alerts" />
          </Row>
          {p.alerts && (
            <div className="py-3 border-b border-white/[0.05] space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {ALERT_KINDS.map((k) => {
                  const on = p.alertKinds.includes(k.id)
                  return (
                    <button key={k.id} aria-pressed={on} onClick={() => p.set({ alertKinds: on ? p.alertKinds.filter((x) => x !== k.id) : [...p.alertKinds, k.id] })}
                      className={`chip ${on ? 'text-[var(--gilded)]' : 'opacity-50'}`}>{k.label}</button>
                  )
                })}
              </div>
              <Segmented<string> label="Lead time" value={String(p.alertLeadMinutes)} onChange={(v) => p.set({ alertLeadMinutes: Number(v) })}
                options={[{ v: '5', label: '5 min' }, { v: '15', label: '15 min' }, { v: '60', label: '1 hour' }]} />
            </div>
          )}

          <h3 className="eyebrow mt-6 mb-1">Ambience</h3>
          <div className="py-3.5 border-b border-white/[0.05]">
            <div className="text-sm mb-2">Starfield</div>
            <Segmented<AmbiencePref> label="Starfield" value={p.ambience} onChange={(v) => p.set({ ambience: v })}
              options={[{ v: 'off', label: 'Off' }, { v: 'subtle', label: 'Subtle' }, { v: 'full', label: 'Full' }]} />
          </div>
          <div className="py-3.5 border-b border-white/[0.05]">
            <div className="text-sm mb-1">Motion</div>
            <div className="text-[11px] text-muted-foreground mb-2">“System” follows your operating system’s reduce-motion setting.</div>
            <Segmented<MotionPref> label="Motion" value={p.motion} onChange={(v) => p.set({ motion: v })}
              options={[{ v: 'system', label: 'System' }, { v: 'reduce', label: 'Reduced' }, { v: 'full', label: 'Full' }]} />
          </div>
          <Row title="Film grain" hint="A faint tactile noise over the void.">
            <Switch checked={p.grain} onCheckedChange={(v) => p.set({ grain: v })} aria-label="Film grain" />
          </Row>

          <h3 className="eyebrow mt-6 mb-1">Astrology</h3>
          <div className="py-3.5">
            <div className="text-sm mb-2">Default house system</div>
            <div className="space-y-1.5">
              {HOUSE_SYSTEMS.map((h) => (
                <button key={h.id} onClick={() => p.set({ houseSystem: h.id as HouseSystem })}
                  className={`w-full text-left px-3 py-2 border transition-colors ${p.houseSystem === h.id ? 'border-[rgba(233,203,124,0.45)] bg-[rgba(233,203,124,0.07)]' : 'border-white/[0.06] hover:border-white/[0.14]'}`}>
                  <div className={`text-sm ${p.houseSystem === h.id ? 'text-[var(--gilded)]' : ''}`}>{h.label}</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">{h.blurb}</div>
                </button>
              ))}
            </div>
          </div>

          <h3 className="eyebrow mt-6 mb-1">Your archive</h3>
          <div className="py-3.5 space-y-2">
            <div className="text-[11px] text-muted-foreground">Journal entries and saved charts live on this machine. Back them up, or move them to another computer.</div>
            <div className="flex gap-2">
              <a href="/api/backup" download className="flex-1 inline-flex items-center justify-center gap-2 h-9 text-xs border border-white/[0.08] hover:border-[rgba(233,203,124,0.4)] hover:text-[var(--gilded)] transition-colors">
                <Download className="h-3.5 w-3.5" /> Export backup
              </a>
              <button onClick={() => fileRef.current?.click()} disabled={restoring} className="flex-1 inline-flex items-center justify-center gap-2 h-9 text-xs border border-white/[0.08] hover:border-[rgba(167,139,250,0.4)] hover:text-[var(--astral)] transition-colors disabled:opacity-50">
                {restoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Restore…
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) restore(f) }} />
            </div>
            <div className="text-[10.5px] text-muted-foreground">Restoring merges — nothing already here is deleted.</div>
            {desktopBridge() && (
              <div className="flex gap-3 pt-1 text-[11px]">
                <button onClick={() => desktopBridge()?.openDataFolder()} className="text-muted-foreground hover:text-[var(--gilded)] underline-offset-4 hover:underline">Open data folder</button>
                <button onClick={() => desktopBridge()?.openLogs()} className="text-muted-foreground hover:text-[var(--gilded)] underline-offset-4 hover:underline">Open logs</button>
                <span className="ml-auto text-muted-foreground/70 tabular">desktop v{desktopBridge()?.version}</span>
              </div>
            )}
          </div>

          <button onClick={p.reset} className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-[var(--gilded)] transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Restore defaults
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
