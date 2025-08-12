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

// ...
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // REMOVED: * 1000 to return km instead of meters
    return R * c; 
};
// ..


const createAqiIcon = (aqi, isComingSoon = false) => {
    const color = isComingSoon ? '#cbd5e1' : getAQIColor(aqi);
    const displayValue = isComingSoon ? '?' : (Math.round(aqi) || 'N/A');
    const iconHtml = `<div style="background-color: ${color};" class="aqi-marker-icon ${isComingSoon ? 'coming-soon' : ''}"><div class="aqi-marker-icon-inner">${displayValue}</div></div>`;
    return window.L.divIcon({ html: iconHtml, className: 'custom-div-icon', iconSize: [40, 40], iconAnchor: [20, 40] });
};

// Enhanced popup content creator
const createStationPopupContent = (station, stationId) => {
    const isRealStation = ['lora-v1', 'loradev2'].includes(stationId);
    const isComingSoon = stationId.startsWith('temp-');

    if (isComingSoon) {
        return `
            <div class="map-station-popup coming-soon-popup">
                <div class="popup-header">
                    <div class="popup-station-name">${station.station_info.name}</div>
                    <div class="coming-soon-badge">
                        <span class="coming-soon-icon">🚧</span>
                        <span class="coming-soon-text">Coming Soon</span>
                    </div>
                </div>
                <div class="coming-soon-message">
                    <p>This monitoring station is under development and will be operational soon.</p>
                    <p>Stay tuned for real-time air quality data from this location!</p>
                </div>
            </div>
        `;
    }

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
                    <div class="real-sensor-badge">🟢 Live Data</div>
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
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    
    // Mobile-specific states
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [activeTab, setActiveTab] = useState('stations');
    // NEW: Full screen map state
    const [isFullScreenMap, setIsFullScreenMap] = useState(false);
    const [isBottomSheetCollapsed, setIsBottomSheetCollapsed] = useState(false);

    // Refs
    const mapRef = useRef(null);
    const markersRef = useRef({});
    const userLocationMarkerRef = useRef(null);
    
    // Hooks
    const navigate = useNavigate();
    const { user, logout, loading: authLoading } = useAuth();
    const [authInitialized, setAuthInitialized] = useState(false);
    const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://airaware-app-gcw7.onrender.com' 
        : 'http://localhost:8000';

    // === USER LOCATION TRACKING - FIXED ===
    const trackUserLocation = useCallback(() => {
    // FIXED: Prevent multiple requests and unnecessary reloads
        if (isLocationLoading) {
            console.log('Location request already in progress...');
            return;
        }

        if (!user) {
            console.log('User not authenticated for location tracking');
            return;
        }

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by this browser.");
            return;
        }

        setIsLocationLoading(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc = { 
                    lat: position.coords.latitude, 
                    lng: position.coords.longitude,
                    timestamp: Date.now()
                };
                
                console.log('Location obtained:', loc);
                setUserLocation(loc);
                setIsLocationLoading(false);
                
                // FIXED: Only update map if significantly different location
                if (mapInstance) {
                    const currentCenter = mapInstance.getCenter();
                    const distance = calculateDistance(
                        currentCenter.lat, 
                        currentCenter.lng, 
                        loc.lat, 
                        loc.lng
                    );
                    
                    // Only center map if more than 1km away to prevent constant reloads
                    if (distance > 1000) {
                        mapInstance.setView([loc.lat, loc.lng], 15);
                    }
                    
                    // Update user marker without recreating
                    const userIcon = window.L.divIcon({
                        html: '<div class="user-location-marker"><i class="fas fa-user"></i></div>',
                        className: 'custom-user-icon',
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    });
                    
                    if (userLocationMarkerRef.current) {
                        userLocationMarkerRef.current.setLatLng([loc.lat, loc.lng]);
                    } else {
                        userLocationMarkerRef.current = window.L.marker([loc.lat, loc.lng], { 
                            icon: userIcon 
                        }).addTo(mapInstance);
                    }
                }
            },
            (error) => {
                setIsLocationLoading(false);
                console.warn('Geolocation error:', error.message);
                
                // Don't show alert for permission denied
                if (error.code !== error.PERMISSION_DENIED) {
                    console.error('Location error:', error.message);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 300000 // 5 minutes cache - prevents constant requests
            }
        );
    }, [user, mapInstance, isLocationLoading]);

    // Initialize auth state properly
    useEffect(() => {
        // Wait for auth to finish loading before showing UI
        if (!authLoading) {
            setAuthInitialized(true);
        }
    }, [authLoading]);

    // Auto-track location when user logs in and map is ready
    useEffect(() => {
    // FIXED: Only auto-track once when conditions are met
    if (!user || !mapInstance || userLocation) return;
    
    // Add a longer delay to prevent immediate requests
    const timer = setTimeout(() => {
        trackUserLocation();
    }, 2000); // 2 second delay
    
    return () => clearTimeout(timer);
}, [user, mapInstance]); // Remove userLocation from dependencies to prevent loops

// MINIMAL FIX: Add this debounced effect for user location data calculation
    useEffect(() => {
        if (!userLocation || Object.keys(stations).length === 0) return;
        
        // FIXED: Debounce the calculation to prevent excessive updates
        const timeoutId = setTimeout(() => {
            console.log('Calculating user location data...');
            // ... your existing calculation code here ...
        }, 1000); // 1 second debounce
        
        return () => clearTimeout(timeoutId);
    }, [userLocation, stations]);
    // Make component instance available globally for popup callbacks
    useEffect(() => {
        window.mapPageInstance = {
            handleStationSelect: (stationId, fromPopup = false) => {
                // Only allow selection of real stations
                if (['lora-v1', 'loradev2'].includes(stationId)) {
                    setSelectedStationId(stationId);
                    if (isMobile) {
                        setActiveTab('details');
                        setShowMobileMenu(true);
                        setIsBottomSheetCollapsed(false);
                    }
                    if (fromPopup && mapInstance && stations[stationId]) {
                        const { lat, lng } = stations[stationId].station_info;
                        mapInstance.setView([lat, lng], 15);
                    }
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
            
    // === CORRECTED IDW INTERPOLATION - ONLY REAL STATIONS ===
    const calculateIDWInterpolation = useCallback((locationData, stations) => {
        console.log('🔍 Starting IDW calculation with ONLY real stations...');
        
        // FIXED: Only use the 2 real stations for interpolation
        const realStationIds = ['lora-v1', 'loradev2'];
        const realStations = {};
        
        realStationIds.forEach(id => {
            if (stations[id] && stations[id].averages) {
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
            co: 0, o3: 0, nh3: 0
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

            // Avoid division by zero
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
    
    // === DATA FETCHING - CORRECTED ===
    const fetchRealtimeData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/map/realtime/`);
            if (!response.ok) throw new Error('Failed to fetch data');
            
            const data = await response.json();
            
            // FIXED: Only show real stations with data, and coming soon stations without data
            const processedStations = {};
            
            // Add real stations with data
            if (data.stations['lora-v1']) {
                processedStations['lora-v1'] = data.stations['lora-v1'];
            }
            if (data.stations['loradev2']) {
                processedStations['loradev2'] = data.stations['loradev2'];
            }
            
            // Add coming soon stations (location only)
            ['temp-1', 'temp-2', 'temp-3'].forEach(id => {
                if (data.stations[id]) {
                    processedStations[id] = {
                        station_info: data.stations[id].station_info,
                        averages: null,
                        highest_sub_index: null,
                        is_coming_soon: true
                    };
                }
            });
            
            setStations(processedStations);
            
            // Set default selection to first real station
            if (!selectedStationId) {
                const realStations = Object.keys(processedStations).filter(id => !id.startsWith('temp-'));
                if (realStations.length > 0) {
                    setSelectedStationId(realStations[0]);
                }
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
        if (userLocation && Object.keys(stations).length > 0) {
            console.log('🔍 Calculating user location data with ONLY real stations for interpolation...');
            
            // FIXED: Only use real stations for distance calculation and interpolation
            const realStationIds = ['lora-v1', 'loradev2'];
            const realStations = {};
            
            realStationIds.forEach(id => {
                if (stations[id] && stations[id].averages) {
                    realStations[id] = stations[id];
                }
            });
            
            if (Object.keys(realStations).length === 0) {
                console.warn('⚠️ No real stations available');
                return;
            }
            
            // Calculate distances to ONLY real stations
            let nearestDist = Infinity;
            let nearestId = null;
            
            Object.entries(realStations).forEach(([id, station]) => {
                const dist = calculateDistance(
                    userLocation.lat, 
                    userLocation.lng, 
                    station.station_info.lat, 
                    station.station_info.lng
                );
                
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

            console.log(`📍 Nearest real station: ${nearestId} at ${nearestDist.toFixed(2)}m`);
            
            // Check if user is within 2km of any real station for interpolation
            if (nearestDist <= 2.0) {
                // Within 2km - use interpolation with ONLY real stations
                const idwResult = calculateIDWInterpolation(userLocation, realStations);
                
                setUserLocationData({
                    method: 'location_interpolation',
                    source: 'interpolated',
                    values: idwResult.interpolated_values,
                    aqi: idwResult.interpolated_aqi,
                    station_name: `Your Location`,
                    is_interpolated: true,
                    distance_to_nearest: nearestDist,
                    nearest_station_name: realStations[nearestId]?.station_info?.name,
                    stations_used_for_calculation: Object.keys(realStations)
                });
                
                console.log('✅ Using interpolated data from real stations:', idwResult);
            } else {
                // Beyond 5km from all real sensors - show nearest real station data
                const nearestStationData = realStations[nearestId];
                
                setUserLocationData({
                    method: 'nearest_station',
                    source: 'nearest_station',
                    values: nearestStationData.averages || {},
                    aqi: nearestStationData.highest_sub_index || 50,
                    station_name: nearestStationData.station_info.name,
                    is_interpolated: false,
                    distance_to_nearest: nearestDist,
                    nearest_station_name: nearestStationData.station_info.name,
                    distance_warning: `You are ${nearestDist.toFixed(1)}km away from sensors`
                });
                
                console.log('✅ Using nearest real station data (beyond 1km):', nearestStationData.station_info.name);
            }
        }
    }, [userLocation, stations, calculateIDWInterpolation]);
    
    // === FORECAST DATA FETCHING ===
    useEffect(() => {
        if (!selectedStationId || selectedStationId.startsWith('temp-')) return;
        
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
            const isComingSoon = station.is_coming_soon;
            
            const marker = window.L.marker([lat, lng], { 
                icon: createAqiIcon(station.highest_sub_index, isComingSoon) 
            }).addTo(mapInstance);
            
            // Enhanced popup with different content for coming soon vs real stations
            const popupContent = createStationPopupContent(station, id);
            marker.bindPopup(popupContent, {
                maxWidth: 300,
                className: isComingSoon ? 'coming-soon-popup' : 'real-station-popup'
            });
            
            marker.on('click', () => {
                if (isComingSoon) {
                    // Show coming soon message
                    alert(`${station.station_info.name} is coming soon! This station is under development.`);
                } else {
                    setSelectedStationId(id);
                    if (isMobile) {
                        setActiveTab('details');
                        setShowMobileMenu(true);
                        setIsBottomSheetCollapsed(false);
                    }
                    mapInstance.setView([lat, lng], 15);
                }
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
        // Only allow selection of real stations
        if (['lora-v1', 'loradev2'].includes(stationId)) {
            setSelectedStationId(stationId);
            if (isMobile) {
                setActiveTab('details');
                setIsBottomSheetCollapsed(false);
            }
        } else {
            // Show coming soon message for temp stations
            const station = stations[stationId];
            if (station) {
                alert(`${station.station_info.name} is coming soon! This station is under development and will be operational soon.`);
            }
        }
    }, [isMobile, stations]);

    // NEW: Handle full screen toggle
    const toggleFullScreenMap = useCallback(() => {
        setIsFullScreenMap(!isFullScreenMap);
        if (!isFullScreenMap) {
            // Going to full screen
            setShowMobileMenu(false);
        }
    }, [isFullScreenMap]);

    // NEW: Handle bottom sheet collapse
    const toggleBottomSheetCollapse = useCallback(() => {
        setIsBottomSheetCollapsed(!isBottomSheetCollapsed);
    }, [isBottomSheetCollapsed]);

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

    // Filter real stations vs coming soon stations
    const realStations = Object.entries(stations).filter(([id, station]) => !station.is_coming_soon);
    const comingSoonStations = Object.entries(stations).filter(([id, station]) => station.is_coming_soon);

    // Mobile Tab Content Renderer
    const renderMobileTabContent = () => {
        switch (activeTab) {
            case 'stations':
                return (
                    <div className="mobile-tab-content">
                        <div className="mobile-section">
                            <div className="section-header">
                                <h3><i className="fas fa-broadcast-tower"></i> Live Stations</h3>
                                <span className="live-indicator">🔴 LIVE</span>
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
                                    <button onClick={fetchRealtimeData} className="retry-btn">please refresh.</button>
                                </div>
                            ) : (
                                <div className="station-grid">
                                    {realStations.map(([id, station]) => (
                                        <button 
                                            key={id} 
                                            className={`station-card ${selectedStationId === id ? 'active' : ''}`} 
                                            onClick={() => handleStationSelect(id)}
                                        >
                                            <div className="station-header">
                                                <h4>{station.station_info.name}</h4>
                                                <div className="live-badge">🟢 LIVE</div>
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

                        <div className="mobile-section">
                            <div className="section-header">
                                <h3><i className="fas fa-clock"></i> Coming Soon</h3>
                                <span className="coming-soon-count">{comingSoonStations.length} stations</span>
                            </div>
                            
                            <div className="coming-soon-grid">
                                {comingSoonStations.map(([id, station]) => (
                                    <div key={id} className="coming-soon-card" onClick={() => handleStationSelect(id)}>
                                        <div className="station-header">
                                            <h4>{station.station_info.name}</h4>
                                            <div className="coming-soon-badge">🚧 Soon</div>
                                        </div>
                                        <div className="coming-soon-info">
                                            <span>Under Development</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'details':
                return (
                    <div className="mobile-tab-content">
                        {selectedStationData && !selectedStationData.is_coming_soon ? (
                            <>
                                <div className="mobile-section-header">
                                    <div className="station-title">
                                        <h3><i className="fas fa-chart-bar"></i> {selectedStationData.station_info.name}</h3>
                                        <div className="live-badge">🟢 LIVE</div>
                                    </div>
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
                                    <h4><i className="fas fa-thermometer-half"></i> Current Readings</h4>
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
                                        <h4><i className="fas fa-chart-line"></i> 4-Day Forecast</h4>
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
                                <i className="fas fa-satellite-dish"></i>
                                <h3>Select a Live Station</h3>
                                <p>Choose a monitoring station with live data to view detailed information</p>
                                <button 
                                    className="select-station-btn"
                                    onClick={() => setActiveTab('stations')}
                                >
                                    <i className="fas fa-broadcast-tower"></i>
                                    View Live Stations
                                </button>
                            </div>
                        )}
                    </div>
                );

            case 'user':
                return (
                    <div className="mobile-tab-content">
                        <div className="mobile-section-header">
                            <h3><i className="fas fa-map-marker-alt"></i> Your Location Data</h3>
                        </div>
                        
                        {user ? (
                            userLocation && userLocationData && nearestStation ? (
                                <div className="mobile-user-data">
                                    <div className="mobile-user-aqi">
                                        <div 
                                            className="user-aqi-circle"
                                            style={{ backgroundColor: getAQIColor(userLocationData.aqi) }}
                                        >
                                            <span className="aqi-number">{Math.round(userLocationData.aqi)}</span>
                                            <span className="aqi-label">AQI</span>
                                        </div>
                                        <div className="user-location-info">
                                            <div className="location-method">
                                                {userLocationData.is_interpolated ? 
                                                    '🎯 Calculated for your location' : 
                                                    `📍 From ${userLocationData.station_name}`
                                                }
                                            </div>
                                            
                                            <div className="distance-info">
                                                {/* This check prevents the crash */}
                                                {nearestStation && nearestStation.distance != null ? (
                                                    `📏 ${nearestStation.distance.toFixed(1)}km from nearest sensor`
                                                ) : (
                                                    '📏 Calculating distance...'
                                                )}
                                            </div>
                                            {userLocationData.distance_warning && (
                                                <div className="distance-warning">
                                                    ⚠️ {userLocationData.distance_warning}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* User's readings */}
                                    <div className="mobile-readings-section">
                                        <h4><i className="fas fa-user-circle"></i> Your Air Quality</h4>
                                        <div className="mobile-readings-grid">
                                            {pollutants.map(p => (
                                                <div className="mobile-reading-card user-reading" key={p.key}>
                                                    <div className="reading-label">{p.name}</div>
                                                    <div className="reading-value">
                                                        {(userLocationData.values?.[p.key]?.toFixed(2)) ?? 'N/A'}
                                                        <span>µg/m³</span>
                                                    </div>
                                                    <div className="data-source-badge">
                                                        {userLocationData.is_interpolated ? '🎯' : '📍'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Methodology info */}
                                    <div className="methodology-section">
                                        
                                        <div className="methodology-card">
                                            {userLocationData.is_interpolated ? (
                                                <>
                                                   
                                                </>
                                            ) : (
                                                <>
                                                    <div className="method-item">
                                                        
                                                    </div>
                                                    <div className="method-item">
                                                        
                                                        
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mobile-location-prompt">
                                    <div className="location-prompt-content">
                                        <i className="fas fa-map-marker-alt location-icon"></i>
                                        <h4>Get Your Air Quality Data</h4>
                                        <p>Enable location to see personalized air quality data calculated from our real sensors</p>
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
                                </div>
                            )
                        ) : (
                            <div className="mobile-login-prompt">
                                <div className="login-prompt-content">
                                    <i className="fas fa-lock login-icon"></i>
                                    <h4>Login Required</h4>
                                    <p>Login to view personalized AQI data for your location</p>
                                    <Link to="/login" className="mobile-login-btn">
                                        <i className="fas fa-sign-in-alt"></i>
                                        Login Now
                                    </Link>
                                </div>
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
            {/* Optimized Navbar */}
            <nav className="navbar">
                <div className="navbar-content">
                    <Link to="/" className="navbar-brand">
                        <img src={logoImage} alt="AQM Logo" width={isMobile ? "28" : "36"} height={isMobile ? "28" : "36"} />
                        <span>AirAware</span>
                    </Link>
                    
                    {!isMobile && (
                        <div className="nav-center">
                            <ul className="nav-links">
                                <li><Link to="/" className="nav-link">🏠 Home</Link></li>
                                <li><Link to="/map" className="nav-link active">Live Map</Link></li>
                                {user && (
                                    <>
                                       {/*<li><Link to="/dashboard" className="nav-link">Dashboard</Link></li>
                                        <li><Link to="/add-family" className="nav-link">Family</Link></li>*/}
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
                <div className={`map-container ${isFullScreenMap ? 'full-screen' : ''}`}>
                    <div id="map" ref={mapRef} className="map-element"></div>
                    
                    {/* Map Controls */}
                    <button 
                        onClick={trackUserLocation} 
                        className={`my-location-btn ${isLocationLoading ? 'loading' : ''}`}
                        title="Find My Location"
                        disabled={isLocationLoading}
                    >
                        {isLocationLoading ? (
                            <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                            <i className="fas fa-crosshairs"></i>
                        )}
                    </button>

                    {/* NEW: Mobile Map Controls */}
                    {isMobile && (
                        <div className="mobile-map-controls">
                            {/* Full Screen Toggle */}
                            <button 
                                className="mobile-control-btn full-screen-btn"
                                onClick={toggleFullScreenMap}
                                title={isFullScreenMap ? "Exit Full Screen" : "Full Screen Map"}
                            >
                                <i className={`fas ${isFullScreenMap ? 'fa-compress' : 'fa-expand'}`}></i>
                            </button>

                            {/* Menu Toggle (only show when not in full screen) */}
                            {!isFullScreenMap && (
                                <button 
                                    className="mobile-control-btn menu-toggle-btn"
                                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                                    title="Toggle Menu"
                                >
                                    <i className={`fas ${showMobileMenu ? 'fa-times' : 'fa-bars'}`}></i>
                                </button>
                            )}

                            {/* Quick Exit Full Screen Overlay */}
                            {isFullScreenMap && (
                                <button 
                                    className="full-screen-exit-overlay"
                                    onClick={toggleFullScreenMap}
                                >
                                    <i className="fas fa-compress"></i>
                                    <span>Exit Full Screen</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Desktop Layout */}
                {!isMobile && (
                    <>
                        {/* LEFT PANEL - Optimized */}
                        <div className="sidebar-panel">
                            <div className="panel-content">
                                {/* User Location Panel - Optimized */}
                                {user && userLocation && userLocationData && nearestStation && (
                                    <div className="user-location-section">
                                        <div className="section-title">
                                            <i className="fas fa-map-marker-alt"></i>
                                            <span>Your Location</span>
                                        </div>
                                        <div className="user-aqi-card">
                                            <div className="user-aqi-main">
                                                <div className="aqi-circle" style={{ backgroundColor: getAQIColor(userLocationData.aqi) }}>
                                                    <span className="aqi-value">{Math.round(userLocationData.aqi)}</span>
                                                    <span className="aqi-label">AQI</span>
                                                </div>
                                                <div className="location-details">
                                                    <div className="location-status">
                                                        {userLocationData.is_interpolated ? 
                                                            '🎯 Calculated for your exact location' : 
                                                            `📍 From ${userLocationData.nearest_station_name}`
                                                        }
                                                    </div>
                                                    <div className="distance-info">
                                                        📏 {nearestStation.distance.toFixed(1)}km from nearest sensor
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Quick readings */}
                                            <div className="quick-readings">
                                                <div className="quick-reading">
                                                    <span>PM2.5</span>
                                                    <span>{userLocationData.values?.pm25?.toFixed(1) || 'N/A'}</span>
                                                    <span className="data-badge">{userLocationData.is_interpolated ? '🎯' : '📍'}</span>
                                                </div>
                                                <div className="quick-reading">
                                                    <span>PM10</span>
                                                    <span>{userLocationData.values?.pm10?.toFixed(1) || 'N/A'}</span>
                                                    <span className="data-badge">{userLocationData.is_interpolated ? '🎯' : '📍'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                               
                                {/* Station List - Optimized */}
                                <div className="stations-section">
                                    <div className="section-title">
                                        <i className="fas fa-broadcast-tower"></i>
                                        <span>Live Monitoring Stations</span>
                                        <div className="live-indicator">🔴 LIVE</div>
                                    </div>
                                    
                                    {isLoading ? (
                                        <div className="section-loader">
                                            <div className="loading-spinner"></div>
                                            <p>Loading stations...</p>
                                        </div>
                                    ) : error ? (
                                        <div className="section-error">
                                            <i className="fas fa-exclamation-triangle"></i>
                                            <p>Error: {error}</p>
                                            <button onClick={fetchRealtimeData} className="retry-btn">
                                                <i className="fas fa-redo"></i>
                                                Retry
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="station-list">
                                                {realStations.map(([id, station]) => (
                                                    <button 
                                                        key={id} 
                                                        className={`station-item ${selectedStationId === id ? 'active' : ''}`} 
                                                        onClick={() => handleStationSelect(id)}
                                                    >
                                                        <div className="station-content">
                                                            <div className="station-name">
                                                                {station.station_info.name}
                                                                <span className="live-dot">🟢</span>
                                                            </div>
                                                            <div 
                                                                className="station-aqi" 
                                                                style={{ backgroundColor: getAQIColor(station.highest_sub_index) }}
                                                            >
                                                                {Math.round(station.highest_sub_index) || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            
                                            {/* Coming Soon Stations */}
                                            <div className="coming-soon-section">
                                                <div className="section-subtitle">
                                                    <i className="fas fa-clock"></i>
                                                    <span>Expanding Soon</span>
                                                </div>
                                                <div className="coming-soon-list">
                                                    {comingSoonStations.map(([id, station]) => (
                                                        <div key={id} className="coming-soon-item" onClick={() => handleStationSelect(id)}>
                                                            <div className="station-name">
                                                                {station.station_info.name}
                                                                <span className="coming-soon-dot">🚧</span>
                                                            </div>
                                                            <div className="coming-soon-status">Soon</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {!user && (
                                    <div className="login-section">
                                        <div className="login-card">
                                            <div className="login-icon">
                                                <i className="fas fa-user-circle"></i>
                                            </div>
                                            <h3>Personal Location Data</h3>
                                            <p>Login to view AQI data calculated for your exact location</p>
                                            <Link to="/login" className="login-cta-btn">
                                                <i className="fas fa-sign-in-alt"></i>
                                                Login to Access
                                            </Link>
                                        </div>
                                    </div>
                                )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        

                        {/* RIGHT PANEL - Optimized */}
                        <div className="details-panel">
                            <div className="panel-content">
                                {selectedStationData && !selectedStationData.is_coming_soon ? (
                                    <div className="station-details">
                                        {/* Station Header - Compact */}
                                        <div className="details-header">
                                            <div className="station-title">
                                                <h2>{selectedStationData.station_info.name}</h2>
                                                <div className="live-badge">🟢 LIVE DATA</div>
                                            </div>
                                            <div className="current-aqi">
                                                <span 
                                                    className="aqi-display"
                                                    style={{ backgroundColor: getAQIColor(selectedStationData.highest_sub_index) }}
                                                >
                                                    {Math.round(selectedStationData.highest_sub_index)}
                                                </span>
                                                <span className="aqi-status-text">
                                                    {getAQIStatus(selectedStationData.highest_sub_index)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Current Readings - Compact Grid */}
                                        <div className="readings-section">
                                            <h3><i className="fas fa-thermometer-half"></i> Current Readings</h3>
                                            <div className="readings-grid">
                                                {pollutants.map(p => (
                                                    <div className="reading-card" key={p.key}>
                                                        <div className="reading-label">{p.name}</div>
                                                        <div className="reading-value">
                                                            {(selectedStationData.averages?.[p.key]?.toFixed(2)) ?? 'N/A'}
                                                            <span className="reading-unit">µg/m³</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Forecast Section - Compact */}
                                        <div className="forecast-section">
                                            <div className="forecast-header">
                                                <h3><i className="fas fa-chart-line"></i> 4-Day Forecast</h3>
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
                                            
                                            <div className="chart-container">
                                                {isForecastLoading ? (
                                                    <div className="chart-loader">
                                                        <div className="loading-spinner"></div>
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
                                                 {/* Login Prompt - Optimized */}
                                

                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-selection">
                                        <div className="no-selection-content">
                                            <i className="fas fa-satellite-dish"></i>
                                            <h2>Select a Live Station</h2>
                                            <p>Choose a monitoring station from the sidebar to view real-time air quality data, current readings, and forecast information.</p>
                                            <div className="station-info-grid">
                                                <div className="info-item">
                                                    <span className="info-icon">🟢</span>
                                                    <span>Live stations provide real-time data</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-icon">🚧</span>
                                                    <span>More stations coming soon</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Mobile Bottom Sheet - Optimized with Collapse Feature */}
                {isMobile && !isFullScreenMap && (
                    <div className={`mobile-bottom-sheet ${showMobileMenu ? 'open' : ''} ${isBottomSheetCollapsed ? 'collapsed' : ''}`}>
                        {/* Collapse/Expand Handle */}
                        <div className="bottom-sheet-handle" onClick={toggleBottomSheetCollapse}>
                            <div className="handle-bar"></div>
                            <div className="handle-text">
                                {isBottomSheetCollapsed ? 'Tap to expand' : 'Tap to minimize'}
                            </div>
                            <i className={`fas ${isBottomSheetCollapsed ? 'fa-chevron-up' : 'fa-chevron-down'} handle-icon`}></i>
                        </div>

                        {/* Mobile Tab Navigation */}
                        <div className="mobile-tab-nav">
                            <button 
                                className={`mobile-tab-btn ${activeTab === 'stations' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('stations');
                                    setIsBottomSheetCollapsed(false);
                                }}
                            >
                                <i className="fas fa-broadcast-tower"></i>
                                <span>Stations</span>
                            </button>
                            <button 
                                className={`mobile-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('details');
                                    setIsBottomSheetCollapsed(false);
                                }}
                            >
                                <i className="fas fa-chart-bar"></i>
                                <span>Details</span>
                            </button>
                            <button 
                                className={`mobile-tab-btn ${activeTab === 'user' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('user');
                                    setIsBottomSheetCollapsed(false);
                                }}
                            >
                                <i className="fas fa-map-marker-alt"></i>
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
        </div>
    );
};

export default MapPage;