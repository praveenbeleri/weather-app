/* =====================================================
   Weatherly — App.js (Pure JS Clone)
   ===================================================== */

(() => {
  'use strict';

  // ── Config ─────────────────────────────────────────
  const CITIES = ['Madrid', 'London', 'New York', 'Los Angeles', 'Barcelona', 'Paris', 'Tokyo', 'Sydney', 'Dubai', 'Mumbai', 'Singapore', 'Berlin'];

  // ── State ───────────────────────────────────────────
  const state = {
    apiKey: localStorage.getItem('wly_api_key') || '',
    isDemo: false,
    isDark: localStorage.getItem('wly_theme') !== 'light',
    currentCity: localStorage.getItem('wly_city') || 'Hoskote',
    currentLat: null,
    currentLon: null,
    map: null,
    mapMarker: null,
    clockInterval: null,
  };

  // ── DOM ─────────────────────────────────────────────
  const $ = id => document.getElementById(id);

  // ── SVG Icon Set (matching original) ───────────────
  const ICONS = {
    clearDay: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="icon-clear"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    clearNight: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="icon-clear"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    cloudy: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="icon-cloudy"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`,
    partlyCloudy: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="icon-cloudy"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`,
    rain: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="icon-rain"><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`,
    drizzle: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="icon-drizzle"><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`,
    snow: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="icon-snow"><polyline points="23 7 16 12 23 17"/><line x1="8" y1="12" x2="16" y2="12"/><polyline points="1 7 8 12 1 17"/></svg>`,
    thunder: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="icon-thunder"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/></svg>`,
    mist: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="icon-cloudy"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  };

  const getIcon = (id, dt, sunrise, sunset) => {
    const night = dt < sunrise || dt > sunset;
    if (id === 800) return night ? ICONS.clearNight : ICONS.clearDay;
    if (id >= 801 && id <= 803) return ICONS.partlyCloudy;
    if (id === 804) return ICONS.cloudy;
    if (id >= 300 && id < 400) return ICONS.drizzle;
    if (id >= 500 && id < 600) return ICONS.rain;
    if (id >= 600 && id < 700) return ICONS.snow;
    if (id >= 200 && id < 300) return ICONS.thunder;
    if (id >= 700 && id < 800) return ICONS.mist;
    return ICONS.cloudy;
  };

  // ── API ─────────────────────────────────────────────
  const API_BASE = 'https://api.openweathermap.org/data/2.5';
  const GEO_BASE = 'https://api.openweathermap.org/geo/1.0';

  const apiFetch = async url => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  };

  // ── Load Weather ─────────────────────────────────────
  const loadWeatherByCity = async city => {
    state.currentCity = city;
    localStorage.setItem('wly_city', city);
    try {
      // Geocode first to get lat/lon
      const geo = await apiFetch(`${GEO_BASE}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${state.apiKey}`);
      if (!geo.length) throw new Error('City not found');
      const { lat, lon } = geo[0];
      await loadWeatherByCoords(lat, lon, city);
    } catch (e) {
      console.warn('City load error:', e.message);
    }
  };

  const loadWeatherByCoords = async (lat, lon, cityNameOverride) => {
    state.currentLat = lat;
    state.currentLon = lon;
    try {
      const [weather, forecast, airQuality] = await Promise.all([
        apiFetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${state.apiKey}&units=metric`),
        apiFetch(`${API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${state.apiKey}&units=metric&cnt=40`),
        apiFetch(`${API_BASE}/air_pollution?lat=${lat}&lon=${lon}&appid=${state.apiKey}`),
      ]);

      renderAll(weather, forecast, airQuality);
      updateMap(lat, lon);
    } catch (e) {
      console.warn('Weather load error:', e.message);
    }
  };

  // ── Render ─────────────────────────────────────────
  const renderAll = (weather, forecast, airQuality) => {
    renderTemperature(weather);
    renderAirPollution(airQuality);
    renderSunset(weather);
    renderWind(weather);
    renderHourly(forecast, weather);
    renderUV(weather);
    renderPopulation(weather);
    renderFiveDay(forecast, weather);
    renderSmallCards(weather);
    renderCities();
    showGrid();
  };

  // Temperature
  const renderTemperature = (w) => {
    const { main, weather, timezone, name, dt, sys } = w;
    const temp = Math.round(main.temp);
    const minT = Math.round(main.temp_min);
    const maxT = Math.round(main.temp_max);
    const id = weather[0].id;
    const desc = weather[0].description;
    const sunrise = sys.sunrise;
    const sunset  = sys.sunset;

    $('tempCityName').textContent = name;
    $('tempBig').textContent = `${temp}°`;
    $('tempDesc').textContent = desc.charAt(0).toUpperCase() + desc.slice(1);
    $('tempMinMax').textContent = `Low: ${minT}°  High: ${maxT}°`;
    $('tempIcon').innerHTML = getIcon(id, dt, sunrise, sunset);
    $('fiveDayCityName').textContent = name;
    $('popCityName').textContent = name;

    // Day
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const now = new Date();
    $('tempDay').textContent = days[now.getDay()];

    // Live clock
    if (state.clockInterval) clearInterval(state.clockInterval);
    const updateTime = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2,'0');
      const m = String(d.getMinutes()).padStart(2,'0');
      const s = String(d.getSeconds()).padStart(2,'0');
      $('tempTime').textContent = `${h}:${m}:${s}`;
    };
    updateTime();
    state.clockInterval = setInterval(updateTime, 1000);
  };

  // Air Pollution
  const renderAirPollution = (aq) => {
    if (!aq || !aq.list || !aq.list[0]) return;
    const aqi = aq.list[0].main.aqi; // 1-5
    const texts = ['', 'Air quality is excellent.', 'Air quality is good.', 'Air quality is satisfactory.', 'Air quality is unhealthy.', 'Air quality is very unhealthy.'];
    const pos = ((aqi - 1) / 4) * 100;
    $('airProgressThumb').style.left = `${Math.min(pos, 96)}%`;
    $('airQualityText').textContent = texts[aqi] || 'Air quality data unavailable.';
  };

  // Sunset
  const renderSunset = (w) => {
    const { sys } = w;
    const fmt = unix => {
      const d = new Date(unix * 1000);
      const h = String(d.getHours()).padStart(2,'0');
      const m = String(d.getMinutes()).padStart(2,'0');
      return `${h}:${m}`;
    };
    $('sunsetTime').textContent = fmt(sys.sunset);
    $('sunriseTime').textContent = fmt(sys.sunrise);
  };

  // Wind
  const renderWind = (w) => {
    const speed = w.wind.speed;
    const deg   = w.wind.deg || 0;
    $('windSpeedLabel').textContent = `${Math.round(speed)} m/s`;
    $('compassArrowWrap').style.transform = `rotate(${deg}deg)`;
  };

  // Hourly (first 2 slots from forecast matching closest times)
  const renderHourly = (forecast, weather) => {
    const list = forecast.list;
    const slots = list.slice(0, 2);
    const items = $('hourlyItems');
    const sunrise = weather.sys.sunrise;
    const sunset  = weather.sys.sunset;

    items.innerHTML = slots.map(item => {
      const d = new Date(item.dt * 1000);
      const h = String(d.getHours()).padStart(2,'0');
      const m = String(d.getMinutes()).padStart(2,'0');
      const t = Math.round(item.main.temp);
      const icon = getIcon(item.weather[0].id, item.dt, sunrise, sunset);
      return `
        <div class="hourly-item">
          <span class="hourly-time">${h}:${m}</span>
          <span class="hourly-icon">${icon}</span>
          <span class="hourly-temp">${t}°C</span>
        </div>
      `;
    }).join('');
  };

  // UV Index (OpenWeather doesn't include UV in the free forecast, we approximate)
  const renderUV = (w) => {
    const clouds = w.clouds.all;
    const uv = Math.max(0, Math.round(10 - (clouds / 100) * 7));
    const uvLabels = [
      { max: 2,  label: 'Low',       advice: 'No protection required.' },
      { max: 5,  label: 'Moderate',  advice: 'Wear sunscreen SPF 30+.' },
      { max: 7,  label: 'High',      advice: 'Wear a hat and sunglasses.' },
      { max: 10, label: 'Very High', advice: 'Apply sunscreen SPF 30+ every 2 hours.' },
      { max: 11, label: 'Extreme',   advice: 'Take full precautions, stay in shade.' },
    ];
    const info = uvLabels.find(u => uv <= u.max) || uvLabels[uvLabels.length-1];
    $('uvNumber').textContent = uv;
    $('uvLabelBadge').textContent = `(${info.label})`;
    $('uvAdvice').textContent = info.advice;
    const pct = Math.min((uv / 11) * 100, 98);
    $('uvBarThumb').style.left = `${pct}%`;
  };

  // Population (using REST Countries API as approximation, or just show city data)
  const renderPopulation = async (w) => {
    const countryCode = w.sys.country;
    $('populationNumber').textContent = '—';
    try {
      const res = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=population`);
      const data = await res.json();
      const pop = data.population;
      const fmt = n => n >= 1e9 ? (n/1e9).toFixed(1)+'B' : n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : n;
      $('populationNumber').textContent = fmt(pop);
    } catch {
      $('populationNumber').textContent = 'N/A';
    }
  };

  // 5-Day Forecast
  const renderFiveDay = (forecast, weather) => {
    const list = forecast.list;
    const days = {};
    list.forEach(item => {
      const d = new Date(item.dt * 1000);
      const key = d.toLocaleDateString('en-US', { weekday: 'short' });
      if (!days[key]) days[key] = { temps: [], dt: item.dt };
      days[key].temps.push(item.main.temp_min, item.main.temp_max);
    });

    const entries = Object.entries(days).slice(0, 5);
    const allTemps = entries.flatMap(([,d]) => d.temps);
    const globalMin = Math.min(...allTemps);
    const globalMax = Math.max(...allTemps);

    $('fivedayList').innerHTML = entries.map(([day, data]) => {
      const lo = Math.round(Math.min(...data.temps));
      const hi = Math.round(Math.max(...data.temps));
      const barPct = globalMax > globalMin
        ? Math.round(((hi - globalMin) / (globalMax - globalMin)) * 100)
        : 50;
      return `
        <div class="fiveday-item">
          <span class="fiveday-day">${day}</span>
          <div class="fiveday-sub">
            <span class="fiveday-low-label">(low)</span>
            <span class="fiveday-low-val">${lo}°C</span>
            <div class="fiveday-bar-wrap">
              <div class="fiveday-bar" style="width:${barPct}%"></div>
            </div>
            <span class="fiveday-high-label">(high)</span>
            <span class="fiveday-high-val">${hi}°C</span>
          </div>
        </div>
      `;
    }).join('');
  };

  // Small Cards
  const renderSmallCards = (w) => {
    const feelsLike = Math.round(w.main.feels_like);
    const humidity  = w.main.humidity;
    const vis       = w.visibility / 1000;
    const pressure  = w.main.pressure;

    $('feelsLike').textContent = `${feelsLike}°`;
    $('feelsLikeDesc').textContent = Math.abs(feelsLike - Math.round(w.main.temp)) <= 2
      ? 'Feels close to the actual temperature.'
      : feelsLike < w.main.temp ? 'Feels colder than the actual temperature.' : 'Feels warmer than the actual temperature.';

    $('humidityVal').textContent = `${humidity}%`;
    const humidDesc = humidity < 30 ? 'Low: Dry conditions.' : humidity < 60 ? 'Comfortable: Ideal for health and comfort.' : humidity < 80 ? 'High: Uncomfortable, mold growth risk.' : 'Very High: Very uncomfortable conditions.';
    $('humidityDesc').textContent = humidDesc;

    $('visibilityVal').textContent = `${vis.toFixed(0)} km`;
    const visDesc = vis >= 10 ? 'Good: Easily navigable.' : vis >= 5 ? 'Moderate: Somewhat hazy.' : 'Poor: Reduced visibility.';
    $('visibilityDesc').textContent = visDesc;

    $('pressureVal').textContent = `${pressure} hPa`;
    const pressDesc = pressure >= 1013 ? 'Normal pressure. Expect stable weather.' : pressure >= 1000 ? 'Low pressure. Expect weather changes..' : 'Very low pressure. Stormy conditions possible.';
    $('pressureDesc').textContent = pressDesc;
  };

  // Cities
  const renderCities = () => {
    $('citiesList').innerHTML = CITIES.map(city => `
      <div class="city-item" data-city="${city}">${city}</div>
    `).join('');

    document.querySelectorAll('.city-item').forEach(item => {
      item.addEventListener('click', () => {
        const city = item.dataset.city;
        closeSearch();
        if (state.isDemo) loadDemoForCity(city);
        else loadWeatherByCity(city);
      });
    });
  };

  // ── Map ──────────────────────────────────────────────
  const initMap = (lat, lon) => {
    if (state.map) {
      state.map.setView([lat, lon], 11);
      if (state.mapMarker) {
        state.mapMarker.setLatLng([lat, lon]);
      }
      return;
    }
    state.map = L.map('leafletMap', { zoomControl: true, attributionControl: true }).setView([lat, lon], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(state.map);
    state.mapMarker = L.marker([lat, lon]).addTo(state.map);
  };

  const updateMap = (lat, lon) => {
    initMap(lat, lon);
    if (state.mapMarker) state.mapMarker.setLatLng([lat, lon]);
    if (state.map) state.map.setView([lat, lon], 11);
  };

  // ── Search ────────────────────────────────────────────
  let searchTimer = null;

  const openSearch = () => {
    $('searchModal').classList.add('open');
    setTimeout(() => $('searchModalInput').focus(), 100);
  };

  const closeSearch = () => {
    $('searchModal').classList.remove('open');
    $('searchModalInput').value = '';
    $('searchResults').innerHTML = '';
    $('searchEmpty').style.display = 'none';
  };

  const doSearch = async q => {
    if (!q || q.length < 2) {
      $('searchResults').innerHTML = '';
      $('searchEmpty').style.display = 'none';
      return;
    }
    try {
      let results = [];
      if (state.isDemo) {
        results = CITIES.filter(c => c.toLowerCase().includes(q.toLowerCase())).map(c => ({ name: c, country: '' }));
      } else {
        const data = await apiFetch(`${GEO_BASE}/direct?q=${encodeURIComponent(q)}&limit=6&appid=${state.apiKey}`);
        results = data.map(c => ({ name: c.name, state: c.state, country: c.country, lat: c.lat, lon: c.lon }));
      }
      if (!results.length) {
        $('searchResults').innerHTML = '';
        $('searchEmpty').style.display = 'block';
        return;
      }
      $('searchEmpty').style.display = 'none';
      $('searchResults').innerHTML = results.map((r, i) => {
        const label = [r.name, r.state, r.country].filter(Boolean).join(', ');
        return `<div class="search-result-item" data-i="${i}" data-city="${r.name}" data-lat="${r.lat||''}" data-lon="${r.lon||''}">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color:var(--text-muted);flex-shrink:0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          ${label}
        </div>`;
      }).join('');

      document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const city = item.dataset.city;
          const lat  = parseFloat(item.dataset.lat);
          const lon  = parseFloat(item.dataset.lon);
          closeSearch();
          if (state.isDemo) loadDemoForCity(city);
          else if (lat && lon) loadWeatherByCoords(lat, lon, city);
          else loadWeatherByCity(city);
        });
      });
    } catch (e) {
      $('searchEmpty').style.display = 'block';
    }
  };

  // ── Theme ────────────────────────────────────────────
  const applyTheme = () => {
    const html = document.documentElement;
    if (state.isDark) {
      html.classList.add('dark');
      html.classList.remove('light');
      $('moonIcon').style.display = 'block';
      $('sunIcon').style.display = 'none';
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      $('moonIcon').style.display = 'none';
      $('sunIcon').style.display = 'block';
    }
    localStorage.setItem('wly_theme', state.isDark ? 'dark' : 'light');
  };

  // ── Show Grid ────────────────────────────────────────
  const showGrid = () => {
    $('weatherGrid').style.display = 'flex';
    $('appFooter').style.display = 'block';
    $('apiSetup').style.display = 'none';
    // Init map with default coords if needed
    if (state.currentLat && !state.map) {
      setTimeout(() => updateMap(state.currentLat, state.currentLon), 100);
    }
  };

  // ── Demo Data ────────────────────────────────────────
  const DEMO_CITIES = {
    'Hoskote': { lat: 13.07, lon: 77.79, temp: 24, min: 23, max: 24, feels: 24, humidity: 73, pressure: 1012, vis: 10000, wind: { speed: 7, deg: 270 }, clouds: 100, id: 804, desc: 'Overcast Clouds', sunset: 1719065400, sunrise: 1719021300, country: 'IN', pop: '41.2K' },
    'London':  { lat: 51.51, lon: -0.12, temp: 34, min: 32, max: 35, feels: 35, humidity: 42, pressure: 1016, vis: 10000, wind: { speed: 2, deg: 180 }, clouds: 0,   id: 800, desc: 'Clear Sky',      sunset: 1719079200, sunrise: 1719021300, country: 'GB', pop: '1.0M' },
    'Madrid':  { lat: 40.42, lon: -3.70, temp: 38, min: 29, max: 39, feels: 38, humidity: 18, pressure: 1010, vis: 10000, wind: { speed: 3, deg: 90  }, clouds: 0,   id: 800, desc: 'Clear Sky',      sunset: 1719072000, sunrise: 1719021300, country: 'ES', pop: '3.2M' },
    'New York':{ lat: 40.71, lon: -74.0, temp: 28, min: 24, max: 31, feels: 30, humidity: 55, pressure: 1020, vis: 10000, wind: { speed: 4, deg: 45  }, clouds: 30,  id: 802, desc: 'Scattered Clouds',sunset: 1719097200, sunrise: 1719021300, country: 'US', pop: '8.3M' },
  };

  const buildDemoWeather = (cityKey) => {
    const d = DEMO_CITIES[cityKey] || DEMO_CITIES['Hoskote'];
    const now = Math.floor(Date.now() / 1000);
    return {
      main: { temp: d.temp, temp_min: d.min, temp_max: d.max, feels_like: d.feels, humidity: d.humidity, pressure: d.pressure },
      weather: [{ id: d.id, description: d.desc, main: d.desc.split(' ')[0] }],
      wind: d.wind,
      clouds: { all: d.clouds },
      visibility: d.vis,
      sys: { country: d.country, sunrise: d.sunrise, sunset: d.sunset },
      name: cityKey,
      dt: now,
      coord: { lat: d.lat, lon: d.lon },
    };
  };

  const buildDemoForecast = (cityKey) => {
    const d = DEMO_CITIES[cityKey] || DEMO_CITIES['Hoskote'];
    const baseTemp = d.temp;
    const days = ['Tue','Wed','Thu','Fri','Sat'];
    const now = Math.floor(Date.now() / 1000);
    return {
      list: days.flatMap((day, i) => [
        { dt: now + (i*86400) + 64800, main: { temp: baseTemp - 2 + i*0.5, temp_min: d.min + i*0.3, temp_max: d.max + i*0.5, feels_like: d.feels }, weather: [{ id: d.id, description: d.desc }] },
        { dt: now + (i*86400) + 75600, main: { temp: baseTemp - 1 + i*0.5, temp_min: d.min + i*0.3, temp_max: d.max + i*0.5, feels_like: d.feels }, weather: [{ id: d.id, description: d.desc }] },
      ]),
      city: { name: cityKey, timezone: 0 },
    };
  };

  const buildDemoAQ = (aqi = 1) => ({
    list: [{ main: { aqi }, components: {} }]
  });

  const loadDemoForCity = async (city) => {
    const key = Object.keys(DEMO_CITIES).find(k => k.toLowerCase() === city.toLowerCase()) || Object.keys(DEMO_CITIES)[0];
    const dCity = DEMO_CITIES[key] || DEMO_CITIES['Hoskote'];
    const weather  = buildDemoWeather(key);
    const forecast = buildDemoForecast(key);
    const aq       = buildDemoAQ(Math.ceil(Math.random() * 3));
    state.currentLat = dCity.lat;
    state.currentLon = dCity.lon;

    // Patch population
    const renderAllDemo = () => {
      renderTemperature(weather);
      renderAirPollution(aq);
      renderSunset(weather);
      renderWind(weather);
      renderHourly(forecast, weather);
      renderUV(weather);
      $('populationNumber').textContent = dCity.pop;
      $('popCityName').textContent = key;
      $('populationDesc').innerHTML = `Latest UN population data for <span id="popCityName">${key}</span>.`;
      renderFiveDay(forecast, weather);
      renderSmallCards(weather);
      renderCities();
      showGrid();
      setTimeout(() => updateMap(dCity.lat, dCity.lon), 200);
    };
    renderAllDemo();
  };

  // ── Events ────────────────────────────────────────────
  $('searchTrigger').addEventListener('click', openSearch);
  $('searchModal').addEventListener('click', e => {
    if (e.target === $('searchModal')) closeSearch();
  });

  $('searchModalInput').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => doSearch(e.target.value.trim()), 300);
  });

  $('searchModalInput').addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSearch();
    if (e.key === 'Enter') {
      const q = $('searchModalInput').value.trim();
      if (q) {
        closeSearch();
        if (state.isDemo) loadDemoForCity(q);
        else loadWeatherByCity(q);
      }
    }
  });

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
    if (e.key === 'f' || e.key === 'F') {
      // only if not typing in input
      if (document.activeElement.tagName !== 'INPUT') openSearch();
    }
    if (e.key === 'Escape') closeSearch();
  });

  $('themeToggle').addEventListener('click', () => {
    state.isDark = !state.isDark;
    applyTheme();
  });

  $('apiKeySetupBtn').addEventListener('click', () => {
    const key = $('apiKeySetupInput').value.trim();
    if (!key) { $('apiKeySetupInput').focus(); return; }
    state.apiKey = key;
    localStorage.setItem('wly_api_key', key);
    $('apiSetup').style.display = 'none';
    loadWeatherByCity(state.currentCity);
  });

  $('apiKeySetupInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('apiKeySetupBtn').click();
  });

  $('demoSetupBtn').addEventListener('click', () => {
    state.isDemo = true;
    $('apiSetup').style.display = 'none';
    loadDemoForCity('Hoskote');
  });

  // ── Init ──────────────────────────────────────────────
  const init = () => {
    applyTheme();

    if (state.apiKey) {
      $('apiSetup').style.display = 'none';
      loadWeatherByCity(state.currentCity);
    } else {
      // Auto-run demo so users see the app immediately
      state.isDemo = true;
      $('apiSetup').style.display = 'none';
      loadDemoForCity('Hoskote');
    }
  };

  init();
})();
