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

// Scroll for Pi touchscreen — handles both real touch events and
// pointer/mouse-mode touchscreens (common with Pi DSI/USB touch panels)
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.overflow-y-auto').forEach(el => {
    let startY = 0, startTop = 0, active = false, didScroll = false;

    // Touch events (proper touch device)
    el.addEventListener('touchstart', e => {
      startY = e.touches[0].clientY; startTop = el.scrollTop; active = true; didScroll = false;
    }, { passive: true });
    el.addEventListener('touchmove', e => {
      if (!active) return;
      const dy = startY - e.touches[0].clientY;
      if (Math.abs(dy) > 3) { el.scrollTop = startTop + dy; didScroll = true; }
    }, { passive: true });
    el.addEventListener('touchend', () => { active = false; }, { passive: true });

    // Mouse drag events (touchscreen acting as pointer/mouse)
    el.addEventListener('mousedown', e => {
      startY = e.clientY; startTop = el.scrollTop; active = true; didScroll = false;
    });
    el.addEventListener('mousemove', e => {
      if (!active) return;
      const dy = startY - e.clientY;
      if (Math.abs(dy) > 5) { el.scrollTop = startTop + dy; didScroll = true; }
    });
    el.addEventListener('mouseup', e => {
      if (didScroll) e.stopPropagation();
      active = false;
    });
    el.addEventListener('mouseleave', () => { active = false; });
  });

  document.querySelectorAll('.overflow-x-auto').forEach(el => {
    let startX = 0, startLeft = 0, active = false, didScroll = false;

    // Touch events
    el.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX; startLeft = el.scrollLeft; active = true; didScroll = false;
    }, { passive: true });
    el.addEventListener('touchmove', e => {
      if (!active) return;
      const dx = startX - e.touches[0].clientX;
      if (Math.abs(dx) > 3) { el.scrollLeft = startLeft + dx; didScroll = true; }
    }, { passive: true });
    el.addEventListener('touchend', () => { active = false; }, { passive: true });

    // Mouse drag events (touchscreen acting as pointer/mouse)
    el.addEventListener('mousedown', e => {
      startX = e.clientX; startLeft = el.scrollLeft; active = true; didScroll = false;
      e.preventDefault();
    });
    el.addEventListener('mousemove', e => {
      if (!active) return;
      const dx = startX - e.clientX;
      if (Math.abs(dx) > 5) { el.scrollLeft = startLeft + dx; didScroll = true; }
    });
    el.addEventListener('mouseup', e => {
      if (didScroll) e.stopPropagation();
      active = false;
    });
    el.addEventListener('mouseleave', () => { active = false; });
  });

  // On-screen keyboard for Pi touchscreen
  let osk = null, oskTarget = null;

  function oskCreate() {
    const rows = [
      ['1','2','3','4','5','6','7','8','9','0'],
      ['q','w','e','r','t','y','u','i','o','p'],
      ['a','s','d','f','g','h','j','k','l'],
      ['z','x','c','v','b','n','m','-','.','@'],
    ];
    const kbd = document.createElement('div');
    kbd.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;background:var(--surface);border-top:1px solid var(--border);padding:6px 4px 4px;z-index:99999;display:none;touch-action:none;box-shadow:0 -4px 16px rgba(0,0,0,0.3)';
    const btnStyle = 'flex:1;height:44px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:var(--radius-xs);font-size:1rem;cursor:pointer;touch-action:manipulation;min-width:0';
    const inject = (ch) => {
      if (!oskTarget) return;
      const s = oskTarget.selectionStart, v = oskTarget.value;
      oskTarget.value = v.slice(0, s) + ch + v.slice(oskTarget.selectionEnd);
      oskTarget.setSelectionRange(s + ch.length, s + ch.length);
      oskTarget.dispatchEvent(new Event('input', { bubbles: true }));
    };
    rows.forEach(row => {
      const r = document.createElement('div');
      r.style.cssText = 'display:flex;gap:3px;margin-bottom:3px;justify-content:center';
      row.forEach(k => {
        const b = document.createElement('button');
        b.textContent = k; b.style.cssText = btnStyle;
        b.addEventListener('mousedown', e => { e.preventDefault(); inject(k); });
        b.addEventListener('touchstart', e => { e.preventDefault(); inject(k); }, { passive: false });
        r.appendChild(b);
      });
      kbd.appendChild(r);
    });
    const bot = document.createElement('div');
    bot.style.cssText = 'display:flex;gap:3px';
    [['https://', 'https://', 2, () => inject('https://')],
     ['Space', '  space  ', 2.5, () => inject(' ')],
     ['⌫', '⌫', 1.5, () => { if (!oskTarget) return; const s = oskTarget.selectionStart; if (s > 0) { const v = oskTarget.value; oskTarget.value = v.slice(0,s-1)+v.slice(s); oskTarget.setSelectionRange(s-1,s-1); oskTarget.dispatchEvent(new Event('input',{bubbles:true})); } }],
     ['Done', '✓ Done', 1.5, () => { kbd.style.display='none'; if(oskTarget) oskTarget.blur(); oskTarget=null; }]
    ].forEach(([,label, flex, fn]) => {
      const b = document.createElement('button');
      b.textContent = label; b.style.cssText = btnStyle + `;flex:${flex}`;
      if (label === '✓ Done') b.style.background = 'var(--primary)';
      b.addEventListener('mousedown', e => { e.preventDefault(); fn(); });
      b.addEventListener('touchstart', e => { e.preventDefault(); fn(); }, { passive: false });
      bot.appendChild(b);
    });
    kbd.appendChild(bot);
    document.body.appendChild(kbd);
    return kbd;
  }

  document.addEventListener('focusin', e => {
    if (!e.target.matches('input[type=text],input[type=number],input[type=url],input[type=email],input[type=password],textarea')) return;
    oskTarget = e.target;
    if (!osk) osk = oskCreate();
    osk.style.display = 'block';
  });
  document.addEventListener('focusout', () => {
    setTimeout(() => {
      const active = document.activeElement;
      if (osk && !osk.contains(active) &&
          !active.matches('input,textarea')) {
        osk.style.display = 'none';
        oskTarget = null;
      }
    }, 300);
  });
});

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
