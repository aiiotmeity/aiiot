import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useAuth } from '../App';
import './css/MapPage.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
);

// --- Helper Functions ---
const getAQIColor = (aqi) => {
    if (aqi === null || aqi === undefined) return '#6b7280';
    if (aqi <= 50) return '#10b981';
    if (aqi <= 100) return '#f59e0b';
    if (aqi <= 200) return '#ef4444';
    return '#7c2d12';
};

const getAQIStatus = (aqi) => {
    if (aqi === null || aqi === undefined) return 'Unknown';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy';
    if (aqi <= 200) return 'Severe';
    if (aqi <= 300) return 'Very Severe';
    return 'Hazardous';
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const createAqiIcon = (aqi) => {
    const color = getAQIColor(aqi);
    const iconHtml = `<div style="background-color: ${color};" class="aqi-marker-icon"><div class="aqi-marker-icon-inner">${Math.round(aqi) || 'N/A'}</div></div>`;
    return window.L.divIcon({ html: iconHtml, className: 'custom-div-icon', iconSize: [40, 40], iconAnchor: [20, 40] });
};

// Enhanced popup content creator
const createStationPopupContent = (station, stationId) => {
    const { station_info, averages, highest_sub_index } = station;
    const pollutants = [
        { key: 'pm25', name: 'PM2.5', unit: 'µg/m³' },
        { key: 'pm10', name: 'PM10', unit: 'µg/m³' },
        { key: 'so2', name: 'SO₂', unit: 'µg/m³' },
        { key: 'no2', name: 'NO₂', unit: 'µg/m³' },
        { key: 'co', name: 'CO', unit: 'µg/m³' },
        { key: 'o3', name: 'O₃', unit: 'µg/m³' },
        { key: 'nh3', name: 'NH₃', unit: 'µg/m³' }
    ];

    const readingsHtml = pollutants.map(p => {
        const value = averages?.[p.key];
        const displayValue = value ? value.toFixed(2) : 'N/A';
        return `
            <div class="popup-reading-item">
                <div class="popup-reading-label">${p.name}</div>
                <div class="popup-reading-value">
                    ${displayValue}
                    <span class="popup-reading-unit">${p.unit}</span>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="map-station-popup">
            <div class="popup-header">
                <div class="popup-station-name">${station_info.name}</div>
                <div class="popup-aqi-display">
                    <div class="popup-aqi-value" style="background-color: ${getAQIColor(highest_sub_index)}">
                        ${Math.round(highest_sub_index) || 'N/A'}
                    </div>
                    <div class="popup-aqi-status">${getAQIStatus(highest_sub_index)}</div>
                </div>
            </div>
            <div class="popup-readings">
                <div class="popup-readings-title">Current Readings</div>
                <div class="popup-readings-grid">
                    ${readingsHtml}
                </div>
            </div>
            <a href="#" class="popup-view-details" onclick="window.mapPageInstance.handleStationSelect('${stationId}', true); return false;">
                📊 View Detailed Analysis
            </a>
        </div>
    `;
};

const MapPage = () => {
    // === STATE MANAGEMENT ===
    const [mapInstance, setMapInstance] = useState(null);
    const [stations, setStations] = useState({});
    const [selectedStationId, setSelectedStationId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [forecastData, setForecastData] = useState([]);
    const [isForecastLoading, setIsForecastLoading] = useState(false);
    const [selectedParameter, setSelectedParameter] = useState('pm25_max');
    const [forecastUpdatedAt, setForecastUpdatedAt] = useState(null);
    
    // User location states
    const [userLocation, setUserLocation] = useState(null);
    const [interpolatedData, setInterpolatedData] = useState(null);
    const [nearestStation, setNearestStation] = useState(null);
    const [showLocationPrompt, setShowLocationPrompt] = useState(false);
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    
    // Responsive states
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Refs
    const mapRef = useRef(null);
    const markersRef = useRef({});
    const userLocationMarkerRef = useRef(null);
    
    // Hooks
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://airaware-app-gcw7.onrender.com' 
    : 'http://localhost:8000';


    // Make component instance available globally for popup callbacks
    useEffect(() => {
        window.mapPageInstance = {
            handleStationSelect: (stationId, fromPopup = false) => {
                setSelectedStationId(stationId);
                setIsPanelOpen(true);
                if (fromPopup && mapInstance && stations[stationId]) {
                    const { lat, lng } = stations[stationId].station_info;
                    mapInstance.setView([lat, lng], 15);
                }
                if (isMobile && fromPopup) {
                    setTimeout(() => setIsPanelOpen(false), 500);
                }
            }
        };
        return () => {
            delete window.mapPageInstance;
        };
    }, [mapInstance, stations, isMobile]);

    // === RESPONSIVE DETECTION ===
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsMobile(width <= 768);
            
            if (width <= 768 && isPanelOpen) {
                setIsPanelOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isPanelOpen]);

    // === MAP INITIALIZATION ===
    useEffect(() => {
        let map;
        if (mapRef.current && !mapRef.current._leaflet_id) {
            map = window.L.map(mapRef.current, { 
                zoomControl: false,
                attributionControl: true
            }).setView([10.176, 76.430], 13);
            
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                className: 'map-tiles'
            }).addTo(map);
            
            window.L.control.zoom({ position: 'topleft' }).addTo(map);
            setMapInstance(map);
        }
        return () => { if (map) map.remove(); };
    }, []);
    
    // === USER LOCATION TRACKING ===
    const trackUserLocation = useCallback(() => {
        if (!user) {
            setShowLocationPrompt(true);
            return;
        }

        if (navigator.geolocation) {
            setIsLocationLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                    setUserLocation(loc);
                    setIsLocationLoading(false);
                    
                    if (mapInstance) {
                        mapInstance.setView(loc, 15);
                        
                        const userIcon = window.L.divIcon({
                            html: '<div class="user-location-marker"><i class="fas fa-user"></i></div>',
                            className: 'custom-user-icon',
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                        });
                        
                        if (userLocationMarkerRef.current) {
                            userLocationMarkerRef.current.setLatLng(loc);
                        } else {
                            userLocationMarkerRef.current = window.L.marker(loc, { icon: userIcon }).addTo(mapInstance);
                        }
                    }
                },
                (err) => {
                    setIsLocationLoading(false);
                    console.warn(`Geolocation error: ${err.message}`);
                    alert("Could not get your location. Please enable location services in your browser.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }, [mapInstance, user]);

    // === DATA FETCHING ===
    const fetchRealtimeData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/map/realtime/`);
            if (!response.ok) throw new Error('Failed to fetch data');
            
            const data = await response.json();
            setStations(data.stations);
            
            if (!selectedStationId && Object.keys(data.stations).length > 0) {
                setSelectedStationId(Object.keys(data.stations)[0]);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE_URL, selectedStationId]);

    useEffect(() => {
        fetchRealtimeData();
        const interval = setInterval(fetchRealtimeData, 60000);
        return () => clearInterval(interval);
    }, [fetchRealtimeData]);

    // === INTERPOLATED DATA CALCULATION ===
    useEffect(() => {
        if (userLocation && Object.keys(stations).length > 0 && user) {
            let weightedSum = 0, weightSum = 0, nearestDist = Infinity, nearestId = null;
            
            Object.entries(stations).forEach(([id, station]) => {
                const dist = calculateDistance(
                    userLocation.lat, userLocation.lng, 
                    station.station_info.lat, station.station_info.lng
                );
                
                if (dist < nearestDist) { 
                    nearestDist = dist; 
                    nearestId = id; 
                }
                
                const weight = 1 / Math.pow(dist === 0 ? 0.001 : dist, 2);
                weightedSum += (station.highest_sub_index || 0) * weight;
                weightSum += weight;
            });
            
            setNearestStation({ id: nearestId, distance: nearestDist });
            if (weightSum > 0) {
                setInterpolatedData({ aqi: Math.round(weightedSum / weightSum) });
            }
        }
    }, [userLocation, stations, user]);
    
    // === FORECAST DATA FETCHING ===
    useEffect(() => {
        if (!selectedStationId) return;
        
        const fetchForecast = async () => {
            setIsForecastLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/station/${selectedStationId}/forecast/`);
                if (!response.ok) throw new Error('Failed to fetch forecast');
                
                const data = await response.json();
                setForecastData(data.forecast_data || []);
                setForecastUpdatedAt(data.forecast_updated_at || null);
            } catch (err) {
                console.error("Forecast fetch error:", err);
                setForecastData([]);
            } finally {
                setIsForecastLoading(false);
            }
        };
        
        fetchForecast();
    }, [selectedStationId, API_BASE_URL]);

    // === MAP MARKERS UPDATE WITH ENHANCED POPUPS ===
    useEffect(() => {
        if (!mapInstance || Object.keys(stations).length === 0) return;
        
        Object.values(markersRef.current).forEach(marker => marker.remove());
        markersRef.current = {};

        Object.entries(stations).forEach(([id, station]) => {
            const { lat, lng } = station.station_info;
            const marker = window.L.marker([lat, lng], { 
                icon: createAqiIcon(station.highest_sub_index) 
            }).addTo(mapInstance);
            
            // Enhanced popup with detailed information
            const popupContent = createStationPopupContent(station, id);
            marker.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'enhanced-station-popup'
            });
            
            marker.on('click', () => {
                setSelectedStationId(id);
                setIsPanelOpen(true);
                mapInstance.setView([lat, lng], 15);
            });
            
            markersRef.current[id] = marker;
        });
    }, [mapInstance, stations]);

    // === EVENT HANDLERS ===
    const handleLogout = useCallback(() => {
        logout();
        setUserLocation(null);
        setInterpolatedData(null);
        setNearestStation(null);
        if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.remove();
            userLocationMarkerRef.current = null;
        }
    }, [logout]);

    const handlePanelToggle = useCallback(() => {
        setIsPanelOpen(prev => !prev);
    }, []);

    const handleStationSelect = useCallback((stationId) => {
        setSelectedStationId(stationId);
        if (isMobile) {
            setTimeout(() => setIsPanelOpen(false), 500);
        }
    }, [isMobile]);

    // === DATA PROCESSING ===
    const selectedStationData = stations[selectedStationId];
    const pollutants = [
        { key: 'pm25', name: 'PM2.5' }, 
        { key: 'pm10', name: 'PM10' }, 
        { key: 'so2', name: 'SO₂' }, 
        { key: 'no2', name: 'NO₂' }, 
        { key: 'co', name: 'CO' }, 
        { key: 'o3', name: 'O₃' }, 
        { key: 'nh3', name: 'NH₃' }
    ];

    // === FORECAST CHART CONFIGURATION ===
    const forecastChartData = useMemo(() => {
        if (!forecastData || forecastData.length === 0) return { labels: [], datasets: [] };
        
        const labels = forecastData.map(d => 
            new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );
        const dataPoints = forecastData.map(d => d[selectedParameter]);
        
        return { 
            labels, 
            datasets: [{
                label: selectedParameter.replace('_max', '').toUpperCase(),
                data: dataPoints,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: isMobile ? 4 : 6,
            }]
        };
    }, [forecastData, selectedParameter, isMobile]);

    const forecastChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1f2937',
                bodyColor: '#374151',
                borderColor: '#d1d5db',
                borderWidth: 1,
                cornerRadius: 8,
            }
        },
        scales: { 
            x: { 
                ticks: { 
                    color: '#6b7280', 
                    font: { size: isMobile ? 10 : 12 } 
                },
                grid: { color: '#f3f4f6' }
            }, 
            y: { 
                ticks: { 
                    color: '#6b7280', 
                    font: { size: isMobile ? 10 : 12 } 
                },
                grid: { color: '#f3f4f6' }
            } 
        },
        elements: {
            point: {
                hoverRadius: isMobile ? 6 : 8
            }
        }
    }), [isMobile]);

    const getPanelToggleClassName = () => {
        if (isMobile) {
            return `panel-toggle panels-closed`;
        }
        return `panel-toggle ${isPanelOpen ? 'panels-open' : 'panels-closed'}`;
    };

    return (
        <div className="map-page">
            {/* Enhanced Navbar */}
            <nav className="navbar">
                <div className="navbar-content">
                    <Link to="/" className="navbar-brand">
                        <img src="/aqi.webp" alt="Logo" width="32" height="32" />
                        <span>AirAware</span>
                    </Link>
                    
                    <div className="nav-center">
                        <ul className="nav-links">
                            <li><Link to="/" className="nav-link">Home</Link></li>
                            <li><Link to="/map" className="nav-link active">Live Map</Link></li>
                            {user && (
                                <>
                                    <li><Link to="/dashboard" className="nav-link">Dashboard</Link></li>
                                    <li><Link to="/health-assessment" className="nav-link">Health Update</Link></li>
                                    <li><Link to="/add-family" className="nav-link">Add Family</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    <div className="nav-right">
                        {user ? (
                            <div className="user-menu">
                                <div className="user-info">
                                    <div className="user-avatar">
                                        <i className="fas fa-user"></i>
                                    </div>
                                    <span className="user-name">{user.name}</span>
                                </div>
                                <button onClick={handleLogout} className="logout-btn">
                                    <i className="fas fa-sign-out-alt"></i>
                                    {!isMobile && 'Logout'}
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="login-btn">
                                <i className="fas fa-sign-in-alt"></i>
                                {!isMobile && 'Login'}
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="main-content">
                {/* Map Container */}
                <div className="map-container">
                    <div id="map" ref={mapRef} className="map-element"></div>
                    
                    <button 
                        onClick={trackUserLocation} 
                        className={`my-location-btn ${isLocationLoading ? 'loading' : ''}`}
                        title={user ? "Find My Location" : "Login to view your location"}
                        disabled={isLocationLoading}
                    >
                        {isLocationLoading ? (
                            <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                            <i className="fas fa-crosshairs"></i>
                        )}
                    </button>

                    <button 
                        className={getPanelToggleClassName()}
                        onClick={handlePanelToggle} 
                        title={isPanelOpen ? "Hide Panels" : "Show Panels"}
                    >
                        <i className={`fas ${isPanelOpen ? 'fa-times' : 'fa-bars'}`}></i>
                    </button>
                </div>

                {/* LEFT PANEL - User Data + Station List */}
                <div className={`data-panel ${isPanelOpen ? 'open' : ''}`}>
                    <div className="data-panel-content">
                        {/* User Location Panel */}
                        {user && userLocation && interpolatedData && nearestStation && (
                            <div className="user-location-panel">
                                <div className="user-location-header">
                                    <i className="fas fa-map-marker-alt"></i>
                                    <span>AQI at Your Location</span>
                                </div>
                                <div className="user-location-body">
                                    <div className="user-aqi-value" style={{ color: getAQIColor(interpolatedData.aqi) }}>
                                        {nearestStation.distance < 1 ? 
                                            stations[nearestStation.id]?.highest_sub_index : 
                                            interpolatedData.aqi
                                        }
                                    </div>
                                    <div className="user-location-details">
                                        <div className="location-method">
                                            {nearestStation.distance < 1 ? 'Using nearest station' : 'Interpolated value'}
                                        </div>
                                        <div className="nearest-station">
                                            Nearest: {stations[nearestStation.id]?.station_info.name}
                                        </div>
                                        <div className="distance">
                                            Distance: {nearestStation.distance.toFixed(1)} km
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Login Prompt */}
                        {!user && (
                            <div className="login-prompt-panel">
                                <div className="login-prompt-header">
                                    <i className="fas fa-lock"></i>
                                    <span>Personal Location Data</span>
                                </div>
                                <div className="login-prompt-body">
                                    <p>Login to view AQI data at your current location with personalized insights.</p>
                                    <Link to="/login" className="login-prompt-btn">
                                        <i className="fas fa-sign-in-alt"></i>
                                        Login to Access
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Station List Section */}
                        <div className="station-list-section">
                            <div className="station-list-header">
                                <h2 className="section-title">
                                    <i className="fas fa-satellite-dish"></i> 
                                    Monitoring Stations
                                </h2>
                            </div>
                            
                            {isLoading ? (
                                <div className="panel-loader">
                                    <div className="loading-spinner"></div>
                                    <p>Loading stations...</p>
                                </div>
                            ) : error ? (
                                <div className="error-message">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    <p>Error: {error}</p>
                                    <button onClick={fetchRealtimeData} className="retry-btn">
                                        <i className="fas fa-redo"></i>
                                        Retry
                                    </button>
                                </div>
                            ) : (
                                <div className="station-selector">
                                    {Object.entries(stations).map(([id, station]) => (
                                        <button 
                                            key={id} 
                                            className={`station-btn ${selectedStationId === id ? 'active' : ''}`} 
                                            onClick={() => handleStationSelect(id)}
                                        >
                                            <div className="station-btn-content">
                                                <span className="station-name">{station.station_info.name}</span>
                                                <span 
                                                    className="station-aqi" 
                                                    style={{ backgroundColor: getAQIColor(station.highest_sub_index) }}
                                                >
                                                    {Math.round(station.highest_sub_index) || 'N/A'}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL - Station Details (AQI + Forecast + Current Readings) */}
                <div className={`station-details-panel ${isPanelOpen ? 'open' : ''}`}>
                    <div className="station-details-content">
                        {selectedStationData ? (
                            <div className="station-details">
                                {/* Station Header */}
                                <div className="station-header">
                                    <h3>{selectedStationData.station_info.name}</h3>
                                </div>

                                {/* AQI Section */}
                                <div className="aqi-section">
                                    <div className="current-aqi">
                                        <span className="aqi-label">Current AQI</span>
                                        <span 
                                            className="aqi-value"
                                            style={{ color: getAQIColor(selectedStationData.highest_sub_index) }}
                                        >
                                            {Math.round(selectedStationData.highest_sub_index)}
                                        </span>
                                        <span className="aqi-status">
                                            {getAQIStatus(selectedStationData.highest_sub_index)}
                                        </span>
                                    </div>
                                </div>

                                {/* Current Readings Section - FIRST, FULL WIDTH */}
                                <div className="readings-section">
                                    <h4 className="section-title">
                                        <i className="fas fa-chart-bar"></i>
                                        Current Readings
                                    </h4>
                                    <div className="pollutant-grid">
                                        {pollutants.map(p => (
                                            <div className="metric-card" key={p.key}>
                                                <div className="metric-label">{p.name}</div>
                                                <div className="metric-value">
                                                    {(selectedStationData.averages?.[p.key]?.toFixed(2)) ?? 'N/A'}
                                                    <span className="metric-unit">µg/m³</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Enhanced Forecast Section */}
                                <div className="forecast-section">
                                    <div className="forecast-header">
                                        <h4 className="section-title">
                                            <i className="fas fa-chart-line"></i>
                                            4-Day Forecast
                                        </h4>
                                        <select 
                                            className="parameter-selector"
                                            value={selectedParameter}
                                            onChange={(e) => setSelectedParameter(e.target.value)}
                                        >
                                            <option value="pm25_max">PM2.5</option>
                                            <option value="pm10_max">PM10</option>
                                            <option value="so2_max">SO₂</option>
                                            <option value="no2_max">NO₂</option>
                                            <option value="co_max">CO</option>
                                            <option value="o3_max">O₃</option>
                                            <option value="nh3_max">NH₃</option>
                                        </select>
                                    </div>
                                    
                                    {forecastUpdatedAt && (
                                        <div className="forecast-update-time">
                                            Last updated: {new Date(forecastUpdatedAt).toLocaleString()}
                                        </div>
                                    )}

                                    <div className="chart-container">
                                        {isForecastLoading ? (
                                            <div className="forecast-loader">
                                                <div className="loading-spinner small"></div>
                                                <p>Loading forecast...</p>
                                            </div>
                                        ) : forecastData.length > 0 ? (
                                            <Line data={forecastChartData} options={forecastChartOptions} />
                                        ) : (
                                            <div className="no-data-message">
                                                <i className="fas fa-chart-line"></i>
                                                <p>No forecast data available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="no-station-selected">
                                <div className="no-station-message">
                                    <i className="fas fa-satellite-dish"></i>
                                    <h3>Select a Station</h3>
                                    <p>Choose a monitoring station from the left panel or click on a map marker to view detailed air quality data, current readings, and forecast information.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Location Prompt Modal */}
            {showLocationPrompt && (
                <div className="modal-overlay" onClick={() => setShowLocationPrompt(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><i className="fas fa-map-marker-alt"></i> Location Access</h3>
                            <button 
                                className="modal-close" 
                                onClick={() => setShowLocationPrompt(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>To view AQI data at your current location, please login first.</p>
                            <div className="modal-actions">
                                <Link to="/login" className="modal-btn primary">
                                    <i className="fas fa-sign-in-alt"></i>
                                    Login
                                </Link>
                                <button 
                                    className="modal-btn secondary" 
                                    onClick={() => setShowLocationPrompt(false)}
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapPage;