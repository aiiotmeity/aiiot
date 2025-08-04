import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import './css/HealthReport.css';

const LazyChart = React.lazy(() => import('./LazyChart'));

// --- Helper Functions ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#10b981';
    if (aqi <= 100) return '#f59e0b';
    if (aqi <= 150) return '#ef4444';
    return '#7c2d12';
};

const getAQIStatus = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy';
    return 'Hazardous';
};

// --- CORRECTED: IDW Interpolation Function ---
const calculateIDWInterpolation = (userLocation, stations) => {
    console.log('🔍 Health Report: Starting IDW calculation...');
    
    if (!userLocation || !stations || Object.keys(stations).length === 0) {
        console.warn('⚠️ Health Report: No valid data for interpolation');
        return {
            interpolated_values: {},
            interpolated_aqi: 50,
            stations_used: 0,
            method: 'fallback'
        };
    }
    
    // Use real stations only
    const realStationIds = ['lora-v1', 'loradev2'];
    const realStations = {};
    
    realStationIds.forEach(id => {
        if (stations[id]) {
            realStations[id] = stations[id];
        }
    });
    
    console.log('📊 Health Report: Real stations for interpolation:', Object.keys(realStations));
    
    if (Object.keys(realStations).length === 0) {
        console.warn('⚠️ Health Report: No real stations available for interpolation');
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
            userLocation.lat,
            userLocation.lng,
            station.station_info.lat,
            station.station_info.lng
        );

        console.log(`📍 Health Report: Station ${stationId}: ${distance.toFixed(2)}km away`);

        const safeDistance = Math.max(distance, 0.001);
        const weight = 1.0 / (safeDistance ** 2);
        totalWeight += weight;

        const averages = station.averages || {};
        Object.keys(weightedValues).forEach(param => {
            if (averages[param] !== undefined) {
                weightedValues[param] += averages[param] * weight;
            }
        });

        weightedAqi += (station.highest_sub_index || 0) * weight;
    });

    const interpolated_values = {};
    Object.keys(weightedValues).forEach(param => {
        interpolated_values[param] = totalWeight > 0 ? 
            Math.round((weightedValues[param] / totalWeight) * 100) / 100 : 0;
    });

    const interpolated_aqi = totalWeight > 0 ? 
        Math.round(weightedAqi / totalWeight) : 50;

    console.log('✅ Health Report: IDW Result:', {
        interpolated_aqi,
        stations_used: Object.keys(realStations).length
    });

    return {
        interpolated_values,
        interpolated_aqi,
        stations_used: Object.keys(realStations).length,
        method: 'idw'
    };
};

// --- Get User Location Function ---
const getUserLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    source: 'gps',
                    timestamp: Date.now()
                };
                
                if (isNaN(location.lat) || isNaN(location.lng)) {
                    reject(new Error('Invalid GPS coordinates'));
                    return;
                }
                
                resolve(location);
            },
            (error) => {
                reject(error);
            },
            { 
                enableHighAccuracy: true, 
                timeout: 10000, 
                maximumAge: 300000
            }
        );
    });
};

// Health Recommendations based on AQI and Health Risk Level
const getHealthRecommendations = (aqi, healthRiskLevel) => {
    const baseRecommendations = {
        good: {
            general: [
                '🌟 Perfect air quality - enjoy all outdoor activities',
                '🚶‍♂️ Great time for outdoor exercise and sports',
                '🪟 Open windows to let fresh air in',
                '👶 Safe conditions for children to play outside'
            ],
            sensitive: [
                '✅ Excellent conditions for people with respiratory issues',
                '🏃‍♀️ No restrictions on outdoor activities',
                '💨 Breathe easy - air quality is optimal'
            ]
        },
        moderate: {
            general: [
                '⚠️ Air quality is acceptable for most people',
                '🏃‍♂️ Reduce prolonged outdoor exertion if sensitive',
                '😷 Consider wearing a mask during heavy traffic hours',
                '🌅 Best outdoor times: early morning and late evening'
            ],
            sensitive: [
                '⚠️ Limit prolonged outdoor activities',
                '😷 Wear N95 mask when going outside',
                '🏠 Stay indoors during peak pollution hours',
                '💊 Keep rescue medications readily available'
            ]
        },
        unhealthy: {
            general: [
                '🚨 Avoid prolonged outdoor activities',
                '🏠 Stay indoors as much as possible',
                '😷 Wear N95 mask if you must go outside',
                '🪟 Keep windows and doors closed'
            ],
            sensitive: [
                '🚨 URGENT: Stay indoors immediately',
                '🏥 Seek medical attention if experiencing symptoms',
                '😷 Mandatory N95 mask for any outdoor exposure',
                '📞 Contact doctor if breathing difficulties occur'
            ]
        },
        hazardous: {
            general: [
                '🚨 EMERGENCY: Avoid all outdoor activities',
                '🏠 Remain indoors with air purification',
                '😷 N95 mask mandatory for any exposure',
                '🏥 Seek immediate medical help for symptoms'
            ],
            sensitive: [
                '🚨 HEALTH EMERGENCY: Immediate indoor shelter',
                '🏥 Seek emergency medical attention',
                '📞 Call emergency services if severe symptoms',
                '🚗 Consider relocation to cleaner air area'
            ]
        }
    };

    // Determine category
    let category = 'good';
    if (aqi > 150) category = 'hazardous';
    else if (aqi > 100) category = 'unhealthy'; 
    else if (aqi > 50) category = 'moderate';

    // Determine if user is sensitive based on health risk level
    const isSensitive = healthRiskLevel === 'High' || healthRiskLevel === 'Critical';
    
    return {
        recommendations: isSensitive ? baseRecommendations[category].sensitive : baseRecommendations[category].general,
        isSensitive,
        category,
        isEmergency: category === 'hazardous' || (category === 'unhealthy' && isSensitive)
    };
};

// Emergency contacts based on AQI level
const getEmergencyContacts = (aqi) => {
    if (aqi <= 100) return null;
    
    return {
        primary: {
            name: 'Kerala Pollution Control Board',
            number: '0471-2418566',
            description: '24/7 Air Quality Emergency Hotline'
        },
        medical: {
            name: 'Medical Emergency',
            number: '108',
            description: 'Immediate medical assistance'
        },
        poison: aqi > 150 ? {
            name: 'Poison Control',
            number: '1066',
            description: 'Pollution-related health emergencies'
        } : null
    };
};

function HealthReport() {
    const { user } = useAuth();
    const [username] = useState(user?.name || null);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // --- State for location and interpolation ---
    const [userLocation, setUserLocation] = useState(null);
    const [nearestStation, setNearestStation] = useState(null);
    const [interpolatedData, setInterpolatedData] = useState(null);
    const [locationStatus, setLocationStatus] = useState('initializing');
    const [currentDataInfo, setCurrentDataInfo] = useState(null);
    
    // --- Forecast parameter selection ---
    const [selectedParameter, setSelectedParameter] = useState('pm25');

    const navigate = useNavigate();
    const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://airaware-app-gcw7.onrender.com' 
    : 'http://localhost:8000';

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchReportData = useCallback(async () => {
        if (!username) { navigate('/login'); return; }
        setLoading(true);
        try {
            const url = `${API_BASE_URL}/api/health-report/?username=${username}`;
            const response = await fetch(url);
            if (!response.ok) {
                const errData = await response.json();
                if (errData.redirect_to) navigate(errData.redirect_to);
                throw new Error(errData.error);
            }
            const data = await response.json();
            setReportData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [username, navigate, API_BASE_URL]);

    // --- Get user location ---
    const getUserLocationForReport = useCallback(async () => {
        try {
            setLocationStatus('detecting');
            const location = await getUserLocation();
            setUserLocation(location);
            setLocationStatus('gps_detected');
            console.log('📍 Health Report: Location obtained:', location);
        } catch (error) {
            console.log('📍 Health Report: Location detection failed:', error);
            setLocationStatus('failed');
        }
    }, []);

    useEffect(() => {
        fetchReportData();
        getUserLocationForReport();
    }, [fetchReportData, getUserLocationForReport]);

    // --- Process location and interpolation ---
    useEffect(() => {
        if (userLocation && reportData?.stations) {
            console.log('🔄 Health Report: Processing location and stations data...');
            
            const stations = reportData.stations;
            
            // Use real stations only for calculations
            const realStationIds = ['lora-v1', 'loradev2'];
            const realStations = {};
            
            realStationIds.forEach(id => {
                if (stations[id]) {
                    realStations[id] = stations[id];
                }
            });
            
            if (Object.keys(realStations).length === 0) {
                console.warn('⚠️ Health Report: No real stations available');
                return;
            }
            
            // Find nearest real station - FIXED NULL CHECK
            let nearestDist = Infinity, nearestId = null;
            Object.entries(realStations).forEach(([id, station]) => {
                if (station && station.station_info) {
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
                }
            });
            
            if (nearestId && realStations[nearestId]) {
                setNearestStation({ 
                    id: nearestId, 
                    distance: nearestDist,
                    station: realStations[nearestId]
                });

                console.log(`📍 Health Report: Nearest real station: ${nearestId} at ${nearestDist.toFixed(2)}km`);

                // Check if user is within 1km of any real station
                const isWithinSensorRange = nearestDist <= 1.0;
                
                if (isWithinSensorRange) {
                    // User is within 1km - use interpolation
                    const idwResult = calculateIDWInterpolation(userLocation, realStations);
                    
                    setInterpolatedData({ 
                        aqi: idwResult.interpolated_aqi,
                        values: idwResult.interpolated_values
                    });
                    
                    setCurrentDataInfo({
                        method: 'location_interpolation',
                        source: 'interpolated',
                        explanation: `You are ${nearestDist.toFixed(1)}km from the nearest real sensor. Showing calculated air quality for your exact location using data from the 2 real monitoring stations only.`,
                        values: idwResult.interpolated_values,
                        aqi: idwResult.interpolated_aqi,
                        station_name: `Your Location (Calculated from Real Stations)`,
                        is_interpolated: true,
                        distance: nearestDist,
                        data_type: 'Your Location Data (Real Sensor Interpolation)',
                        stations_used_for_calculation: Object.keys(realStations)
                    });
                    
                    console.log('✅ Health Report: Using interpolated data from real stations - AQI:', idwResult.interpolated_aqi);
                } else {
                    // User is >1km away - use nearest real station
                    const nearestStationData = realStations[nearestId];
                    
                    setCurrentDataInfo({
                        method: 'nearest_station',
                        source: 'nearest_station',
                        explanation: `You are ${nearestDist.toFixed(1)}km from the nearest real sensor. Too far for accurate interpolation - showing data from ${nearestStationData.station_info.name} (nearest real monitoring station).`,
                        values: nearestStationData.averages || {},
                        aqi: nearestStationData.highest_sub_index || 50,
                        station_name: nearestStationData.station_info.name,
                        is_interpolated: false,
                        distance: nearestDist,
                        data_type: 'Nearest Real Station Data',
                        distance_warning: nearestDist > 1.0 ? `You are ${nearestDist.toFixed(1)}km away from real sensors, so you cannot get interpolated values for your exact location.` : null
                    });
                    
                    console.log('✅ Health Report: Using nearest real station data - AQI:', nearestStationData.highest_sub_index);
                }
            }
        } else if (reportData?.stations) {
            // No location - use default station (prefer real station)
            const stations = reportData.stations;
            const defaultStation = stations['lora-v1'] || stations['loradev2'] || stations[Object.keys(stations)[0]] || {};
            
            setCurrentDataInfo({
                method: 'default_station',
                source: 'default',
                explanation: 'Location not available. Showing data from default real monitoring station.',
                values: defaultStation.averages || {},
                aqi: defaultStation.highest_sub_index || 50,
                station_name: defaultStation.station_info?.name || 'ASIET Campus Station',
                is_interpolated: false,
                distance: null,
                data_type: 'Default Real Station Data'
            });
            
            console.log('✅ Health Report: Using default real station data');
        }
    }, [userLocation, reportData]);

    // --- Memoized calculations ---
    const displayAqi = useMemo(() => {
        if (currentDataInfo?.is_interpolated && interpolatedData) {
            return interpolatedData.aqi;
        } else if (currentDataInfo?.aqi) {
            return currentDataInfo.aqi;
        } else {
            return Object.values(reportData?.stations || {})[0]?.highest_sub_index || 0;
        }
    }, [currentDataInfo, interpolatedData, reportData]);

    const healthRecommendations = useMemo(() => {
        if (!reportData?.health_assessment) return null;
        return getHealthRecommendations(displayAqi, reportData.health_assessment.risk_level);
    }, [displayAqi, reportData]);

    const emergencyContacts = useMemo(() => {
        return getEmergencyContacts(displayAqi);
    }, [displayAqi]);

    const aqiStatus = useMemo(() => {
        const status = getAQIStatus(displayAqi);
        const color = getAQIColor(displayAqi);
        return { status, color };
    }, [displayAqi]);

    // --- FIXED: Format forecast data with proper date handling ---
    const forecastData = useMemo(() => {
        if (!nearestStation || !reportData?.forecasts) return [];
        
        const forecast = reportData.forecasts[nearestStation.id];
        if (!forecast || !forecast.data) return [];
        
        // Add proper date formatting
        return forecast.data.map((item, index) => ({
            ...item,
            displayDay: index === 0 ? 'Today' : 
                      index === 1 ? 'Tomorrow' : 
                      `Day ${index + 1}`,
            formattedDate: item.day ? new Date(item.day).toLocaleDateString('en-IN', { 
                month: 'short', 
                day: 'numeric' 
            }) : `Day ${index + 1}`
        }));
    }, [nearestStation, reportData]);

    // Event handlers
    const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
    const handleLogout = useCallback(() => {
        localStorage.clear();
        navigate('/login');
    }, [navigate]);

    const handleRefresh = useCallback(() => {
        fetchReportData();
        getUserLocationForReport();
    }, [fetchReportData, getUserLocationForReport]);


    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    const handleParameterChange = useCallback((param) => {
        setSelectedParameter(param);
    }, []);

    if (loading) return <div className="panel-loader"><h2>🏥 Generating Your Health Report...</h2><div className="loading-spinner"></div></div>;

    if (error) return (
      <div className="error-message">
        <h2>⚠️ Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')} className="retry-btn">
          📊 Go to Dashboard
        </button>
      </div>
    );

    if (!reportData) return <div className="error-message"><h2>📊 No Report Data</h2><p>Unable to generate your health report at this time.</p></div>;

    // --- FIX [START]: Add a loading check for currentDataInfo ---
    // This ensures derived data is ready before rendering the report body.
    if (!currentDataInfo) {
        return (
            <div className="panel-loader">
                <h2>🔄 Processing Location Data...</h2>
                <div className="loading-spinner"></div>
            </div>
        );
    }
    // --- FIX [END] ---

    const { health_assessment, stations, forecasts } = reportData;

    return (
        <div className="report-page">
            {/* Real-time Status Bar */}
            <div className="realtime-status">
                🔴 LIVE HEALTH REPORT • Updated: {currentTime.toLocaleTimeString('en-IN')} • 
                {currentDataInfo?.is_interpolated ? ' Smart Real Sensor Analysis' : ' Government Standards Applied'}
            </div>

            {/* Navigation */}
            <nav className="navbar">
                <div className="navbar-content">
                    <Link to="/" className="navbar-brand">
                        <img src="/aqi.webp" alt="AQM Logo" width="40" height="40" style={{ marginRight: '12px' }} />
                        AirAware Kerala
                    </Link>

                    <div className="menu-toggle" onClick={toggleMenu}>☰</div>

                    <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
                        <li><Link to="/" className="nav-link">🏠 Home</Link></li>
                        <li><Link to="/dashboard" className="nav-link">Profile</Link></li>
                        <li><Link to="/health-assessment" className="nav-link">📋 Health Update</Link></li>
                        <li><Link to="/add-family" className="nav-link">👥 Add Family</Link></li>
                        <li><Link to="/map" className="nav-link">🗺️ Live Map</Link></li>
                        <li className="user-info">👤 <span>{username}</span></li>
                        <li>
                            <button onClick={handleLogout} className="nav-link login-btn">🚪 Logout</button>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* Health Alert Banner */}
            {healthRecommendations?.isEmergency && (
                <div className="emergency-alert-banner">
                    🚨 <strong>HEALTH EMERGENCY ALERT:</strong> 
                    AQI {Math.round(displayAqi)} - {aqiStatus.status} conditions detected.
                    {healthRecommendations.isSensitive && ' High-risk individual - immediate action required!'}
                </div>
            )}

            {/* Alert Banner */}
            <div className={`alert-banner ${aqiStatus.status.toLowerCase()}`} style={{ backgroundColor: getAQIColor(displayAqi) + '20', borderBottom: `3px solid ${getAQIColor(displayAqi)}` }}>
                ℹ️ <span>
                    <strong>CURRENT AIR QUALITY:</strong> 
                    {currentDataInfo?.is_interpolated ? ' Your Location (Real Sensors)' : ' Nearest Real Station'} AQI is {Math.round(displayAqi)} - {aqiStatus.status}
                    {currentDataInfo?.distance && ` • Distance: ${currentDataInfo.distance.toFixed(1)}km from nearest real sensor`}
                    {currentDataInfo?.distance_warning && (
                        <div className="distance-warning-inline">
                            ⚠️ {currentDataInfo.distance_warning}
                        </div>
                    )}
                </span>
            </div>

            <div className="report-container">
                {/* Enhanced Header Section */}
                <div className="header-section">
                    <div className="official-seal">🏛️</div>
                    <div className="government-badge">
                        Air Quality Monitoring
                    </div>
                    <div className="document-id">
                        DOC-ID: HR-{username}-{new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, '0')}{String(new Date().getDate()).padStart(2, '0')}
                    </div>
                    <h1>🏥 Official Air Quality Health Report</h1>
                    <p>
                        Personalized health assessment based on your location's air quality and personal health profile.
                        {currentDataInfo?.is_interpolated && ' Using advanced spatial interpolation from real sensors only for precise location analysis.'}
                    </p>
                    <div className="report-metadata">
                        <div className="metadata-item">
                            <strong>Generated:</strong> {new Date().toLocaleString('en-IN')}
                        </div>
                        <div className="metadata-item">
                            <strong>Name:</strong> {username}
                        </div>
                        <div className="metadata-item">
                            <strong>Location:</strong> {currentDataInfo?.is_interpolated ? 'Your Current Location' : 'Nearest Real Station Data'}
                        </div>
                        {/*}
                        {currentDataInfo?.stations_used_for_calculation && (
                            <div className="metadata-item">
                                <strong>Calculation Method:</strong> Interpolated from {currentDataInfo.stations_used_for_calculation.join(', ')}
                            </div>
                        )}*/}
                    </div>
                </div>

                {/* Executive Summary */}
                <div className="executive-summary">
                    <h2 className="section-title">📋 Executive Health Summary</h2>
                    <div className="overview-grid">
                        <div className="overview-card health-card">
                            <h4>👤 Your Health Profile</h4>
                            <div className="health-score">{health_assessment.score}</div>
                            <div className={`risk-level ${health_assessment.risk_level.toLowerCase()}`}>
                                {health_assessment.risk_level} Risk
                            </div>
                            <div className="health-description">
                                {health_assessment.risk_level === 'Low' && 'You have minimal risk from air pollution effects'}
                                {health_assessment.risk_level === 'Moderate' && 'You have moderate susceptibility to air pollution'}
                                {health_assessment.risk_level === 'High' && 'You are at high risk from air pollution effects'}
                                {health_assessment.risk_level === 'Critical' && 'You are at critical risk and need immediate precautions'}
                            </div>
                        </div>
                        
                        <div className="overview-card aqi-card">
                            <h4>🌬️ Current Air Quality</h4>
                            <div className="station-name">
                                {currentDataInfo?.is_interpolated ? '🎯 Your Location (Real Sensors)' : `📍 ${currentDataInfo?.station_name || 'Default Station'}`}
                                {currentDataInfo?.distance && (
                                    <div className="distance-info">
                                        Distance: {currentDataInfo.distance.toFixed(1)}km from nearest real sensor
                                    </div>
                                )}
                            </div>
                            <div className="station-aqi" style={{ color: aqiStatus.color }}>
                                {Math.round(displayAqi)}
                            </div>
                            <div className="aqi-status-badge" style={{ 
                                backgroundColor: aqiStatus.color + '20', 
                                color: aqiStatus.color,
                                border: `2px solid ${aqiStatus.color}`
                            }}>
                                {aqiStatus.status}
                            </div>
                            {currentDataInfo?.is_interpolated && (
                                <div className="interpolation-badge">
                                    🎯 Calculated for Your Location (Real Sensors Only)
                                </div>
                            )}
                        </div>

                        <div className="overview-card summary-card">
                            <h4>⚕️ Health Risk Assessment</h4>
                            <div className="risk-summary">
                                <div className="risk-indicator">
                                    <div className={`risk-dot ${health_assessment.risk_level.toLowerCase()}`}></div>
                                    <span>Based on your health profile and current air quality, you are classified as <strong>{health_assessment.risk_level} Risk</strong></span>
                                </div>
                                {healthRecommendations?.isSensitive && (
                                    <div className="sensitive-warning">
                                        ⚠️ You are in a sensitive group - please follow enhanced precautions
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Critical Health Alerts */}
                {healthRecommendations?.isEmergency && (
                    <div className="critical-health-section">
                        <div className="emergency-header">
                            <div className="emergency-icon">🚨</div>
                            <h2>IMMEDIATE HEALTH PRECAUTIONS REQUIRED</h2>
                        </div>
                        <div className="emergency-content">
                            <div className="emergency-reason">
                                <p><strong>Air Quality Emergency:</strong> Current AQI of {Math.round(displayAqi)} poses immediate health risks.</p>
                                {healthRecommendations.isSensitive && (
                                    <p><strong>High-Risk Individual:</strong> Your health profile indicates increased vulnerability.</p>
                                )}
                            </div>
                            <div className="emergency-actions">
                                <h3>🚨 IMMEDIATE ACTIONS:</h3>
                                <ul className="emergency-list">
                                    {healthRecommendations.recommendations.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Health Recommendations Section */}
                <div className="recommendations-section">
                    <h2 className="section-title">
                        💡 Personalized Health Recommendations
                        {healthRecommendations?.isSensitive && <span className="sensitive-badge">Sensitive Group</span>}
                    </h2>
                    
                    {/* Government Guidelines */}
                    <div className="guidelines-banner">
                        <div className="guidelines-icon">🏛️</div>
                        <div className="guidelines-text">
                            <strong>Official Government Guidelines:</strong> Based on Central Pollution Control Board (CPCB) standards 
                            and Kerala State Health Department recommendations for air quality health protection.
                        </div>
                    </div>

                    <div className="recommendations-grid">
                        {healthRecommendations?.recommendations.map((action, index) => (
                            <div key={index} className={`recommendation-card ${healthRecommendations.category} ${healthRecommendations.isSensitive ? 'sensitive' : ''}`}>
                                <div className="rec-icon">
                                    <i className={healthRecommendations.isEmergency ? "fas fa-exclamation-triangle" : "fas fa-check-circle"}></i>
                                </div>
                                <div className="rec-content">
                                    <div className="rec-priority">
                                        {healthRecommendations.isEmergency ? 'URGENT' : healthRecommendations.category.toUpperCase()}
                                    </div>
                                    <div className="rec-text">{action}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Additional Recommendations from Health Assessment */}
                    {health_assessment.priority_actions && health_assessment.priority_actions.length > 0 && (
                        <div className="additional-recommendations">
                            <h3>📋 Additional Health Recommendations</h3>
                            <div className="additional-grid">
                                {health_assessment.priority_actions.map((action, index) => (
                                    <div key={index} className="additional-rec-card">
                                        <div className="additional-rec-icon">💊</div>
                                        <div className="additional-rec-text">{action}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Emergency Contacts */}
                {emergencyContacts && (
                    <div className="emergency-contacts-section">
                        <h2 className="section-title">🆘 Emergency Health Contacts</h2>
                        <div className="emergency-contacts-grid">
                            <div className="emergency-contact-card primary">
                                <div className="contact-icon">📞</div>
                                <div className="contact-info">
                                    <div className="contact-name">{emergencyContacts.primary.name}</div>
                                    <div className="contact-number">{emergencyContacts.primary.number}</div>
                                    <div className="contact-desc">{emergencyContacts.primary.description}</div>
                                </div>
                            </div>
                            
                            <div className="emergency-contact-card medical">
                                <div className="contact-icon">🏥</div>
                                <div className="contact-info">
                                    <div className="contact-name">{emergencyContacts.medical.name}</div>
                                    <div className="contact-number">{emergencyContacts.medical.number}</div>
                                    <div className="contact-desc">{emergencyContacts.medical.description}</div>
                                </div>
                            </div>

                            {emergencyContacts.poison && (
                                <div className="emergency-contact-card poison">
                                    <div className="contact-icon">☢️</div>
                                    <div className="contact-info">
                                        <div className="contact-name">{emergencyContacts.poison.name}</div>
                                        <div className="contact-number">{emergencyContacts.poison.number}</div>
                                        <div className="contact-desc">{emergencyContacts.poison.description}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Location Context Banner */}
                {currentDataInfo && (
                    <div className="location-context-banner">
                        <div className="location-context-content">
                            <div className="location-icon-section" style={{ color: currentDataInfo.is_interpolated ? '#10b981' : '#3b82f6' }}>
                                <div className="location-icon-large">
                                    <i className={`fas ${currentDataInfo.is_interpolated ? 'fa-crosshairs' : 'fa-map-marker-alt'}`}></i>
                                </div>
                                <div className="location-badge-large">
                                    {currentDataInfo.is_interpolated ? '🎯 Your Location Data (Real Sensors)' : '📍 Nearest Real Station Data'}
                                </div>
                            </div>
                            
                            <div className="location-details-section">
                                <div className="location-primary-info">
                                    <h3>{currentDataInfo.explanation}</h3>
                                    {locationStatus === 'gps_detected' && currentDataInfo.distance && (
                                        <p className="distance-info">
                                            📍 You are {currentDataInfo.distance.toFixed(1)}km from the nearest real monitoring station
                                        </p>
                                    )}
                                    {locationStatus === 'failed' && (
                                        <p className="location-warning">
                                            ⚠️ Location detection failed - Using default real station data for health recommendations
                                        </p>
                                    )}
                                    {currentDataInfo.distance_warning && (
                                        <p className="distance-warning">
                                            ⚠️ {currentDataInfo.distance_warning}
                                        </p>
                                    )}
                                </div>
                                
                                <div className="location-method-info">
                                    <div className="method-item">
                                        <strong>Data Method:</strong> {currentDataInfo.is_interpolated ? 'Smart Interpolation (Real Sensors Only)' : 'Direct Real Sensor Reading'}
                                    </div>
                                    <div className="method-item">
                                        <strong>Source:</strong> {currentDataInfo.station_name}
                                    </div>
                                    <div className="method-item">
                                        <strong>Accuracy:</strong> {currentDataInfo.is_interpolated ? 'Calculated for your exact location using only real sensor data' : 'Direct from real monitoring station'}
                                    </div>
                                    {currentDataInfo.stations_used_for_calculation && (
                                        <div className="method-item">
                                            <strong>Real Stations Used:</strong> {currentDataInfo.stations_used_for_calculation.join(', ')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* FIXED: Dashboard Grid with Mobile-Optimized Forecast */}
                <div className="dashboard-grid">
                    <div className="dashboard-card forecast-card">
                        <div className="card-header">
                            <h3>📊 4-Day Air Quality Forecast</h3>
                            <div className="forecast-info">
                                <div className="forecast-source">
                                    Data from: {currentDataInfo?.station_name || 'ASIET Campus Station'}
                                </div>
                                <div className="forecast-update">
                                    Last updated: {currentTime.toLocaleTimeString()}
                                </div>
                            </div>
                        </div>

                        {/* IMPROVED: Horizontal Scrollable Parameter Selection */}
                        <div className="forecast-controls-wrapper">
                            <div className="forecast-controls">
                                {['pm25', 'pm10', 'no2', 'o3', 'so2', 'co', 'nh3'].map(param => (
                                    <button 
                                        key={param}
                                        className={`param-btn ${selectedParameter === param ? 'active' : ''}`}
                                        onClick={() => handleParameterChange(param)}
                                        title={`View ${param.toUpperCase()} forecast`}
                                    >
                                        {param.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* FIXED: Chart and Table Section */}
                        <div className="forecast-content">
                            <div className="chart-section">
                                <Suspense fallback={<div className="panel-loader">📊 Loading forecast chart...</div>}>
                                    <LazyChart 
                                        forecastData={forecastData}
                                        selectedParameter={selectedParameter}
                                    />
                                </Suspense>
                            </div>
                            
                            {/* FIXED: Forecast Data Table with Proper Dates */}
                            <div className="forecast-table-section">
                                <div className="forecast-table-container">
                                    <table className="forecast-table">
                                        <thead>
                                            <tr>
                                                <th>📅 Day</th>
                                                <th>📈 Max {selectedParameter.toUpperCase()}</th>
                                                <th>📊 Unit</th>
                                                <th>📍 Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {forecastData && forecastData.length > 0 ? (
                                                forecastData.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="day-cell">
                                                            <div className="day-label">{item.displayDay}</div>
                                                        </td>
                                                        <td className="value-cell">
                                                            <div className="value-display">
                                                                {item[`${selectedParameter}_max`] ? 
                                                                    (selectedParameter === 'co' ? 
                                                                        parseFloat(item[`${selectedParameter}_max`]).toFixed(1) : 
                                                                        Math.round(item[`${selectedParameter}_max`])
                                                                    ) : 'N/A'
                                                                }
                                                            </div>
                                                        </td>
                                                        <td className="unit-cell">
                                                            <div className="unit-display">
                                                                {selectedParameter === 'co' ? 'mg/m³' : 'µg/m³'}
                                                            </div>
                                                        </td>
                                                        <td className="date-cell">
                                                            <div className="date-display">
                                                                {item.formattedDate}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="no-data-cell">
                                                        <div className="no-data-message">
                                                            📊 Forecast data not available for {currentDataInfo?.station_name || 'this station'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="dashboard-card health-details-card">
                        <h3>📋 Your Health Profile Details</h3>
                        <div className="health-details-list">
                            {Object.entries(health_assessment.details).map(([key, value]) => (
                                <div key={key} className="health-detail-item">
                                    <div className="detail-label">{key}:</div>
                                    <div className="detail-value">
                                        {Array.isArray(value) ? value.join(', ') : value}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Health Improvement Tips */}
                        <div className="health-tips">
                            <h4>💡 Health Improvement Tips</h4>
                            <div className="health-tips-list">
                                <div className="health-tip">🫁 Practice deep breathing exercises indoors</div>
                                <div className="health-tip">💧 Stay hydrated - drink 8-10 glasses of water daily</div>
                                <div className="health-tip">🥗 Eat antioxidant-rich foods (fruits, vegetables)</div>
                                <div className="health-tip">🚿 Shower after being outdoors to remove pollutants</div>
                                <div className="health-tip">🌱 Keep indoor air-purifying plants</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button onClick={handleRefresh} className="action-btn primary">
                        🔄 Refresh Report & Location Data
                    </button>
                    <button onClick={handlePrint} className="action-btn secondary">
                        🖨️ Print Report
                    </button>
                    <button onClick={() => navigate('/health-assessment')} className="action-btn secondary">
                        📋 Update Health Profile
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="action-btn secondary">
                        📊 View Dashboard
                    </button>
                </div>

                {/* Data Source Information */}
                <div className="data-source-section">
                    <h3>⚡ Report Data Source & Methodology</h3>
                    <div className="data-source-info">
                        <div className="source-item">
                            <div className="source-icon">📍</div>
                            <div className="source-content">
                                <div className="source-title">Location Analysis</div>
                                <div className="source-desc">
                                    {locationStatus === 'gps_detected' ? (
                                        currentDataInfo?.is_interpolated ? 
                                        `Smart interpolation used - you are ${currentDataInfo.distance?.toFixed(1)}km from nearest real sensor` :
                                        `Using data from nearest real monitoring station (${currentDataInfo.distance?.toFixed(1)}km away)`
                                    ) : locationStatus === 'detecting' ? (
                                        'Detecting your location for personalized air quality analysis...'
                                    ) : locationStatus === 'failed' ? (
                                        'Location detection failed - using default real station data'
                                    ) : (
                                        'Initializing location services...'
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="source-item">
                            <div className="source-icon">🏥</div>
                            <div className="source-content">
                                <div className="source-title">Health Data</div>
                                <div className="source-desc">Based on your personal health assessment and risk factors</div>
                            </div>
                        </div>
                        <div className="source-item">
                            <div className="source-icon">🏛️</div>
                            <div className="source-content">
                                <div className="source-title">Guidelines</div>
                                <div className="source-desc">Following CPCB standards and Kerala Health Department protocols</div>
                            </div>
                        </div>
                        <div className="source-item">
                            <div className="source-icon">🎯</div>
                            <div className="source-content">
                                <div className="source-title">AQI Calculation</div>
                                <div className="source-desc">
                                    {currentDataInfo?.is_interpolated ? 
                                        'Personalized AQI calculated using Inverse Distance Weighting (IDW) from real sensors only (lora-v1, loradev2)' :
                                        'Direct AQI reading from nearest real monitoring station'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Government Disclaimer */}
                <div className="disclaimer-section">
                    <h3>📄 Official Disclaimer</h3>
                    <div className="disclaimer-content">
                        <p><strong>🏛️ Data Authority:</strong> Air quality data sourced from Government of Kerala real monitoring stations operated under Central Pollution Control Board (CPCB) guidelines.</p>
                        <p><strong>⚕️ Health Advisory:</strong> Recommendations are based on standard government health guidelines. Consult healthcare professionals for personalized medical advice.</p>
                        <p><strong>📊 Data Accuracy:</strong> Air quality readings are updated every 30 seconds from certified real monitoring equipment. {currentDataInfo?.is_interpolated && 'Enhanced spatial interpolation uses only real sensor data for location-specific calculations.'}</p>
                        <p><strong>🔄 Updates:</strong> This report reflects current conditions. Air quality can change rapidly - check live updates frequently.</p>
                        <p><strong>📞 Emergency:</strong> In case of severe health symptoms related to air pollution, immediately contact medical emergency services (108) or Kerala Pollution Control Board (0471-2418566).</p>
                        <p><strong>📍 Location Services:</strong> {locationStatus === 'gps_detected' ? 'Your location has been detected and used for personalized air quality calculations using real sensor data only.' : 'Enable location services for more accurate, personalized health recommendations based on real sensor data.'}</p>
                        <p><strong>🎯 Sensor Network:</strong> Calculations use only real monitoring stations (lora-v1: ASIET Campus, loradev2: Mattoor Junction) for maximum accuracy. Simulated stations are excluded from health calculations.</p>
                    </div>
                </div>
            </div>

             {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>AirAware Kerala</h4>
              <p>Smart Air Quality Monitoring System</p>
              <p>Real-time data • Personalized insights • Health-focused</p>
              <div className="social-links">
                <a href="#" className="social-link">📘</a>
                <a href="#" className="social-link">🐦</a>
                <a href="#" className="social-link">💼</a>
                <a href="#" className="social-link">📷</a>
              </div>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="/">🏠 Home</a></li>
                <li><a href="/health-report">📄 Health Report</a></li>
                <li><a href="/add-family">👥 Add Family</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Data Sources</h4>
              <ul>
                <li>ASIET Campus Station (Real Sensor)</li>
                <li>Mattoor Junction Station (Real Sensor)</li>
                <li>Advanced spatial interpolation algorithms (Real Data Only)</li>
                <li>Weather integration</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Contact Information</h4>
              <p>
                Adi Shankara Institute of Engineering and Technology<br/>
                Kalady 683574, Ernakulam<br/>
                Kerala, India
              </p>
              <p>
                <strong>Email:</strong> aiiot@adishankara.ac.in<br/>
                <strong>Phone:</strong> 0484 246 3825
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 AirAware Kerala - Smart Air Quality Monitoring System</p>
            <p>Powered by real sensor data • Advanced interpolation • Government approved</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HealthReport;