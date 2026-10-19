'use client'

import { Input } from '@/components/ui/input'
import { PlaceSearch } from './place-search'

export interface BirthplaceValue {
  preset: string
  lat: string
  lon: string
}

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{children}</label>
}

/** Birthplace search (which also sets the place's time zone, passed as the 2nd argument) or exact coordinates */
export function BirthplaceFields({ value, onChange, idPrefix }: { value: BirthplaceValue; onChange: (v: BirthplaceValue, zone?: string) => void; idPrefix: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="col-span-2">
        <FieldLabel htmlFor={`${idPrefix}-city`}>Birthplace{value.preset ? <span className="normal-case tracking-normal text-[var(--gilded)]"> · {value.preset}</span> : null}</FieldLabel>
        <PlaceSearch id={`${idPrefix}-city`} placeholder={value.preset ? `Change from ${value.preset}…` : 'Search the town of birth…'}
          onPick={(p) => onChange({ preset: p.name, lat: String(p.lat), lon: String(p.lon) }, p.tz)} />
      </div>
      <div>
        <FieldLabel htmlFor={`${idPrefix}-lat`}>Latitude</FieldLabel>
        <Input id={`${idPrefix}-lat`} inputMode="decimal" value={value.lat} onChange={(e) => onChange({ ...value, preset: '', lat: e.target.value })} className="h-9 tabular" placeholder="−26.20" />
      </div>
      <div>
        <FieldLabel htmlFor={`${idPrefix}-lon`}>Longitude</FieldLabel>
        <Input id={`${idPrefix}-lon`} inputMode="decimal" value={value.lon} onChange={(e) => onChange({ ...value, preset: '', lon: e.target.value })} className="h-9 tabular" placeholder="28.05" />
      </div>
    </div>
  )
}
