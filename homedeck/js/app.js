function tickClock() {
  const now  = new Date();
  const clockEl = document.getElementById('clock');
  const dateEl  = document.getElementById('date');
  if (clockEl) clockEl.textContent = formatTime(now);
  if (dateEl)  dateEl.textContent  = formatDate(now);
}

tickClock();
setInterval(tickClock, 1000);


function openApp(name) {
  window.location.href = `apps/${name}/index.html`;
}


async function refreshDashboard() {
  await Promise.allSettled([
    refreshNetwork(),
    refreshWeather(),
    refreshUptime(),
    refreshSystem(),
    refreshHA(),
    refreshStocks(),
  ]);
}

async function refreshNetwork() {
  const internetDot = document.getElementById('internet-dot');
  const localDot    = document.getElementById('local-dot');
  const localLabel  = document.getElementById('local-label');
  const devicesEl   = document.getElementById('network-devices');

  const data = await fetchAPI('/api/network');

  if (internetDot) {
    internetDot.className = `status-dot ${data?.internet ? 'online' : 'offline'}`;
  }
  if (localDot) {
    localDot.className = `status-dot ${data ? 'online' : 'offline'}`;
  }
  if (localLabel && data?.local_ip) {
    localLabel.textContent = data.local_ip;
  }
  if (devicesEl && data?.device_count != null) {
    devicesEl.textContent = data.device_count;
  }
}

async function refreshWeather() {
  const data = await fetchAPI('/api/weather');
  const tempEl  = document.getElementById('weather-temp');
  const condEl  = document.getElementById('weather-cond');
  const iconEl  = document.getElementById('weather-icon');
  const locEl   = document.getElementById('weather-loc');
  const locText = document.getElementById('weather-loc-text');
  const card    = document.getElementById('card-weather');

  if (!data || data.error) {
    if (tempEl) tempEl.textContent = '--°';
    if (condEl) condEl.textContent = 'Unavailable';
    return;
  }

  if (tempEl) tempEl.textContent = `${data.temperature}°`;
  if (condEl) condEl.textContent = data.condition;
  if (iconEl) iconEl.innerHTML = `<img src="assets/icons/${data.icon}" style="width:88px;height:88px;object-fit:contain;" alt="" />`;
  if (locEl && locText && data.location && data.location !== 'Unknown') {
    locText.textContent = data.location;
    locEl.style.display = 'flex';
  }
  if (card) card.classList.add('card--primary');
}

async function refreshUptime() {
  const data    = await fetchAPI('/api/uptime');
  const valueEl = document.getElementById('uptime-value');
  const subEl   = document.getElementById('uptime-sub');
  const iconEl  = document.getElementById('uptime-status-icon');
  const card    = document.getElementById('card-uptime');

  if (!data) {
    if (valueEl) valueEl.textContent = 'Error';
    return;
  }

  const services = data.services || [];
  const up    = services.filter(s => s.status === 'up').length;
  const total = services.length;

  if (valueEl) valueEl.textContent = `${up} / ${total}`;
  if (subEl)   subEl.textContent = total === 1 ? 'Service Online' : 'Services Online';

  if (card) {
    card.classList.remove('card--success', 'card--warning', 'card--error');
    if (up === total && total > 0) card.classList.add('card--success');
    else if (up === 0 && total > 0) card.classList.add('card--error');
    else if (total > 0)             card.classList.add('card--warning');
  }

  if (iconEl) {
    const hasErr = up < total && total > 0;
    iconEl.src = hasErr
      ? 'assets/icons/x_mark.svg'
      : 'assets/icons/check_mark.svg';
  }
}

async function refreshSystem() {
  const data    = await fetchAPI('/api/system');
  const cpuVal  = document.getElementById('sys-cpu-val');
  const cpuBar  = document.getElementById('sys-cpu-bar');
  const ramVal  = document.getElementById('sys-ram-val');
  const ramBar  = document.getElementById('sys-ram-bar');
  const tempVal = document.getElementById('sys-temp-val');
  const tempBar = document.getElementById('sys-temp-bar');

  if (!data) return;

  const cpu  = parseFloat(data.cpu_percent);
  const ram  = parseFloat(data.memory_percent);
  const temp = data.cpu_temp;

  if (cpuVal) cpuVal.textContent = `${data.cpu_percent}%`;
  if (cpuBar) {
    cpuBar.style.width = `${cpu}%`;
    cpuBar.className = `h-full rounded-full transition-[width] duration-700 ${cpu > 80 ? 'bg-error' : cpu > 50 ? 'bg-warning' : 'bg-success'}`;
  }

  if (ramVal) ramVal.textContent = `${data.memory_percent}%`;
  if (ramBar) {
    ramBar.style.width = `${ram}%`;
    ramBar.className = `h-full rounded-full transition-[width] duration-700 ${ram > 80 ? 'bg-error' : ram > 60 ? 'bg-warning' : 'bg-primary'}`;
  }

  if (temp != null) {
    if (tempVal) tempVal.textContent = `${temp}°C`;
    if (tempBar) {
      const pct = Math.min(100, Math.max(0, (temp - 30) / 55 * 100));
      tempBar.style.width = `${pct}%`;
      tempBar.className = `h-full rounded-full transition-[width] duration-700 ${temp > 80 ? 'bg-error' : temp > 65 ? 'bg-warning' : 'bg-primary'}`;
    }
  }
}

async function refreshHA() {
  const data     = await fetchAPI('/api/ha/status');
  const countEl  = document.getElementById('ha-scenes-count');
  const subEl    = document.getElementById('ha-sub');
  const card     = document.getElementById('card-ha');

  if (!data) return;

  const scenes = data.scenes || [];
  if (countEl) countEl.textContent = scenes.length;
  if (subEl)   subEl.textContent   = scenes.length === 1 ? 'Scene Available' : 'Scenes Available';

  if (card) {
    card.classList.remove('card--success', 'card--warning', 'card--error');
    if (data.connected)        card.classList.add('card--success');
    else if (scenes.length > 0) card.classList.add('card--warning');
  }
}

async function refreshStocks() {
  const data   = await fetchAPI('/api/stocks');
  const listEl = document.getElementById('stocks-list');
  if (!listEl) return;

  const stocks = data?.stocks || [];
  if (!stocks.length) {
    listEl.innerHTML = '<div class="text-[0.82rem] text-muted">No stocks configured</div>';
    return;
  }

  listEl.innerHTML = stocks.slice(0, 3).map(s => {
    const chg    = s.change_pct;
    const color  = chg == null ? 'color:var(--text-secondary)' : chg >= 0 ? 'color:var(--success)' : 'color:var(--error)';
    const sign   = chg != null && chg >= 0 ? '+' : '';
    const chgStr = chg != null ? `${sign}${chg}%` : '--';
    return `<div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:0.9rem;font-weight:700;color:var(--text)">${s.ticker}</span>
      <span style="font-size:0.9rem;font-weight:700;${color}">${chgStr}</span>
    </div>`;
  }).join('');
}


const _CARD_ID_MAP = {
  weather: 'card-weather',
  server:  'card-server',
  uptime:  'card-uptime',
  ha:      'card-ha',
  stocks:  'card-stocks',
  network: 'card-network',
};
const _ALL_CARD_IDS = Object.keys(_CARD_ID_MAP);

function applyCardLayout() {
  const stored = JSON.parse(localStorage.getItem('homedeck_cards') || '{}');

  const topLeft  = stored.topLeft  || 'weather';
  const topRight = stored.topRight || 'server';
  const topSet   = new Set([topLeft, topRight]);

  // Bottom order: stored minus top cards, then append any missing
  const storedBottom = Array.isArray(stored.bottomOrder) ? stored.bottomOrder : [];
  const bottomOrder  = [
    ...storedBottom.filter(id => !topSet.has(id) && _ALL_CARD_IDS.includes(id)),
    ..._ALL_CARD_IDS.filter(id => !topSet.has(id) && !storedBottom.includes(id)),
  ];

  const rowTop    = document.getElementById('row-top');
  const rowBottom = document.getElementById('row-bottom');
  if (!rowTop || !rowBottom) return;

  // Place top cards
  [topLeft, topRight].forEach((id, i) => {
    const el = document.getElementById(_CARD_ID_MAP[id]);
    if (!el) return;
    // Replace any existing flex-size class
    el.className = el.className.replace(/\bflex-\[\d+\]\b|\bflex-1\b/g, '').trim();
    el.classList.add(i === 0 ? 'flex-[3]' : 'flex-[2]');
    el.style.display = '';
    rowTop.appendChild(el);
  });

  // Place bottom cards
  bottomOrder.forEach(id => {
    const el = document.getElementById(_CARD_ID_MAP[id]);
    if (!el) return;
    el.className = el.className.replace(/\bflex-\[\d+\]\b|\bflex-1\b/g, '').trim();
    el.classList.add('flex-1');
    el.style.display = stored[id] !== false ? '' : 'none';
    rowBottom.appendChild(el);
  });
}

applyCardLayout();
refreshDashboard();
setInterval(refreshDashboard, 30_000);
