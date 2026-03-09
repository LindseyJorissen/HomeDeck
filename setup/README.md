# Pi Setup

Files for setting up HomeDeck on a Raspberry Pi in kiosk mode.

## Steps

**1. Copy and enable the systemd service:**
```bash
sudo cp homedeck.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable homedeck.service
sudo systemctl start homedeck.service
```

**2. Copy the kiosk script:**
```bash
cp homedeck-kiosk.sh ~/homedeck-kiosk.sh
chmod +x ~/homedeck-kiosk.sh
```

**3. Enable autostart on desktop login:**
```bash
mkdir -p ~/.config/autostart
cp homedeck-kiosk.desktop ~/.config/autostart/
```

**4. Reboot:**
```bash
sudo reboot
```

## Notes
- The service runs the FastAPI backend on port 8000
- The kiosk script waits 5 seconds for the system to settle, then launches Chromium fullscreen
- `--enable-virtual-keyboard` enables Chromium's built-in on-screen keyboard for touch input
- Wayland display env is saved to `/tmp/homedeck-env` for use by the API
