import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import logoImage from '../assets/aqi.webp'; 
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
    const [forecastData, setForecastData] = useState([]);
    const [isForecastLoading, setIsForecastLoading] = useState(false);
    const [selectedParameter, setSelectedParameter] = useState('pm25_max');
    const [forecastUpdatedAt, setForecastUpdatedAt] = useState(null);
    
    // User location states
    const [userLocation, setUserLocation] = useState(null);
    const [userLocationData, setUserLocationData] = useState(null);
    const [nearestStation, setNearestStation] = useState(null);
    const [showLocationPrompt, setShowLocationPrompt] = useState(false);
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    
    // Mobile-specific states
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [activeTab, setActiveTab] = useState('stations'); // 'stations', 'details', 'user'

    // Refs
    const mapRef = useRef(null);
    const markersRef = useRef({});
    const userLocationMarkerRef = useRef(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    
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
                if (isMobile) {
                    setActiveTab('details');
                    setShowMobileMenu(true);
                }
                if (fromPopup && mapInstance && stations[stationId]) {
                    const { lat, lng } = stations[stationId].station_info;
                    mapInstance.setView([lat, lng], 15);
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
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
        }, []);
            
    // === CORRECTED IDW INTERPOLATION - ONLY REAL STATIONS ===
    const calculateIDWInterpolation = useCallback((locationData, stations) => {
        console.log('🔍 Starting IDW calculation with ONLY real stations...');
        
        // FIXED: Only use the 2 real stations for interpolation
        const realStationIds = ['lora-v1', 'loradev2'];
        const realStations = {};
        
        realStationIds.forEach(id => {
            if (stations[id]) {
                realStations[id] = stations[id];
            }
        });
        
        console.log('📊 Real stations for interpolation:', Object.keys(realStations));
        
        if (Object.keys(realStations).length === 0) {
            console.warn('⚠️ No real stations available for interpolation');
            return {
                interpolated_values: {},
                interpolated_aqi: 50,
                stations_used: 0,
                method: 'fallback'
            };
        }
        
        let totalWeight = 0;
        const weightedValues = {
            pm25: 0, pm10: 0, so2: 0, no2: 0, 
            co: 0, o3: 0, nh3: 0, temp: 0, hum: 0, pre: 0
        };
        let weightedAqi = 0;

        Object.entries(realStations).forEach(([stationId, station]) => {
            const distance = calculateDistance(
                locationData.lat,
                locationData.lng,
                station.station_info.lat,
                station.station_info.lng
            );

            console.log(`📍 Station ${stationId}: ${distance.toFixed(2)}km away`);

            // Avoid division by zero - same as Dashboard.js
            const safeDistance = Math.max(distance, 0.001);
            const weight = 1.0 / (safeDistance ** 2);
            totalWeight += weight;

            // Add weighted values
            const averages = station.averages || {};
            Object.keys(weightedValues).forEach(param => {
                if (averages[param] !== undefined) {
                    weightedValues[param] += averages[param] * weight;
                }
            });

            // Add weighted AQI
            weightedAqi += (station.highest_sub_index || 0) * weight;
            
            console.log(`⚖️ Station ${stationId}: weight=${weight.toFixed(4)}, AQI=${station.highest_sub_index}`);
        });

        // Calculate final interpolated values
        const interpolated_values = {};
        Object.keys(weightedValues).forEach(param => {
            interpolated_values[param] = totalWeight > 0 ? 
                Math.round((weightedValues[param] / totalWeight) * 100) / 100 : 0;
        });

        const interpolated_aqi = totalWeight > 0 ? 
            Math.round(weightedAqi / totalWeight) : 50;

        console.log('✅ IDW Result:', {
            interpolated_aqi,
            stations_used: Object.keys(realStations).length,
            total_weight: totalWeight.toFixed(4)
        });

        return {
            interpolated_values,
            interpolated_aqi,
            stations_used: Object.keys(realStations).length,
            method: 'idw'
        };
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

    // === CORRECTED USER LOCATION DATA CALCULATION - ONLY REAL STATIONS ===
    useEffect(() => {
        if (userLocation && Object.keys(stations).length > 0 && user) {
            console.log('🔍 Calculating user location data with ONLY real stations for interpolation...');
            
            // FIXED: Only use real stations for distance calculation and interpolation
            const realStationIds = ['lora-v1', 'loradev2'];
            const realStations = {};
            
            realStationIds.forEach(id => {
                if (stations[id]) {
                    realStations[id] = stations[id];
                }
            });
            
            if (Object.keys(realStations).length === 0) {
                console.warn('⚠️ No real stations available');
                return;
            }
            
            // Calculate distances to ONLY real stations
            const stationDistances = {};
            let nearestDist = Infinity;
            let nearestId = null;
            
            Object.entries(realStations).forEach(([id, station]) => {
                const dist = calculateDistance(
                    userLocation.lat, 
                    userLocation.lng, 
                    station.station_info.lat, 
                    station.station_info.lng
                );
                
                stationDistances[id] = {
                    distance: dist,
                    station: station
                };
                
                if (dist < nearestDist) { 
                    nearestDist = dist; 
                    nearestId = id; 
                }
            });
            
            setNearestStation({ 
                id: nearestId, 
                distance: nearestDist,
                station: realStations[nearestId]
            });

            console.log(`📍 Nearest real station: ${nearestId} at ${nearestDist.toFixed(2)}km`);
            
            // Check if user is within 1km of any real station
            const isWithinSensorRange = Object.values(stationDistances).some(s => s.distance <= 1.0);
            
            if (isWithinSensorRange || nearestDist <= 1.0) {
                // Within 1km - use interpolation with ONLY real stations
                const idwResult = calculateIDWInterpolation(userLocation, realStations);
                
                setUserLocationData({
                    method: 'location_interpolation',
                    source: 'interpolated',
                    explanation: `You are ${nearestDist.toFixed(1)}km from the nearest sensor. Showing calculated air quality for your exact location using data from the 2 real monitoring stations.`,
                    values: idwResult.interpolated_values,
                    aqi: idwResult.interpolated_aqi,
                    station_name: `Your Location (Calculated from Real Stations)`,
                    is_interpolated: true,
                    show_distance_message: true,
                    distance_message: `📍 You are within sensor range (${nearestDist.toFixed(1)}km from nearest), showing calculated values for your exact location using only real sensor data`,
                    data_type: 'Your Location Data (Real Sensor Interpolation)',
                    nearest_station_name: realStations[nearestId]?.station_info?.name,
                    stations_used_for_calculation: Object.keys(realStations)
                });
                
                console.log('✅ Using interpolated data from real stations:', idwResult);
            } else {
                // Beyond 1km from all real sensors - show nearest real station data
                const nearestStationData = realStations[nearestId];
                
                setUserLocationData({
                    method: 'nearest_station',
                    source: 'nearest_station',
                    explanation: `You are ${nearestDist.toFixed(1)}km from the nearest real sensor. Too far for accurate interpolation - showing data from ${nearestStationData.station_info.name} (nearest real monitoring station).`,
                    values: nearestStationData.averages || {},
                    aqi: nearestStationData.highest_sub_index || 50,
                    station_name: nearestStationData.station_info.name,
                    is_interpolated: false,
                    show_distance_message: true,
                    distance_message: `📍 You are ${nearestDist.toFixed(1)}km from the nearest real sensor (beyond 1km interpolation range), showing data from ${nearestStationData.station_info.name}`,
                    data_type: 'Nearest Real Station Data',
                    nearest_station_name: nearestStationData.station_info.name,
                    distance_warning: nearestDist > 1.0 ? `You are ${nearestDist.toFixed(1)}km away from sensors, so you cannot get interpolated values for your exact location.` : null
                });
                
                console.log('✅ Using nearest real station data (beyond 1km):', nearestStationData.station_info.name);
            }
        }
    }, [userLocation, stations, user, calculateIDWInterpolation]);
    
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
                if (isMobile) {
                    setActiveTab('details');
                    setShowMobileMenu(true);
                }
                mapInstance.setView([lat, lng], 15);
            });
            
            markersRef.current[id] = marker;
        });
    }, [mapInstance, stations, isMobile]);

    // === EVENT HANDLERS ===
    const handleLogout = useCallback(() => {
        logout();
        setUserLocation(null);
        setUserLocationData(null);
        setNearestStation(null);
        if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.remove();
            userLocationMarkerRef.current = null;
        }
    }, [logout]);

    const handleStationSelect = useCallback((stationId) => {
        setSelectedStationId(stationId);
        if (isMobile) {
            setActiveTab('details');
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

    // Mobile Tab Content Renderer
    const renderMobileTabContent = () => {
        switch (activeTab) {
            case 'stations':
                return (
                    <div className="mobile-tab-content">
                        <div className="mobile-section-header">
                            <h3>
                                <i className="fas fa-satellite-dish"></i>
                                Monitoring Stations
                            </h3>
                        </div>
                        {isLoading ? (
                            <div className="mobile-loader">
                                <div className="loading-spinner"></div>
                                <p>Loading stations...</p>
                            </div>
                        ) : error ? (
                            <div className="mobile-error">
                                <i className="fas fa-exclamation-triangle"></i>
                                <p>Error: {error}</p>
                                <button onClick={fetchRealtimeData} className="retry-btn">
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <div className="mobile-station-list">
                                {Object.entries(stations).map(([id, station]) => (
                                    <button 
                                        key={id} 
                                        className={`mobile-station-card ${selectedStationId === id ? 'active' : ''}`} 
                                        onClick={() => handleStationSelect(id)}
                                    >
                                        <div className="station-info">
                                            <h4>{station.station_info.name}</h4>
                                            <div className="station-meta">
                                                <span>Last updated: {station.last_updated_on || 'N/A'}</span>
                                                {['lora-v1', 'loradev2'].includes(id) && (
                                                    <span className="real-station-badge">🟢 Real Sensor</span>
                                                )}
                                                {id.startsWith('temp-') && (
                                                    <span className="simulated-station-badge">🔮 Simulated</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="station-aqi-badge" style={{ backgroundColor: getAQIColor(station.highest_sub_index) }}>
                                            <span className="aqi-number">{Math.round(station.highest_sub_index) || 'N/A'}</span>
                                            <span className="aqi-status">{getAQIStatus(station.highest_sub_index)}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'details':
                return (
                    <div className="mobile-tab-content">
                        {selectedStationData ? (
                            <>
                                <div className="mobile-section-header">
                                    <h3>
                                        <i className="fas fa-chart-bar"></i>
                                        {selectedStationData.station_info.name}
                                    </h3>
                                    <div className="mobile-aqi-display">
                                        <span 
                                            className="mobile-aqi-value"
                                            style={{ backgroundColor: getAQIColor(selectedStationData.highest_sub_index) }}
                                        >
                                            {Math.round(selectedStationData.highest_sub_index)}
                                        </span>
                                        <span className="mobile-aqi-status">
                                            {getAQIStatus(selectedStationData.highest_sub_index)}
                                        </span>
                                    </div>
                                </div>

                                {/* Current Readings */}
                                <div className="mobile-readings-section">
                                    <h4>Current Readings</h4>
                                    <div className="mobile-readings-grid">
                                        {pollutants.map(p => (
                                            <div className="mobile-reading-card" key={p.key}>
                                                <div className="reading-label">{p.name}</div>
                                                <div className="reading-value">
                                                    {(selectedStationData.averages?.[p.key]?.toFixed(2)) ?? 'N/A'}
                                                    <span>µg/m³</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Forecast */}
                                <div className="mobile-forecast-section">
                                    <div className="forecast-header">
                                        <h4>4-Day Forecast</h4>
                                        <select 
                                            className="mobile-parameter-selector"
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
                                    
                                    <div className="mobile-chart-container">
                                        {isForecastLoading ? (
                                            <div className="chart-loader">
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
                            </>
                        ) : (
                            <div className="mobile-no-selection">
                                <i className="fas fa-map-marker-alt"></i>
                                <h3>Select a Station</h3>
                                <p>Choose a monitoring station to view detailed information</p>
                                <button 
                                    className="select-station-btn"
                                    onClick={() => setActiveTab('stations')}
                                >
                                    View Stations
                                </button>
                            </div>
                        )}
                    </div>
                );

            case 'user':
                return (
                    <div className="mobile-tab-content">
                        <div className="mobile-section-header">
                            <h3>
                                <i className="fas fa-user-circle"></i>
                                Your Location
                            </h3>
                        </div>
                        {user && userLocation && userLocationData && nearestStation ? (
                            <div className="mobile-user-data">
                                <div className="mobile-user-aqi">
                                    <div 
                                        className="user-aqi-circle"
                                        style={{ backgroundColor: getAQIColor(userLocationData.aqi) }}
                                    >
                                        <span className="aqi-number">
                                            {Math.round(userLocationData.aqi)}
                                        </span>
                                        <span className="aqi-label">AQI</span>
                                    </div>
                                    <div className="user-location-info">
                                        <p><strong>Method:</strong> {userLocationData.is_interpolated ? 'Smart Interpolation (Real Sensors Only)' : 'Nearest Real Station'}</p>
                                        <p><strong>Data Source:</strong> {userLocationData.station_name}</p>
                                        <p><strong>Distance:</strong> {nearestStation.distance.toFixed(1)} km from nearest real sensor</p>
                                        <p><strong>Status:</strong> {userLocationData.is_interpolated ? 'Within sensor range' : 'Beyond interpolation range'}</p>
                                        {userLocationData.stations_used_for_calculation && (
                                            <p><strong>Stations Used:</strong> {userLocationData.stations_used_for_calculation.join(', ')}</p>
                                        )}
                                        {userLocationData.distance_warning && (
                                            <div className="distance-warning">
                                                ⚠️ {userLocationData.distance_warning}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* CORRECTED: Show user's readings with proper indication */}
                                <div className="mobile-readings-section">
                                    <h4>Your Location Readings</h4>
                                    <div className="mobile-readings-grid">
                                        {pollutants.map(p => (
                                            <div className="mobile-reading-card" key={p.key}>
                                                <div className="reading-label">{p.name}</div>
                                                <div className="reading-value">
                                                    {(userLocationData.values?.[p.key]?.toFixed(2)) ?? 'N/A'}
                                                    <span>µg/m³</span>
                                                </div>
                                                {userLocationData.is_interpolated ? (
                                                    <div className="interpolated-badge">🎯 Calculated</div>
                                                ) : (
                                                    <div className="nearest-badge">📍 Nearest</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Distance and methodology info */}
                                <div className="user-location-methodology">
                                    <h4>Data Methodology</h4>
                                    <div className="methodology-info">
                                        {userLocationData.is_interpolated ? (
                                            <div className="interpolation-info">
                                                <div className="info-item">
                                                    <span className="info-icon">🎯</span>
                                                    <span>Using smart interpolation from real sensors only</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-icon">📊</span>
                                                    <span>Calculated from lora-v1 and loradev2 stations</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-icon">📏</span>
                                                    <span>You are within 1km of real sensors</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="nearest-station-info">
                                                <div className="info-item">
                                                    <span className="info-icon">📍</span>
                                                    <span>Using nearest real station data</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-icon">⚠️</span>
                                                    <span>Beyond 1km from sensors - no interpolation</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-icon">📏</span>
                                                    <span>{nearestStation.distance.toFixed(1)}km from nearest real sensor</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : !user ? (
                            <div className="mobile-login-prompt">
                                <i className="fas fa-lock"></i>
                                <h4>Login Required</h4>
                                <p>Login to view personalized AQI data for your location</p>
                                <Link to="/login" className="mobile-login-btn">
                                    <i className="fas fa-sign-in-alt"></i>
                                    Login Now
                                </Link>
                            </div>
                        ) : (
                            <div className="mobile-location-prompt">
                                <i className="fas fa-map-marker-alt"></i>
                                <h4>Enable Location</h4>
                                <p>Get personalized AQI data calculated from real sensors for your current location</p>
                                <button 
                                    className="mobile-location-btn"
                                    onClick={trackUserLocation}
                                    disabled={isLocationLoading}
                                >
                                    {isLocationLoading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Getting Location...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-crosshairs"></i>
                                            Get My Location
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="map-page">
            {/* Enhanced Navbar */}
            <nav className="navbar">
                <div className="navbar-content">
                    <Link to="/" className="navbar-brand">
                                {/* 2. USE THE IMPORTED VARIABLE */}
                                <img src={logoImage} alt="AQM Logo" width={isMobileView ? "32" : "40"} height={isMobileView ? "32" : "40"} />
                                AirAware
                              </Link>
                    
                    {!isMobile && (
                        <div className="nav-center">
                            <ul className="nav-links">
                                <li><Link to="/" className="nav-link">Home</Link></li>
                                <li><Link to="/map" className="nav-link active">Live Map</Link></li>
                                {user && (
                                    <>
                                        <li><Link to="/dashboard" className="nav-link">Profile</Link></li>
                                        <li><Link to="/add-family" className="nav-link">Add Family</Link></li>
                                    </>
                                )}
                            </ul>
                        </div>
                    )}

                    <div className="nav-right">
                        {user ? (
                            <div className="user-menu">
                                {!isMobile && (
                                    <div className="user-info">
                                        <div className="user-avatar">
                                            <i className="fas fa-user"></i>
                                        </div>
                                        <span className="user-name">{user.name}</span>
                                    </div>
                                )}
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
                    
                    {/* Map Controls */}
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

                    {isMobile && (
                        <button 
                            className="mobile-menu-toggle"
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                        >
                            <i className={`fas ${showMobileMenu ? 'fa-times' : 'fa-bars'}`}></i>
                        </button>
                    )}
                </div>

                {/* Desktop Panels */}
                {!isMobile && (
                    <>
                        {/* LEFT PANEL - User Data + Station List */}
                        <div className="data-panel">
                            <div className="data-panel-content">
                                {/* CORRECTED: User Location Panel with real station indication */}
                                {user && userLocation && userLocationData && nearestStation && (
                                    <div className="user-location-panel">
                                        <div className="user-location-header">
                                            <i className="fas fa-map-marker-alt"></i>
                                            <span>AQI at Your Location</span>
                                        </div>
                                        <div className="user-location-body">
                                            <div className="user-aqi-value" style={{ color: getAQIColor(userLocationData.aqi) }}>
                                                {Math.round(userLocationData.aqi)}
                                            </div>
                                            <div className="user-location-details">
                                                <div className="location-method">
                                                    {userLocationData.is_interpolated ? 
                                                        '🎯 Smart Interpolation from Real Sensors Only' : 
                                                        '📍 Nearest Real Station Data'
                                                    }
                                                </div>
                                                <div className="nearest-station">
                                                    Data source: {userLocationData.station_name}
                                                </div>
                                                <div className="distance">
                                                    Distance to nearest real sensor: {nearestStation.distance.toFixed(1)} km
                                                </div>
                                                <div className="data-quality">
                                                    {userLocationData.is_interpolated ? 
                                                        `🎯 Calculated for your exact location using lora-v1 and loradev2` : 
                                                        `📍 Direct reading from ${userLocationData.nearest_station_name}`
                                                    }
                                                </div>
                                                {userLocationData.distance_warning && (
                                                    <div className="distance-warning">
                                                        ⚠️ {userLocationData.distance_warning}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* CORRECTED: Show user's specific readings with proper source indication */}
                                        <div className="user-readings-summary">
                                            <h4>Your Location Readings</h4>
                                            <div className="readings-mini-grid">
                                                <div className="mini-reading">
                                                    <span>PM2.5:</span>
                                                    <span>{userLocationData.values?.pm25?.toFixed(1) || 'N/A'}</span>
                                                    {userLocationData.is_interpolated ? 
                                                        <span className="calc-badge">🎯</span> : 
                                                        <span className="nearest-badge">📍</span>
                                                    }
                                                </div>
                                                <div className="mini-reading">
                                                    <span>PM10:</span>
                                                    <span>{userLocationData.values?.pm10?.toFixed(1) || 'N/A'}</span>
                                                    {userLocationData.is_interpolated ? 
                                                        <span className="calc-badge">🎯</span> : 
                                                        <span className="nearest-badge">📍</span>
                                                    }
                                                </div>
                                                <div className="mini-reading">
                                                    <span>NO₂:</span>
                                                    <span>{userLocationData.values?.no2?.toFixed(1) || 'N/A'}</span>
                                                    {userLocationData.is_interpolated ? 
                                                        <span className="calc-badge">🎯</span> : 
                                                        <span className="nearest-badge">📍</span>
                                                    }
                                                </div>
                                                <div className="mini-reading">
                                                    <span>O₃:</span>
                                                    <span>{userLocationData.values?.o3?.toFixed(1) || 'N/A'}</span>
                                                    {userLocationData.is_interpolated ? 
                                                        <span className="calc-badge">🎯</span> : 
                                                        <span className="nearest-badge">📍</span>
                                                    }
                                                </div>
                                            </div>
                                            <div className="calc-note">
                                                {userLocationData.is_interpolated ? 
                                                    '🎯 Interpolated values using only real sensor data (lora-v1, loradev2)' :
                                                    `📍 Direct values from nearest real sensor (${userLocationData.nearest_station_name})`
                                                }
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
                                            <p>Login to view AQI data at your current location with personalized insights calculated from real sensors.</p>
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
                                                        <div className="station-name-container">
                                                            <span className="station-name">{station.station_info.name}</span>
                                                            {['lora-v1', 'loradev2'].includes(id) && (
                                                                <span className="real-station-indicator">🟢</span>
                                                            )}
                                                            {id.startsWith('temp-') && (
                                                                <span className="simulated-station-indicator">🔮</span>
                                                            )}
                                                        </div>
                                                        <span 
                                                            className="station-aqi" 
                                                            style={{ backgroundColor: getAQIColor(station.highest_sub_index) }}
                                                        >
                                                            {Math.round(station.highest_sub_index) || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="station-type-label">
                                                        {['lora-v1', 'loradev2'].includes(id) ? 'Real Sensor' : 'Simulated'}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANEL - Station Details */}
                        <div className="station-details-panel">
                            <div className="station-details-content">
                                {selectedStationData ? (
                                    <div className="station-details">
                                        {/* Station Header */}
                                        <div className="station-header">
                                            <h3>{selectedStationData.station_info.name}</h3>
                                            <div className="station-badges">
                                                {['lora-v1', 'loradev2'].includes(selectedStationId) && (
                                                    <span className="real-sensor-badge">🟢 Real Sensor</span>
                                                )}
                                                {selectedStationId.startsWith('temp-') && (
                                                    <span className="simulated-sensor-badge">🔮 Simulated</span>
                                                )}
                                            </div>
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

                                        {/* Current Readings Section */}
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
                                            <div className="station-types-info">
                                                <div className="station-type-info">
                                                    <span className="type-indicator real">🟢</span>
                                                    <span>Real sensors are used for interpolation calculations</span>
                                                </div>
                                                <div className="station-type-info">
                                                    <span className="type-indicator simulated">🔮</span>
                                                    <span>Simulated stations for network visualization</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Mobile Bottom Sheet */}
                {isMobile && (
                    <div className={`mobile-bottom-sheet ${showMobileMenu ? 'open' : ''}`}>
                        {/* Mobile Tab Navigation */}
                        <div className="mobile-tab-nav">
                            <button 
                                className={`mobile-tab-btn ${activeTab === 'stations' ? 'active' : ''}`}
                                onClick={() => setActiveTab('stations')}
                            >
                                <i className="fas fa-satellite-dish"></i>
                                <span>Stations</span>
                            </button>
                            <button 
                                className={`mobile-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                                onClick={() => setActiveTab('details')}
                            >
                                <i className="fas fa-chart-bar"></i>
                                <span>Details</span>
                            </button>
                            <button 
                                className={`mobile-tab-btn ${activeTab === 'user' ? 'active' : ''}`}
                                onClick={() => setActiveTab('user')}
                            >
                                <i className="fas fa-user-circle"></i>
                                <span>My Data</span>
                            </button>
                        </div>

                        {/* Mobile Tab Content */}
                        <div className="mobile-tab-content-wrapper">
                            {renderMobileTabContent()}
                        </div>
                    </div>
                )}
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
                            <p>To view AQI data calculated from real sensors at your current location, please login first.</p>
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