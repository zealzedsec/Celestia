'use client'

import { useState } from 'react'
import { PLANETS, ELEMENTS, ZODIAC } from '@/lib/celestial/data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function Grimoire() {
  return (
    <Tabs defaultValue="planets" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-secondary/40">
        <TabsTrigger value="planets">⚗ Planetary Spirits</TabsTrigger>
        <TabsTrigger value="elements">🜁 Four Elements</TabsTrigger>
        <TabsTrigger value="zodiac">✧ Zodiac Keys</TabsTrigger>
      </TabsList>

      <TabsContent value="planets" className="mt-4"><PlanetsGrimoire /></TabsContent>
      <TabsContent value="elements" className="mt-4"><ElementsGrimoire /></TabsContent>
      <TabsContent value="zodiac" className="mt-4"><ZodiacGrimoire /></TabsContent>
    </Tabs>
  )
}

function PlanetsGrimoire() {
  const [open, setOpen] = useState<string>('sun')
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {PLANETS.map((p) => {
        const isOpen = open === p.id
        return (
          <button
            key={p.id}
            onClick={() => setOpen(isOpen ? '' : p.id)}
            className={`celestial-card p-4 text-left transition-all ${isOpen ? 'md:col-span-2 xl:col-span-3 celestial-card-gold' : 'hover:border-[rgba(167,139,250,0.4)]'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl" style={{ color: p.color, textShadow: `0 0 16px ${p.color}66` }}>{p.glyph}</span>
                <div>
                  <div className="font-display text-lg" style={{ color: p.color }}>{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.metal} · {p.day} · {p.classical ? 'classical septenary' : 'modern invisible'}</div>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{isOpen ? 'close' : 'open grimoire'}</span>
            </div>
            {isOpen && (
              <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm">
                <div className="space-y-2.5">
                  <GRow k="Archangel" v={p.archangel} />
                  <GRow k="Sephirah" v={p.sephirah} />
                  <GRow k="Tarot" v={p.tarot.join(' · ')} />
                  <GRow k="Numbers" v={p.number} />
                  <GRow k="Governed body" v={p.bodyPart} />
                  <GRow k="Colours" v={p.colors.join(', ')} />
                </div>
                <div className="space-y-2.5">
                  <GRow k="Crystals" v={p.crystals.join(', ')} />
                  <GRow k="Herbs" v={p.herbs.join(', ')} />
                  <GRow k="Incense" v={p.incense} />
                  <GRow k="Deities" v={p.deities} />
                  <GRow k="Element" v={p.element} />
                </div>
                <div className="space-y-3">
                  <div className="rounded-md border border-[rgba(232,200,116,0.25)] bg-secondary/30 p-3">
                    <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--gilded)' }}>Alchemical operation</div>
                    <div className="font-serif-alt text-[15px] leading-snug">{p.process}</div>
                  </div>
                  <div className="rounded-md border border-border/60 bg-secondary/20 p-3">
                    <div className="text-[10px] uppercase tracking-widest mb-1 text-muted-foreground">Hour magic</div>
                    <div className="text-[13px] leading-snug text-muted-foreground">{p.magic}</div>
                  </div>
                  <div className="rounded-md border border-border/60 bg-secondary/20 p-3">
                    <div className="text-[10px] uppercase tracking-widest mb-1 text-muted-foreground">When retrograde</div>
                    <div className="text-[13px] leading-snug text-muted-foreground italic">{p.retroMeaning}</div>
                  </div>
                </div>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

function ElementsGrimoire() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {ELEMENTS.map((e) => (
        <div key={e.name} className="celestial-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl" style={{ color: e.color, textShadow: `0 0 18px ${e.color}88` }}>{e.symbol}</span>
            <div>
              <div className="font-display text-xl" style={{ color: e.color }}>{e.name}</div>
              <div className="text-xs text-muted-foreground">{e.quality}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <GRow k="Signs" v={e.signs.join(', ')} />
            <GRow k="Tarot suit" v={e.tarotSuit} />
            <GRow k="Direction" v={e.direction} />
            <GRow k="Season" v={e.season} />
            <GRow k="Temperament" v={e.temper} />
          </div>
          <div className="mt-3 rounded-md border border-border/60 bg-secondary/20 p-3 text-[13px] text-muted-foreground leading-snug">
            <span className="uppercase text-[10px] tracking-widest block mb-1" style={{ color: e.color }}>Ritual current</span>
            {e.magic}
          </div>
        </div>
      ))}
    </div>
  )
}

function ZodiacGrimoire() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {ZODIAC.map((z) => (
        <div key={z.name} className="celestial-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl" style={{
                color: z.element === 'Fire' ? '#e2543e' : z.element === 'Earth' ? '#8a9a5b' : z.element === 'Air' ? '#d4c05a' : '#5aa8a0',
              }}>{z.glyph}</span>
              <div>
                <div className="font-display text-lg">{z.name}</div>
                <div className="text-[11px] text-muted-foreground">{z.dates}</div>
              </div>
            </div>
            <div className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
              <div>{z.element}</div><div>{z.modality} · {z.polarity}</div>
            </div>
          </div>
          <div className="hairline my-2.5" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <GRow k="Ruler" v={z.ruler} gold />
            <GRow k="Tarot" v={z.tarot} />
            <GRow k="Stone" v={z.stone} />
            <GRow k="Herb" v={z.herb} />
            <GRow k="Body" v={z.bodyPart} />
            <GRow k="Keyword" v={z.keyword} gold />
          </div>
          <div className="mt-2.5 text-[13px] text-muted-foreground font-serif-alt leading-snug">{z.traits}</div>
          <div className="mt-2 text-[12px] italic" style={{ color: 'var(--astral)' }}>{z.alchemy}</div>
        </div>
      ))}
    </div>
  )
}

function GRow({ k, v, gold }: { k: string; v: string; gold?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</span>
      <span style={gold ? { color: 'var(--gilded)' } : undefined}>{v}</span>
    </div>
  )
}
