import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import './ArgMonitoring.css';

// --- API CONFIGURATION ---
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';

const STATION_ID = 'ARGS1';
const STATION_NAME = 'ARGDL1';
const STATION_LOCATION = 'Kalady, Kerala (10.1766° N, 76.4257° E)';
const REFRESH_SECONDS = 30;
const PAGE_SIZE = 10; // readings per table page

// Minutes to add to the logger timestamp before display.
// 0 = show as recorded. Set to 330 if the logger clock is UTC and you want IST.
const TIME_OFFSET_MIN = 0;

const RANGES = [
  { hours: 6, label: '6 Hours' },
  { hours: 24, label: '24 Hours' },
  { hours: 72, label: '3 Days' },
  { hours: 168, label: '7 Days' }
];

const toDate = (ts) => {
  const d = new Date(ts);
  if (isNaN(d)) return null;
  d.setMinutes(d.getMinutes() + TIME_OFFSET_MIN);
  return d;
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

const ArgMonitoring = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(6);
  const [countdown, setCountdown] = useState(REFRESH_SECONDS);
  const [ageSec, setAgeSec] = useState(null);
  const [page, setPage] = useState(1);

  // Download-key dialog
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/weather/arg-realtime?station=${STATION_ID}&hours=${hours}`
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch ARG data');
      setData(result);
      setAgeSec(result.last_received_age_sec);
      setError(null);
    } catch (err) {
      console.error('ARG realtime error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setCountdown(REFRESH_SECONDS);
    }
  }, [hours]);

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

  const rows = useMemo(() => (data?.data || []), [data]);

  const chartData = useMemo(() => {
    const step = Math.max(1, Math.ceil(rows.length / 96));
    return rows
      .filter((_, i) => i % step === 0 || i === rows.length - 1)
      .map(r => ({
        ...r,
        label: hours > 24 ? fmtDateTime(r.timestamp) : fmtTime(r.timestamp)
      }));
  }, [rows, hours]);

  // ---- Table pagination (newest first, 10 per page) ----
  const tableRows = useMemo(() => [...rows].reverse(), [rows]);
  const totalPages = Math.max(1, Math.ceil(tableRows.length / PAGE_SIZE));

  // Go back to page 1 when the time range changes
  useEffect(() => { setPage(1); }, [hours]);

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
        body: JSON.stringify({ key, station: STATION_ID, hours })
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
      a.download = `${STATION_ID}_${hours}h.csv`;
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
        Automatic Rain Gauge  Network
      </h1>

      <p>
        Stations at Illithode and Kuttampuzha track rainfall to support
        river-flow assessment and flood preparedness in Kalady.
      </p>

      {/* <p>
        IMD-compliant · Proposed with the Forest Department and DDMA
        · Provisional sanction received · Civil works completed
      </p> */}
    </div>
  </div>
</header>


      <main className="arg-main">
        {/* Live info bar */}
        <div className="arg-livebar">
          <div>
            
            
            {latest && <> Reading time <strong>{fmtDateTime(latest.timestamp)}</strong></>}
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
                  <div className="arg-kpi-value">{fmtVal(latest.rainfall)}<span> mm</span></div>
                </div>
              </div>
              <div className="arg-kpi temp">
                <div className="arg-kpi-icon"><i className="fas fa-thermometer-half"></i></div>
                <div>
                  <div className="arg-kpi-label">Temperature</div>
                  <div className="arg-kpi-value">
                    {fmtVal(latest.temperature)}<span> °C</span>
                  </div>
                  
                </div>
              </div>
              <div className="arg-kpi hum">
                <div className="arg-kpi-icon"><i className="fas fa-tint"></i></div>
                <div>
                  <div className="arg-kpi-label">Humidity</div>
                  <div className="arg-kpi-value">
                    {fmtVal(latest.humidity)}<span> %</span>
                  </div>
                </div>
              </div>
              <div className="arg-kpi count">
                <div className="arg-kpi-icon"><i className="fas fa-database"></i></div>
                <div>
                  <div className="arg-kpi-label">Readings</div>
                  <div className="arg-kpi-value">{data.count}</div>
                  <div className="arg-kpi-sub">in selected range</div>
                </div>
              </div>
            </section>

            {/* Range selector */}
            <div className="arg-toolbar">
              <div className="arg-ranges">
                {RANGES.map(r => (
                  <button
                    key={r.hours}
                    className={hours === r.hours ? 'active' : ''}
                    onClick={() => setHours(r.hours)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <button className="arg-download" onClick={openKeyModal} disabled={!rows.length}>
                <i className="fas fa-lock"></i> Download CSV
              </button>
            </div>

            {/* Charts */}
            <section className="arg-charts">
              <div className="arg-chart wide">
                <h3><i className="fas fa-cloud-rain"></i> Rainfall (mm)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" fontSize={11} stroke="#64748b" minTickGap={30} />
                    <YAxis fontSize={11} stroke="#64748b" allowDecimals />
                    <Tooltip />
                    <Bar dataKey="rainfall" name="Rainfall (mm)" fill="#0284c7" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="arg-chart">
                <h3><i className="fas fa-thermometer-half"></i> Temperature (°C)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" fontSize={11} stroke="#64748b" minTickGap={30} />
                    <YAxis fontSize={11} stroke="#64748b" domain={['auto', 'auto']} />
                    <Tooltip />
                    <Line type="monotone" dataKey="temperature" name="Temperature (°C)"
                      stroke="#ea580c" strokeWidth={2} dot={false} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="arg-chart">
                <h3><i className="fas fa-tint"></i> Humidity (%)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" fontSize={11} stroke="#64748b" minTickGap={30} />
                    <YAxis fontSize={11} stroke="#64748b" domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="humidity" name="Humidity (%)"
                      stroke="#059669" strokeWidth={2} dot={false} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Table */}
            <section className="arg-table-card">
              <h3><i className="fas fa-list"></i> Latest Readings</h3>
              <div className="arg-table-wrap">
                <table className="arg-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Station</th>
                      <th>Rainfall (mm)</th>
                      <th>Temperature (°C)</th>
                      <th>Humidity (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r, i) => {
                      const isNewest = page === 1 && i === 0;
                      return (
                      <tr key={r.timestamp} className={isNewest ? 'newest' : ''}>
                        <td>{fmtDateTime(r.timestamp)} {isNewest && <span className="arg-new">LATEST</span>}</td>
                        <td>{r.id}</td>
                        <td>{fmtVal(r.rainfall)}</td>
                        <td>{fmtVal(r.temperature)}</td>
                        <td>{fmtVal(r.humidity)}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {tableRows.length > 0 && (
                <div className="arg-pagination">
                  <div className="arg-page-info">
                    Showing <strong>{firstRowNo}–{lastRowNo}</strong> of <strong>{tableRows.length}</strong> readings
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
            <p>Enter the download key to export <strong>{rangeLabel}</strong> of {STATION_ID} data as CSV.</p>

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