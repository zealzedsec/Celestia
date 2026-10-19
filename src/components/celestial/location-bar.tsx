'use client'

import { useState } from 'react'
import { MapPin, Crosshair, ChevronDown, History, Star } from 'lucide-react'
import { CITY_PRESETS } from '@/lib/celestial/data'
import { useCelestiaStore, type LocationState } from '@/lib/celestial/use-sky'
import { browserTimeZone } from '@/lib/celestial/timezone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/hooks/use-toast'
import { PlaceSearch } from './forms/place-search'

export function LocationBar() {
  const location = useCelestiaStore((s) => s.location)
  const recent = useCelestiaStore((s) => s.recent)
  const setLocation = useCelestiaStore((s) => s.setLocation)
  const [open, setOpen] = useState(false)
  const [manual, setManual] = useState({ name: '', lat: '', lon: '' })

  const apply = (loc: LocationState, quiet = false) => {
    setLocation(loc)
    setOpen(false)
    if (!quiet) toast({ title: `Observatory moved — ${loc.name}`, description: `${loc.lat.toFixed(2)}°, ${loc.lon.toFixed(2)}°${loc.tz ? ` · ${loc.tz.replace(/_/g, ' ')}` : ''}` })
  }

  const applyManual = () => {
    const lat = parseFloat(manual.lat)
    const lon = parseFloat(manual.lon)
    if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      toast({ title: 'Invalid coordinates', description: 'Latitude −90…90, longitude −180…180.', variant: 'destructive' })
      return
    }
    apply({ lat, lon, name: manual.name.trim() || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°` })
  }

  const useGeolocation = () => {
    if (!('geolocation' in navigator)) {
      toast({ title: 'Geolocation unavailable', description: 'Search for your town instead.', variant: 'destructive' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => apply({ lat: pos.coords.latitude, lon: pos.coords.longitude, name: 'Your position', tz: browserTimeZone() }),
      () => toast({ title: 'Could not read your position', description: 'Permission denied or no location service — search for your town instead.', variant: 'destructive' }),
      { timeout: 10_000, maximumAge: 600_000 },
    )
  }

  const others = recent.filter((r) => r.name !== location.name).slice(0, 4)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-primary/25 hover:bg-primary/10 max-w-[200px]" aria-label={`Observatory location: ${location.name}. Change location`}>
          <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--gilded)' }} />
          <span className="truncate">{location.name}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-4">
        <div className="space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-1.5">Move the observatory</div>
            <PlaceSearch autoFocus onPick={(p) => apply({ lat: p.lat, lon: p.lon, name: p.name, tz: p.tz })} />
            <div className="text-[10.5px] text-muted-foreground mt-1">Any city or town worldwide — the time zone comes with it.</div>
          </div>

          {others.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-1.5"><History className="h-3 w-3" /> Recent</div>
              <div className="flex flex-wrap gap-1.5">
                {others.map((r) => (
                  <button key={`${r.name}-${r.lat}`} onClick={() => apply(r, true)} className="chip text-foreground/85">{r.name}</button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-1.5"><Star className="h-3 w-3" /> Observatories of note</div>
            <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto scroll-ethereal pr-1">
              {CITY_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => apply({ lat: p.lat, lon: p.lon, name: p.name, tz: p.tz })}
                  className={`text-left text-xs px-2 py-1.5 border transition-colors truncate ${p.name === location.name ? 'border-[rgba(233,203,124,0.5)] bg-primary/15 text-[var(--gilded)]' : 'border-white/[0.06] hover:bg-primary/10'}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="hairline" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-1.5">Exact coordinates</div>
            <div className="grid grid-cols-3 gap-1.5">
              <Input placeholder="Name" aria-label="Place name" value={manual.name} onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))} className="h-8 text-xs" />
              <Input placeholder="Lat" aria-label="Latitude" inputMode="decimal" value={manual.lat} onChange={(e) => setManual((m) => ({ ...m, lat: e.target.value }))} className="h-8 text-xs tabular" />
              <Input placeholder="Lon" aria-label="Longitude" inputMode="decimal" value={manual.lon} onChange={(e) => setManual((m) => ({ ...m, lon: e.target.value }))} className="h-8 text-xs tabular" />
            </div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" className="h-8 flex-1 text-xs" onClick={applyManual}>Set coordinates</Button>
              <Button size="sm" variant="secondary" className="h-8 text-xs gap-1" onClick={useGeolocation}>
                <Crosshair className="h-3 w-3" /> Locate me
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
