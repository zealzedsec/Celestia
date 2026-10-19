#!/usr/bin/env bash
# CELESTIA — desktop launcher installer for the AppImage build (Linux, per-user, no root).
#
#   ./install-launcher.sh CELESTIA-7.0.0-linux-x86_64.AppImage   install / update
#   ./install-launcher.sh --uninstall                              remove launcher & app
#
# Copies the AppImage to ~/.local/opt/celestia, adds an application-menu entry and icons,
# and puts a `celestia` command on your PATH (~/.local/bin). The .deb package does all of
# this system-wide on its own — this script is only for the AppImage.
set -euo pipefail

APP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}"
OPT_DIR="$HOME/.local/opt/celestia"
BIN_DIR="$HOME/.local/bin"
DESKTOP_FILE="$APP_DIR/applications/celestia.desktop"
ICON_BASE="$APP_DIR/icons/hicolor"

say() { printf '\033[38;5;179m✦\033[0m %s\n' "$*"; }

if [[ "${1:-}" == "--uninstall" ]]; then
  rm -rf "$OPT_DIR" "$BIN_DIR/celestia" "$DESKTOP_FILE"
  find "$ICON_BASE" -name 'celestia.png' -delete 2>/dev/null || true
  command -v update-desktop-database >/dev/null && update-desktop-database "$APP_DIR/applications" || true
  say "CELESTIA launcher removed. Your journal & charts remain in ~/.config/CELESTIA (delete it to erase them)."
  exit 0
fi

APPIMAGE="${1:-}"
if [[ -z "$APPIMAGE" ]]; then
  APPIMAGE="$(ls -t "$(dirname "$0")"/CELESTIA-*.AppImage 2>/dev/null | head -1 || true)"
fi
[[ -f "$APPIMAGE" ]] || { echo "Usage: $0 path/to/CELESTIA-<version>-linux-x86_64.AppImage" >&2; exit 1; }

mkdir -p "$OPT_DIR" "$BIN_DIR" "$APP_DIR/applications"
install -m 755 "$APPIMAGE" "$OPT_DIR/CELESTIA.AppImage"
say "installed $(basename "$APPIMAGE") → $OPT_DIR"

# extract the icons bundled inside the AppImage
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
( cd "$TMP" && "$OPT_DIR/CELESTIA.AppImage" --appimage-extract 'usr/share/icons/*' >/dev/null 2>&1 || true )
if [[ -d "$TMP/squashfs-root/usr/share/icons/hicolor" ]]; then
  for d in "$TMP"/squashfs-root/usr/share/icons/hicolor/*/apps; do
    size="$(basename "$(dirname "$d")")"
    mkdir -p "$ICON_BASE/$size/apps"
    cp "$d"/*.png "$ICON_BASE/$size/apps/celestia.png" 2>/dev/null || true
  done
fi

cat > "$BIN_DIR/celestia" <<SH
#!/usr/bin/env bash
exec "$OPT_DIR/CELESTIA.AppImage" "\$@"
SH
chmod 755 "$BIN_DIR/celestia"

cat > "$DESKTOP_FILE" <<DESKTOP
[Desktop Entry]
Type=Application
Name=CELESTIA
GenericName=Astronomy & Astrology Observatory
Comment=Live sky, moon, almanac, natal charts and planetary hours
Exec=$OPT_DIR/CELESTIA.AppImage %U
Icon=celestia
Terminal=false
Categories=Science;Astronomy;Education;
Keywords=astronomy;astrology;moon;planets;ephemeris;horoscope;natal;almanac;
StartupWMClass=CELESTIA
Actions=almanac;natal;journal;

[Desktop Action almanac]
Name=Celestial Almanac
Exec=$OPT_DIR/CELESTIA.AppImage --open=almanac

[Desktop Action natal]
Name=Cast a Natal Chart
Exec=$OPT_DIR/CELESTIA.AppImage --open=natal

[Desktop Action journal]
Name=Book of Shadows
Exec=$OPT_DIR/CELESTIA.AppImage --open=journal
DESKTOP
chmod 644 "$DESKTOP_FILE"

command -v update-desktop-database >/dev/null && update-desktop-database "$APP_DIR/applications" || true
command -v gtk-update-icon-cache >/dev/null && gtk-update-icon-cache -q "$ICON_BASE" 2>/dev/null || true

say "launcher added — find CELESTIA in your applications menu, or run: celestia"
case ":$PATH:" in *":$BIN_DIR:"*) ;; *) say "note: add $BIN_DIR to your PATH to use the \`celestia\` command";; esac
