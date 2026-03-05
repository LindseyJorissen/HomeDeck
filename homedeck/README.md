# HomeDeck

A clean, modern home dashboard for Raspberry Pi with touchscreen.
Displays weather, uptime monitoring, system stats,..

---

## Quick Start

### 1 — Install Python dependencies

```bash
pip3 install -r backend/requirements.txt
```


### 2 — Start the backend

```bash
bash backend/start.sh
```

Or directly:

```bash
cd backend
uvicorn api:app --host 0.0.0.0 --port 8000
```

### 3 — Open in browser

```
http://localhost:8000/
```

---

## Raspberry Pi Kiosk Setup

### Auto-start on boot

Create a systemd service at `/etc/systemd/system/homedeck.service`:

```ini
[Unit]
Description=HomeDeck Dashboard Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/HomeDeck/homedeck/backend
ExecStart=/usr/bin/python3 -m uvicorn api:app --host 0.0.0.0 --port 8000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl enable homedeck
sudo systemctl start homedeck
```

### Chromium kiosk mode

Add to `/etc/xdg/lxsession/LXDE-pi/autostart`:

```
@chromium-browser --kiosk --noerrdialogs --disable-infobars --check-for-update-interval=31536000 http://localhost:8000/
```

Or for Wayland / newer Pi OS, create `~/.config/wayfire.ini` autostart entry.

---
## API Reference

| Endpoint | Description |
|---|---|
| `GET /api/health` | Server health check |
| `GET /api/system` | CPU, RAM, disk, uptime |
| `GET /api/network` | Internet + local IP status |
| `GET /api/uptime` | Check all configured service URLs |
| `GET /api/weather` | Current weather + 8h forecast (Open-Meteo) |

Interactive API docs at `http://localhost:8000/api/docs`.

---

## Music (MPD)

The music app connects to **MPD (Music Player Daemon)** on `localhost:6600`.

Install on Raspberry Pi:

```bash
sudo apt install mpd mpc ncmpc
sudo systemctl enable mpd
```

Configure `/etc/mpd.conf` to point to your music directory, then restart MPD.

---

## Weather

Weather data is fetched from [Open-Meteo](https://open-meteo.com/) — completely free, no API key required.
Set your `latitude` / `longitude` in `config.json`. Units can be `fahrenheit`/`celsius` and `mph`/`kmh`.

---

## Adding New Modules

1. Create `apps/mymodule/index.html` using the same app-page layout
2. Add a card in `index.html` pointing to `apps/mymodule/index.html`
3. Optionally add a new endpoint in `backend/api.py`
