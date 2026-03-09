#!/bin/bash
# HomeDeck Kiosk Launcher
# Place this at ~/homedeck-kiosk.sh on the Pi and make executable:
#   chmod +x ~/homedeck-kiosk.sh
#
# Then create ~/.config/autostart/homedeck-kiosk.desktop pointing to it.

sleep 5

chromium --kiosk \
  --ozone-platform=wayland \
  --touch-events=enabled \
  --password-store=basic \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-session-crashed-bubble \
  http://localhost:8000
