import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Riverdata.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000');

const WATER_LEVEL_FILE = 'hourly_averages/STA_01_MASTER_LOG.csv';
const POLL_MS = 30_000;

export default function Riverdata() {
  const navigate = useNavigate();
  const [latest,    setLatest]    = useState(null);
  const [status,    setStatus]    = useState('idle');
  const [error,     setError]     = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [countdown, setCountdown] = useState(POLL_MS / 1000);
  const [updated,   setUpdated]   = useState(false);
  const cdRef   = useRef(null);
  const prevKey = useRef(null);

  const fetchData = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/weather/debug-read-s3?file=${encodeURIComponent(WATER_LEVEL_FILE)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const row = data.latest || null;
      if (row) {
        if (row['Update_Timestamp'] !== prevKey.current) {
          prevKey.current = row['Update_Timestamp'];
          setUpdated(true);
          setTimeout(() => setUpdated(false), 1800);
        }
        setLatest(row);
      } else {
        throw new Error(data.error || 'No latest data available');
      }
      setLastFetch(new Date());
      setStatus('ok');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
    setCountdown(POLL_MS / 1000);
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, POLL_MS);
    return () => clearInterval(t);
  }, [fetchData]);

  useEffect(() => {
    cdRef.current = setInterval(
      () => setCountdown(c => (c > 0 ? c - 1 : POLL_MS / 1000)), 1000
    );
    return () => clearInterval(cdRef.current);
  }, []);

  const SM = {
    idle:    { label: 'Initialising', color: '#778ca3' },
    loading: { label: 'Syncing...',   color: '#ffd43b' },
    ok:      { label: 'Live',         color: '#51cf66' },
    error:   { label: 'Error',        color: '#ff6b6b' },
  }[status];

  const syncPct = ((POLL_MS / 1000 - countdown) / (POLL_MS / 1000)) * 100;
  const wl  = latest ? parseFloat(latest['WL(m)'])  : null;

  return (
    <div className="rdb-root">

      {/* TOPBAR */}
      <div className="rdb-topbar">
        <button className="rdb-back-btn" onClick={() => navigate('/weather-home')}>
          <span className="rdb-back-arrow">←</span>
          Weather Home
        </button>
        <div className="rdb-topbar-center">
          <span className="rdb-wave-icon">~</span>
          <div>
            <h1 className="rdb-title">REAL-TIME WATER LEVEL MONITORING</h1>
            <p className="rdb-subtitle">Periyar River · Station STA_01 · Kalady, Kerala</p>
          </div>
        </div>
        <div className="rdb-topbar-right">
          <div className="rdb-live-badge" style={{ '--sc': SM.color }}>
            <span className="rdb-live-dot" />
            <span className="rdb-live-label">{SM.label}</span>
          </div>
          <button className="rdb-refresh-btn" onClick={fetchData} title="Refresh">&#8635;</button>
        </div>
      </div>

      {/* SYNC BAR */}
      {status === 'ok' && (
        <div className="rdb-syncbar">
          <div className="rdb-syncbar-fill" style={{ width: `${syncPct}%` }} />
          <span className="rdb-syncbar-label">Auto-refresh in {countdown}s</span>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="rdb-error-banner">
          ⚠ {error}
          <span className="rdb-error-hint"> — Check S3 CORS policy for this origin.</span>
        </div>
      )}

      {/* LOADING */}
      {status === 'loading' && !latest && (
        <div className="rdb-empty">
          <span className="rdb-spinner">⟳</span> Fetching latest data from S3...
        </div>
      )}

      {/* MAIN DATA */}
      {latest && (
        <div className={`rdb-live-container${updated ? ' rdb-live-container--flash' : ''}`}>

          {/* TIMESTAMP BANNER */}
          <div className="rdb-timestamp-banner">
            <div className="rdb-ts-left">
              <span className="rdb-ts-icon">&#128336;</span>
              <div>
                <span className="rdb-ts-label">LAST UPDATED</span>
                <span className="rdb-ts-value">{latest['Update_Timestamp']}</span>
              </div>
            </div>
            {lastFetch && (
              <span className="rdb-ts-fetched">
                Synced at {lastFetch.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </span>
            )}
          </div>

          {/* DATA CARDS */}
          <div className="rdb-live-cards">

            <div className="rdb-live-card rdb-live-card--wl">
              <div className="rdb-lc-icon">&#127754;</div>
              <div className="rdb-lc-label">WATER LEVEL</div>
              <div className="rdb-lc-value" style={{ color: '#3b7d54' }}>
                {!isNaN(wl) ? wl.toFixed(4) : '—'}
                <span className="rdb-lc-unit"> m</span>
              </div>
              <div className="rdb-lc-sublabel">Latest river reading</div>
            </div>

            {/* <div className="rdb-live-card rdb-live-card--alt">
              <div className="rdb-lc-icon">&#9968;</div>
              <div className="rdb-lc-label">ALTITUDE</div>
              <div className="rdb-lc-value" style={{ color: '#ffd43b' }}>
                {!isNaN(alt) ? alt.toFixed(4) : '—'}
                <span className="rdb-lc-unit"> m</span>
              </div>
              <div className="rdb-lc-sublabel">Above sea level</div>
            </div>

            <div className="rdb-live-card rdb-live-card--lon">
              <div className="rdb-lc-icon">&#128205;</div>
              <div className="rdb-lc-label">LONGITUDE</div>
              <div className="rdb-lc-value" style={{ color: '#cc5de8' }}>
                {!isNaN(lon) ? lon.toFixed(6) : '—'}
                <span className="rdb-lc-unit"> °D</span>
              </div>
              <div className="rdb-lc-sublabel">Station coordinates</div>
            </div> */}

          </div>

          {/* INFO STRIP */}
          {/* <div className="rdb-info-strip">
            <span className="rdb-info-item">&#128225; Station: STA_01</span>
            <span className="rdb-info-divider">|</span>
            <span className="rdb-info-item">&#128260; S3 Source: {BUCKET}</span>
            <span className="rdb-info-divider">|</span>
            <span className="rdb-info-item">&#127760; Region: {REGION}</span>
            <span className="rdb-info-divider">|</span>
            <span className="rdb-info-item">&#8987; Interval: 30 s</span>
          </div> */}

        </div>
      )}

      {/* FOOTER */}
      <div className="rdb-footer">
        <span>Latest river data • refreshed every 30s</span>
        {lastFetch && (
          <span>Last synced: {lastFetch.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
        )}
        <button className="rdb-footer-home-btn" onClick={() => navigate('/weather-home')}>
          ← Weather Home
        </button>
      </div>

    </div>
  );
}