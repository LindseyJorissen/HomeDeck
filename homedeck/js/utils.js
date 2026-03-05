const API_BASE = '';

async function fetchAPI(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[HomeDeck] API error (${endpoint}):`, err.message);
    return null;
  }
}

function goHome() {
  const depth = (window.location.pathname.match(/\//g) || []).length - 1;
  const prefix = depth > 1 ? '../'.repeat(depth - 1) : '';
  window.location.href = prefix + 'index.html';
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString([], {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
  });
}

function formatRelativeTime(timestamp) {
  const diff    = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5)    return 'just now';
  if (seconds < 60)   return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function setLastUpdated(elementId, time = new Date()) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = `Last updated ${formatRelativeTime(time)}`;
}

function progressClass(percent) {
  if (percent > 80) return 'progress-fill--error';
  if (percent > 60) return 'progress-fill--warning';
  return 'progress-fill--success';
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatBytes(bytes, decimals = 1) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

function setLoading(containerId, loading, message = 'Loading...') {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (loading) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" style="animation:pulse 1s infinite"><img src="../../assets/icons/hourglass.svg" width="48" height="48" alt="" /></div>
        <div class="empty-title">${message}</div>
      </div>`;
  }
}

function setError(containerId, message = 'Could not load data', sub = 'Make sure the HomeDeck server is running') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon"><img src="../../assets/icons/warning.svg" width="48" height="48" alt="" /></div>
      <div class="empty-title">${message}</div>
      <div class="empty-sub">${sub}</div>
    </div>`;
}
