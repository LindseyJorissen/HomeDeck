#!/bin/bash
# HomeDeck Kiosk Launcher
# Place this at ~/homedeck-kiosk.sh on the Pi and make executable:
#   chmod +x ~/homedeck-kiosk.sh
#
# Then create ~/.config/autostart/homedeck-kiosk.desktop pointing to it.

sleep 5

# Save Wayland display environment so the API can launch wvkbd
printf "WAYLAND_DISPLAY=%s\nXDG_RUNTIME_DIR=%s\n" "${WAYLAND_DISPLAY}" "${XDG_RUNTIME_DIR}" > /tmp/homedeck-env

chromium --kiosk \
  --ozone-platform=wayland \
  --touch-events=enabled \
  --enable-virtual-keyboard \
  --password-store=basic \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-session-crashed-bubble \
  http://localhost:8000
