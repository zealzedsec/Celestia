'use client'

/**
 * Tarot Drawer — shuffle the 78-card deck, cut a spread, flip the fate cards.
 * Drawn spreads attach themselves to the journal entry being written.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RotateCcw, Hand, Check } from 'lucide-react'
import { SPREADS, TAROT_PROMPTS, drawSpread, type DrawnCard, type TarotSpread } from '@/lib/celestial/tarot'

interface TarotDrawerProps {
  onAttach: (payload: { name: string; question: string | null; cards: DrawnCard[] }) => void
  trigger?: React.ReactNode
}

interface FannedCard {
  card: DrawnCard
  flipState: boolean
}

export function TarotDrawer({ onAttach, trigger }: TarotDrawerProps) {
  const [open, setOpen] = useState(false)
  const [spread, setSpread] = useState<TarotSpread>(SPREADS[1])
  const [phase, setPhase] = useState<'pick' | 'shuffling' | 'drawn'>('pick')
  const [fanned, setFanned] = useState<FannedCard[]>([])
  const [question, setQuestion] = useState('')
  const [promptIdx, setPromptIdx] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // rotate suggested prompts
  useEffect(() => {
    if (!open) return
    const id = setInterval(() => setPromptIdx((i) => (i + 1) % TAROT_PROMPTS.length), 3800)
    return () => clearInterval(id)
  }, [open])

  // clear pending timers when the drawer closes
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  const shuffle = useCallback((s: TarotSpread) => {
    setSpread(s)
    clearTimers()
    setPhase('shuffling')
    setFanned([])
    // riffle … then deal
    timers.current.push(setTimeout(() => {
      const { spread: sp, cards } = drawSpread(s.id)
      setFanned(cards.map((c) => ({ card: c, flipState: false })))
      setPhase('drawn')
      // flip cards one by one, left to right
      cards.forEach((_, i) => {
        timers.current.push(setTimeout(() => {
          setFanned((f) => f.map((x, j) => (j === i ? { ...x, flipState: true } : x)))
        }, 500 + i * 620))
      })
      void sp
    }, 1250))
  }, [])

  const reset = () => { clearTimers(); setPhase('pick'); setFanned([]) }

  const attach = () => {
    if (!fanned.length) return
    onAttach({
      name: spread.name,
      question: question.trim() || null,
      cards: fanned.map((f) => f.card),
    })
    setOpen(false)
    reset()
    setQuestion('')
  }

  const fanRotation = (i: number, n: number) => (n <= 1 ? 0 : (i - (n - 1) / 2) * 4)

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>{trigger ?? (
        <Button variant="outline" size="sm" className="gap-2 border-[rgba(233,203,124,0.35)] hover:bg-[rgba(233,203,124,0.08)]">
          <Hand className="h-3.5 w-3.5" /> Draw a spread
        </Button>
      )}</DialogTrigger>
      <DialogContent className="celestial-card !bg-[rgba(9,7,18,0.78)] max-w-3xl max-h-[88vh] overflow-y-auto scroll-ethereal">
        <DialogHeader>
          <DialogTitle className="font-display tracking-[0.12em] text-[var(--gilded)] flex items-center gap-2">
            <Hand className="h-4 w-4" /> THE VEIL DEALS
          </DialogTitle>
          <DialogDescription className="font-serif-alt text-[15px] italic text-muted-foreground">
            Ask, breathe, cut the deck — {SPREADS.length} spreads · 78 cards · one answer.
          </DialogDescription>
        </DialogHeader>

        {/* question + prompts */}
        <div className="space-y-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Whisper your question… (optional)"
            className="font-serif-alt text-[15px] italic bg-secondary/30 border-border/70"
          />
          {!question && (
            <button
              onClick={() => setQuestion(TAROT_PROMPTS[promptIdx])}
              className="ink-link text-[11.5px] italic text-muted-foreground font-serif-alt"
              title="Borrow this question"
            >
              ✧ “{TAROT_PROMPTS[promptIdx]}”
            </button>
          )}
        </div>

        {phase === 'pick' && (
          <div className="grid gap-2.5 sm:grid-cols-3">
            {SPREADS.map((s) => (
              <motion.button
                key={s.id}
                whileHover={{ y: -3 }}
                onClick={() => shuffle(s)}
                className="celestial-card corners text-left p-4 group"
              >
                <div className="font-display text-sm tracking-[0.14em] text-[var(--gilded)] group-hover:glow-gold transition-all">{s.name}</div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">{s.positions.length} card{s.positions.length > 1 ? 's' : ''}</div>
                <p className="font-serif-alt text-[13px] leading-snug text-foreground/70 mt-2 italic">{s.blurb}</p>
              </motion.button>
            ))}
          </div>
        )}

        {phase === 'shuffling' && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative w-24 h-40">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-lg tarot-back"
                  animate={{ rotate: [0, i % 2 ? 9 : -9, i % 2 ? -5 : 5, 0], x: [0, i % 2 ? 10 : -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.06 }}
                  style={{ transformOrigin: '50% 90%' }}
                />
              ))}
            </div>
            <div className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground quill-in" key="shuf">the deck riffles…</div>
          </div>
        )}

        {phase === 'drawn' && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="eyebrow justify-center">{spread.name}</div>
              {question && <div className="font-serif-alt italic text-[15px] text-foreground/80 mt-2">“{question}”</div>}
            </div>
            <div className="spread-fan pt-3">
              {fanned.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 26, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center gap-2.5"
                  style={{ transform: `rotate(${fanRotation(i, fanned.length)}deg)` }}
                >
                  <span className="text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">{f.card.position}</span>
                  <div className="flip-scene w-[118px] h-[188px] sm:w-[132px] sm:h-[210px]">
                    <div className={`flip-inner ${f.flipState ? 'is-flipped' : ''}`}>
                      {/* back */}
                      <div className="flip-face tarot-back flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl text-[rgba(233,203,124,0.85)] glow-gold">✧</div>
                          <div className="mt-1 text-[8px] uppercase tracking-[0.3em] text-[rgba(233,203,124,0.5)]">celestia</div>
                        </div>
                      </div>
                      {/* face */}
                      <div className={`flip-face flip-face-back tarot-face ${f.card.reversed ? 'reversed-card' : ''} p-2.5 flex flex-col`}>
                        <div className="flex items-start justify-between">
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{f.card.arcana === 'major' ? `Arcanum ${f.card.number}` : f.card.astro}</span>
                          {f.card.reversed && <span className="text-[9px] uppercase tracking-widest text-[var(--astral)]">℞ reversed</span>}
                        </div>
                        <div className={`flex-1 flex items-center justify-center ${f.card.reversed ? 'rotate-180' : ''}`}>
                          <span className="text-4xl sm:text-5xl" style={{ filter: 'drop-shadow(0 0 14px rgba(233,203,124,0.45))' }}>{f.card.glyph}</span>
                        </div>
                        <div className="text-center">
                          <div className="font-display text-[11.5px] tracking-wide text-[var(--gilded)] leading-tight">{f.card.name}</div>
                          <div className="text-[9.5px] text-muted-foreground mt-1 leading-snug">{(f.card.reversed ? f.card.keywords.reversed : f.card.keywords.upright).slice(0, 2).join(' · ')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <Button onClick={attach} className="wax-seal gap-2 text-white">
                <Check className="h-4 w-4" /> Weave into the entry
              </Button>
              <Button variant="ghost" onClick={reset} className="gap-2 text-muted-foreground hover:text-[var(--gilded)]">
                <RotateCcw className="h-3.5 w-3.5" /> Cut again
              </Button>
            </div>

            {/* meaning scroll */}
            <div className="journal-paper p-4">
              <div className="eyebrow mb-3 justify-center">The Reading</div>
              <div className="space-y-2.5">
                {fanned.filter((f) => f.flipState).map((f, i) => (
                  <AnimatePresence key={i} mode="wait">
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm"
                    >
                      <span className="font-display text-[12px] tracking-wide text-[var(--gilded)]">{f.card.position}: {f.card.name}</span>
                      <span className="text-muted-foreground"> — {f.card.meaning}</span>
                      <span className="block text-[12.5px] text-foreground/65 font-serif-alt italic mt-0.5">
                        {f.card.reversed ? 'Reversed: ' : 'Upright: '}{(f.card.reversed ? f.card.keywords.reversed : f.card.keywords.upright).join(', ')} · {f.card.astro}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                ))}
                {!fanned.some((f) => f.flipState) && (
                  <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground py-2">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--gilded)]" /> the cards are turning…
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
