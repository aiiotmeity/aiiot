import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, Area, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import './ArgMonitoring.css';

// --- API CONFIGURATION ---
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';

// --- RAIN GAUGE STATIONS ---
// id must match the S3 file names ({id}_MASTER_LOG.csv / {id}_LATEST.json).
// lat/lon: GPS position of each gauge.
const STATIONS = [
  {
    id: 'ARGS1',
    number: 1,
    name: 'Illithode',
    area: 'Malayattoor, Ernakulam',
    lat: 10.20395751276211,
    lon: 76.53282253409051,
  },
  {
    id: 'ARGS2',
    number: 2,
    name: 'Kuttampuzha',
    area: 'Kothamangalam, Ernakulam',
    lat: 10.159964473433378,
    lon: 76.78871405387139,
  },
];
const DEFAULT_STATION = STATIONS[0].id;
const findStation = (id) =>
  STATIONS.find(s => s.id === String(id || '').toUpperCase()) || STATIONS[0];

// Small OpenStreetMap embed centred on the station (no extra packages needed)
const MAP_SPAN = 0.035; // degrees either side of the marker
const osmEmbedUrl = ({ lat, lon }) => {
  const bbox = [lon - MAP_SPAN, lat - MAP_SPAN * 0.6, lon + MAP_SPAN, lat + MAP_SPAN * 0.6]
    .map(v => v.toFixed(4)).join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
};
const gmapsUrl = ({ lat, lon }) => `https://www.google.com/maps?q=${lat},${lon}`;
const fmtCoord = (v, pos, neg) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;
const REFRESH_SECONDS = 30;
const PAGE_SIZE = 10; // hourly rows per table page

// Minutes to add to the logger timestamp before display.
// 0 = show as recorded. Set to 330 if the logger clock is UTC and you want IST.
const TIME_OFFSET_MIN = 0;

const HOUR_MS = 3600e3;
const IST_OFFSET_MS = 5.5 * HOUR_MS;

const RANGES = [
  { hours: 6, label: '6 Hours' },
  { hours: 24, label: '24 Hours' },
  { hours: 72, label: '3 Days' },
  { hours: 168, label: '7 Days' }
];

// ---------- Time helpers ----------
const toDate = (ts) => {
  if (ts === null || ts === undefined || ts === '') return null;
  let d = new Date(ts);
  if (isNaN(d) && typeof ts === 'string') d = new Date(ts.replace(' ', 'T'));
  if (isNaN(d)) return null;
  d.setMinutes(d.getMinutes() + TIME_OFFSET_MIN);
  return d;
};

const toMs = (ts) => {
  const d = toDate(ts);
  return d ? d.getTime() : null;
};

const fmtTime = (ts) => {
  const d = toDate(ts);
  if (!d) return ts || '--';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const fmtDateTime = (ts) => {
  const d = toDate(ts);
  if (!d) return ts || '--';
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  return `${date}, ${fmtTime(ts)}`;
};

const fmtAge = (sec) => {
  if (sec === null || sec === undefined) return 'unknown';
  if (sec < 60) return `${sec} sec ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ${Math.floor((sec % 3600) / 60)} min ago`;
  return `${Math.floor(sec / 86400)} days ago`;
};

const fmtVal = (v, unit = '') => (v === null || v === undefined ? '--' : `${v}${unit}`);
const fmtNum = (v, d = 1) => (v === null || v === undefined ? '--' : Number(v).toFixed(d));

// ---------- Hourly aggregation (same logic as App.jsx) ----------
const dateFmtIN = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const hourFmtIN = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
const shortDayFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' });
const shortHourFmt = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });

const round1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
const mean = (vals) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);

// Start of the IST hour that contains t
function hourStart(t) {
  const d = new Date(t + IST_OFFSET_MS);
  d.setUTCMinutes(0, 0, 0);
  return d.getTime() - IST_OFFSET_MS;
}

const hourLabel = (start) =>
  `${dateFmtIN.format(start)}, ${hourFmtIN.format(start)} – ${hourFmtIN.format(start + HOUR_MS)}`;

// Rainfall from the logger is accumulated: turn it into "rain since previous reading".
// A drop larger than 0.05 mm is treated as a counter reset.
function withIncrements(rows) {
  let prev = null;
  return rows.map((r) => {
    let inc = null;
    if (r.rainfall != null && prev) {
      const diff = r.rainfall - prev.rainfall;
      inc = diff >= -0.05 ? Math.max(diff, 0) : r.rainfall;
    }
    if (r.rainfall != null) prev = r;
    return { ...r, inc };
  });
}

// Group readings into one-hour buckets. A reading stamped exactly on the hour
// (e.g. 11:00) closes the 10:00–11:00 bucket.
function aggregateHourly(rows, fromT = -Infinity, fill = false) {
  const map = new Map();
  withIncrements(rows).forEach((r) => {
    if (r.t == null) return;
    const start = hourStart(r.t - 1);
    let b = map.get(start);
    if (!b) {
      b = { start, end: start + HOUR_MS, rain: null, temps: [], hums: [], count: 0 };
      map.set(start, b);
    }
    if (r.inc != null) b.rain = (b.rain ?? 0) + r.inc;
    if (validClimate(r)) {
      if (r.temperature != null) b.temps.push(r.temperature);
      if (r.humidity != null) b.hums.push(r.humidity);
    }
    b.count += 1;
  });

  let list = [...map.values()].filter((b) => b.end > fromT).sort((a, b) => a.start - b.start);

  if (fill && list.length > 1) {
    const filled = [];
    for (let t = list[0].start, i = 0; t <= list[list.length - 1].start; t += HOUR_MS) {
      if (list[i]?.start === t) filled.push(list[i++]);
      else filled.push({ start: t, end: t + HOUR_MS, rain: null, temps: [], hums: [], count: 0 });
    }
    list = filled;
  }

  return list.map((b) => ({
    start: b.start,
    end: b.end,
    label: hourLabel(b.start),
    rain: round1(b.rain),
    tAvg: round1(mean(b.temps)),
    hAvg: round1(mean(b.hums)),
    count: b.count,
  }));
}

// ---------- Combined chart ----------
const SERIES = [
  { key: 'rain', label: 'Rainfall', unit: 'mm', color: '#0284c7', digits: 1 },
  { key: 'temp', label: 'Temperature', unit: '°C', color: '#ea580c', digits: 1 },
  { key: 'hum', label: 'Humidity', unit: '%', color: '#059669', digits: 0 },
];
const SERIES_BY_KEY = Object.fromEntries(SERIES.map(s => [s.key, s]));

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const rows = SERIES.filter(s => payload.some(p => p.dataKey === s.key));
  return (
    <div className="arg-tip">
      <div className="arg-tip-title">{point.range}</div>
      {point.partial && <div className="arg-tip-note">Hour in progress</div>}
      {rows.map(s => (
        <div key={s.key} className="arg-tip-row">
          <span className="arg-tip-swatch" style={{ background: s.color }} />
          <span className="arg-tip-label">{s.label}</span>
          <span className="arg-tip-value">
            {point[s.key] == null ? '--' : `${Number(point[s.key]).toFixed(s.digits)} ${s.unit}`}
          </span>
        </div>
      ))}
    </div>
  );
};

// Rain axis: round tick steps with ~15% headroom above the wettest hour
const RAIN_STEPS = [0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100];
function rainAxis(maxRain) {
  const target = Math.max(maxRain || 0, 0.1) * 1.15;
  const step = RAIN_STEPS.find(s => s * 4 >= target) || Math.ceil(target / 4);
  return { max: step * 4, ticks: [0, step, step * 2, step * 3, step * 4] };
}

// Sensor sends -39 °C when the temperature/humidity probe is faulty
const validClimate = (r) => r.temperature == null || r.temperature > -39;

const toNumOrNull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const ArgMonitoring = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const station = findStation(searchParams.get('station') || DEFAULT_STATION);
  const stationId = station.id;
  const requestSeq = useRef(0); // ignore replies that arrive after a station/range switch

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(6);
  const [countdown, setCountdown] = useState(REFRESH_SECONDS);
  const [ageSec, setAgeSec] = useState(null);
  const [page, setPage] = useState(1);
  const [visible, setVisible] = useState({ rain: true, temp: true, hum: true });

  // Toggle a series on/off, but always keep at least one visible
  const toggleSeries = (key) => setVisible(v => {
    const next = { ...v, [key]: !v[key] };
    return Object.values(next).some(Boolean) ? next : v;
  });

  // Download-key dialog
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchData = useCallback(async () => {
    const seq = ++requestSeq.current;
    try {
      // One extra hour so the first hour in range has a previous reading
      // to compute its rainfall increment from (same as App.jsx).
      const response = await fetch(
        `${API_BASE_URL}/api/weather/arg-realtime?station=${stationId}&hours=${hours + 1}`
      );
      const result = await response.json();
      if (seq !== requestSeq.current) return; // a newer request has started
      if (!response.ok) throw new Error(result.error || 'Failed to fetch ARG data');
      setData(result);
      setAgeSec(result.last_received_age_sec);
      setError(null);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      console.error('ARG realtime error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
        setCountdown(REFRESH_SECONDS);
      }
    }
  }, [hours, stationId]);

  // Switching station: drop the old station's data so it never shows under the new name
  useEffect(() => {
    setData(null);
    setError(null);
  }, [stationId]);

  const selectStation = (id) => {
    if (id === stationId) return;
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('station', id);
      return next;
    }, { replace: true });
  };

  // Load on start and whenever the range changes
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // 1-second ticker: countdown to next refresh + "last received" age
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          fetchData();
          return REFRESH_SECONDS;
        }
        return c - 1;
      });
      setAgeSec(a => (a === null || a === undefined ? a : a + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Raw readings with numeric time + values, oldest first
  const readings = useMemo(() => (
    (data?.data || [])
      .map(r => ({
        ...r,
        t: toMs(r.timestamp),
        rainfall: toNumOrNull(r.rainfall),
        temperature: toNumOrNull(r.temperature),
        humidity: toNumOrNull(r.humidity),
      }))
      .filter(r => r.t != null)
      .sort((a, b) => a.t - b.t)
  ), [data]);

  const lastT = readings.length ? readings[readings.length - 1].t : null;
  const fromT = lastT != null ? lastT - hours * HOUR_MS : -Infinity;

  const inRange = useMemo(() => readings.filter(r => r.t >= fromT), [readings, fromT]);

  // Hourly buckets (includes the current, still-running hour)
  const hourly = useMemo(() => aggregateHourly(readings, fromT, true), [readings, fromT]);
  const lastHourRain = hourly.length ? hourly[hourly.length - 1].rain : null;

  // Combined chart: one point per hour (rain total, avg temp, avg humidity)
  const comboData = useMemo(() => hourly.map(b => ({
    x: hours > 24
      ? `${shortDayFmt.format(b.start)} ${shortHourFmt.format(b.start)}`
      : shortHourFmt.format(b.start),
    range: b.label,
    partial: lastT != null && b.end > lastT,
    rain: b.rain,
    temp: b.tAvg,
    hum: b.hAvg,
  })), [hourly, hours, lastT]);

  const rainScale = useMemo(
    () => rainAxis(Math.max(0, ...hourly.map(b => b.rain ?? 0))),
    [hourly]
  );

  const totalRain = hourly.reduce((sum, b) => sum + (b.rain ?? 0), 0);

  // Summary for the selected range
  const stats = useMemo(() => {
    const climate = inRange.filter(validClimate);
    const temps = climate.map(r => r.temperature).filter(v => v != null);
    const hums = climate.map(r => r.humidity).filter(v => v != null);
    const withRain = hourly.filter(b => b.rain != null);
    const peak = withRain.reduce((best, b) => (best == null || b.rain > best.rain ? b : best), null);
    return {
      peak,
      rainyHours: withRain.filter(b => b.rain > 0).length,
      hoursWithData: withRain.length,
      tMin: temps.length ? Math.min(...temps) : null,
      tMax: temps.length ? Math.max(...temps) : null,
      hAvg: mean(hums),
    };
  }, [inRange, hourly]);

  // ---- Table: completed hours only, newest first ----
  const tableRows = useMemo(
    () => hourly.filter(b => lastT != null && b.end <= lastT).reverse(),
    [hourly, lastT]
  );
  const totalPages = Math.max(1, Math.ceil(tableRows.length / PAGE_SIZE));

  // Go back to page 1 when the time range changes
  useEffect(() => { setPage(1); }, [hours, stationId]);

  // Keep the page valid if the number of rows shrinks after a refresh
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = tableRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const firstRowNo = tableRows.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastRowNo = Math.min(page * PAGE_SIZE, tableRows.length);

  // Page numbers to show: 1 … 4 5 [6] 7 8 … 20
  const pageNumbers = useMemo(() => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    if (start > 1) pages.push(1);
    if (start > 2) pages.push('…start');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages - 1) pages.push('…end');
    if (end < totalPages) pages.push(totalPages);
    return pages;
  }, [page, totalPages]);

  const latest = data?.latest;
  const online = data?.status === 'ONLINE';
  const summary = data?.summary || {};

  // ---- Protected CSV download ----
  // The key is checked by the backend (/api/weather/arg-download/), never in this file.
  const openKeyModal = () => {
    setKeyInput('');
    setKeyError('');
    setShowKeyModal(true);
  };

  const closeKeyModal = useCallback(() => {
    if (downloading) return;
    setShowKeyModal(false);
    setKeyInput('');
    setKeyError('');
  }, [downloading]);

  // Close the dialog with Esc
  useEffect(() => {
    if (!showKeyModal) return;
    const onKey = (e) => { if (e.key === 'Escape') closeKeyModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showKeyModal, closeKeyModal]);

  const handleKeySubmit = async (e) => {
    e.preventDefault();
    const key = keyInput.trim();
    if (!key) return;

    setDownloading(true);
    setKeyError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/weather/arg-download/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, station: stationId, hours })
      });

      if (!response.ok) {
        let message = 'Download failed. Please try again.';
        try {
          const err = await response.json();
          if (err?.error) message = err.error;
        } catch (_) { /* not JSON */ }
        if (response.status === 401) message = 'Incorrect download key.';
        setKeyError(message);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${stationId}_${station.name}_${hours}h.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setShowKeyModal(false);
      setKeyInput('');
    } catch (err) {
      console.error('ARG download error:', err);
      setKeyError('Could not reach the server. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const rangeLabel = RANGES.find(r => r.hours === hours)?.label || `${hours} hours`;

  return (
    <div className="arg-page">
      {/* Top bar */}
      <header className="arg-topbar">
        <div className="arg-topbar-inner">
          <button className="arg-back" onClick={() => navigate('/weather-home')}>
            <i className="fas fa-arrow-left"></i> Home
          </button>

          <div className="arg-title">
            <h1>
              <i className="fas fa-cloud-rain"></i>{" "}
              Automatic Rain Gauge Network
            </h1>
            <p>
              Stations at Illithode and Kuttampuzha track rainfall to support
              river-flow assessment and flood preparedness in Kalady.
            </p>
          </div>
        </div>
      </header>

      <main className="arg-main">
        {/* Station switcher */}
        <div className="arg-stations" role="tablist" aria-label="Rain gauge station">
          {STATIONS.map(s => (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === stationId}
              className={`arg-station-tab ${s.id === stationId ? 'active' : ''}`}
              onClick={() => selectStation(s.id)}
            >
              <span className="arg-station-num">{s.number}</span>
              <span className="arg-station-text">
                <strong>{s.name}</strong>
                <small>Station {s.number} · {s.id}</small>
              </span>
            </button>
          ))}
        </div>

        {/* Live info bar */}
        <div className="arg-livebar">
          <div>
            <i className="fas fa-broadcast-tower"></i> {station.name} ({stationId})
            {latest && <> · Reading time <strong>{fmtDateTime(latest.timestamp)}</strong></>}
          </div>
        </div>

        {error && (
          <div className="arg-alert error">
            <i className="fas fa-exclamation-triangle"></i> {error}
          </div>
        )}
        {loading && !data ? (
          <div className="arg-empty">Loading live data...</div>
        ) : !data ? (
          <div className="arg-empty">No data available.</div>
        ) : (
          <>
            {/* KPI cards */}
            <section className="arg-kpis">
              <div className="arg-kpi rain">
                <div className="arg-kpi-icon"><i className="fas fa-cloud-showers-heavy"></i></div>
                <div>
                  <div className="arg-kpi-label">Rainfall (RFD)</div>
                  <div className="arg-kpi-value">{fmtVal(latest?.rainfall)}<span> mm</span></div>
                  <div className="arg-kpi-sub">
                    {lastHourRain != null ? `${fmtNum(lastHourRain)} mm this hour` : 'Accumulated'}
                  </div>
                </div>
              </div>
              <div className="arg-kpi temp">
                <div className="arg-kpi-icon"><i className="fas fa-thermometer-half"></i></div>
                <div>
                  <div className="arg-kpi-label">Temperature</div>
                  <div className="arg-kpi-value">
                    {fmtVal(latest?.temperature)}<span> °C</span>
                  </div>
                </div>
              </div>
              <div className="arg-kpi hum">
                <div className="arg-kpi-icon"><i className="fas fa-tint"></i></div>
                <div>
                  <div className="arg-kpi-label">Humidity</div>
                  <div className="arg-kpi-value">
                    {fmtVal(latest?.humidity)}<span> %</span>
                  </div>
                </div>
              </div>
              <div className="arg-kpi count">
                <div className="arg-kpi-icon"><i className="fas fa-database"></i></div>
                <div>
                  <div className="arg-kpi-label">Total Rainfall</div>
                  <div className="arg-kpi-value">{fmtNum(totalRain)}<span> mm</span></div>
                  <div className="arg-kpi-sub">{inRange.length} readings in selected range</div>
                </div>
              </div>
            </section>

            {/* Combined hourly chart */}
            <section className="arg-panel">
              <div className="arg-panel-head">
                <div>
                  <h3>Rainfall, temperature &amp; humidity</h3>
                  <p>Hourly · {station.name} ({stationId}) · last {rangeLabel.toLowerCase()}</p>
                </div>
                <div className="arg-panel-actions">
                  <div className="arg-ranges" role="group" aria-label="Time range">
                    {RANGES.map(r => (
                      <button
                        key={r.hours}
                        className={hours === r.hours ? 'active' : ''}
                        aria-pressed={hours === r.hours}
                        onClick={() => setHours(r.hours)}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <button className="arg-download" onClick={openKeyModal} disabled={!readings.length}>
                    <i className="fas fa-lock"></i> Download CSV
                  </button>
                </div>
              </div>

              <div className="arg-panel-stats">
                <div>
                  <span>Total rainfall</span>
                  <strong>{fmtNum(totalRain)} <small>mm</small></strong>
                  <em>{stats.rainyHours} of {stats.hoursWithData} hours with rain</em>
                </div>
                {/* <div>
                  <span>Wettest hour</span>
                  <strong>{stats.peak ? fmtNum(stats.peak.rain) : '--'} <small>mm</small></strong>
                  <em>{stats.peak && stats.peak.rain > 0
                      ? `${shortDayFmt.format(stats.peak.start)}, ${hourFmtIN.format(stats.peak.start)} – ${hourFmtIN.format(stats.peak.end)}`
                      : 'No rain recorded'}</em>
                </div> */}
                <div>
                  <span>Temperature</span>
                  <strong>
                    {stats.tMin == null ? '--' : `${fmtNum(stats.tMin)} – ${fmtNum(stats.tMax)}`} <small>°C</small>
                  </strong>
                  <em>Min – max in range</em>
                </div>
                <div>
                  <span>Avg humidity</span>
                  <strong>{fmtNum(stats.hAvg, 0)} <small>%</small></strong>
                  <em>{inRange.length} readings</em>
                </div>
              </div>

              <div className="arg-chart-bar">
                <div className="arg-legend" role="group" aria-label="Show or hide series">
                  {SERIES.map(s => (
                    <button
                      key={s.key}
                      className={`arg-legend-chip ${visible[s.key] ? 'on' : ''}`}
                      aria-pressed={visible[s.key]}
                      onClick={() => toggleSeries(s.key)}
                      style={{ '--chip': s.color }}
                    >
                      <span className={`arg-legend-mark ${s.key}`} />
                      {s.label} <small>({s.unit})</small>
                    </button>
                  ))}
                </div>
                <div className="arg-axis-caps">
                  {visible.rain && <span>Left axis: rain (mm)</span>}
                  {visible.temp && <span>Right axis: temp (°C)</span>}
                </div>
              </div>

              <div className="arg-combo-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={comboData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="argRainFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={SERIES_BY_KEY.rain.color} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={SERIES_BY_KEY.rain.color} stopOpacity={0.55} />
                      </linearGradient>
                      <linearGradient id="argHumFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={SERIES_BY_KEY.hum.color} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={SERIES_BY_KEY.hum.color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="x" fontSize={11} stroke="#94a3b8" tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }} minTickGap={hours > 24 ? 48 : 24}
                    />
                    <YAxis
                      yAxisId="rain" orientation="left" hide={!visible.rain}
                      fontSize={11} stroke="#94a3b8" tickLine={false} axisLine={false} width={40}
                      domain={[0, rainScale.max]} ticks={rainScale.ticks} allowDecimals
                    />
                    <YAxis
                      yAxisId="temp" orientation="right" hide={!visible.temp}
                      fontSize={11} stroke="#94a3b8" tickLine={false} axisLine={false} width={36}
                      domain={[(min) => Math.floor(min - 1), (max) => Math.ceil(max + 1)]}
                      allowDecimals={false}
                    />
                    <YAxis yAxisId="hum" hide domain={[0, 100]} />

                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />

                    {visible.hum && (
                      <Area
                        yAxisId="hum" type="monotone" dataKey="hum" name="Humidity"
                        stroke={SERIES_BY_KEY.hum.color} strokeWidth={1.5} strokeDasharray="4 3"
                        fill="url(#argHumFill)" connectNulls={false} isAnimationActive={false}
                        dot={false} activeDot={{ r: 3 }}
                      />
                    )}
                    {visible.rain && (
                      <Bar
                        yAxisId="rain" dataKey="rain" name="Rainfall" fill="url(#argRainFill)"
                        radius={[3, 3, 0, 0]} maxBarSize={18} isAnimationActive={false}
                      >
                        {comboData.map(d => (
                          <Cell key={d.range} fillOpacity={d.partial ? 0.45 : 1} />
                        ))}
                      </Bar>
                    )}
                    {visible.temp && (
                      <Line
                        yAxisId="temp" type="monotone" dataKey="temp" name="Temperature"
                        stroke={SERIES_BY_KEY.temp.color} strokeWidth={2.25}
                        dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls={false} isAnimationActive={false}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="arg-chart-note">
              </p>
            </section>

            {/* Hourly table */}
            <section className="arg-table-card">
              <h3><i className="fas fa-list"></i> Hourly Readings</h3>
              <div className="arg-table-wrap">
                <table className="arg-table">
                  <thead>
                    <tr>
                      <th>Hour</th>
                      <th>Station</th>
                      <th>Rain in hour (mm)</th>
                      <th>Avg Temp (°C)</th>
                      <th>Avg RH (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>
                          No completed hours in this range yet
                        </td>
                      </tr>
                    ) : (
                      pageRows.map((r, i) => {
                        const isNewest = page === 1 && i === 0;
                        return (
                          <tr key={r.start} className={isNewest ? 'newest' : ''}>
                            <td>{r.label} {isNewest && <span className="arg-new">LATEST</span>}</td>
                            <td>{stationId}</td>
                            <td>{fmtNum(r.rain)}</td>
                            <td>{fmtNum(r.tAvg)}</td>
                            <td>{fmtNum(r.hAvg, 0)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {tableRows.length > 0 && (
                <div className="arg-pagination">
                  <div className="arg-page-info">
                    Showing <strong>{firstRowNo}–{lastRowNo}</strong> of <strong>{tableRows.length}</strong> hours
                  </div>
                  <div className="arg-page-controls">
                    <button onClick={() => setPage(1)} disabled={page === 1} title="First page">
                      <i className="fas fa-angle-double-left"></i>
                    </button>
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 1} title="Previous page">
                      <i className="fas fa-angle-left"></i> Prev
                    </button>

                    {pageNumbers.map(p =>
                      typeof p === 'number' ? (
                        <button
                          key={p}
                          className={p === page ? 'active' : ''}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      ) : (
                        <span key={p} className="arg-page-gap">…</span>
                      )
                    )}

                    <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} title="Next page">
                      Next <i className="fas fa-angle-right"></i>
                    </button>
                    <button onClick={() => setPage(totalPages)} disabled={page === totalPages} title="Last page">
                      <i className="fas fa-angle-double-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {/* Location + short map (bottom of page) */}
        <section className="arg-location arg-location-bottom">
          <div className="arg-location-info">
            <div className="arg-location-label"><i className="fas fa-map-marker-alt"></i> Station location</div>
            <h2>{station.name}</h2>
            <p className="arg-location-area">{station.area}, Kerala</p>
            <dl>
              <div><dt>Station ID</dt><dd>{stationId}</dd></div>
              {/* <div><dt>Latitude</dt><dd>{fmtCoord(station.lat, 'N', 'S')}</dd></div>
              <div><dt>Longitude</dt><dd>{fmtCoord(station.lon, 'E', 'W')}</dd></div> */}
            </dl>
            <a className="arg-location-link" href={gmapsUrl(station)} target="_blank" rel="noopener noreferrer">
              <i className="fas fa-external-link-alt"></i> Open in Google Maps
            </a>
          </div>
          <div className="arg-location-map">
            <iframe
              key={stationId}
              title={`Map of ${station.name} rain gauge`}
              src={osmEmbedUrl(station)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </main>

      {/* Download-key dialog */}
      {showKeyModal && (
        <div className="arg-modal-backdrop" onClick={closeKeyModal}>
          <form
            className="arg-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleKeySubmit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="arg-modal-title"
          >
            <div className="arg-modal-icon"><i className="fas fa-lock"></i></div>
            <h3 id="arg-modal-title">Download access</h3>
            <p>Enter the download key to export <strong>{rangeLabel}</strong> of {station.name} ({stationId}) data as CSV.</p>

            <input
              type="password"
              className={`arg-modal-input ${keyError ? 'has-error' : ''}`}
              placeholder="Download key"
              value={keyInput}
              onChange={(e) => { setKeyInput(e.target.value); setKeyError(''); }}
              autoComplete="off"
              autoFocus
              disabled={downloading}
            />

            {keyError && (
              <div className="arg-modal-error">
                <i className="fas fa-exclamation-circle"></i> {keyError}
              </div>
            )}

            <div className="arg-modal-actions">
              <button type="button" className="arg-modal-cancel" onClick={closeKeyModal} disabled={downloading}>
                Cancel
              </button>
              <button type="submit" className="arg-download" disabled={downloading || !keyInput.trim()}>
                {downloading
                  ? <><i className="fas fa-spinner fa-spin"></i> Checking...</>
                  : <><i className="fas fa-download"></i> Download</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ArgMonitoring;