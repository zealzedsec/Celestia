# Changelog

All notable changes to CELESTIA. Versions follow [Semantic Versioning](https://semver.org/).

## [7.0.0] — 2026-10-16 · "Orrery": the first public release

### Desktop
- Native desktop app (Electron) for Linux (AppImage and .deb), with Windows (NSIS) and macOS (dmg) builds from CI.
  It runs the observatory on a private loopback port with a splash screen, remembers the window size and position, and offers native menus (Go, File → Export) and crash recovery.
- Data lives in your user-data folder. First launch seeds it from an empty template.
- Launcher quick actions (Almanac, Natal chart, Journal) and `celestia --open=<module>` deep links.
  `scripts/install-launcher.sh` adds the AppImage to your application menu.
- One-paste setup: `scripts/setup-arch.sh` (pacman) and `scripts/setup-windows.ps1` (winget) install the tools, build, test and install the desktop app. A workflow runs both on real machines whenever they change.

### New
- **Almanac**, up to a year ahead:
  - lunations and supermoons;
  - every ingress, including retrograde re-entries;
  - stations timed to the minute;
  - greatest elongations, apsides, all eclipses in range, and seasons.
  
  It also has a retrograde-season chart, search, filters and `.ics` calendar export.
- **Worldwide place search** with automatic time zones: an offline gazetteer of ~150 cities, plus Open-Meteo online.
- **Times shown in the observatory's own time zone**, with a toggle to switch to your computer's.
- **Natal:**
  - Placidus, Whole Sign, Equal and Porphyry houses;
  - DST-exact IANA time zones;
  - lunar nodes, Part of Fortune and hemisphere emphasis;
  - wheel export as PNG, SVG or JSON.
- **Union:** house overlays in both directions.
- **Sky dome:** ecliptic and celestial equator, the Moon drawn with its phase, keyboard zoom and pan, and time travel inside the Chronomancer.
- **Moon:** void-of-course watch with the Moon's next aspect, a distance gauge, and exact quarter moments in the calendar.
- **Dashboard:** a twilight band (astronomical → golden hour) and event countdowns.
- **Navigation:**
  - grouped collapsible sidebar, live sky ribbon and mobile tab bar;
  - hash routes with deep links and a working back button;
  - shortcuts (`1–0`, `g`+letter, `[ ]`, `/`, `?`, `,`, `\`) and an expanded ⌘K palette.
- **Settings:** clock format, motion, starfield, film grain, default house system, time display, event alerts (desktop notifications), and backup & restore.

### Fixed
- Natal and synastry charts were offset by the server's UTC offset on any non-UTC host.
- The Chronomancer applied the viewer's UTC offset twice.
- The sky dome was mirror-reversed (east plotted on the right).
- "Sunset" showed tomorrow's sunset all day.
- The void-of-course Moon missed approaching aspects.
- Moon age read about 30 days after each new moon.
- Lunar apsides could be off by a cycle.
- Degrees could print as `60′`.
- Moon-calendar "today" was wrong for far-east zones.
- The journal: tag filter, streak, search race, null spread and 404 handling.

### Security & quality
- zod validation on every route, bounded caches, and no stack traces sent to clients.
- A request guard against CSRF and DNS rebinding.
- Security headers.
- `npm start` and `npm run dev` bind to `127.0.0.1` by default. Next.js would otherwise listen on every network interface and expose the journal to the local network.
- Lint and type-checking re-enabled (they were disabled before).
- 37 unit tests, checked against astronomy-engine's independent coordinate pipeline.
