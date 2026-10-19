// The optional bridge exposed by the desktop shell (desktop/preload.cjs). Absent in browsers.
export interface CelestiaDesktop {
  isDesktop: true
  platform: string
  version: string
  openDataFolder: () => Promise<string>
  openLogs: () => Promise<string>
}

export function desktopBridge(): CelestiaDesktop | null {
  if (typeof window === 'undefined') return null
  return (window as unknown as { celestiaDesktop?: CelestiaDesktop }).celestiaDesktop ?? null
}
