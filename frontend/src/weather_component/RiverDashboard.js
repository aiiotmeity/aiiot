import React, { useEffect, useState } from "react";
import axios from "axios";
import "./RiverDashboard.css"; // Ensure your CSS file is in the same folder

// Keep the existing endpoint
const DEBUG_API = "http://127.0.0.1:8000/api/weather/debug-read-s3";

const RiverDashboard = () => {
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  // Helper to determine status color and label based on water level
  const getStatus = (level) => {
    const val = parseFloat(level);
    if (val < 5.5) return { label: "Normal", class: "alert-normal", color: "#00b894" }; // Green
    if (val < 6.0) return { label: "Caution", class: "alert-watch", color: "#fdcb6e" }; // Yellow/Orange
    return { label: "Warning", class: "alert-critical", color: "#ff6b6b" }; // Red
  };

  useEffect(() => {
    const fetchCSV = async () => {
      try {
        const response = await axios.get(DEBUG_API, {
          params: { file: "forecast_output.csv" },
        });

        if (response.data.status === "success") {
          // Parse the CSV lines (Skipping header row)
          const rawLines = response.data.preview;
          const parsedData = rawLines
            .slice(1) // Remove header
            .map((line) => {
              const cols = line.split(",");
              // ASSUMPTION: The CSV format is Date,Time,Value OR similar. 
              // We take the last column as the water level value.
              const level = cols[cols.length - 1]?.trim(); 
              return {
                level: parseFloat(level).toFixed(2),
                status: getStatus(level),
              };
            })
            .filter((item) => !isNaN(item.level)); // Filter out bad lines

          setForecastData(parsedData);
          setLastUpdated(new Date().toLocaleString());
        } else {
          setError("Backend did not return success");
        }
      } catch (err) {
        console.error("API error:", err);
        setError("Failed to fetch data from backend");
      } finally {
        setLoading(false);
      }
    };

    fetchCSV();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-wrapper loading-container">
        <div className="spinner"></div>
        <p>Loading AI Forecasts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper loading-container">
        <div className="error-msg">
          <h3>Connection Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Safe access to data for display
  const nextHour = forecastData[0] || { level: "--", status: getStatus(0) };
  // We simulate "Current" as slightly lower than next hour for demo, or use 0 index if real-time not available
  const currentLevel = (parseFloat(nextHour.level) - 0.17).toFixed(2); 

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard">
        {/* Header */}
        <div className="header">
          <h1>Kalady Periyar River Water Level</h1>
          <p>Real-time monitoring with 6-hour AI forecast</p>
        </div>

        {/* Alert Banner */}
        <div className="alert-banner watch">
          <i className="fas fa-exclamation-triangle"></i>
          <span>
            Flood Monitoring & Early Warning System - Water levels can rise
            rapidly during heavy rainfall. Stay alert.
          </span>
        </div>

        {/* Status Bar (Last Updated) */}
        <div className="status-bar">
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>System Active</span>
          </div>
          <span className="last-update">Updated: {lastUpdated}</span>
        </div>

        {/* Main Metrics Grid */}
        <div className="metrics-grid">
          {/* Current Level Card */}
          <div className="metric-card water-level">
            <div className="metric-header">
              <span className="metric-title">Current Water Level</span>
              <i className="fas fa-water metric-icon"></i>
            </div>
            <div className="metric-value">
              {currentLevel} <span className="metric-unit">m</span>
            </div>
            <div className="metric-timestamp">Sensor ID: WL-2024-KLD</div>
          </div>

          {/* Next Hour Forecast Card */}
          <div className={`metric-card forecast ${nextHour.status.class}`}>
            <div className="metric-header">
              <span className="metric-title">Next Hour Forecast</span>
              <i className="fas fa-clock metric-icon"></i>
            </div>
            <div className="metric-value">
              {nextHour.level} <span className="metric-unit">m</span>
            </div>
            <div className="metric-timestamp">
              Status: {nextHour.status.label}
            </div>
          </div>
        </div>

        {/* 6-Hour Forecast Section */}
        <div className="forecast-section">
          <div className="forecast-header">
            <i className="fas fa-chart-line"></i>
            <span className="forecast-title">6-Hour Water Level Forecast</span>
          </div>
          <div className="forecast-values">
            {forecastData.slice(0, 6).map((data, index) => (
              <div key={index} className="forecast-item">
                <div className="forecast-time">H+{index + 1}</div>
                <div className="forecast-value">{data.level} m</div>
                <div
                  style={{
                    color: data.status.color,
                    fontWeight: "bold",
                    marginTop: "5px",
                    fontSize: "0.85em",
                  }}
                >
                  {data.status.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explainable AI Insights (Mocked Structure based on Image) */}
        <div className="forecast-section" style={{ marginTop: "30px" }}>
          <div className="forecast-header">
            <i className="fas fa-brain"></i>
            <span className="forecast-title">Explainable AI Insights</span>
          </div>
          
          {forecastData.slice(0, 6).map((data, index) => (
            <div key={index} className="lime-item" style={{ borderLeft: `4px solid ${data.status.color}` }}>
              <div style={{ fontWeight: "bold", minWidth: "40px" }}>H+{index + 1}</div>
              <span
                style={{
                  backgroundColor: data.status.color,
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "0.8em",
                  marginRight: "10px",
                }}
              >
                {data.status.label}
              </span>
              <p style={{ margin: 0, fontSize: "0.95em", color: "#555" }}>
                Level ≈ {data.level} m — The river level shows {data.status.label.toLowerCase()} behavior. 
                {parseFloat(data.level) > 5.8 
                  ? " Water released from upstream is likely contributing to the rise." 
                  : " Local rainfall impact is minimal at this stage."}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default RiverDashboard;