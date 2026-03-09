# Pi Setup

Files for setting up HomeDeck on a Raspberry Pi in kiosk mode.

## Dependencies (install on Pi)

```bash
sudo apt install matchbox-keyboard xdotool -y
```

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

**4. Configure labwc to position keyboard at bottom (`~/.config/labwc/rc.xml`):**

```xml
<?xml version="1.0"?>
<openbox_config xmlns="http://openbox.org/3.4/rc">
    <touch deviceName="11-0038 generic ft5x06 (00)" mapToOutput="DSI-2" mouseEmulation="yes"/>
    <applications>
        <application title="Keyboard">
            <position force="yes">
                <x>0</x>
                <y>288</y>
            </position>
            <decorate>no</decorate>
        </application>
    </applications>
</openbox_config>
```

**5. Reboot:**

```bash
sudo reboot
```

## Notes

- The service runs the FastAPI backend on port 8000
- The kiosk script waits 5 seconds for the system to settle, then launches Chromium fullscreen
- On-screen keyboard uses `matchbox-keyboard` (X11/XWayland) positioned at bottom via xdotool
- Keyboard auto-shows when tapping input fields, hides when focus leaves
