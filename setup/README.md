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

**4. Configure labwc touch input (`~/.config/labwc/rc.xml`):**

```xml
<?xml version="1.0"?>
<openbox_config xmlns="http://openbox.org/3.4/rc">
    <touch deviceName="11-0038 generic ft5x06 (00)" mapToOutput="DSI-2" mouseEmulation="yes"/>
</openbox_config>
```

**5. Reboot:**

```bash
sudo reboot
```

## Notes

- The service runs the FastAPI backend on port 8000
- The kiosk script waits 5 seconds for the system to settle, then launches Chromium fullscreen
- On-screen keyboard is built into the browser (pure JS) — no external dependencies needed
- Keyboard auto-shows when tapping input fields, hides when done
