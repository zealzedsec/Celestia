# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Report them privately through
GitHub's **"Report a vulnerability"** button (Security → Advisories) on this repository.
We aim to acknowledge reports within a few days.

## Design notes

- **Desktop app:**
  - The server listens on `127.0.0.1` only, on a random port, and refuses any other `Host` header, which defeats DNS rebinding.
  - The window runs with `contextIsolation`, `sandbox`, no Node integration, and a minimal read-only preload.
  - External links open in your system browser.
- **Write requests** (`POST`/`PUT`/`DELETE` to `/api/*`) must be same-origin JSON. This blocks cross-site request forgery from other websites you visit.
- **Your data** (journal, charts) stays on your machine in a local SQLite file. CELESTIA has no telemetry. It only goes online for two optional features: place search (Open-Meteo) and the NASA image archive.
