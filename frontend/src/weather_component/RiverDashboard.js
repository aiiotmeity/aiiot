import React, { useState, useEffect } from 'react';
import './RiverDashboard.css';

// ==========================================
// CONFIGURATION
// ==========================================
const DATA_BASE_URL = '.';
const CSV_FILE_NAME = 'forecast_outputs.csv';
const TXT_FILE_NAME = 'lime_short_sentences.txt';

// Alert Thresholds (Matching HTML logic)
const ALERT_THRESHOLDS = {
    NORMAL: 3.0,
    WATCH: 4.0,
    WARNING: 5.0
};

const RiverDashboard = () => {
    // State
    const [currentLevel, setCurrentLevel] = useState(0);
    const [forecastData, setForecastData] = useState([]); // Array of 6 hours
    const [limeDetails, setLimeDetails] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshCount, setRefreshCount] = useState(0);

    // --- Helpers ---
    const getAlertLevel = (level) => {
        if (level < ALERT_THRESHOLDS.NORMAL) return 'normal';
        if (level < ALERT_THRESHOLDS.WATCH) return 'watch';
        if (level < ALERT_THRESHOLDS.WARNING) return 'warning';
        return 'critical';
    };

    const getAlertMessage = (level, value) => {
        const valStr = value.toFixed(2);
        switch (level) {
            case 'normal': return `🟢 Water level ${valStr}m - River levels are currently normal.`;
            case 'watch': return `🟡 Water level ${valStr}m - ⚠️ WATCH ALERT: River levels are elevated.`;
            case 'warning': return `🟠 Water level ${valStr}m - 🚨 WARNING: Flooding is likely! Move to higher ground.`;
            case 'critical': return `🔴 Water level ${valStr}m - 🆘 CRITICAL FLOOD ALERT: Immediate evacuation may be required!`;
            default: return `Water level ${valStr}m`;
        }
    };

    const parseCSV = (csvText) => {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) return [];
        
        // Simple CSV parser assuming standard layout
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
                let rowObject = {};
                for (let j = 0; j < headers.length; j++) {
                    // Try to convert to number if possible
                    const val = values[j].trim();
                    rowObject[headers[j]] = isNaN(val) ? val : parseFloat(val);
                }
                data.push(rowObject);
            }
        }
        return data;
    };

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch Forecast CSV
            const csvResponse = await fetch(`${DATA_BASE_URL}/${CSV_FILE_NAME}`);
            if (!csvResponse.ok) throw new Error('Failed to load Forecast CSV');
            const csvText = await csvResponse.text();
            const fullData = parseCSV(csvText);

            // Logic to simulate Current + Forecast from CSV
            // Assuming the CSV has rows of predictions. 
            // We take the FIRST row's first numeric value as "Current" (or a specific column if you have one)
            // And subsequent rows/columns as forecast.
            
            // ADAPTATION: Mapping your CSV structure to the UI
            // If fullData has multiple rows, we treat row 0 as current, rows 1-6 as forecast
            if (fullData.length > 0) {
                // Find first numeric column to use as water level
                const keys = Object.keys(fullData[0]);
                const valueKey = keys.find(k => !isNaN(fullData[0][k])); 

                if (valueKey) {
                    const current = fullData[0][valueKey];
                    setCurrentLevel(current);
                    
                    // Create forecast array from subsequent rows or fake it if only 1 row
                    const nextRows = fullData.slice(1, 7);
                    const forecastValues = nextRows.map(row => row[valueKey]);
                    setForecastData(forecastValues);
                }
            }

            // 2. Fetch LIME Text
            const txtResponse = await fetch(`${DATA_BASE_URL}/${TXT_FILE_NAME}`);
            if (!txtResponse.ok) throw new Error('Failed to load LIME Text');
            const txtText = await txtResponse.text();
            setLimeDetails(txtText.split('\n').filter(line => line.trim() !== ''));

            setLastUpdated(new Date());
            setRefreshCount(prev => prev + 1);

        } catch (err) {
            console.error("Error:", err);
            setError("Unable to retrieve river data. Is the server running?");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Auto refresh every 30s
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // --- Render Helpers ---
    const alertLevel = getAlertLevel(currentLevel);
    const alertMessage = getAlertMessage(alertLevel, currentLevel);
    const nextHourValue = forecastData.length > 0 ? forecastData[0] : '--';

    if (isLoading && refreshCount === 0) {
        return (
            <div className="dashboard-wrapper">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <h2>Loading Periyar Monitor...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-wrapper">
                <div className="dashboard">
                    <div className="error-msg">⚠️ {error}</div>
                    <button className="refresh-btn" onClick={fetchData} style={{position:'static', marginTop: 20}}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-wrapper">
            {/* Auto Refresh Indicator */}
            <div className="auto-refresh-indicator">
                <span className="status-dot" style={{display:'inline-block', marginRight:'8px'}}></span>
                <span>Auto-refresh active</span>
            </div>

            <div className="dashboard">
                
                {/* Header */}
                <div className="header">
                    <h1>🌊 Kalady Periyar River Level</h1>
                    <p>Real-time monitoring with AI forecast</p>
                </div>

                {/* Safety Notice */}
                <div className="safety-notice">
                    <h3>⚠️ FLOOD ALERT SYSTEM ⚠️</h3>
                    <p>This is an automated river level monitoring system for public safety. Water levels can rise rapidly. Stay alert and follow official evacuation orders.</p>
                </div>

                {/* Dynamic Alert Banner */}
                <div className={`alert-banner ${alertLevel}`}>
                    <div id="alertMessage">{alertMessage}</div>
                </div>

                {/* Status Bar */}
                <div className="status-bar">
                    <div className="status-indicator">
                        <div className={`status-dot ${alertLevel === 'warning' || alertLevel === 'critical' ? 'alert' : ''}`}></div>
                        <span>System Active</span>
                    </div>
                    <div className="last-update">
                        Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '...'}
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="metrics-grid">
                    {/* Current Level Card */}
                    <div className={`metric-card water-level alert-${alertLevel}`}>
                        <div className="metric-header">
                            <div className="metric-title">Current Water Level</div>
                            <div className="metric-icon">💧</div>
                        </div>
                        <div className="metric-value">
                            {currentLevel.toFixed(2)}
                            <span className="metric-unit">mtrs</span>
                        </div>
                        <div className="metric-timestamp">
                            Live Reading
                        </div>
                    </div>

                    {/* Next Hour Forecast Card */}
                    {/* <div className="metric-card forecast">
                        <div className="metric-header">
                            <div className="metric-title">Next Hour Forecast</div>
                            <div className="metric-icon">🔮</div>
                        </div>
                        <div className="metric-value">
                            {typeof nextHourValue === 'number' ? nextHourValue.toFixed(2) : nextHourValue}
                            <span className="metric-unit">mtrs</span>
                        </div>
                        <div className="metric-timestamp">
                            AI Prediction
                        </div>
                    </div> */}
                </div>

                {/* 6-Hour Forecast Section */}
                <div className="forecast-section">
                    <div className="forecast-header">
                        <div className="forecast-title">📊 6-Hour Water Level Forecast</div>
                    </div>
                    <div className="forecast-values">
                        {forecastData.length > 0 ? (
                            forecastData.map((val, idx) => (
                                <div key={idx} className="forecast-item">
                                    <div className="forecast-time">+{idx + 1}hr</div>
                                    <div className="forecast-value">
                                        {typeof val === 'number' ? val.toFixed(2) : '--'} m
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{gridColumn: '1/-1', textAlign: 'center', color: '#7f8c8d'}}>
                                Insufficient forecast data available
                            </div>
                        )}
                    </div>
                </div>

                {/* LIME Analysis Section (Adapted to new design) */}
                <div className="forecast-section" style={{ borderLeft: '6px solid #a29bfe' }}>
                    <div className="forecast-header">
                        <div className="forecast-title">🧠 AI Causality Analysis</div>
                    </div>
                    <div>
                        {limeDetails.map((line, index) => {
                             const isGreen = line.toUpperCase().includes('[GREEN]');
                             const isOrange = line.toUpperCase().includes('[ORANGE]');
                             const cleanLine = line.replace(/\[GREEN\]|\[ORANGE\]/gi, '').trim();
                             const icon = isGreen ? '✅' : (isOrange ? '⚠️' : 'ℹ️');

                             return (
                                 <div key={index} className="lime-item">
                                     <div className="lime-icon">{icon}</div>
                                     <div style={{fontWeight: 500}}>{cleanLine}</div>
                                 </div>
                             )
                        })}
                    </div>
                </div>

                {/* Emergency Contacts / Disclaimer */}
                <div style={{ marginTop: '30px', background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '15px', background: '#fff3cd', borderRadius: '10px', color: '#856404', textAlign: 'center', fontSize: '0.9em' }}>
                        <strong>DISCLAIMER:</strong> This system provides general flood risk information. 
                        In emergency, call 100 (Police) or 101 (Fire & Rescue).
                    </div>
                </div>

            </div>

            {/* Floating Refresh Button */}
            <button className="refresh-btn" onClick={fetchData} title="Refresh Data">
                🔄
            </button>
        </div>
    );
};

export default RiverDashboard;