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
  ]);
}

async function refreshNetwork() {
  const internetDot = document.getElementById('internet-dot');
  const localDot    = document.getElementById('local-dot');
  const localLabel  = document.getElementById('local-label');

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
}

async function refreshWeather() {
  const data = await fetchAPI('/api/weather');
  const tempEl = document.getElementById('weather-temp');
  const condEl = document.getElementById('weather-cond');
  const iconEl = document.getElementById('weather-icon');
  const card   = document.getElementById('card-weather');

  if (!data || data.error) {
    if (tempEl) tempEl.textContent = '--°';
    if (condEl) condEl.textContent = 'Unavailable';
    return;
  }

  if (tempEl) tempEl.textContent = `${data.temperature}°`;
  if (condEl) condEl.textContent = data.condition;
  if (iconEl) iconEl.innerHTML = `<img src="assets/icons/${data.icon}" width="32" height="32" alt="" />`;
  if (card)   card.classList.add('card--primary');
}

async function refreshUptime() {
  const data = await fetchAPI('/api/uptime');
  const valueEl = document.getElementById('uptime-value');
  const subEl   = document.getElementById('uptime-sub');
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
}

async function refreshSystem() {
  const data   = await fetchAPI('/api/system');
  const cpuEl  = document.getElementById('server-cpu');
  const subEl  = document.getElementById('server-sub');
  const card   = document.getElementById('card-server');

  if (!data) {
    if (cpuEl) cpuEl.textContent = '--%';
    return;
  }

  if (cpuEl) cpuEl.textContent = `${data.cpu_percent}%`;
  if (subEl) {
    const parts = [`CPU ${data.cpu_percent}%`, `RAM ${data.memory_percent}%`];
    if (data.cpu_temp) parts.push(`${data.cpu_temp}°C`);
    subEl.textContent = parts.join('  •  ');
  }

  if (card) {
    card.classList.remove('card--success', 'card--warning', 'card--error');
    const cpu = parseFloat(data.cpu_percent);
    if (cpu > 80)      card.classList.add('card--error');
    else if (cpu > 50) card.classList.add('card--warning');
    else               card.classList.add('card--success');
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


refreshDashboard();
setInterval(refreshDashboard, 30_000);
