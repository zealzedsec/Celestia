'use client'

/**
 * The Command Veil — ⌘K / Ctrl+K palette.
 * Jump to any chamber, align the observatory to a city, export the almanac, change settings.
 */
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { CITY_PRESETS } from '@/lib/celestial/data'
import { useCelestiaStore } from '@/lib/celestial/use-sky'
import { usePreferences } from '@/lib/celestial/preferences'
import { toast } from '@/hooks/use-toast'
import { CalendarPlus, Crosshair, History, Keyboard, MapPin, Settings2, Sparkles, Wind } from 'lucide-react'
import { MODULES, MODULE_BY_ID, ModuleId, isModuleId } from './modules'

interface Props {
  open: boolean
  setOpen: (v: boolean) => void
  onNavigate: (id: ModuleId) => void
  onOpenSettings: () => void
  onOpenShortcuts: () => void
}

export function CommandPalette({ open, setOpen, onNavigate, onOpenSettings, onOpenShortcuts }: Props) {
  const setLocation = useCelestiaStore((s) => s.setLocation)
  const recent = usePreferences((s) => s.recentModules).filter(isModuleId).slice(0, 4)
  const motion = usePreferences((s) => s.motion)
  const setPref = usePreferences((s) => s.set)

  const run = (fn: () => void) => () => { setOpen(false); fn() }

  const locate = () => {
    if (!('geolocation' in navigator)) return toast({ title: 'Geolocation unavailable', variant: 'destructive' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude, name: 'Your position', tz: Intl.DateTimeFormat().resolvedOptions().timeZone })
        toast({ title: 'Sky aligned to your position' })
      },
      () => toast({ title: 'Could not read position', description: 'Permission denied or unavailable.', variant: 'destructive' }),
      { timeout: 10_000, maximumAge: 600_000 },
    )
  }

  const exportIcs = () => {
    const a = document.createElement('a')
    a.href = '/api/events?days=365&format=ics'
    a.download = 'celestia-almanac.ics'
    a.click()
    toast({ title: 'Almanac exported', description: 'A year of sky events as an .ics calendar.' })
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command Veil" description="Search modules, places and actions">
      <CommandInput placeholder="Conjure a module, place or action…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No such conjuration — try another word.</CommandEmpty>

        {recent.length > 1 && (
          <CommandGroup heading="Recent">
            {recent.map((id) => {
              const m = MODULE_BY_ID[id]
              return (
                <CommandItem key={`recent-${id}`} value={`recent ${m.title}`} onSelect={run(() => onNavigate(id))} className="gap-2.5">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span>{m.title}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        <CommandGroup heading="Chambers">
          {MODULES.map((m) => (
            <CommandItem key={m.id} value={`${m.title} ${m.sub} ${m.group}`} onSelect={run(() => onNavigate(m.id))} className="gap-2.5">
              <m.icon className="h-4 w-4" style={{ color: m.accent }} />
              <span>{m.title}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground ml-auto hidden sm:inline">{m.sub}</span>
              <kbd className="key-badge ml-2">{m.key ?? `g ${m.chord}`}</kbd>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem value="export almanac calendar ics" onSelect={run(exportIcs)} className="gap-2.5">
            <CalendarPlus className="h-4 w-4 text-[var(--verdant)]" /> <span>Export a year of sky events (.ics)</span>
          </CommandItem>
          <CommandItem value="time travel chronomancer" onSelect={run(() => onNavigate('chrono'))} className="gap-2.5">
            <Sparkles className="h-4 w-4 text-[var(--astral)]" /> <span>Travel through time</span>
          </CommandItem>
          <CommandItem value="toggle reduce motion animation" onSelect={run(() => {
            const next = motion === 'reduce' ? 'full' : 'reduce'
            setPref({ motion: next })
            toast({ title: next === 'reduce' ? 'Motion stilled' : 'Motion restored' })
          })} className="gap-2.5">
            <Wind className="h-4 w-4 text-muted-foreground" /> <span>{motion === 'reduce' ? 'Restore motion' : 'Reduce motion'}</span>
          </CommandItem>
          <CommandItem value="settings preferences" onSelect={run(onOpenSettings)} className="gap-2.5">
            <Settings2 className="h-4 w-4 text-muted-foreground" /> <span>Observatory settings</span>
            <kbd className="key-badge ml-auto">,</kbd>
          </CommandItem>
          <CommandItem value="keyboard shortcuts help" onSelect={run(onOpenShortcuts)} className="gap-2.5">
            <Keyboard className="h-4 w-4 text-muted-foreground" /> <span>Keyboard shortcuts</span>
            <kbd className="key-badge ml-auto">?</kbd>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />

        <CommandGroup heading="Align the observatory">
          <CommandItem value="locate me my position gps" onSelect={run(locate)} className="gap-2.5">
            <Crosshair className="h-4 w-4 text-[var(--verdant)]" /> <span>Locate me</span>
          </CommandItem>
          {CITY_PRESETS.map((c) => (
            <CommandItem
              key={c.name}
              value={`city ${c.name}`}
              onSelect={run(() => { setLocation({ lat: c.lat, lon: c.lon, name: c.name, tz: c.tz }); toast({ title: `Location set — ${c.name}` }) })}
              className="gap-2.5"
            >
              <MapPin className="h-4 w-4 text-[var(--astral)]" /> <span>{c.name}</span>
              <span className="tabular text-[10px] text-muted-foreground ml-auto">{c.lat.toFixed(1)}°, {c.lon.toFixed(1)}°</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
