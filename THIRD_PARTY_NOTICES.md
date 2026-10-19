# Third-party notices

CELESTIA's own code is MIT-licensed (see `LICENSE`). It builds on the following work.

## Data

| Source | Used for | License |
|---|---|---|
| [HYG Database v4.1](https://github.com/astronexus/HYG-Database) by David Nash | The bright-star catalogue in `src/lib/celestial/stars.ts`, which is derived from it by `scripts/build-stars.py` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The derived star table is shared under the same license. |
| [IANA Time Zone Database](https://www.iana.org/time-zones) (via the runtime's `Intl`) | Historical UTC offsets and DST | Public domain |
| [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) (optional, online) | Worldwide place search | Free for non-commercial use; data from [GeoNames](https://www.geonames.org/) under CC BY 4.0. CELESTIA works fully offline without it, using its built-in city list. |
| [NASA Image and Video Library](https://images.nasa.gov/) (optional, online) | Archive imagery | NASA media is generally not copyrighted; see [NASA's media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) |

## Software (main runtime dependencies)

| Package | License |
|---|---|
| [astronomy-engine](https://github.com/cosinekitty/astronomy) | MIT |
| [Next.js](https://github.com/vercel/next.js), [React](https://github.com/facebook/react) | MIT |
| [Prisma](https://github.com/prisma/prisma) | Apache-2.0 |
| [Radix UI](https://github.com/radix-ui/primitives), [cmdk](https://github.com/pacocoursey/cmdk), [lucide](https://github.com/lucide-icons/lucide) | MIT / ISC |
| [framer-motion](https://github.com/motiondivision/motion), [zustand](https://github.com/pmndrs/zustand), [zod](https://github.com/colinhacks/zod), [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) | MIT |
| [Electron](https://github.com/electron/electron) (desktop builds) | MIT. It bundles Chromium; see `LICENSES.chromium.html` inside the desktop app. |
| Fonts: Cinzel, Cormorant Garamond, Inter (self-hosted via `next/font`) | SIL Open Font License 1.1 |

Run `npx license-checker --production --summary` for the full transitive list.
