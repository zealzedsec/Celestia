'use client'

/* NASA imagery is served straight from images-assets.nasa.gov; next/image would need a remote
   loader and the sharp optimiser for no gain on thumbnails the archive already sizes. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Camera, ExternalLink, Satellite, AlertTriangle } from 'lucide-react'

interface NasaItem {
  nasaId: string
  title: string
  description: string
  date: string
  center: string
  photographer: string
  thumb: string
  medium: string
}

const QUERY_HINTS: Record<string, string> = {
  sun: 'sun solar dynamics observatory',
  moon: 'moon lunar surface apollo',
  mercury: 'mercury planet messenger',
  venus: 'venus planet surface',
  mars: 'mars surface rover',
  jupiter: 'jupiter great red spot',
  saturn: 'saturn rings cassini',
  uranus: 'uranus planet voyager',
  neptune: 'neptune planet voyager',
  pluto: 'pluto new horizons',
  chiron: 'centaur asteroid comet',
}

/**
 * Cosmic Archive — live imagery from the NASA Image & Video Library,
 * fetched per celestial body through our caching /api/nasa route.
 */
export function NasaArchiveDialog({
  bodyName,
  open,
  onOpenChange,
}: {
  bodyName: string
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const query = QUERY_HINTS[bodyName.toLowerCase()] ?? bodyName

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#120e26]/95 border-[rgba(233,203,124,0.3)] backdrop-blur-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 tracking-wider" style={{ color: 'var(--gilded)' }}>
            <Satellite className="h-4 w-4" /> COSMIC ARCHIVE — {bodyName.toUpperCase()}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Live photography from the NASA Image & Video Library — curated captures from Apollo, Voyager, Cassini, Hubble and beyond.
          </DialogDescription>
        </DialogHeader>
        {open && <ArchiveBody key={query} query={query} />}
      </DialogContent>
    </Dialog>
  )
}

function ArchiveBody({ query }: { query: string }) {
  const [items, setItems] = useState<NasaItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState<NasaItem | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/nasa?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        if (json?.error) throw new Error(json.error)
        setItems(json.items ?? [])
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'archive unreachable'))
    return () => {
      cancelled = true
    }
  }, [query])

  return (
    <>
      <ScrollArea className="flex-1 max-h-[62vh] pr-3 scroll-ethereal">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive py-6 justify-center">
              <AlertTriangle className="h-4 w-4" /> The deep-space link is down ({error}). Try again shortly.
            </div>
          )}
          {!error && !items && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 celestial-card" />
              ))}
            </div>
          )}
          {items && items.length === 0 && (
            <div className="text-sm text-muted-foreground py-8 text-center">
              <Camera className="h-5 w-5 mx-auto mb-2 opacity-60" />
              The archive holds no plates for this query yet.
            </div>
          )}
          {items && items.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
              {items.map((it) => (
                <button
                  key={it.nasaId}
                  onClick={() => setZoom(it)}
                  className="group text-left rounded-lg overflow-hidden border border-border/60 bg-secondary/25 hover:border-[rgba(233,203,124,0.5)] transition-all hover:shadow-[0_10px_30px_-12px_rgba(233,203,124,0.35)]"
                >
                  <img
                    src={it.thumb}
                    alt={it.title}
                    loading="lazy"
                    className="w-full h-28 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="p-2">
                    <div className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-[var(--gilded)] transition-colors">{it.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 tabular">{it.date || 'undated'} · {it.center}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
      </ScrollArea>

      <NasaZoom item={zoom} onClose={() => setZoom(null)} />
    </>
  )
}

/** Lightbox with the description + link back to the NASA source record. */
export function NasaZoom({ item, onClose }: { item: NasaItem | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl bg-[#120e26]/95 border-[rgba(233,203,124,0.3)] backdrop-blur-xl z-[60]">
        {item && (
          <div className="space-y-3">
            <img src={item.medium || item.thumb} alt={item.title} className="w-full rounded-lg max-h-[52vh] object-contain bg-black/40" />
            <DialogHeader>
              <DialogTitle className="font-display text-base tracking-wide" style={{ color: 'var(--gilded)' }}>{item.title}</DialogTitle>
              <DialogDescription className="text-xs leading-relaxed text-muted-foreground line-clamp-5">
                {item.description || 'No description recorded in the archive.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="tabular">{item.date} · {item.center}{item.photographer ? ` · ${item.photographer}` : ''}</span>
              <a
                href={`https://images.nasa.gov/details/${item.nasaId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-[var(--gilded)] transition-colors"
              >
                source record <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
