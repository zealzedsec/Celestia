# Contributing to CELESTIA

Thank you for lending a hand to the observatory.

## Setup

```bash
cp .env.example .env
npm install
npm run db:push
npm run dev            # web app on http://localhost:3000
npm run desktop:dev    # desktop shell pointed at the dev server (run `npm run dev` first)
```

## Before you open a pull request

```bash
npm run check          # typecheck + lint + unit tests — CI runs the same
```

- **Astronomy changes need a test.** Prefer checking results against astronomy-engine's own coordinate pipeline (see `tests/houses.test.ts`), or against a published ephemeris value, over hard-coded numbers you computed yourself.
- **Keep the design law:** square, frameless black-glass slabs in gold and violet. Only celestial bodies are round.
- **New modules** are registered in `src/components/shell/modules.ts`. Routing, the sidebar, the palette and shortcuts all pick them up from there.
- **API routes** validate input with zod (`src/lib/api.ts`) and never return stack traces.

## Releasing (maintainers)

1. Bump `version` in `package.json` and `desktop/package.json`, and add a `CHANGELOG.md` entry.
2. `git tag v7.x.y && git push --tags`.
3. The *Release* workflow builds the Linux, Windows and macOS packages into a **draft** GitHub release. Review it, then publish.
