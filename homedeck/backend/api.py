#!/usr/bin/env python3

import asyncio
import json
import socket
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

import httpx
import psutil
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="HomeDeck API",
    description="Local API for the HomeDeck Raspberry Pi dashboard",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CONFIG_PATH = Path(__file__).parent / "config.json"

_DEFAULT_CONFIG = {
    "weather": {
        "latitude":      40.7128,
        "longitude":    -74.0060,
        "location_name": "New York",
        "units":         "fahrenheit",   # "fahrenheit" or "celsius"
        "wind_unit":     "mph",          # "mph" or "kmh"
    },
    "uptime": {
        "checks": [
            {"name": "Google",  "url": "https://www.google.com"},
            {"name": "GitHub",  "url": "https://github.com"},
        ]
    },
    "servers": [],
}

def load_config() -> dict:
    try:
        with open(CONFIG_PATH) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return _DEFAULT_CONFIG

WMO: dict[int, tuple[str, str]] = {
    0:  ("Clear Sky",        "sun.svg"),
    1:  ("Mostly Clear",     "sun.svg"),
    2:  ("Partly Cloudy",    "partly-cloudy.svg"),
    3:  ("Overcast",         "cloudy.svg"),
    45: ("Foggy",            "cloud-fog.svg"),
    48: ("Icy Fog",          "cloud-fog.svg"),
    51: ("Light Drizzle",    "drizzle.svg"),
    53: ("Drizzle",          "drizzle.svg"),
    55: ("Heavy Drizzle",    "rain.svg"),
    61: ("Light Rain",       "rain.svg"),
    63: ("Rain",             "rain.svg"),
    65: ("Heavy Rain",       "rain.svg"),
    71: ("Light Snow",       "snow.svg"),
    73: ("Snow",             "snow.svg"),
    75: ("Heavy Snow",       "snow.svg"),
    77: ("Snow Grains",      "snow.svg"),
    80: ("Rain Showers",     "drizzle.svg"),
    81: ("Rain Showers",     "rain.svg"),
    82: ("Heavy Showers",    "thunderstorm.svg"),
    85: ("Snow Showers",     "snow.svg"),
    86: ("Heavy Snow",       "snow.svg"),
    95: ("Thunderstorm",     "thunderstorm.svg"),
    96: ("Thunderstorm",     "thunderstorm.svg"),
    99: ("Thunderstorm",     "thunderstorm.svg"),
}

def _format_uptime(seconds: float) -> str:
    d = int(seconds // 86400)
    h = int((seconds % 86400) // 3600)
    m = int((seconds % 3600) // 60)
    if d > 0:  return f"{d}d {h}h {m}m"
    if h > 0:  return f"{h}h {m}m"
    return f"{m}m"

def _local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "Unknown"

async def _check_internet() -> bool:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.head("https://www.google.com", follow_redirects=True)
            return r.status_code < 500
    except Exception:
        return False

async def _check_service(check: dict) -> dict:
    name = check.get("name", "Unknown")
    url  = check.get("url", "")
    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url)
        elapsed = round((time.monotonic() - start) * 1000)
        ok = resp.status_code < 500
        return {
            "name":        name,
            "url":         url,
            "status":      "up" if ok else "down",
            "status_code": resp.status_code,
            "response_ms": elapsed,
            "checked_at":  datetime.now().isoformat(),
        }
    except httpx.TimeoutException:
        return {"name": name, "url": url, "status": "down",
                "status_code": None, "response_ms": None,
                "error": "Timeout", "checked_at": datetime.now().isoformat()}
    except Exception as exc:
        return {"name": name, "url": url, "status": "down",
                "status_code": None, "response_ms": None,
                "error": str(exc)[:120], "checked_at": datetime.now().isoformat()}

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "time": datetime.now().isoformat()}


@app.get("/api/system")
async def get_system():
    """CPU, RAM, disk usage and system info."""
    cpu   = psutil.cpu_percent(interval=0.5)
    mem   = psutil.virtual_memory()
    disk  = psutil.disk_usage("/")

    cpu_temp: Optional[float] = None
    try:
        temps = psutil.sensors_temperatures()
        for key in ("cpu_thermal", "coretemp", "k10temp", "acpitz"):
            if key in temps and temps[key]:
                cpu_temp = round(temps[key][0].current, 1)
                break
    except (AttributeError, Exception):
        pass

    boot_dt   = datetime.fromtimestamp(psutil.boot_time())
    uptime_s  = (datetime.now() - boot_dt).total_seconds()

    try:
        l1, l5, l15 = psutil.getloadavg()
        load_avg = {"1m": round(l1, 2), "5m": round(l5, 2), "15m": round(l15, 2)}
    except (AttributeError, OSError):
        load_avg = None

    return {
        "cpu_percent":     round(cpu, 1),
        "cpu_temp":        cpu_temp,
        "load_avg":        load_avg,
        "memory_percent":  round(mem.percent, 1),
        "memory_used_gb":  round(mem.used   / 1024**3, 2),
        "memory_total_gb": round(mem.total  / 1024**3, 2),
        "disk_percent":    round(disk.percent, 1),
        "disk_used_gb":    round(disk.used  / 1024**3, 2),
        "disk_total_gb":   round(disk.total / 1024**3, 2),
        "uptime":          _format_uptime(uptime_s),
        "hostname":        socket.gethostname(),
        "timestamp":       datetime.now().isoformat(),
    }


@app.get("/api/network")
async def get_network():
    """Internet reachability and local network info."""
    internet = await _check_internet()
    return {
        "internet":  internet,
        "local":     True,
        "local_ip":  _local_ip(),
        "hostname":  socket.gethostname(),
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/uptime")
async def get_uptime():
    """Check all configured services concurrently."""
    config = load_config()
    checks = config.get("uptime", {}).get("checks", [])

    if not checks:
        return {"services": [], "checked_at": datetime.now().isoformat()}

    results = await asyncio.gather(*[_check_service(c) for c in checks])
    return {
        "services":   list(results),
        "checked_at": datetime.now().isoformat(),
    }


@app.get("/api/weather")
async def get_weather():
    """Current weather + hourly forecast via Open-Meteo (free, no API key)."""
    cfg  = load_config().get("weather", {})
    lat  = cfg.get("latitude",      40.7128)
    lon  = cfg.get("longitude",    -74.0060)
    loc  = cfg.get("location_name", "Unknown")
    units    = cfg.get("units",    "fahrenheit")
    wind_u   = cfg.get("wind_unit", "mph")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude":         lat,
                    "longitude":        lon,
                    "current":          "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day",
                    "hourly":           "temperature_2m,weather_code,precipitation_probability,is_day",
                    "temperature_unit": units,
                    "wind_speed_unit":  wind_u,
                    "forecast_days":    2,
                    "timezone":         "auto",
                },
            )
            resp.raise_for_status()
            raw = resp.json()
    except Exception as exc:
        return {"error": str(exc), "location": loc}

    cur  = raw.get("current", {})
    code   = cur.get("weather_code", 0)
    is_day = cur.get("is_day", 1)
    condition, icon = WMO.get(code, ("Unknown", "weather.svg"))
    if not is_day and icon == "sun.svg":
        icon = "moon.svg"

    hourly  = raw.get("hourly", {})
    h_times  = hourly.get("time", [])
    h_temps  = hourly.get("temperature_2m", [])
    h_codes  = hourly.get("weather_code", [])
    h_precip = hourly.get("precipitation_probability", [])
    h_isday  = hourly.get("is_day", [])

    now_str = datetime.now().strftime("%Y-%m-%dT%H:00")
    try:
        start = h_times.index(now_str)
    except ValueError:
        start = 0

    forecast = []
    for i in range(start, min(start + 8, len(h_times))):
        _, h_icon = WMO.get(h_codes[i] if i < len(h_codes) else 0, ("", "weather.svg"))
        if (i < len(h_isday) and not h_isday[i]) and h_icon == "sun.svg":
            h_icon = "moon.svg"
        forecast.append({
            "time":         h_times[i],
            "temp":         round(h_temps[i])  if i < len(h_temps)  else None,
            "icon":         h_icon,
            "precip_chance":h_precip[i]         if i < len(h_precip) else 0,
        })

    unit_sym = "°F" if units == "fahrenheit" else "°C"

    return {
        "location":    loc,
        "temperature": round(cur.get("temperature_2m", 0)),
        "feels_like":  round(cur.get("apparent_temperature", 0)),
        "humidity":    cur.get("relative_humidity_2m"),
        "wind_speed":  round(cur.get("wind_speed_10m", 0)),
        "wind_unit":   wind_u,
        "unit":        unit_sym,
        "condition":   condition,
        "icon":        icon,
        "forecast":    forecast,
        "timestamp":   datetime.now().isoformat(),
    }


@app.get("/api/servers")
async def get_servers():
    """Configured external server list (for future monitoring)."""
    cfg = load_config()
    return {
        "servers":   cfg.get("servers", []),
        "timestamp": datetime.now().isoformat(),
    }

async def _ha_request(method: str, path: str, **kwargs):
    """Make an authenticated request to the Home Assistant REST API."""
    cfg   = load_config()
    ha    = cfg.get("homeassistant", {})
    url   = ha.get("url", "").rstrip("/")
    token = ha.get("token", "")

    if not url or not token:
        return None, "Home Assistant not configured"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type":  "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await getattr(client, method)(f"{url}{path}", headers=headers, **kwargs)
            return resp, None
    except Exception as exc:
        return None, str(exc)


@app.get("/api/ha/status")
async def ha_status():
    """Check if Home Assistant is reachable and return configured scenes."""
    cfg    = load_config()
    ha     = cfg.get("homeassistant", {})
    scenes = ha.get("scenes", [])

    resp, err = await _ha_request("get", "/api/")
    if err:
        return {"connected": False, "error": err, "scenes": scenes}

    return {
        "connected": resp.status_code == 200,
        "scenes":    scenes,
    }


@app.post("/api/ha/scene/{scene_id:path}")
async def ha_activate_scene(scene_id: str):
    """Activate a Home Assistant scene by entity_id."""
    resp, err = await _ha_request(
        "post",
        "/api/services/scene/turn_on",
        json={"entity_id": scene_id},
    )
    if err:
        return {"ok": False, "error": err}
    return {"ok": resp.status_code < 300}

@app.get("/api/config")
async def get_config():
    """Return current dashboard configuration (safe to expose on local network)."""
    cfg = load_config()
    cfg.pop("_comment", None)
    return cfg


@app.post("/api/config")
async def save_config(body: dict):
    """
    Merge incoming JSON into config.json and save.
    Only known top-level keys are accepted (weather, uptime, servers).
    """
    current = load_config()
    current.pop("_comment", None)

    if "homeassistant" in body:
        ha_in = body["homeassistant"]
        ha    = current.setdefault("homeassistant", {})
        if "url"   in ha_in: ha["url"]   = str(ha_in["url"]).rstrip("/")
        if "token" in ha_in: ha["token"] = str(ha_in["token"])
        if "scenes" in ha_in:
            ha["scenes"] = [
                {
                    "name":      str(s.get("name", "")),
                    "entity_id": str(s.get("entity_id", "")),
                    "icon":      str(s.get("icon", "💡")),
                }
                for s in ha_in["scenes"]
                if s.get("name") and s.get("entity_id")
            ]

    if "weather" in body:
        w = body["weather"]
        weather = current.setdefault("weather", {})
        if "latitude"      in w: weather["latitude"]      = float(w["latitude"])
        if "longitude"     in w: weather["longitude"]     = float(w["longitude"])
        if "location_name" in w: weather["location_name"] = str(w["location_name"])
        if "units"         in w and w["units"] in ("fahrenheit", "celsius"):
            weather["units"] = w["units"]
        if "wind_unit"     in w and w["wind_unit"] in ("mph", "kmh"):
            weather["wind_unit"] = w["wind_unit"]

    if "uptime" in body:
        checks = body["uptime"].get("checks", [])
        current["uptime"] = {
            "checks": [
                {"name": str(c["name"]), "url": str(c["url"])}
                for c in checks
                if c.get("name") and c.get("url")
            ]
        }

    with open(CONFIG_PATH, "w") as f:
        json.dump(current, f, indent=2)

    return {"ok": True}


@app.get("/api/geocode")
async def geocode(q: str):
    """
    Search for a city name using the Open-Meteo Geocoding API (free, no key).
    Returns up to 5 results with name, country, latitude, longitude.
    """
    if not q or len(q) < 2:
        return {"results": []}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": q, "count": 5, "language": "en", "format": "json"},
            )
            resp.raise_for_status()
            raw = resp.json()
    except Exception as exc:
        return {"results": [], "error": str(exc)}

    results = []
    for r in raw.get("results", []):
        parts = [r.get("name", "")]
        if r.get("admin1"): parts.append(r["admin1"])
        if r.get("country"): parts.append(r["country"])
        results.append({
            "name":      r.get("name", ""),
            "display":   ", ".join(parts),
            "country":   r.get("country", ""),
            "latitude":  r.get("latitude"),
            "longitude": r.get("longitude"),
        })

    return {"results": results}

_STATIC_DIR = Path(__file__).parent.parent 

app.mount("/", StaticFiles(directory=str(_STATIC_DIR), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
