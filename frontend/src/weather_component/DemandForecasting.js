import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Demandforecasting.css';

// Network Base Endpoint Configuration matching your system standards
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';

const REFRESH_SECONDS = 30;

// ─── ZONE / SECTION DICTIONARY ───
// Keys must match the node names in testbed/node_valve_demand.json
const ZONES = {
  Node1_Zone_Demand: { section: 'Section 1', node: 'region 1', color: '#ef4444' },
  Node2_Zone_Demand: { section: 'Section 1', node: 'region 2', color: '#3b82f6' },
  Node5_Zone_Demand: { section: 'Section 2', node: 'region 5', color: '#10b981' },
  Node7_Zone_Demand: { section: 'Section 3', node: 'region 7', color: '#f59e0b' },
};
const FALLBACK_COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

const zoneInfo = (key, index) => ZONES[key] || {
  section: 'System node',
  node: key.split('_')[0].replace(/(\D)(\d)/, '$1 $2'),
  color: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
};

const toNumber = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const fmtLitres = (v) => (v == null ? '--' : v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

// "2024-07-27 08:00:00" -> "27 Jul 2024, 08:00"
const fmtCycle = (ts) => {
  if (!ts || ts === 'N/A') return '--';
  const d = new Date(String(ts).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(ts);
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date}, ${time}`;
};

const fmtClock = (d) => (d ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '--');

const LINKS = [
  {
    href: 'https://aiiot.it.com/project/digital-water',
    icon: 'fa-project-diagram',
    color: '#2563eb',
    title: 'Digital Water Solution',
    text: 'Explore global system architecture',
  },
  {
    href: 'https://aiiot.it.com/product-details/distribution-net',
    icon: 'fa-network-wired',
    color: '#10b981',
    title: 'Distribution Network',
    text: 'Review network product details',
  },
];

const DemandForecasting = () => {
  const navigate = useNavigate();
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH_SECONDS);
  const requestSeq = useRef(0);

  const fetchLiveDemandData = useCallback(async () => {
    const seq = ++requestSeq.current;
    setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/weather/water-demand`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || `Server returned status: ${response.status}`);
      }
      if (!result.success) {
        throw new Error(result.error || 'Failed parsing live data arrays.');
      }
      if (seq !== requestSeq.current) return;
      setForecastData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      console.error('Error connecting to hydraulic telemetry stream:', err);
      setError(err.message || 'Failed connecting to real-time S3 telemetry streams.');
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
        setRefreshing(false);
        setCountdown(REFRESH_SECONDS);
      }
    }
  }, []);

  // Load once, then refresh every REFRESH_SECONDS (countdown shown in the status bar)
  useEffect(() => {
    fetchLiveDemandData();
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          fetchLiveDemandData();
          return REFRESH_SECONDS;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      clearInterval(timer);
      requestSeq.current += 1; // ignore any reply that lands after unmount
    };
  }, [fetchLiveDemandData]);

  // Zones with numeric values, share of total and the highest-demand zone
  const zones = useMemo(() => {
    const entries = Object.entries(forecastData?.demand || {});
    const list = entries.map(([key, raw], i) => ({ key, raw, value: toNumber(raw), ...zoneInfo(key, i) }));
    const total = list.reduce((sum, z) => sum + (z.value ?? 0), 0);
    const max = Math.max(0, ...list.map(z => z.value ?? 0));
    return list.map(z => ({
      ...z,
      share: total > 0 && z.value != null ? (z.value / total) * 100 : 0,
      isPeak: max > 0 && z.value === max,
    }));
  }, [forecastData]);

  const totalDemand = zones.reduce((sum, z) => sum + (z.value ?? 0), 0);
  const peakZone = zones.find(z => z.isPeak);
  const sectionCount = new Set(zones.map(z => z.section)).size;
  const hasData = forecastData != null;

  return (
    <div className="df-page">
      {/* ─── HERO ─── */}
      <header className="df-hero">
        <div
          className="df-hero-bg"
          aria-hidden="true"
          style={{ backgroundImage: "url('/sensor_modules/water-dist.jpg')" }}
        />
        <div className="df-hero-inner">
          <button className="df-back" onClick={() => navigate('/weather-home')}>
            <i className="fas fa-arrow-left"></i> Home
          </button>

          <div className="df-hero-main">
            <div className="df-eyebrow">
              <span className={`df-live-dot ${error ? 'is-stale' : ''}`} />
              {error && hasData ? 'Connection interrupted' : 'Live · Water distribution testbed'}
            </div>
            <h1>Real-time Hydraulic Demand Forecasting</h1>
            <p>
              Live operational data from the Artificial Intelligence Integrated Water
              Distribution system bed.
            </p>
            {/* signature element: telemetry waveform, echoes the sensor stream this page reads from */}
            <svg className="df-wave" viewBox="0 0 600 26" preserveAspectRatio="none" aria-hidden="true">
              <polyline
                points="0,13 40,13 55,4 70,22 85,13 130,13 145,7 160,19 175,13 260,13 275,2 292,24 310,13 600,13"
                fill="none" stroke="#38bdf8" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </header>

      <main className="df-main">
        {loading && !hasData ? (
          /* ─── LOADING ─── */
          <section className="df-panel df-loading" aria-busy="true">
            <div className="df-scanline"><span /></div>
            <div className="df-skeleton-grid">
              {[0, 1, 2].map(i => (
                <div key={i} className="df-skeleton">
                  <span className="df-sk df-sk-sm" />
                  <span className="df-sk df-sk-md" />
                  <span className="df-sk df-sk-lg" />
                  <span className="df-sk df-sk-bar" />
                </div>
              ))}
            </div>
            <p className="df-loading-text">Connecting to AWS S3 telemetry buffers…</p>
          </section>
        ) : error && !hasData ? (
          /* ─── FIRST LOAD FAILED ─── */
          <section className="df-error">
            <div className="df-error-icon"><i className="fas fa-exclamation-triangle"></i></div>
            <div>
              <h4>Operational telemetry offline</h4>
              <p className="df-mono">{error}</p>
              <button className="df-btn df-btn-danger" onClick={fetchLiveDemandData} disabled={refreshing}>
                <i className={`fas fa-redo ${refreshing ? 'fa-spin' : ''}`}></i>
                {refreshing ? 'Retrying…' : 'Retry telemetry fetch'}
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* Refresh failed but we still have the last good data */}
            {error && (
              <div className="df-alert" role="status">
                <i className="fas fa-exclamation-circle"></i>
                <span>Couldn't refresh ({error}). Showing data from {fmtClock(lastUpdated)}.</span>
              </div>
            )}

            {/* ─── STATUS BAR ─── */}
            <section className="df-statusbar">
              <div className="df-status-item">
                <i className="fas fa-satellite-dish"></i>
                <span>Forecast cycle</span>
                <strong className="df-mono">{fmtCycle(forecastData?.timestamp)}</strong>
              </div>
              <div className="df-status-item">
                <i className="far fa-clock"></i>
                <span>Updated</span>
                <strong className="df-mono">{fmtClock(lastUpdated)}</strong>
              </div>
              <div className="df-status-actions">
                {/* <span className="df-countdown">Next refresh in <b>{countdown}s</b></span>
                <button className="df-btn df-btn-ghost" onClick={fetchLiveDemandData} disabled={refreshing}>
                  <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i>
                  {refreshing ? 'Refreshing' : 'Refresh'}
                </button> */}
              </div>
            </section>

            {/* ─── SUMMARY ─── */}
            <section className="df-summary">
              <div className="df-stat">
                <div className="df-stat-icon" style={{ '--c': '#2563eb' }}><i className="fas fa-tint"></i></div>
                <div>
                  <span>Total demand</span>
                  <strong>{fmtLitres(totalDemand)} <small>L</small></strong>
                  {/* <em>Across all monitored zones</em> */}
                </div>
              </div>
              <div className="df-stat">
                <div className="df-stat-icon" style={{ '--c': peakZone?.color || '#64748b' }}><i className="fas fa-arrow-up"></i></div>
                <div>
                  <span>Highest demand</span>
                  <strong>{peakZone ? fmtLitres(peakZone.value) : '--'} <small>L</small></strong>
                  <em>{peakZone ? `${peakZone.section} · ${peakZone.node}` : 'No data'}</em>
                </div>
              </div>
              <div className="df-stat">
                <div className="df-stat-icon" style={{ '--c': '#0891b2' }}><i className="fas fa-map-marked-alt"></i></div>
                <div>
                  <span>Monitored zones</span>
                  <strong>{zones.length}</strong>
                  <em>{sectionCount} section{sectionCount === 1 ? '' : 's'}</em>
                </div>
              </div>
              <div className="df-stat">
                <div className="df-stat-icon" style={{ '--c': error ? '#d97706' : '#059669' }}>
                  <i className={`fas ${error ? 'fa-exclamation' : 'fa-check'}`}></i>
                </div>
                <div>
                  <span>Telemetry</span>
                  <strong className={error ? 'df-text-warn' : 'df-text-ok'}>{error ? 'Stale' : 'Live'}</strong>
                  {/* <em>Auto-refresh every {REFRESH_SECONDS}s from S3</em> */}
                </div>
              </div>
            </section>

            {/* ─── ZONE DEMAND ─── */}
            <section className="df-panel">
              <div className="df-panel-head">
                <div>
                  <h3>Zone demand</h3>
                  <p>Forecast water demand per distribution zone, in litres</p>
                </div>
              </div>

              {zones.length === 0 ? (
                <p className="df-empty">No node matrices populated for this parsing sequence.</p>
              ) : (
                <>
                  <div className="df-zones">
                    {zones.map(z => (
                      <article key={z.key} className="df-zone" style={{ '--zone': z.color }}>
                        <div className="df-zone-head">
                          <div>
                            <span className="df-zone-section">{z.section}</span>
                            <h4>Zone ID: {z.node}</h4>
                          </div>
                          <span className="df-zone-tag df-mono">{z.key.split('_')[0]}</span>
                        </div>

                        <div className="df-zone-body">
                          <div className="df-zone-value">
                            <strong>{z.value == null ? String(z.raw ?? '--') : fmtLitres(z.value)}</strong>
                            <span>L</span>
                            {z.isPeak && zones.length > 1 && <em className="df-peak">Highest</em>}
                          </div>

                          <div className="df-zone-share">
                            <div className="df-zone-share-row">
                              <span>Share of total demand</span>
                              <b>{z.share.toFixed(1)}%</b>
                            </div>
                            <div className="df-meter" role="img" aria-label={`${z.share.toFixed(1)} percent of total demand`}>
                              <i style={{ width: `${Math.max(z.share, 2)}%` }} />
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* Distribution across zones */}
                  {/* {totalDemand > 0 && (
                    <div className="df-dist">
                      <div className="df-dist-head">
                        <span>Demand distribution</span>
                        <b className="df-mono">{fmtLitres(totalDemand)} L total</b>
                      </div>
                      <div className="df-dist-bar">
                        {zones.filter(z => z.share > 0).map(z => (
                          <span
                            key={z.key}
                            style={{ width: `${z.share}%`, background: z.color }}
                            title={`${z.node}: ${fmtLitres(z.value)} L (${z.share.toFixed(1)}%)`}
                          />
                        ))}
                      </div>
                      <ul className="df-dist-legend">
                        {zones.map(z => (
                          <li key={z.key}>
                            <i style={{ background: z.color }} />
                            {z.node} <small>{z.section}</small>
                            <b className="df-mono">{z.share.toFixed(1)}%</b>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )} */}
                </>
              )}
            </section>

            {/* ─── EXTERNAL LINKS ─── */}
            <section className="df-links">
              {LINKS.map(l => (
                <a key={l.href} className="df-link" href={l.href} target="_blank" rel="noopener noreferrer" style={{ '--c': l.color }}>
                  <div className="df-link-icon"><i className={`fas ${l.icon}`}></i></div>
                  <div className="df-link-text">
                    <h4>{l.title}</h4>
                    <span>{l.text}</span>
                  </div>
                  <i className="fas fa-arrow-right df-link-arrow"></i>
                </a>
              ))}
            </section>

            {/* ─── ABOUT ─── */}
            <section className="df-about">
              <div className="df-about-icon"><i className="fas fa-info-circle"></i></div>
              <div>
                <h4>Distribution system status</h4>
                <p>
                  This system provides real-time water demand monitoring across the three wards
                  to support efficient water distribution and supply management.
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default DemandForecasting;