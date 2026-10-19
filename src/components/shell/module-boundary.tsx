'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/** Contains a crash to the module it happened in — the rest of the observatory keeps working */
export class ModuleBoundary extends Component<{ children: ReactNode; name: string }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error(`[${this.props.name}]`, error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="celestial-card p-8 text-center">
        <AlertTriangle className="h-6 w-6 mx-auto text-[var(--ember)]" />
        <div className="font-display text-lg mt-3 text-[var(--moonlight)]">The {this.props.name} chamber faltered</div>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Something unexpected happened while drawing this module. The rest of the observatory is unaffected.</p>
        <pre className="mt-3 text-[11px] text-muted-foreground/80 whitespace-pre-wrap max-w-lg mx-auto">{this.state.error.message}</pre>
        <button onClick={() => this.setState({ error: null })} className="chip mt-4 text-[var(--gilded)] inline-flex items-center gap-1.5">
          <RotateCcw className="h-3 w-3" /> try again
        </button>
      </div>
    )
  }
}
