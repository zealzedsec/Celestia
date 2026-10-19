#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  CELESTIA — one-shot build & setup for Arch Linux (and Manjaro, EndeavourOS…)
#
#  Paste this into a terminal:
#
#    curl -fsSL https://raw.githubusercontent.com/zealzedsec/Celestia/main/scripts/setup-arch.sh | bash
#
#  …or, from inside a clone:   ./scripts/setup-arch.sh
#
#  It installs the build tools it needs (asks for your password once, via sudo),
#  fetches or updates the source, runs the tests, builds the desktop app (AppImage)
#  and adds CELESTIA to your applications menu. Re-run it any time to update.
#
#  Options (environment variables):
#    CELESTIA_DIR=~/Celestia     where to clone the source          (default ~/Celestia)
#    CELESTIA_REPO=<git url>     clone from elsewhere, e.g. an SSH URL
#    CELESTIA_MODE=web           build the web server instead of the desktop app
#    SKIP_DEPS=1                 don't touch pacman
#    SKIP_TESTS=1                skip the unit tests
#    SKIP_LAUNCHER=1             build only — don't install into the menu
# ─────────────────────────────────────────────────────────────────────────────
set -Eeuo pipefail

REPO="${CELESTIA_REPO:-https://github.com/zealzedsec/Celestia.git}"
DIR="${CELESTIA_DIR:-$HOME/Celestia}"
MODE="${CELESTIA_MODE:-desktop}"
export NEXT_TELEMETRY_DISABLED=1

gold=$'\033[38;5;179m'; violet=$'\033[38;5;141m'; red=$'\033[31m'; dim=$'\033[2m'; off=$'\033[0m'
step() { printf '\n%s✦ %s%s\n' "$gold" "$*" "$off"; }
info() { printf '  %s%s%s\n' "$dim" "$*" "$off"; }
die()  { printf '\n%s✗ %s%s\n' "$red" "$*" "$off" >&2; exit 1; }
trap 'die "setup failed on line $LINENO — scroll up for the error"' ERR

printf '%s\n   C E L E S T I A   —   living observatory setup (%s)\n%s' "$violet" "$MODE" "$off"

[[ "$(uname -s)" == Linux ]] || die "This script is for Linux. On Windows use scripts/setup-windows.ps1."
[[ $EUID -ne 0 ]] || die "Run this as your normal user, not root — it uses sudo only for pacman."

# ── 1 · system packages ─────────────────────────────────────────────────────
if [[ -z "${SKIP_DEPS:-}" ]]; then
  if command -v pacman >/dev/null; then
    step "Installing build tools & desktop runtime libraries (pacman)"
    # git/node/npm build it; fuse2 runs AppImages; the rest are Electron's runtime libraries
    sudo pacman -S --needed --noconfirm git nodejs npm fuse2 gtk3 nss alsa-lib libnotify xdg-utils
  else
    info "pacman not found — skipping system packages (install git, Node.js ≥ 20.9, npm and fuse2 yourself)"
  fi
fi

command -v git >/dev/null || die "git is missing"
command -v node >/dev/null || die "Node.js is missing"
node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>20||(a===20&&b>=9)?0:1)' \
  || die "Node.js $(node -v) is too old — CELESTIA needs ≥ 20.9"
info "node $(node -v) · npm $(npm -v) · $(git --version)"

# ── 2 · source ──────────────────────────────────────────────────────────────
# when run from a file inside a clone, build that clone (piped from curl, BASH_SOURCE is empty)
here=""
if [[ -n "${BASH_SOURCE[0]:-}" && -f "${BASH_SOURCE[0]}" ]]; then here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; fi
if [[ -n "$here" && -f "$here/../package.json" ]] && grep -q '"name": "celestia"' "$here/../package.json"; then
  DIR="$(cd "$here/.." && pwd)"
  step "Using the source in $DIR"
elif [[ -d "$DIR/.git" ]]; then
  step "Updating the source in $DIR"
  git -C "$DIR" pull --ff-only
else
  step "Cloning CELESTIA into $DIR"
  git clone --depth 1 "$REPO" "$DIR"
fi
cd "$DIR"

# ── 3 · dependencies ────────────────────────────────────────────────────────
step "Installing npm dependencies (first run downloads Electron, ~100 MB)"
npm ci --no-audit --no-fund
[[ -f .env ]] || cp .env.example .env

if [[ -z "${SKIP_TESTS:-}" ]]; then
  step "Running the test suite"
  npm test --silent
fi

# ── 4 · build ───────────────────────────────────────────────────────────────
if [[ "$MODE" == web ]]; then
  step "Building the web server"
  npm run db:push
  npm run build
  db="$DIR/db/custom.db"
  printf '\n%s✓ Built.%s Start it with:\n\n    cd %q && DATABASE_URL="file:%s" PORT=3000 npm start\n\n  then open http://localhost:3000\n' "$gold" "$off" "$DIR" "$db"
  exit 0
fi

step "Building the desktop app (Next.js → standalone server → AppImage)"
rm -rf release
npm run build
npm run desktop:prepare
npx electron-builder --linux AppImage --publish never

appimage="$(ls -t release/CELESTIA-*.AppImage 2>/dev/null | head -1 || true)"
[[ -n "$appimage" ]] || die "No AppImage was produced — see the electron-builder output above"
info "built $(basename "$appimage") ($(du -h "$appimage" | cut -f1))"

# ── 5 · launcher ────────────────────────────────────────────────────────────
if [[ -z "${SKIP_LAUNCHER:-}" ]]; then
  step "Adding CELESTIA to your applications menu"
  bash scripts/install-launcher.sh "$appimage"
  printf '\n%s✓ Done.%s Open %sCELESTIA%s from your applications menu, or run:  celestia\n' "$gold" "$off" "$violet" "$off"
  printf '  Quick actions (right-click the launcher): Almanac · Natal chart · Journal\n'
  printf '  Your journal & charts live in ~/.config/CELESTIA — back them up from Settings → Your archive.\n\n'
else
  printf '\n%s✓ Done.%s Run it with:  %s\n\n' "$gold" "$off" "$DIR/$appimage"
fi
