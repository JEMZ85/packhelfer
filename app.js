// Packhelfer – main app

// ─── State ────────────────────────────────────────────────────────────────────

let state = {
  view: 'home',       // 'home' | 'setup' | 'list' | 'edit'
  setupStep: 1,
  setup: {
    context: null,
    destination: '',
    days: 3,
    sports: [],
    weather: null,
    weatherLoading: false,
    weatherError: null
  },
  currentTripId: null,
  trips: [],
  masterItems: null,  // loaded on init
  vorOrtExpanded: false,
  editExpandedId: null,
};

// ─── Storage ──────────────────────────────────────────────────────────────────

function saveState() {
  const toSave = {
    currentTripId: state.currentTripId,
    trips: state.trips,
    masterItems: state.masterItems
  };
  localStorage.setItem('packhelfer', JSON.stringify(toSave));
}

function loadState() {
  try {
    const raw = localStorage.getItem('packhelfer');
    if (!raw) return;
    const saved = JSON.parse(raw);
    state.currentTripId = saved.currentTripId ?? null;
    state.trips = saved.trips ?? [];
    state.masterItems = saved.masterItems ?? null;
  } catch (e) {
    console.warn('State load failed', e);
  }
}

// ─── Trip logic ───────────────────────────────────────────────────────────────

function calcQty(item, days) {
  if (!item.scaleable) return item.baseQty;
  return Math.min(days * item.scalePerDay, item.maxQty);
}

function buildTripItems(context, sports, days) {
  const items = [];
  for (const master of state.masterItems) {
    if (!master.contexts.includes(context)) continue;
    if (master.sportOnly && !master.sportIds.some(s => sports.includes(s))) continue;
    items.push({
      id: master.id,
      name: master.name,
      category: master.category,
      qty: calcQty(master, days),
      vorhanden: false,
      eingepackt: false,
      vorOrt: (master.vorOrtContexts || []).includes(context)
    });
  }
  return items;
}

function createTrip(setup) {
  const id = Date.now().toString();
  const items = buildTripItems(setup.context, setup.sports, setup.days);
  return {
    id,
    createdAt: id,
    context: setup.context,
    destination: setup.destination || '—',
    days: setup.days,
    sports: setup.sports,
    weather: setup.weather,
    items
  };
}

function currentTrip() {
  return state.trips.find(t => t.id === state.currentTripId) ?? null;
}

function tripProgress(trip) {
  const active = trip.items.filter(i => !i.vorOrt);
  const packed  = active.filter(i => i.eingepackt);
  return { packed: packed.length, total: active.length };
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function el(id) { return document.getElementById(id); }

function render() {
  const app = document.getElementById('app');
  switch (state.view) {
    case 'home':  app.innerHTML = renderHome();  break;
    case 'setup': app.innerHTML = renderSetup(); break;
    case 'list':  app.innerHTML = renderList();  break;
    case 'edit':  app.innerHTML = renderEdit();  break;
  }
  afterRender();
}

function afterRender() {
  if (state.view === 'setup' && state.setupStep === 2) {
    const inp = document.getElementById('dest-input');
    if (inp) inp.value = state.setup.destination;
  }
}

// ── Home ──────────────────────────────────────────────────────────────────────

function renderHome() {
  const trip = currentTrip();
  const pastTrips = state.trips.filter(t => t.id !== state.currentTripId).slice(-5).reverse();

  const activeCard = trip ? (() => {
    const { packed, total } = tripProgress(trip);
    const pct = total ? Math.round((packed / total) * 100) : 0;
    const ctx = CONTEXTS[trip.context];
    const weather = trip.weather?.forecast?.[0];
    const weatherStr = weather ? `${weather.icon} ${weather.max}°` : '';
    const sportsStr = trip.sports.map(s => SPORTS.find(x => x.id === s)?.emoji ?? s).join(' ');
    return `
      <div class="card active-trip" data-action="open-trip">
        <div class="trip-header">
          <span class="trip-ctx">${ctx.emoji} ${ctx.label}</span>
          ${weatherStr ? `<span class="trip-weather">${weatherStr}</span>` : ''}
        </div>
        <div class="trip-dest">${trip.destination}</div>
        <div class="trip-meta">${trip.days} Tag${trip.days !== 1 ? 'e' : ''} ${sportsStr}</div>
        <div class="progress-row">
          <span class="progress-label">${packed} / ${total} eingepackt</span>
          <span class="progress-pct">${pct}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>`;
  })() : `
      <div class="card empty-state">
        <div class="empty-icon">🎒</div>
        <div class="empty-text">Keine aktive Reise</div>
      </div>`;

  const pastHtml = pastTrips.length ? `
    <div class="section-title">Frühere Reisen</div>
    ${pastTrips.map(t => {
      const ctx = CONTEXTS[t.context];
      const { packed, total } = tripProgress(t);
      return `
        <div class="card past-trip" data-action="open-past" data-trip-id="${t.id}">
          <div class="past-trip-row">
            <span>${ctx.emoji} <strong>${t.destination}</strong></span>
            <span class="past-meta">${t.days}T · ${packed}/${total}</span>
          </div>
        </div>`;
    }).join('')}` : '';

  return `
    <div class="screen">
      <div class="hero">
        <span class="hero-icon">🎒</span>
        <span class="hero-title">Packhelfer</span>
      </div>
      <div class="section-title">${trip ? 'Aktuelle Reise' : 'Keine Reise aktiv'}</div>
      ${activeCard}
      <button class="btn-primary" data-action="new-trip">+ Neue Reise</button>
      ${pastHtml}
    </div>`;
}

// ── Setup ─────────────────────────────────────────────────────────────────────

function renderSetup() {
  switch (state.setupStep) {
    case 1: return renderSetup1();
    case 2: return renderSetup2();
    case 3: return renderSetup3();
  }
}

function renderSetup1() {
  return `
    <div class="screen">
      <div class="nav-bar">
        <button class="btn-back" data-action="go-home">←</button>
        <span class="nav-title">Neue Reise</span>
      </div>
      <div class="section-title">Was für eine Reise?</div>
      <div class="context-grid">
        ${Object.entries(CONTEXTS).map(([id, ctx]) => `
          <button class="context-card ${state.setup.context === id ? 'selected' : ''}"
                  data-action="select-context" data-context="${id}">
            <span class="ctx-emoji">${ctx.emoji}</span>
            <span class="ctx-label">${ctx.label}</span>
            <span class="ctx-desc">${ctx.desc}</span>
          </button>`).join('')}
      </div>
      <button class="btn-primary ${!state.setup.context ? 'disabled' : ''}"
              data-action="setup-next" ${!state.setup.context ? 'disabled' : ''}>
        Weiter →
      </button>
    </div>`;
}

function renderSetup2() {
  const days = state.setup.days;
  return `
    <div class="screen">
      <div class="nav-bar">
        <button class="btn-back" data-action="setup-back">←</button>
        <span class="nav-title">${CONTEXTS[state.setup.context].emoji} ${CONTEXTS[state.setup.context].label}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Zielort</label>
        <input id="dest-input" class="form-input" type="text" placeholder="z.B. Barcelona"
               value="${escHtml(state.setup.destination)}" autocomplete="off" autocorrect="off"
               data-action="input-destination">
      </div>
      <div class="form-group">
        <label class="form-label">Wie viele Tage?</label>
        <div class="stepper">
          <button class="stepper-btn" data-action="days-minus">−</button>
          <span class="stepper-val">${days}</span>
          <button class="stepper-btn" data-action="days-plus">+</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Sport</label>
        <div class="sport-grid">
          ${SPORTS.map(s => `
            <button class="sport-chip ${state.setup.sports.includes(s.id) ? 'selected' : ''}"
                    data-action="toggle-sport" data-sport="${s.id}">
              ${s.emoji} ${s.label}
            </button>`).join('')}
        </div>
      </div>
      <button class="btn-primary" data-action="setup-next">Weiter →</button>
    </div>`;
}

function renderSetup3() {
  const { weather, weatherLoading, weatherError, destination, days } = state.setup;
  const ctx = CONTEXTS[state.setup.context];

  let weatherHtml = '';
  if (weatherLoading) {
    weatherHtml = `<div class="weather-loading">Wetter wird geladen…</div>`;
  } else if (weatherError) {
    weatherHtml = `<div class="weather-error">⚠️ ${escHtml(weatherError)}</div>`;
  } else if (weather) {
    const shown = weather.forecast.slice(0, Math.min(days, 7));
    const DAYS_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    weatherHtml = `
      <div class="weather-location">📍 ${escHtml(weather.location.name)}, ${weather.location.country.toUpperCase()}</div>
      <div class="weather-scroll">
        ${shown.map(d => {
          const dow = DAYS_DE[new Date(d.date + 'T12:00:00').getDay()];
          return `
            <div class="weather-day">
              <div class="wd-dow">${dow}</div>
              <div class="wd-icon">${d.icon}</div>
              <div class="wd-max">${d.max}°</div>
              <div class="wd-min">${d.min}°</div>
            </div>`;
        }).join('')}
      </div>`;
  } else if (destination) {
    weatherHtml = `<div class="weather-loading">Wetter lädt…</div>`;
  } else {
    weatherHtml = `<div class="weather-error">Kein Zielort angegeben</div>`;
  }

  const sportsStr = state.setup.sports.map(s => SPORTS.find(x => x.id === s)?.label).filter(Boolean).join(', ');

  return `
    <div class="screen">
      <div class="nav-bar">
        <button class="btn-back" data-action="setup-back">←</button>
        <span class="nav-title">${ctx.emoji} ${destination || '—'} · ${days} Tag${days !== 1 ? 'e' : ''}</span>
      </div>
      <div class="section-title">Wetter vor Ort</div>
      <div class="card weather-card">${weatherHtml}</div>
      ${sportsStr ? `<div class="summary-row">🏅 ${escHtml(sportsStr)}</div>` : ''}
      <button class="btn-primary" data-action="create-trip">Liste erstellen ✓</button>
    </div>`;
}

// ── List ──────────────────────────────────────────────────────────────────────

function renderList() {
  const trip = currentTrip();
  if (!trip) { state.view = 'home'; return renderHome(); }

  const ctx = CONTEXTS[trip.context];
  const { packed, total } = tripProgress(trip);
  const pct = total ? Math.round((packed / total) * 100) : 0;

  const weather = trip.weather?.forecast;
  const DAYS_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const weatherStrip = weather ? `
    <div class="weather-strip">
      ${weather.slice(0, Math.min(trip.days, 5)).map(d => {
        const dow = DAYS_DE[new Date(d.date + 'T12:00:00').getDay()];
        return `<div class="ws-day"><span class="ws-icon">${d.icon}</span><span class="ws-temp">${d.max}°</span><span class="ws-dow">${dow}</span></div>`;
      }).join('')}
    </div>` : '';

  // Group items by category, separate vorOrt
  const activeItems = trip.items.filter(i => !i.vorOrt);
  const vorOrtItems = trip.items.filter(i => i.vorOrt);

  const byCategory = {};
  for (const item of activeItems) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  }

  const categorySections = CATEGORIES_ORDER
    .filter(cat => byCategory[cat])
    .map(cat => {
      const catItems = byCategory[cat];
      const catPacked = catItems.filter(i => i.eingepackt).length;
      return `
        <div class="category-section">
          <div class="category-header">
            <span class="cat-name">${cat.toUpperCase()}</span>
            <span class="cat-count">${catPacked}/${catItems.length}</span>
          </div>
          ${catItems.map(i => renderItemRow(i)).join('')}
        </div>`;
    }).join('');

  const vorOrtSection = vorOrtItems.length ? `
    <div class="category-section vor-ort-section">
      <div class="category-header vor-ort-header" data-action="toggle-vor-ort">
        <span class="cat-name">📍 VOR ORT</span>
        <span class="cat-toggle">${state.vorOrtExpanded ? '▲' : '▼'} ${vorOrtItems.length}</span>
      </div>
      ${state.vorOrtExpanded ? vorOrtItems.map(i => renderItemRow(i, true)).join('') : ''}
    </div>` : '';

  return `
    <div class="screen screen-list">
      <div class="nav-bar">
        <button class="btn-back" data-action="go-home">←</button>
        <span class="nav-title">${ctx.emoji} ${escHtml(trip.destination)}</span>
        <button class="btn-edit" data-action="go-edit">✎</button>
      </div>
      ${weatherStrip}
      <div class="progress-section">
        <div class="progress-row">
          <span class="progress-label">${packed} / ${total} eingepackt</span>
          <span class="progress-pct">${pct}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="list-body">
        ${categorySections}
        ${vorOrtSection}
      </div>
    </div>`;
}

function renderItemRow(item, isVorOrt = false) {
  const stateClass = item.eingepackt ? 'eingepackt' : (item.vorhanden ? 'vorhanden' : '');
  const qtyHtml = item.qty > 1 ? `<span class="item-qty">×${item.qty}</span>` : '';
  const checkIcon = item.eingepackt
    ? `<svg viewBox="0 0 24 24"><path d="M5 12l5 5L19 7" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`;

  return `
    <div class="item-row ${stateClass} ${isVorOrt ? 'item-vor-ort' : ''}"
         data-item-id="${item.id}">
      <div class="item-main" data-action="tap-vorhanden" data-item-id="${item.id}">
        <span class="item-name">${escHtml(item.name)}</span>
        ${qtyHtml}
      </div>
      <button class="item-check ${item.eingepackt ? 'checked' : ''}"
              data-action="tap-eingepackt" data-item-id="${item.id}">
        ${checkIcon}
      </button>
    </div>`;
}

// ── Edit ──────────────────────────────────────────────────────────────────────

function renderEdit() {
  const byCategory = {};
  for (const item of state.masterItems) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  }

  const allCategories = [...CATEGORIES_ORDER, ...Object.keys(byCategory).filter(c => !CATEGORIES_ORDER.includes(c))];

  const sections = allCategories
    .filter(cat => byCategory[cat])
    .map(cat => {
      const items = byCategory[cat];
      return `
        <div class="category-section">
          <div class="category-header edit-cat-header">
            <span class="cat-name">${cat.toUpperCase()}</span>
            <button class="btn-add-item" data-action="add-item" data-category="${escAttr(cat)}">+ Hinzufügen</button>
          </div>
          ${items.map(item => renderEditItem(item)).join('')}
        </div>`;
    }).join('');

  return `
    <div class="screen screen-edit">
      <div class="nav-bar">
        <button class="btn-back" data-action="edit-done">← Fertig</button>
        <span class="nav-title">Liste bearbeiten</span>
      </div>
      <div class="edit-hint">Gegenstand antippen zum Bearbeiten</div>
      ${sections}
      <div class="edit-spacer"></div>
    </div>`;
}

function renderEditItem(item) {
  const isExpanded = state.editExpandedId === item.id;
  const ctxChips = Object.entries(CONTEXTS).map(([id, ctx]) => `
    <button class="chip ${item.contexts.includes(id) ? 'chip-on' : ''}"
            data-action="toggle-ctx" data-item-id="${item.id}" data-ctx="${id}">
      ${ctx.emoji} ${ctx.label}
    </button>`).join('');

  const vorOrtChips = Object.entries(CONTEXTS).map(([id, ctx]) => `
    <button class="chip ${(item.vorOrtContexts||[]).includes(id) ? 'chip-on chip-vorort' : ''}"
            data-action="toggle-vorort-ctx" data-item-id="${item.id}" data-ctx="${id}">
      📍 ${ctx.label}
    </button>`).join('');

  return `
    <div class="edit-item ${isExpanded ? 'expanded' : ''}">
      <div class="edit-item-row" data-action="expand-item" data-item-id="${item.id}">
        <span class="edit-item-name">${escHtml(item.name)}</span>
        <div class="edit-item-actions">
          ${item.scaleable ? '<span class="badge-scale">skaliert</span>' : ''}
          <span class="expand-arrow">${isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>
      ${isExpanded ? `
        <div class="edit-item-detail">
          <div class="edit-field">
            <label>Name</label>
            <input class="form-input" type="text" value="${escAttr(item.name)}"
                   data-action="rename-item" data-item-id="${item.id}">
          </div>
          <div class="edit-field">
            <label>Reisekontexte</label>
            <div class="chip-row">${ctxChips}</div>
          </div>
          <div class="edit-field">
            <label>Vor Ort bei</label>
            <div class="chip-row">${vorOrtChips}</div>
          </div>
          <button class="btn-danger" data-action="delete-item" data-item-id="${item.id}">
            🗑 ${escHtml(item.name)} löschen
          </button>
        </div>` : ''}
    </div>`;
}

// ─── Event handling ───────────────────────────────────────────────────────────

document.addEventListener('click', handleClick);
document.addEventListener('input', handleInput);

function handleClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  switch (action) {
    case 'new-trip':
      state.view = 'setup';
      state.setupStep = 1;
      state.setup = { context: null, destination: '', days: 3, sports: [], weather: null, weatherLoading: false, weatherError: null };
      render(); break;

    case 'open-trip':
      state.view = 'list';
      render(); break;

    case 'open-past': {
      const tid = btn.dataset.tripId;
      state.currentTripId = tid;
      state.view = 'list';
      saveState();
      render(); break;
    }

    case 'go-home':
      state.view = 'home';
      render(); break;

    case 'go-edit':
      state.view = 'edit';
      state.editExpandedId = null;
      render(); break;

    case 'edit-done':
      state.view = 'list';
      render(); break;

    case 'select-context':
      state.setup.context = btn.dataset.context;
      render(); break;

    case 'setup-next':
      if (state.setupStep === 1 && !state.setup.context) return;
      if (state.setupStep === 2) {
        state.setup.destination = document.getElementById('dest-input')?.value?.trim() || '';
      }
      state.setupStep++;
      if (state.setupStep === 3 && state.setup.destination) {
        loadWeatherAsync();
      }
      render(); break;

    case 'setup-back':
      if (state.setupStep > 1) { state.setupStep--; render(); }
      else { state.view = 'home'; render(); }
      break;

    case 'days-minus':
      if (state.setup.days > 1) { state.setup.days--; render(); }
      break;

    case 'days-plus':
      if (state.setup.days < 30) { state.setup.days++; render(); }
      break;

    case 'toggle-sport': {
      const sid = btn.dataset.sport;
      const idx = state.setup.sports.indexOf(sid);
      if (idx === -1) state.setup.sports.push(sid);
      else state.setup.sports.splice(idx, 1);
      render(); break;
    }

    case 'create-trip': {
      const trip = createTrip(state.setup);
      state.trips.push(trip);
      state.currentTripId = trip.id;
      state.view = 'list';
      saveState();
      render(); break;
    }

    case 'tap-vorhanden': {
      const item = findTripItem(btn.dataset.itemId);
      if (item) { item.vorhanden = !item.vorhanden; saveState(); render(); }
      break;
    }

    case 'tap-eingepackt': {
      e.stopPropagation();
      const item = findTripItem(btn.dataset.itemId);
      if (item) {
        item.eingepackt = !item.eingepackt;
        if (item.eingepackt) item.vorhanden = true;
        saveState(); render();
      }
      break;
    }

    case 'toggle-vor-ort':
      state.vorOrtExpanded = !state.vorOrtExpanded;
      render(); break;

    case 'expand-item': {
      const iid = btn.dataset.itemId;
      state.editExpandedId = state.editExpandedId === iid ? null : iid;
      render(); break;
    }

    case 'toggle-ctx': {
      const item = findMasterItem(btn.dataset.itemId);
      if (!item) break;
      const ctx = btn.dataset.ctx;
      const idx = item.contexts.indexOf(ctx);
      if (idx === -1) item.contexts.push(ctx);
      else item.contexts.splice(idx, 1);
      saveState(); render(); break;
    }

    case 'toggle-vorort-ctx': {
      const item = findMasterItem(btn.dataset.itemId);
      if (!item) break;
      const ctx = btn.dataset.ctx;
      if (!item.vorOrtContexts) item.vorOrtContexts = [];
      const idx = item.vorOrtContexts.indexOf(ctx);
      if (idx === -1) item.vorOrtContexts.push(ctx);
      else item.vorOrtContexts.splice(idx, 1);
      saveState(); render(); break;
    }

    case 'delete-item': {
      const iid = btn.dataset.itemId;
      const item = findMasterItem(iid);
      if (!item) break;
      if (!confirm(`„${item.name}" wirklich löschen?`)) break;
      state.masterItems = state.masterItems.filter(i => i.id !== iid);
      state.editExpandedId = null;
      saveState(); render(); break;
    }

    case 'add-item': {
      const cat = btn.dataset.category;
      const name = prompt(`Neuer Gegenstand in „${cat}":`)?.trim();
      if (!name) break;
      const newId = 'custom_' + Date.now();
      state.masterItems.push({
        id: newId, name, category: cat,
        scaleable: false, baseQty: 1,
        contexts: Object.keys(CONTEXTS),
        vorOrtContexts: [],
        sportOnly: false, sportIds: []
      });
      state.editExpandedId = newId;
      saveState(); render(); break;
    }
  }
}

function handleInput(e) {
  if (e.target.dataset.action === 'input-destination') {
    state.setup.destination = e.target.value;
  }
  if (e.target.dataset.action === 'rename-item') {
    const item = findMasterItem(e.target.dataset.itemId);
    if (item) { item.name = e.target.value; saveState(); }
  }
}

// ─── Weather async load ───────────────────────────────────────────────────────

function loadWeatherAsync() {
  state.setup.weatherLoading = true;
  state.setup.weather = null;
  state.setup.weatherError = null;
  render();

  getWeatherForTrip(state.setup.destination, state.setup.days)
    .then(weather => {
      state.setup.weather = weather;
      state.setup.weatherLoading = false;
      if (state.view === 'setup' && state.setupStep === 3) render();
    })
    .catch(err => {
      state.setup.weatherError = err.message;
      state.setup.weatherLoading = false;
      if (state.view === 'setup' && state.setupStep === 3) render();
    });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findTripItem(id) {
  const trip = currentTrip();
  return trip?.items.find(i => i.id === id) ?? null;
}

function findMasterItem(id) {
  return state.masterItems.find(i => i.id === id) ?? null;
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  loadState();
  if (!state.masterItems) {
    state.masterItems = DEFAULT_ITEMS.map(i => ({ ...i }));
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  render();
}

document.addEventListener('DOMContentLoaded', init);
