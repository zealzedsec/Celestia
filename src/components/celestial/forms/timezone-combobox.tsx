'use client'

import { useId, useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Globe2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { formatOffset, listTimeZones, offsetForWallTime, zoneOffsetMinutes } from '@/lib/celestial/timezone'
import { useNow } from '@/lib/celestial/use-sky'

/**
 * Searchable IANA time-zone picker. When a wall time is given, the badge shows the offset
 * that was actually in force then (historical DST included), not today's offset.
 */
export function TimeZoneCombobox({ value, onChange, wallTime, id }: { value: string; onChange: (tz: string) => void; wallTime?: string; id?: string }) {
  const [open, setOpen] = useState(false)
  const zones = useMemo(() => listTimeZones(), [])
  const nowMs = useNow(3_600_000)
  const listId = useId()
  const grouped = useMemo(() => {
    const g = new Map<string, string[]>()
    for (const z of zones) {
      const region = z.includes('/') ? z.split('/')[0] : 'Other'
      if (!g.has(region)) g.set(region, [])
      g.get(region)!.push(z)
    }
    return [...g.entries()]
  }, [zones])

  const offset = wallTime ? offsetForWallTime(wallTime, value) : zoneOffsetMinutes(nowMs, value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={id} type="button" role="combobox" aria-expanded={open} aria-controls={listId} aria-haspopup="listbox" aria-label="Time zone"
          className="h-9 w-full flex items-center gap-2 border border-input bg-background/60 px-2.5 text-sm text-left">
          <Globe2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate flex-1">{value.replace(/_/g, ' ')}</span>
          <span className="tabular text-[10.5px] text-[var(--gilded)] shrink-0">{formatOffset(offset)}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent id={listId} className="p-0 w-[320px]" align="start">
        <Command>
          <CommandInput placeholder="Search zones — “Johannesburg”, “Kolkata”…" />
          <CommandList className="max-h-72">
            <CommandEmpty>No zone by that name.</CommandEmpty>
            {grouped.map(([region, list]) => (
              <CommandGroup key={region} heading={region}>
                {list.map((z) => (
                  <CommandItem key={z} value={z} onSelect={() => { onChange(z); setOpen(false) }} className="gap-2">
                    <Check className={`h-3.5 w-3.5 ${z === value ? 'opacity-100 text-[var(--gilded)]' : 'opacity-0'}`} />
                    <span className="truncate">{z.replace(/_/g, ' ')}</span>
                    <span className="ml-auto tabular text-[10px] text-muted-foreground">{formatOffset(zoneOffsetMinutes(nowMs, z))}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
