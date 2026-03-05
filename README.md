# HomeDeck

HomeDeck is a modern home dashboard designed for Raspberry Pi devices
with a touchscreen. It provides a centralized interface for monitoring
system information, network status, weather, uptime of hosted services, home assistant scenes and more!

The project is designed to run as a lightweight kiosk application on a
Raspberry Pi, automatically launching on boot and displaying a clean
touch screen friendly dashboard interface.

## Features

- Weather overview using the Open Meteo API

- System statistics including CPU, memory, disk usage, and uptime

- Network information including local IP and internet connectivity

- Service uptime monitoring for self hosted applications and websites

- Touchscreen friendly interface designed for Raspberry Pi kiosks

- Automatic startup through systemd

## Architecture

HomeDeck uses a simple architecture designed to run efficiently on low
power hardware.

### Frontend:
Static HTML interface served by the backend

### Backend:
FastAPI application providing API endpoints for system data

Runtime\
Uvicorn ASGI server

Hardware Target\
Raspberry Pi with touchscreen display running Raspberry Pi OS

## Installation

Clone the repository

    git clone https://github.com/lindseyjorissen/homedeck.git
    cd homedeck

Install Python dependencies

    pip install -r backend/requirements.txt

Start the backend server

    bash backend/start.sh

Alternatively run the server manually

    cd backend
    uvicorn api:app --host 0.0.0.0 --port 8000

Open the dashboard in your browser

    http://localhost:8000

Interactive API documentation

    http://localhost:8000/api/docs

## Raspberry Pi Kiosk Setup

Create a systemd service

File location

    /etc/systemd/system/homedeck.service

Configuration

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

Enable the service

    sudo systemctl enable homedeck
    sudo systemctl start homedeck

## Chromium Kiosk Mode

Add to

    /etc/xdg/lxsession/LXDE-pi/autostart

    @chromium-browser --kiosk --noerrdialogs --disable-infobars --check-for-update-interval=31536000 http://localhost:8000/

For newer Raspberry Pi OS versions using Wayland configure the autostart
section in

    ~/.config/wayfire.ini


## Weather Configuration

Weather data is retrieved from Open Meteo.  
No API key is required.

The location and unit preferences can be configured in two ways.

### Using the Settings Menu

HomeDeck includes a built in settings panel where you can configure:

- Location  
- Temperature unit (celsius or fahrenheit)  
- Wind speed unit (kmh or mph)

Changes made in the settings menu are saved automatically and applied to the weather module.

### Manual Configuration

You can also configure the weather location manually in `config.json`.


## Extending HomeDeck

Create a new module

    apps/newmodule/index.html

Add a navigation card in `index.html`.

If backend logic is needed, create a new endpoint in

    backend/api.py

## Use Cases

- Home server monitoring
- Smart home information display
- Service uptime monitoring for self -hosted applications
- Wall mounted information dashboard
- Touchscreen control panel

