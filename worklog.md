# Worklog

---
Task ID: 1
Agent: Main agent (Super Z)
Task: Build "CELESTIA" — a live astrology / astronomy / moon phase / alchemical correspondences / planetary tracking web application (Type 3: Interactive Web Development, Next.js 16)

Work Log:
- Initialized fullstack environment via init script; verified Next.js 16 + shadcn/ui + Prisma scaffold
- Installed `astronomy-engine@2.1.19` (high-precision VSOP87-grade ephemeris); empirically verified API surface with scripts/test-astronomy.ts (Ecliptic = true ecliptic of date; Constellation(ra,dec) takes hours/degrees; SearchLunarApside does not exist — implemented custom perigee/apogee finder via sampling + ternary search)
- Built core library in src/lib/celestial/: types.ts, data.ts (zodiac, 10 planetary grimoire profiles, 4 elements, Chaldean order, city presets), astro.ts (positions, retrograde via 24h longitude delta, aspects with applying/separating, rise/set/transit via SearchRiseSet/SearchHourAngle, moon info incl. void-of-course & lunar day, upcoming events incl. ingresses/stations/eclipses/seasons), natal.ts (real ASC/MC via GMST sidereal formulas, whole-sign houses, weighted element/modality balance, interpretations), hours.ts (sunrise-anchored 24 planetary hours in Chaldean order), horoscope.ts (transit-based horoscopes from aspects to 15° solar points + solar houses)
- Created API routes: /api/sky (full snapshot), /api/natal (POST compute + save, GET list, PUT reload, DELETE), /api/hours, /api/horoscope, /api/moon-calendar (daily phase grid, UTC)
- Prisma schema: SavedChart model pushed to SQLite (bun run db:push)
- Built UI: cosmic violet/gold dark theme (globals.css), Cinzel/Cormorant/Inter via Google Fonts link, deterministic starfield, live clock with Julian Day, location picker (presets/geolocation/manual) persisted in zustand, 7 modules: Dashboard, MoonTracker (SVG true-phase moon + calendar), PlanetTracker (ephemeris table + aspect web + retro watch), NatalChart (wheel SVG with aspect lines + DB save/load/delete + JSON export), Grimoire (3 tabs), PlanetaryHours (current hour hero + 24h grid), Oracle (transit horoscopes with mood bars)
- Fixed issues found during verification: Prisma field name tzOffset vs tzOffsetMinutes; moon next-phase skipped-current-bucket logic; planetary hours sunrise-anchored cycle (now < sunrise case); negative day length for far-longitude locations (Tokyo); real civil twilight via SearchAltitude(-6°); hydration mismatch from Math.sin FP divergence Bun/Chrome → integer LCG with Math.imul; react-hooks/immutability lint error → removed escaping closure; duplicate "Water Water" text; sticky header opacity for readability
- Browser self-verification (agent-browser): all 7 modules clicked through and screenshot-verified with live data; natal chart cast+saved via UI; API save/list/delete round trip; mobile 390×844 responsive; sticky footer; 0 console errors; lint 0 errors (1 false-positive font warning for App Router)

Stage Summary:
- Deliverable: runnable Next.js 16 app at / (single page, 7 modules) with 5 API routes backed by real ephemeris math and SQLite via Prisma
- Key files: src/lib/celestial/{astro,natal,hours,horoscope,data,types,use-sky}.ts, src/app/api/{sky,natal,hours,horoscope,moon-calendar}/route.ts, src/components/celestial/*.tsx, src/app/{page,layout,globals.css}
- Verified accuracy spot-checks: Sun 6°44′ Libra (Sep 29 2026 ✓), Saturn ℞ Aries ✓, Venus stations retrograde Oct 2 2026 ✓, Mars opposition Mar 2028 ✓, moon 87.5% waning gibbous ✓

---
Task ID: 2
Agent: Main agent (Super Z)
Task: V2 upgrade — heavy visual/theming overhaul + higher-quality data sources, assets & integrations for CELESTIA

Work Log:
- globals.css v2: refined palette (new verdant/ember/rose accents), luminous gradient-border celestial-cards, ornate corner brackets, gold-foil shimmer title, eyebrow ornament headers, nebula-drift/shooting-star/float/pulse keyframes, gilded selection & focus rings, shimmer-sweep hover
- layout.tsx: migrated to self-hosted next/font (Cinzel, Cormorant Garamond, Inter mapped to existing CSS vars — zero runtime font requests), viewport theme-color, expanded metadata
- star-field.tsx: cinematic rewrite — 4 drifting nebula veils, 150 twinkling stars + 9 spectral-tinted major stars, 4 timed shooting stars; module-scope deterministic LCG (fixes react-hooks/immutability lint)
- page.tsx: framer-motion layoutId nav pill, AnimatePresence module transitions, animated orbiting logo sigil, foil title, footer upgraded with source credits (astronomy-engine 2.1 · HYG · NASA · IAU 88)
- Built src/lib/celestial/stars.ts from real HYG Database v4.1 (downloaded, scripts/build-stars.py): 304 stars ≤ mag 3.3 + figure stars, J2000 RA/Dec converted hours→degrees, spectral classes, distances, 48 validated constellation stick-figure polylines
- New /api/starmap: precesses J2000 → equator-of-date via Rotation_EQJ_EQD, Horizon coords for all stars + bodies. Fixed critical bug: Horizon() expects RA in sidereal HOURS (was passing degrees); verified against independent GMST math (Sirius 6.6°/105.5° ✓, Polaris alt ≈ −lat ✓)
- New sky-map.tsx: stereographic zenith-projection planetarium — spectral-colored magnitude-scaled stars, constellation figure lines, live planet glyphs w/ glow, alt/az graticule, N/E/S/W cardinals, twilight auto-dimming (civil/nautical/astronomical/full-darkness), figures & labels toggles, under-horizon strip
- New /api/nasa + nasa-archive.tsx: live NASA Image & Video Library integration (server fetch, 30-min TTL cache, per-body query hints); Cosmic Archive dialog from every ephemeris row + selected-planet panel; lightbox with description/date/center/source-record link
- planet-tracker.tsx: Ephemeris ⇄ Sky Dome tab switcher, staggered row entrance, per-row NASA camera buttons, glowing glyph shadows
- moon-visual.tsx v2: realistic lunar surface — 12 craters w/ rim highlights, maria shading, limb darkening, halo, terminator softening
- dashboard.tsx: staggered variants entrance, hover lift, eyebrow headers, planet chips w/ color glow; eyebrow class applied across moon-tracker/planetary-hours/natal-chart
- Browser-verified (agent-browser): dashboard/moon/sky-dome/NASA-dialog/lightbox/natal/grimoire/hours/oracle all render + interact; 0 console errors after clean reload; mobile 390px no horizontal overflow; footer pushes naturally; lint 0 problems

Stage Summary:
- V2 deliverable: same 7-module app, now with real-sky planetarium (HYG star catalog), NASA live imagery integration, self-hosted fonts, cinematic backdrop and luxury occult theming
- Key new files: src/lib/celestial/stars.ts, src/app/api/starmap/route.ts, src/app/api/nasa/route.ts, src/components/celestial/{sky-map,nasa-archive}.tsx, scripts/build-stars.py
- Accuracy spot-checks: star horizon math independently verified; NASA API returns real NASA IDs w/ canonical medium URLs; starmap 155/304 stars above horizon at night in Tokyo ✓

---
Task ID: 3
Agent: Main agent (Super Z)
Task: V3 "Grand Orrery" — full front/backend review + UI/theming upgrade + control improvements + functionality expansion

Work Log:
- Full code review: read every lib/API/component file; found & fixed REAL bugs:
  (1) CRITICAL api/natal/route.ts PUT used rec.tzOffsetMinutes (column is tzOffset) → loading saved charts 500'd; fixed + verified save/reload/delete roundtrip via API
  (2) astro.ts imported AspectHit/MoonInfo/PlanetPosition/SkyEvent from './data' (they live in './types'); split imports properly
  (3) hours.ts cursor union-type error; natal.ts ascendant() call arity; use-sky.ts SignHoroscope imported from wrong module; star-field.tsx nebula string/number types; planetary-hours + horoscope unreachable ?? ordinals — ALL fixed, tsc now clean (excluding pre-existing examples/scripts noise)
- Backend expansion: /api/sky gains ?t=ISO (time-travel 1800-2200, validated); new lib/celestial/synastry.ts (cross-chart aspects w/ synastry orbs, weighted resonance score, verdict, four-pillar bonds, elemental chemistry) + /api/synastry POST (validate, swap support); /api/moon-calendar gains ?tz= (local-noon sampling) + real signGlyph
- NEW MODULE Union (♀ synastry weaver): two-soul form w/ side-B London default, swap button, resonance dial (SVG conic glow), cross-aspect list w/ A|B chips + poetic stories, four pillars, elemental chemistry bars
- NEW MODULE Chronomancer (⧖ time machine): datetime + step-size chips + play/pause lapse (900ms ticks) + ±1y/±10y leaps + year ribbon slider (1900-2100); reuses /api/sky?t= debounced; moon/positions/aspects/events all recomputed; electional hint footer
- Sky Dome controls v3: wheel-zoom (non-passive listener) + buttons (1×→3.6×), drag-to-pan via pointer capture, star search dropdown → pulsing gold highlight + dossier bar (name/con/mag/dist/alt/az/class), constellation realm labels toggle, reset view; click any star for dossier
- Command Veil (⌘K palette): CommandDialog w/ modules+hints+key badges, locate-me, city presets, guidance; global ⌘K/Ctrl+K listener; header ⌘K button + footer trigger
- Keyboard shortcuts: keys 1-9 switch modules (input/textarea/select guarded); nav key-badges; shrink-0 fix so mobile nav pills don't collapse (was 34px → 156px, scrollable)
- Moon tracker: calendar timezone selector (browser default + 11 zones), weekday headers + leading blanks (Mon-start), click-a-day dossier (mini MoonVisual + phase/sign/distance), selected/today states
- Theming v3 layer in globals.css: grain-veil (SVG noise overlay), aurora-sheen text, conic-live rotating border (@property --spin), chip utility, key-badge, lit-top streak, lens-flare, enchanted input focus (gold rune), dressed range sliders (chronomancer thumb), global scrollbar enchantment, sigil-divider footer
- page.tsx: 9 modules, grain veil, ⌘K header button, nav key badges + titles, sigil footer, palette integration; dashboard: instruments quick-conjure chips strip; LiveClock lens-flare
- Verification: bun lint 0 errors; tsc clean; agent-browser E2E: dashboard/Union(weave → score 73 dial)/Chrono(−10y jump + lapse play, Saturn Sgr 2016 ✓)/dome(search Sirius dossier, 3.6× zoom, realm labels)/⌘K palette/Moon day dossier/Hours/Grimoire; API tests: sky@1999-12-31 Sun 9°45′ Cap ✓, synastry roundtrip ✓, moon-calendar tz ✓, natal PUT reload ✓ (bug fix proven); mobile 390px no overflow; 0 console errors; dev.log clean

---
Task ID: 4
Agent: Main agent (Super Z)
Task: V4 "Book of Shadows" — journal & note-taking module + further visual/theming/animation upgrades

Work Log:
- Prisma: added JournalEntry model (kind/title/body/mood/tags JSON/skySigil JSON/tarotSpread JSON/favorite) with kind+createdAt indexes; db:push OK
- New lib/celestial/tarot.ts: full 78-card RWS deck (22 majors w/ Golden Dawn astro attributions + 56 minors w/ per-suit rank attributions), 3 spreads (Daily Draw / Three Threads / Crescent Veil), crypto-random Fisher-Yates draw w/ ~24% reversals, 8 rotating prompts, 8 moods palette
- New /api/journal: GET (list + q/kind/tag/favorite filters + stats: totals, by-kind, favorites, day-streak, tag cloud), POST (server-computed sky sigil: moon phase/sign+illumination, sun sign, Chaldean hour ruler, day ruler via astro+hours libs), PUT (revise/star), DELETE (burn); kind+whisper validation; roundtrip tested via curl (sigil verified: Waning Gibbous/Taurus/Libra/Mars hour on 2026-09-30)
- New components: tarot-drawer.tsx (spread picker cards, riffle shuffle animation, dealt cards 3D flip staggered via .flip-scene/.flip-inner CSS, reading scroll, weave-into-entry; question input with rotating suggested prompts) + journal.tsx (stats band w/ ember streak + tag cloud, composer w/ candle flame ornament, kind chips, mood badges, tarot attach chip, wax-seal save, entry cards on .journal-paper w/ gold drop-cap initial, sigil row, mini tarot spread render, unfold/fold, star/edit/2-click-burn, debounced search, kind/star filters, markdown export)
- globals.css v4 layer: journal-paper vellum, dropcap-initial, quill-in ink animation, candle+gutter flame, 3D flip scene, tarot-back star-lattice, tarot-face filigree (+reversed variant), wax-seal, ink-link, mood-badge (color-mix glow), sigil-row, streak-ember, spread-fan; reduced-motion additions
- Wiring: page.tsx 10th module ❦ Journal (key badge '0', shortcut 0→10th), header tagline "ten spheres"; command-veil Journal item (NotebookPen, key 0); dashboard quick-conjure chip "❦ record a pondering"
- Bugs found & fixed during build/verify: JSX fragment wrapper for stats band; Hand import; TarotCard.suit NonNullable type; ::first-letter dropcap invisible inside line-clamp (webkit-box) → replaced with manual .dropcap-initial span; CRITICAL mobile/desktop overflow: long entry titles forced grid column to 1006px (nested truncate-in-grid) → min-w-0 overflow-hidden on article + head row; stale CSS chunk after globals.css edit → dev server restart
- Verification: tsc clean (app code), eslint 0 problems, API CRUD roundtrip (POST/search/PUT fav+spread/DELETE), browser E2E: journal render, composer fill+mood+tags, tarot drawer (3-thread + crescent spreads, all cards flipped), weave→composer autofill, seal→entry w/ sigil+spread+dropcap, unfold/fold both ways, star toggle + starred filter, edit-revise-seal, 2-click burn, tag-cloud filter, search "chains"→1 hit, export clicked; all 10 nav modules clicked through with content; mobile 390×844 scrollW 390=390 no overflow; 0 console errors; final desktop full-page screenshot verified

Stage Summary:
- Deliverable: CELESTIA V4 — 10 modules; new Book of Shadows journal (ponderings/tarot/horoscopes/diary/dreams) with live sky sigils, full tarot engine, and V4 theming/animation layer
- Key new files: src/lib/celestial/tarot.ts, src/app/api/journal/route.ts, src/components/celestial/{journal,tarot-drawer}.tsx; schema: JournalEntry
- One demo entry left in DB ("Crescent Veil" tarot reading, mood Shadowed, tags crescent-veil/shadow-work)

---
Task ID: 5
Agent: Main agent (Super Z)
Task: V5 "Vantablack Obsidian" — dark vanta-black + blurred glass + subtle purple/gold theming + square frameless boxes (no rounded corners)

Work Log:
- globals.css palette surgery: background #000000 (true vanta), glass card/popover vars (rgba blacks), --radius 0rem, --border near-invisible white hairline (frameless), --verdant re-tinted teal→moon-silver #c8cfe0 (chart-3 too), body radial glows dropped to whisper alphas (purple/gold only), font-smoothing antialiased
- celestial-card / journal-paper rebuilt: borderless black glass (blur 18-20px saturate 1.2+), inset specular top highlight, deep obsidian shadows, purple/gold hover glows; gradient-frame ::before removed (frameless)
- aurora-sheen re-tinted violet-gold; conic-live stops now gold→violet; pulse-ring teal→purple; scrollbar thumbs square + subtler
- V5 edict layer appended: (1) wildcard `*, *::before, *::after { border-radius: 0 !important }` — every box square; (2) round exemptions for celestial geometry only (.star, .star-major, .nebula, .streak-ember, .candle::before flame, .lens-flare::before); (3) frosted windows — dialogs/popovers/selects/dropdowns/tooltips/command sheets bg rgba(5,4,10,.78)+blur(28px), overlays blur(10px); (4) glass inputs with purple hover border; (5) square range scrubbers; (6) vanta header/footer smoked glass; (7) gold-cut selection; (8) whisper dividers; (9) shadcn card → black glass
- CRITICAL BUG FOUND+FIXED: tarot drawer (celestial-card on DialogContent) rendered off-screen — unlayered `.celestial-card{position:relative}` beat Tailwind's layered `.fixed` utility → dialog resolved top:50% against document. Systemic fix: wrapped ALL custom component classes (flourishes v2→v4) in `@layer components` (utilities now always win); moved @property --spin outside the layer; V5 edict intentionally left unlayered (!important)
- star-field.tsx: nebula veils dimmed ~35% and re-tinted purple/violet/gold-dust (teal veil removed); page.tsx logo dot teal→gold; layout.tsx themeColor #000000; tarot-drawer DialogContent bg lightened to glass rgba(9,7,18,.78)
- Verification: bun lint 0 problems; dev.log clean; agent-browser E2E — dashboard full-page (vanta black, square slabs, gold/purple), Journal composer+chips+mood badges square, ⌘K Command Veil frosted, tarot Three Threads deal (dialog pos:fixed centered:true after fix, 3 square cards flipped), NASA Cosmic Archive dialog glass+real imagery, Sky Dome (SVG circles correctly round), mobile 390px scrollWidth 390 (no overflow); 0 page errors

Stage Summary:
- Deliverable: CELESTIA V5 "Vantablack Obsidian" — same 10 live modules, now in true-black blurred-glass with subtle purple/gold and exclusively square frameless boxes
- Key files: src/app/globals.css (palette+components layer+V5 edict), src/components/celestial/star-field.tsx, src/components/celestial/tarot-drawer.tsx, src/app/page.tsx, src/app/layout.tsx
- Design law: every UI box is a square frameless glass slab; only celestial bodies (stars, nebulae, flame, moon/planets in SVG) keep round geometry
---
Task ID: 6
Agent: Main agent (Super Z)
Task: V6 "Adept's Review" — full code review of every lib file, API route and component; implement all refinements, updates and improvements found

Work Log:
- Deep review of ~7,800 lines: all 10 lib/celestial files, 10 API routes, 19 components, globals.css, prisma schema — 11 real findings fixed:
  (1) HIGH sky-map.tsx: dome polled /api/starmap WITHOUT location params → always rendered default city (Johannesburg) no matter the header selection. Now builds URL from useCelestiaStore location; browser-verified dome header flips to "WHOLE HEAVENS ABOVE TOKYO" after switching city (137 stars, correct 03:17 JST full-darkness twilight badge)
  (2) astro.ts julianDay() computed from TT (astronomy-engine MakeTime.tt) → ~69s ahead of true UT JD; now UT-based (getTime()/86400000 + 2440587.5), consistent with LiveClock
  (3) astro.ts ruledSigns returned [planet's own id] instead of ruled signs; now derives real ruled zodiac signs from ZODIAC ruler strings (incl. modern co-rulers)
  (4) moon-visual.tsx gradient/clip IDs were angle+size-derived → collision risk when two moons share both; now React useId (sanitized)
  (5) chrono-machine.tsx debounce-fetch had no abort → fast scrubbing let stale responses overwrite newer; now AbortController + alive flag
  (6) page.tsx number-key shortcuts fired while modal dialogs were open (focus on a button ≠ input) → guarded by document.querySelector('[role="dialog"][data-state="open"]'); browser-verified pressing 3 with ⌘K veil open no longer switches modules
  (7) moon-tracker.tsx calendar fetch swallowed errors (infinite skeleton on failure) → proper error card with retry (calNonce); fixed TS narrowing via ternary reorder
  (8) journal.tsx toggleFavorite/burn were fire-and-forget fetches; now optimistic with rollback + stats sync + toast on failure; burn two-click flow re-verified end-to-end (DB row actually deleted)
  (9) sky-map.tsx pointer capture moved from e.target (star nodes replaced every 60s poll, dropping drags) to e.currentTarget (persistent SVG)
  (10) command-veil.tsx listed only 8 of 16 city presets → all now
  (11) layout.tsx metadataBase added (silences Next.js OG warnings)
- Performance: (a) /api/sky 30s TTL micro-cache for live queries (time-travel ?t= bypasses) — measured 42ms → 5ms repeat hit, bounded at 24 entries; (b) usePolling rewritten: AbortController kills stale requests on url change/unmount, skips fetch cycles while document.hidden, instant refetch on visibilitychange, stable refresh() via ref
- Verification: bun lint 0 problems; tsc clean (app source); dev.log clean; API tests: starmap@Tokyo Sirius alt 28.5°/az 142° plausible ✓, natal 1990-05-12 Sun 21°31′ Taurus ✓, journal CRUD ✓, cache hit ✓, time-travel bypass ✓; agent-browser E2E: dashboard live (Last Quarter 36.5%, Venus/Saturn/Uranus/Neptune/Pluto ℞), dome-Tokyo fix visually confirmed, moon calendar day-dossier, journal seal+star+burn roundtrip, tarot Three Threads 3/3 flips + weave-to-composer, chrono −10y jump + now, ⌘K veil with 16 cities, dialog keyboard guard, mobile 390px scrollW=390 no overflow; 0 console errors / 0 page errors; test entry burned (DB back to original 1 record)
- Screenshots: scripts/verify-v6-{dashboard,dome-tokyo,tarot,chrono,mobile,final-full}.png

Stage Summary:
- Deliverable: CELESTIA V6 — same 10 live modules & Vantablack design law, now with the dome location bug fixed, UT-accurate Julian Day, race-free polling/fetching everywhere, resilient journal actions, background-tab-friendly polling, halved ephemeris load, and modal-safe keyboard shortcuts
- Key changed files: src/components/celestial/{sky-map,moon-visual,chrono-machine,moon-tracker,journal,command-veil}.tsx, src/lib/celestial/{use-sky,astro}.ts, src/app/page.tsx, src/app/layout.tsx, src/app/api/sky/route.ts
- Accuracy spot-checks: JD UT-consistent; natal Sun sign verified; dome horizon coords verified from Tokyo
---
Task ID: 7
Agent: Claude (Opus 5.5) — independent review
Task: V7 "Orrery" — deep review of V1–V6, fix every defect found, rebuild navigation/UI, add the Almanac, restore real quality gates

Review findings fixed (all reproduced or verified before fixing):
  (1) CRITICAL natal/synastry: birth wall time parsed with `new Date("YYYY-MM-DDTHH:mm")` = SERVER-local time, then the offset subtracted → every chart wrong by the server's UTC offset on any non-UTC host. Now pure UTC arithmetic + explicit offset (regression test runs under two TZs).
  (2) HIGH time zones: fixed 12-entry "UTC+2"-style list, no DST, no ±30/45-minute zones. Now full IANA zone picker; the historical offset at the birth instant (DST gaps/folds per zoneinfo) is resolved server-side.
  (3) HIGH Chronomancer: datetime-local value converted to UTC twice → every reconstructed sky shifted by the viewer's offset.
  (4) HIGH Sky dome mirror-reversed: east plotted on the right of an upward-looking chart → every constellation drawn backwards.
  (5) HIGH sunTimes: the negative-day-length "fix" made the dashboard show tomorrow's sunset all day long; now a true solar day with twilight anchored to it.
  (6) Void-of-course: only aspects already within 6° were considered and the needed-arc maths used an unsigned separation → false "void" flags. Rewritten to test every major aspect on both sides of the circle.
  (7) Moon age read ~30 days for ~1.5 days after each new moon (forward search from −31 d found the previous lunation). Now a backward search.
  (8) Lunar apsides: worklog claimed the library lacked an apsis search and hand-rolled a sampler that could return the window edge; astronomy-engine has SearchLunarApsis — used now.
  (9) formatDegree could print 17°60′; now truncates to whole arcminutes.
  (10) Moon calendar "today" wrong for far-east zones (UTC date of local noon). Journal streak mixed local setDate with UTC dates. Journal tag filter applied after the 200-row limit. PUT stored the string "null". DELETE of a missing id → 500.
  (11) Journal search race (stale responses overwrote newer ones); MoonTracker showed "unavailable (null)" while loading; synastry bond text had a stray "△"; natal header printed "UTC±" with no sign.
  (12) Quality gates were disabled: eslint config turned off ~30 rules (incl. no-undef, no-unreachable, exhaustive-deps) and next.config ignored TypeScript build errors. Both restored; 0 errors / 0 warnings.
  (13) Hygiene: .env pinned /home/z/my-project; .env and the SQLite DB were committed; prisma logged every query in production; 20 unused deps (next-auth, mdxeditor, z-ai SDK…) + 34 unused UI components (−393 packages); 65 MB of screenshots + a 33 MB CSV in git; dead Tailwind v3 config; unbounded NASA cache; stack traces returned to clients.

Upgrades:
  - Astronomy: apparent sidereal time + true obliquity for the angles; Placidus / Whole Sign / Equal / Porphyry houses (Porphyry fallback at polar latitudes); mean lunar nodes; Part of Fortune (sect-aware); day/night chart; hemisphere emphasis; synastry house overlays.
  - Almanac engine + /api/events (≤400 days, kinds filter, RFC 5545 .ics export): all ingresses incl. retrograde re-entries, stations for every planet (bisected to the minute), greatest elongations, every eclipse in range, apsides, supermoons, seasons, optional Moon ingresses.
  - Starmap: ecliptic + celestial equator, Moon drawn with its phase, ?t= time travel (embedded in Chrono), keyboard zoom/pan.
  - Shell: grouped collapsible sidebar, breadcrumbs, live sky ribbon, mobile tab bar + module sheet, hash routing (deep links/back button), shortcuts (1–0, g-chords, [ ], /, ?, ,, \), command palette with recents & actions, settings sheet (clock, motion, ambience, grain, default houses), module headers + pager, skip link, focus rings.
  - Data layer: shared polling store (one request per URL, stale-while-revalidate, hidden-tab aware); zod validation + bounded TTL caches on every route; security headers.
  - Tests: 30 vitest cases verifying angles/cusps against astronomy-engine's independent pipeline, known 2026–27 events, DST edge cases and each regression above.

Verification: tsc clean · eslint 0/0 · vitest 30/30 · `next build` (TypeScript enforced) · standalone production server smoke-tested on every endpoint · browser: almanac, natal (cast via UI), sky dome, dashboard, mobile 375 px (no horizontal overflow).
---
Task ID: 8
Agent: Claude (Opus 5.5)
Task: Desktop-ready release ("Orrery" v7.0.0): native app + launcher, GitHub release preparation, last-mile UI/UX and functionality gaps

Work Log:
- Gaps closed:
  - worldwide place search (offline gazetteer of ~150 cities + Open-Meteo geocoder, automatic IANA zone);
  - observatory carries its time zone and every time is displayed in it (toggle → system zone);
  - top clock shows the observatory's wall time when it differs;
  - backup / restore (/api/backup, merge-by-id);
  - per-module error boundary;
  - opt-in desktop event alerts;
  - API guard (src/proxy.ts): same-origin JSON writes (CSRF), host allow-list (DNS rebinding).
- UI:
  - CSS-only module entrance (route changes can no longer stall);
  - duplicate in-module titles removed (Oracle, Journal);
  - responsive stats/forms, breadcrumb only on wide screens, almanac timeline alignment, header opacity, window titles.
- Desktop (desktop/, electron-builder.yml, scripts/prepare-desktop.mjs, scripts/after-pack.cjs):
  - Electron utility process runs the standalone server on a random loopback port;
  - splash, window-state memory, single instance, sandboxed renderer, external links → system browser, permission allow-list, native menus, crash recovery dialog, logs;
  - template DB seeded into userData;
  - portable Prisma engines (debian/rhel OpenSSL 3).
  - Packaging pitfalls fixed:
    - root deps leaking into app.asar (358 MB → 16 kB);
    - extraResources dropping node_modules (→ afterPack copy);
    - cpSync turning relative symlinks absolute (→ verbatimSymlinks);
    - unused Prisma WASM runtimes pruned.
  - AppImage 146 MB.
- Launcher: .desktop entry with quick actions (Almanac/Natal/Journal) via `--open=<module>`; scripts/install-launcher.sh installs the AppImage per-user with menu entry, icons and a `celestia` command.
- GitHub: LICENSE (MIT), THIRD_PARTY_NOTICES (HYG CC BY-SA), CHANGELOG, SECURITY, CONTRIBUTING, CI + tag-driven release workflows (Linux/Windows/macOS → draft release), issue/PR templates, dependabot, README with downloads & screenshots captured from the packaged app.
- Verification: typecheck, lint 0/0, 37 tests; packaged app launched with a fresh profile: DB seeded, journal write OK, forged Host → 421, native window screenshot verified.
