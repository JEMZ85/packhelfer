// Packhelfer – weather API (Open-Meteo, kein API-Key nötig)

async function geocodeCity(cityName) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=de&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Netzwerkfehler beim Geocoding');
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`„${cityName}" nicht gefunden`);
  }
  const r = data.results[0];
  return { lat: r.latitude, lon: r.longitude, name: r.name, country: r.country_code };
}

// startDate: 'YYYY-MM-DD' or null (uses forecast_days from today)
async function fetchForecast(lat, lon, days, startDate) {
  const n = Math.min(Math.max(days, 1), 16);
  let url;
  if (startDate) {
    const start = new Date(startDate + 'T12:00:00');
    const end   = new Date(startDate + 'T12:00:00');
    end.setDate(end.getDate() + n - 1);
    const fmt = d => d.toISOString().slice(0, 10);
    url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto` +
          `&start_date=${fmt(start)}&end_date=${fmt(end)}`;
  } else {
    url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto` +
          `&forecast_days=${n}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Wetter nicht verfügbar (max. 16 Tage im Voraus)');
  const data = await res.json();
  return data.daily.time.map((date, i) => ({
    date,
    code: data.daily.weathercode[i],
    max:  Math.round(data.daily.temperature_2m_max[i]),
    min:  Math.round(data.daily.temperature_2m_min[i]),
    icon: WEATHER_ICONS[data.daily.weathercode[i]] ?? '🌡️'
  }));
}

// input: city name string OR {lat, lon, name, country} object (skips geocoding)
// startDate: 'YYYY-MM-DD' or null
async function getWeatherForTrip(input, days, startDate) {
  let location;
  if (typeof input === 'object' && input !== null) {
    location = { lat: input.lat, lon: input.lon, name: input.name || input.city || '?', country: input.country || '' };
  } else {
    location = await geocodeCity(input);
  }
  const forecast = await fetchForecast(location.lat, location.lon, days, startDate || null);
  return { location, forecast };
}

function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Fetch 1 weather day per stop, date offset by stop index from startDate
async function getWeatherForLayover(stops, startDate) {
  const promises = stops.map((s, i) => {
    const date = addDays(startDate, i);
    return fetchForecast(s.lat, s.lon, 1, date)
      .then(forecast => ({ iata: s.iata, city: s.city, country: s.country, day: forecast[0] ?? null }))
      .catch(() =>        ({ iata: s.iata, city: s.city, country: s.country, day: null }));
  });
  const stopResults = await Promise.all(promises);
  return {
    isLayover: true,
    stops: stopResults,
    location: { name: stops[0].city, country: stops[0].country },
    forecast: stopResults.map(r => r.day).filter(Boolean)  // flat array for home card
  };
}
