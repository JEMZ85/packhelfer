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

async function fetchForecast(lat, lon, days) {
  const n = Math.min(Math.max(days, 1), 16);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=${n}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Netzwerkfehler beim Wetter');
  const data = await res.json();
  return data.daily.time.map((date, i) => ({
    date,
    code: data.daily.weathercode[i],
    max: Math.round(data.daily.temperature_2m_max[i]),
    min: Math.round(data.daily.temperature_2m_min[i]),
    icon: WEATHER_ICONS[data.daily.weathercode[i]] ?? '🌡️'
  }));
}

async function getWeatherForTrip(cityName, days) {
  const location = await geocodeCity(cityName);
  const forecast = await fetchForecast(location.lat, location.lon, days);
  return { location, forecast };
}
