// Packhelfer – main app

// ─── State ────────────────────────────────────────────────────────────────────

let state = {
  view: 'home',       // 'home' | 'setup' | 'list' | 'edit'
  setupStep: 1,
  setup: {
    context: null,
    destination: '',
    startDate: '',      // YYYY-MM-DD, filled in init()
    days: 2,
    layoverDuration: '72h',  // single-stop layover: '24h' | '72h' | '48h'
    sports: [],
    dresscodes: [],
    waschen: true,
    laptop: false,
    uniformiert: true,
    stops: [],          // layover: [{iata, city, country, lat, lon}]
    acQuery: '',        // layover autocomplete: current query
    acResults: [],      // layover autocomplete: current results
    focusIata: false,   // signal afterRender to re-focus iata input
    weather: null,
    weatherLoading: false,
    weatherError: null
  },
  currentTripId: null,
  trips: [],
  masterItems: null,
  vorOrtExpanded: null,  // null = use context default
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
    // migrate old context IDs
    for (const trip of state.trips) {
      if (trip.context === 'urlaub' || trip.context === 'wochenend') trip.context = 'reise';
    }
  } catch (e) {
    console.warn('State load failed', e);
  }
}

// ─── Trip logic ───────────────────────────────────────────────────────────────

function calcQty(item, days, waschen) {
  if (!item.scaleable) return item.baseQty;
  const max = (waschen && item.washMaxQty != null) ? item.washMaxQty : item.maxQty;
  return Math.min(days * item.scalePerDay, max);
}

function weatherMaxTemp(weather) {
  if (!weather) return null;
  if (weather.isLayover) {
    const temps = (weather.stops || []).filter(s => s.day).map(s => s.day.max);
    return temps.length ? Math.max(...temps) : null;
  }
  const temps = (weather.forecast || []).map(d => d.max);
  return temps.length ? Math.max(...temps) : null;
}

function weatherHasRain(weather) {
  if (!weather) return false;
  const days = weather.isLayover
    ? (weather.stops || []).filter(s => s.day).map(s => s.day)
    : (weather.forecast || []);
  return days.some(d => d.code >= 51);
}

function buildTripItems(context, days, opts = {}) {
  const { sports = [], dresscodes = [], waschen = true, laptop = false, uniformiert = true, weather = null, nonSchuko = false } = opts;
  const maxTemp = weatherMaxTemp(weather);
  const hasRain = weatherHasRain(weather);
  const items = [];
  for (const master of state.masterItems) {
    if (!master.contexts.includes(context)) continue;
    if (master.sportOnly) {
      const sportMatch = master.sportIds.some(s => sports.includes(s));
      const coldBypass = master.coldTempThreshold != null && maxTemp != null && maxTemp < master.coldTempThreshold;
      if (!sportMatch && !coldBypass) continue;
    }
    if (master.dresscodeOnly && !master.dresscodeIds.some(d => dresscodes.includes(d))) continue;
    if (master.laptopOnly && !laptop) continue;
    if (master.uniformVollstaendig && uniformiert) continue;
    if (master.rainOnly && !hasRain) continue;
    if (master.nonSchuko && !nonSchuko) continue;
    if (master.minTemp != null && maxTemp != null && maxTemp < master.minTemp) continue;
    if (master.maxTempThreshold != null && maxTemp != null && maxTemp >= master.maxTempThreshold) continue;
    let qty = calcQty(master, days, waschen);
    if (master.uniformWechsel && uniformiert) qty = Math.max(0, qty - 1);
    if (qty === 0) continue;
    items.push({
      id: master.id,
      name: master.name,
      category: master.category,
      qty,
      vorhanden: false,
      eingepackt: false,
      vorOrt: (master.vorOrtContexts || []).includes(context)
    });
  }
  return items;
}

function createTrip(setup) {
  const id = Date.now().toString();
  const items = buildTripItems(setup.context, setup.days, {
    sports: setup.sports,
    dresscodes: setup.dresscodes || [],
    waschen: setup.waschen ?? true,
    laptop: setup.laptop ?? false,
    uniformiert: setup.uniformiert ?? true,
    nonSchuko: setup.nonSchuko ?? false,
    weather: setup.weather ?? null,
  });
  return {
    id,
    createdAt: id,
    context: setup.context,
    destination: setup.destination || '—',
    days: setup.days,
    startDate: setup.startDate || null,
    sports: setup.sports,
    dresscodes: setup.dresscodes || [],
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
    const dest = document.getElementById('dest-input');
    if (dest) dest.value = state.setup.destination;

    if (state.setup.focusIata) {
      state.setup.focusIata = false;
      const iata = document.getElementById('iata-input');
      if (iata) iata.focus();
    }
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
        <div class="trip-dest">${escHtml(trip.destination)}</div>
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
            <span>${ctx.emoji} <strong>${escHtml(t.destination)}</strong></span>
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
      <div class="context-grid">
        ${Object.entries(CONTEXTS).map(([id, ctx]) => `
          <button class="context-card ${state.setup.context === id ? 'selected' : ''}"
                  data-action="select-context" data-context="${id}">
            <span class="ctx-emoji">${ctx.emoji}</span>
            <span class="ctx-label">${ctx.label}</span>
          </button>`).join('')}
      </div>
    </div>`;
}

function renderIataInput() {
  const { stops, acQuery, acResults } = state.setup;
  return `
    <div class="form-group">
      <label class="form-label">Stops</label>
      ${stops.length ? `
        <div class="stops-list">
          ${stops.map((s, i) => `
            <div class="stop-chip">
              <span>${countryFlag(s.country)}&nbsp;<strong>${escHtml(s.iata)}</strong>&nbsp;${escHtml(s.city)}</span>
              <button class="stop-remove" data-action="remove-stop" data-stop-idx="${i}">×</button>
            </div>`).join('')}
        </div>` : ''}
      <div class="iata-wrap">
        <input id="iata-input" class="form-input" type="text"
               placeholder="IATA oder Stadt (FRA, JFK…)"
               value="${escHtml(acQuery)}"
               autocomplete="off" autocorrect="off" autocapitalize="characters"
               spellcheck="false"
               data-action="iata-search">
        ${acResults.length ? `
          <div class="ac-dropdown">
            ${acResults.map(([iata, city, country, lat, lon]) => `
              <button class="ac-item" data-action="select-airport"
                      data-iata="${iata}" data-city="${escAttr(city)}"
                      data-country="${escAttr(country)}"
                      data-lat="${lat}" data-lon="${lon}">
                <span class="ac-flag">${countryFlag(country)}</span>
                <span class="ac-iata">${iata}</span>
                <span class="ac-city">${escHtml(city)}</span>
              </button>`).join('')}
          </div>` : ''}
      </div>
    </div>`;
}

function renderSetup2() {
  const isLayover = state.setup.context === 'layover';
  const days = state.setup.days;
  const nonFRA = state.setup.stops.filter(s => s.iata !== 'FRA');
  const canProceed = !isLayover || nonFRA.length > 0;

  const destinationGroup = isLayover ? renderIataInput() : `
    <div class="form-group">
      <label class="form-label">Zielort</label>
      <input id="dest-input" class="form-input" type="text" placeholder="z.B. Barcelona"
             value="${escHtml(state.setup.destination)}" autocomplete="off" autocorrect="off"
             data-action="input-destination">
    </div>`;

  return `
    <div class="screen">
      <div class="nav-bar">
        <button class="btn-back" data-action="setup-back">←</button>
        <span class="nav-title">${CONTEXTS[state.setup.context].emoji} ${CONTEXTS[state.setup.context].label}</span>
      </div>
      ${destinationGroup}
      <div class="form-group">
        <label class="form-label">Abreise</label>
        <input type="date" id="start-date" class="form-input"
               value="${escAttr(state.setup.startDate)}"
               min="${todayStr()}"
               data-action="input-startdate">
      </div>
      ${isLayover ? (() => {
        if (nonFRA.length === 0) return '';
        if (nonFRA.length >= 2) return `
          <div class="form-group">
            <label class="form-label">Dauer</label>
            <div class="duration-auto">${nonFRA.length} Nächte</div>
          </div>`;
        const dur = state.setup.layoverDuration;
        return `
          <div class="form-group">
            <label class="form-label">Dauer</label>
            <div class="duration-chips">
              <button class="dur-chip ${dur === '24h' ? 'selected' : ''}" data-action="select-duration" data-dur="24h">24h</button>
              <button class="dur-chip ${dur === '48h' ? 'selected' : ''}" data-action="select-duration" data-dur="48h">48h</button>
              <button class="dur-chip ${dur === '72h' ? 'selected' : ''}" data-action="select-duration" data-dur="72h">72h</button>
            </div>
          </div>`;
      })() : `
      <div class="form-group">
        <label class="form-label">Wie viele Tage?</label>
        <div class="stepper">
          <button class="stepper-btn" data-action="days-minus">−</button>
          <span class="stepper-val">${days}</span>
          <button class="stepper-btn" data-action="days-plus">+</button>
        </div>
      </div>`}
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
      <div class="form-group">
        <label class="form-label">Dresscode</label>
        <div class="sport-grid">
          ${DRESSCODES.map(d => `
            <button class="sport-chip ${state.setup.dresscodes.includes(d.id) ? 'selected' : ''}"
                    data-action="toggle-dresscode" data-dresscode="${d.id}">
              ${d.emoji} ${d.label}
            </button>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Optionen</label>
        <div class="sport-grid">
          <button class="sport-chip ${state.setup.waschen ? 'selected' : ''}" data-action="toggle-waschen">
            🧺 Ich wasche unterwegs
          </button>
          <button class="sport-chip ${state.setup.laptop ? 'selected' : ''}" data-action="toggle-laptop">
            💻 Mit Laptop
          </button>
          <button class="sport-chip ${state.setup.nonSchuko ? 'selected' : ''}" data-action="toggle-nonschuko">
            🔌 Nicht-Schuko Land
          </button>
          ${isLayover ? `
          <button class="sport-chip ${state.setup.uniformiert ? 'selected' : ''}" data-action="toggle-uniformiert">
            🛫 Uniformiert aus dem Haus
          </button>` : ''}
        </div>
      </div>
      <button class="btn-primary ${canProceed ? '' : 'disabled'}"
              data-action="setup-next" ${canProceed ? '' : 'disabled'}>
        Weiter →
      </button>
    </div>`;
}

function renderSetup3() {
  const { weather, weatherLoading, weatherError, destination, days, startDate } = state.setup;
  const ctx = CONTEXTS[state.setup.context];
  const today = todayStr();
  const dateNote = startDate && startDate !== today
    ? `<div class="weather-date-note">📅 ab ${formatDate(startDate)}</div>` : '';

  let weatherHtml = '';
  if (weatherLoading) {
    weatherHtml = `${dateNote}<div class="weather-loading">Wetter wird geladen…</div>`;
  } else if (weatherError) {
    weatherHtml = `${dateNote}<div class="weather-error">⚠️ ${escHtml(weatherError)}</div>`;
  } else if (weather) {
    const DAYS_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    if (weather.isLayover) {
      weatherHtml = `
        ${dateNote}
        <div class="layover-weather">
          ${weather.stops.map(s => `
            <div class="lw-stop">
              <div class="lw-stop-label">${countryFlag(s.country)}&nbsp;<strong>${escHtml(s.iata)}</strong>&nbsp;${escHtml(s.city)}</div>
              ${s.day ? `
                <div class="lw-stop-day">
                  <span class="lw-dow">${DAYS_DE[new Date(s.day.date + 'T12:00:00').getDay()]}</span>
                  <span class="lw-icon">${s.day.icon}</span>
                  <span class="lw-temp">${s.day.max}° <span class="lw-min">${s.day.min}°</span></span>
                </div>` : `<span class="lw-na">–</span>`}
            </div>`).join('')}
        </div>`;
    } else {
      const shown = weather.forecast.slice(0, days);
      weatherHtml = `
        ${dateNote}
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
    }
  } else if (destination) {
    weatherHtml = `${dateNote}<div class="weather-loading">Wetter lädt…</div>`;
  } else {
    weatherHtml = `<div class="weather-error">Kein Zielort angegeben</div>`;
  }

  const sportsStr = state.setup.sports.map(s => SPORTS.find(x => x.id === s)?.label).filter(Boolean).join(', ');
  const dresscodeStr = state.setup.dresscodes.map(d => DRESSCODES.find(x => x.id === d)?.label).filter(Boolean).join(', ');

  return `
    <div class="screen">
      <div class="nav-bar">
        <button class="btn-back" data-action="setup-back">←</button>
        <span class="nav-title">${ctx.emoji} ${escHtml(destination || '—')} · ${days} Tag${days !== 1 ? 'e' : ''}</span>
      </div>
      <div class="section-title">Wetter vor Ort</div>
      <div class="card weather-card">${weatherHtml}</div>
      ${sportsStr ? `<div class="summary-row">🏅 ${escHtml(sportsStr)}</div>` : ''}
      ${dresscodeStr ? `<div class="summary-row">👔 ${escHtml(dresscodeStr)}</div>` : ''}
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

  const tripWeather = trip.weather;
  const DAYS_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  let weatherStrip = '';
  if (tripWeather?.isLayover && tripWeather.stops?.length) {
    weatherStrip = `
      <div class="weather-strip">
        ${tripWeather.stops.filter(s => s.day).map(s => `
          <div class="ws-day">
            <span class="ws-icon">${s.day.icon}</span>
            <span class="ws-temp">${s.day.max}°</span>
            <span class="ws-dow">${DAYS_DE[new Date(s.day.date + 'T12:00:00').getDay()]} · ${s.iata}</span>
          </div>`).join('')}
      </div>`;
  } else if (tripWeather?.forecast?.length) {
    weatherStrip = `
      <div class="weather-strip">
        ${tripWeather.forecast.slice(0, Math.min(trip.days, 5)).map(d => {
          const dow = DAYS_DE[new Date(d.date + 'T12:00:00').getDay()];
          return `<div class="ws-day"><span class="ws-icon">${d.icon}</span><span class="ws-temp">${d.max}°</span><span class="ws-dow">${dow}</span></div>`;
        }).join('')}
      </div>`;
  }

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
      const allPacked = catPacked === catItems.length;
      return `
        <div class="category-section">
          <div class="category-header">
            <span class="cat-name">${cat.toUpperCase()}</span>
            <div class="cat-header-right">
              ${!allPacked ? `<button class="btn-check-all" data-action="check-all-cat" data-cat="${escAttr(cat)}">✓ alle</button>` : ''}
              <span class="cat-count">${catPacked}/${catItems.length}</span>
            </div>
          </div>
          ${catItems.map(i => renderItemRow(i)).join('')}
        </div>`;
    }).join('');

  const isCamper = trip.context === 'camper';
  const vorOrtVisible = state.vorOrtExpanded ?? isCamper;
  const vorOrtLabel = isCamper ? '🚐 IN DER CONNI – prüfen' : '📍 VOR ORT';
  const vorOrtSection = vorOrtItems.length ? `
    <div class="category-section vor-ort-section">
      <div class="category-header vor-ort-header" data-action="toggle-vor-ort">
        <span class="cat-name">${vorOrtLabel}</span>
        <span class="cat-toggle">${vorOrtVisible ? '▲' : '▼'} ${vorOrtItems.length}</span>
      </div>
      ${vorOrtVisible ? vorOrtItems.map(i => renderItemRow(i, true)).join('') : ''}
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
      state.setup = {
        context: null, destination: '', startDate: todayStr(),
        days: 3, layoverDuration: '72h', sports: [], dresscodes: [],
        waschen: true, laptop: false, uniformiert: true, nonSchuko: false,
        stops: [], acQuery: '', acResults: [], focusIata: false,
        weather: null, weatherLoading: false, weatherError: null
      };
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
      state.setupStep = 2;
      render(); break;

    case 'setup-next': {
      if (state.setupStep === 1 && !state.setup.context) return;
      if (state.setupStep === 2) {
        const isLayover = state.setup.context === 'layover';
        if (isLayover) {
          const nf = state.setup.stops.filter(s => s.iata !== 'FRA');
          if (!nf.length) return;
          state.setup.destination = nf.map(s => s.iata).join(' – ');
        } else {
          state.setup.destination = document.getElementById('dest-input')?.value?.trim() || '';
        }
      }
      state.setupStep++;
      if (state.setupStep === 3) {
        const isLayover = state.setup.context === 'layover';
        if (isLayover ? state.setup.stops.length > 0 : state.setup.destination) {
          loadWeatherAsync();
        }
      }
      render(); break;
    }

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

    case 'toggle-dresscode': {
      const did = btn.dataset.dresscode;
      const idx = state.setup.dresscodes.indexOf(did);
      if (idx === -1) state.setup.dresscodes.push(did);
      else state.setup.dresscodes.splice(idx, 1);
      render(); break;
    }

    case 'toggle-waschen':
      state.setup.waschen = !state.setup.waschen;
      render(); break;

    case 'toggle-laptop':
      state.setup.laptop = !state.setup.laptop;
      render(); break;

    case 'toggle-uniformiert':
      state.setup.uniformiert = !state.setup.uniformiert;
      render(); break;

    case 'toggle-nonschuko':
      state.setup.nonSchuko = !state.setup.nonSchuko;
      render(); break;

    case 'check-all-cat': {
      const cat = btn.dataset.cat;
      const trip = currentTrip();
      if (!trip) break;
      for (const item of trip.items) {
        if (item.category === cat && !item.vorOrt) {
          item.eingepackt = true;
          item.vorhanden = true;
        }
      }
      saveState(); render(); break;
    }

    case 'select-airport': {
      const { iata, city, country, lat, lon } = btn.dataset;
      state.setup.stops.push({ iata, city, country, lat: parseFloat(lat), lon: parseFloat(lon) });
      state.setup.acQuery = '';
      state.setup.acResults = [];
      state.setup.focusIata = true;
      state.setup.days = layoverDays(state.setup.stops, state.setup.layoverDuration);
      render(); break;
    }

    case 'remove-stop': {
      const idx = parseInt(btn.dataset.stopIdx);
      state.setup.stops.splice(idx, 1);
      state.setup.focusIata = true;
      state.setup.days = layoverDays(state.setup.stops, state.setup.layoverDuration);
      render(); break;
    }

    case 'select-duration': {
      state.setup.layoverDuration = btn.dataset.dur;
      state.setup.days = layoverDays(state.setup.stops, btn.dataset.dur);
      render(); break;
    }

    case 'create-trip': {
      const trip = createTrip(state.setup);
      state.trips.push(trip);
      state.currentTripId = trip.id;
      state.view = 'list';
      state.vorOrtExpanded = null;
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

    case 'toggle-vor-ort': {
      const trip = currentTrip();
      const defaultExpanded = trip?.context === 'camper';
      state.vorOrtExpanded = !(state.vorOrtExpanded ?? defaultExpanded);
      render(); break;
    }

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
  if (e.target.dataset.action === 'iata-search') {
    state.setup.acQuery = e.target.value;
    state.setup.acResults = searchAirports(e.target.value);
    renderAcDropdownOnly(); // partial update – no focus loss
    return;
  }
  if (e.target.dataset.action === 'input-startdate') {
    state.setup.startDate = e.target.value;
    return;
  }
  if (e.target.dataset.action === 'input-destination') {
    state.setup.destination = e.target.value;
  }
  if (e.target.dataset.action === 'rename-item') {
    const item = findMasterItem(e.target.dataset.itemId);
    if (item) { item.name = e.target.value; saveState(); }
  }
}

// ─── Autocomplete dropdown (partial DOM update – no focus loss) ───────────────

function renderAcDropdownOnly() {
  const wrap = document.querySelector('.iata-wrap');
  if (!wrap) return;
  let dd = wrap.querySelector('.ac-dropdown');
  const results = state.setup.acResults;
  if (!results.length) {
    if (dd) dd.remove();
    return;
  }
  if (!dd) {
    dd = document.createElement('div');
    dd.className = 'ac-dropdown';
    wrap.appendChild(dd);
  }
  dd.innerHTML = results.map(([iata, city, country, lat, lon]) => `
    <button class="ac-item" data-action="select-airport"
            data-iata="${iata}" data-city="${escAttr(city)}"
            data-country="${escAttr(country)}"
            data-lat="${lat}" data-lon="${lon}">
      <span class="ac-flag">${countryFlag(country)}</span>
      <span class="ac-iata">${iata}</span>
      <span class="ac-city">${escHtml(city)}</span>
    </button>`).join('');
}

// ─── Weather async load ───────────────────────────────────────────────────────

function loadWeatherAsync() {
  const isLayover = state.setup.context === 'layover';

  state.setup.weatherLoading = true;
  state.setup.weather = null;
  state.setup.weatherError = null;
  render();

  const startDate = state.setup.startDate || todayStr();
  const sd = startDate !== todayStr() ? startDate : null;
  let promise;

  if (isLayover) {
    const nonFRA = state.setup.stops.filter(s => s.iata !== 'FRA');
    if (!nonFRA.length) { state.setup.weatherLoading = false; render(); return; }
    if (nonFRA.length === 1) {
      // single destination → normal multi-day forecast
      const s = nonFRA[0];
      promise = getWeatherForTrip({ lat: s.lat, lon: s.lon, name: s.city, country: s.country }, state.setup.days, sd);
    } else {
      // multi-stop → 1 day per stop
      promise = getWeatherForLayover(nonFRA, startDate);
    }
  } else {
    if (!state.setup.destination) { state.setup.weatherLoading = false; render(); return; }
    promise = getWeatherForTrip(state.setup.destination, state.setup.days, sd);
  }

  promise
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

function layoverDays(stops, duration) {
  const nonFRA = stops.filter(s => s.iata !== 'FRA');
  if (nonFRA.length >= 2) return nonFRA.length;
  const map = { '24h': 1, '48h': 2, '72h': 3 };
  return map[duration] ?? 1;
}

function findTripItem(id) {
  const trip = currentTrip();
  return trip?.items.find(i => i.id === id) ?? null;
}

function findMasterItem(id) {
  return state.masterItems.find(i => i.id === id) ?? null;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDate(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${d}.${m}.`;
}

function countryFlag(code) {
  if (!code || code.length < 2) return '';
  return [...code.toUpperCase().slice(0, 2)].map(c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  ).join('');
}

function searchAirports(q) {
  if (!q || q.length < 2) return [];
  const up = q.toUpperCase().trim();
  const lo = q.toLowerCase().trim();
  const exact = [], starts = [], contains = [];
  for (const a of AIRPORTS) {
    const [iata, city] = a;
    if (iata === up)                                    { exact.push(a);    continue; }
    if (iata.startsWith(up) || city.toLowerCase().startsWith(lo)) { starts.push(a);   continue; }
    if (city.toLowerCase().includes(lo))                { contains.push(a); }
  }
  return [...exact, ...starts, ...contains].slice(0, 6);
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  state.setup.startDate = todayStr();
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
