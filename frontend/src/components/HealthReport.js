import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import './css/HealthReport.css';
import logoImage from '../assets/aqi.webp'; 

const LazyChart = React.lazy(() => import('./LazyChart'));

// --- Helper Functions (same as Dashboard.js) ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // REMOVED: * 1000 to return km instead of meters
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

// Function to get user-friendly station names
const getFriendlyStationName = (stationName) => {
    if (!stationName) return 'Local Monitoring Station';
    
    // Remove technical terms and make user-friendly
    const cleanName = stationName
        .replace(/lora|LoRa|LORA/gi, '')
        .replace(/v1|v2|V1|V2/gi, '')
        .replace(/dev|DEV|development/gi, '')
        .replace(/node|NODE/gi, '')
        .replace(/sensor|SENSOR/gi, '')
        .replace(/station|STATION/gi, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // If name becomes too short or empty, provide a generic name
    if (cleanName.length < 3) {
        return 'Local Air Quality Monitor';
    }
    
    // Capitalize properly
    return cleanName
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') + ' Area';
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
    // In HealthReport.js, add this function near the top with your other helpers.
const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
const calculateInterpolatedAqi = (locationData, stations) => {
    let totalWeight = 0;
    let weightedAqi = 0;
    
    stations.forEach(station => {
        const distance = calculateDistance(
            locationData.lat,
            locationData.lng,
            station.station_info.lat,
            station.station_info.lng
        );
        // Use a small minimum distance to avoid division by zero
        const safeDistance = Math.max(distance, 0.001);
        const weight = 1.0 / (safeDistance ** 2);
        totalWeight += weight;
        weightedAqi += (station.highest_sub_index || 0) * weight;
    });

    if (totalWeight > 0) {
        return Math.round(weightedAqi / totalWeight);
    }
    // Fallback to the first station's AQI if something goes wrong
    return stations[0]?.highest_sub_index || 50; 
};
    // AFTER (Correct):
    const { user, loading: authLoading } = useAuth();
    const [username] = useState(user?.name || null);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // --- State for location and interpolation (same as Dashboard) ---
    const [userLocation, setUserLocation] = useState(null);
    const [nearestStation, setNearestStation] = useState(null);
    const [interpolatedData, setInterpolatedData] = useState(null);
    const [currentDataInfo, setCurrentDataInfo] = useState(null);

    const navigate = useNavigate();
    // This will automatically use the correct URL for both local and deployed environments
    const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://airaware-app-gcw7.onrender.com' // Your deployed backend URL
        : 'http://localhost:8000';                   // Your local backend URL

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // In HealthReport.js, replace the entire fetchReportData function

    const fetchReportData = useCallback(async () => {
        // This check is now robust and waits for the user object from useAuth
        if (!user || !user.name) {
            console.log("Health Report fetch blocked: User name not available yet.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // --- THIS IS THE KEY FIX ---
            // The backend view expects 'username', so we must send 'user.name'
            const url = new URL(`${API_BASE_URL}/api/health-report/`);
            url.searchParams.append('username', user.name); // Send username, NOT user_id

            console.log(`🚀 Calling health report API: ${url.toString()}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`The server responded with an error (Status: ${response.status})`);
            }
            
            const data = await response.json();
            setReportData(data);
            
            // Set the default station for the forecast chart
            if (data.stations) {
                const stationEntries = Object.entries(data.stations);
                if (stationEntries.length > 0) {
                    const [defaultId] = stationEntries[0];
                    setNearestStation({ id: defaultId });
                }
            }

        } catch (err) {
            console.error("❌ Health report fetch failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, navigate, API_BASE_URL]);


    // ===== INITIALIZATION =====
    useEffect(() => {
        if (authLoading) {
            return; // Wait for auth check
        }
        
        fetchReportData();
    }, [authLoading, user, fetchReportData, navigate]);

   
    // In HealthReport.js
// Add this corrected block in place of the two you deleted.

  useEffect(() => {
    // Start by fetching the main report data
    fetchReportData();

    // Then, try to get the user's GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // If successful, update the userLocation state
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("Geolocation failed. Using default station data.");
          // If GPS fails, set location to null
          setUserLocation(null);
        }
      );
    } else {
      // If the browser doesn't support geolocation, set location to null
      setUserLocation(null);
    }
  }, [fetchReportData]); // This effect runs once to fetch data and location

  // --- THIS NEW useEffect PERFORMS THE CALCULATIONS AND FIXES THE BUG ---
  // In HealthReport.js, replace the entire location-processing useEffect

  useEffect(() => {
    // Only run this logic if we have the main report data
    if (!reportData?.stations) return;

    // Use Object.entries to get both the ID and the station data
    const stationEntries = Object.entries(reportData.stations);
    if (stationEntries.length === 0) return;

    // --- If we have the user's location (within 1km), calculate their specific AQI ---
    if (userLocation) {
      let nearestDist = Infinity;
      let nearestStationId = null;
      let nearestStationDetails = null;

      stationEntries.forEach(([id, station]) => {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, station.station_info.lat, station.station_info.lng);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestStationId = id; // Store the correct ID ('lora-v1')
          nearestStationDetails = station;
        }
      });
      
      // Check if the user is within the 1km radius for interpolation
      if (nearestDist <= 1.0) {
        const interpolatedAqi = calculateInterpolatedAqi(userLocation, Object.values(reportData.stations));
        setCurrentDataInfo({
          is_interpolated: true,
          aqi: interpolatedAqi,
          distance: nearestDist,
          station_name: "Your Exact Location"
        });
      } else {
        // If user is outside 1km, use the nearest station's data
        setCurrentDataInfo({
          is_interpolated: false,
          aqi: nearestStationDetails.highest_sub_index,
          distance: nearestDist,
          station_name: nearestStationDetails.station_info.name
        });
      }
      // CRITICAL FIX: Set the nearestStation with the correct ID for the forecast
      setNearestStation({ id: nearestStationId, distance: nearestDist });

    } else {
      // --- If we DON'T have a location, use the first station as the default ---
      const [defaultId, defaultStation] = stationEntries[0];
      
      setCurrentDataInfo({
        is_interpolated: false,
        aqi: defaultStation.highest_sub_index,
        distance: null,
        station_name: defaultStation.station_info.name
      });
      // Set nearestStation with the default ID for the forecast
      setNearestStation({ id: defaultId, distance: null });
    }
  }, [reportData, userLocation]); // This effect re-runs whenever data or location changes




    // Memoized calculations
    const displayAqi = useMemo(() => {
        // This now directly and reliably gets the calculated AQI
        return currentDataInfo?.aqi || 0;
    }, [currentDataInfo]);


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

    // Get user-friendly station name
    const friendlyStationName = useMemo(() => {
        // This now uses the correct station name from currentDataInfo
        return getFriendlyStationName(currentDataInfo?.station_name);
    }, [currentDataInfo]);

    // Helper function to safely format distance
    const formatDistance = useCallback((distance) => {
        if (distance === null || distance === undefined || typeof distance !== 'number') {
            return 'N/A';
        }
        return distance.toFixed(1);
    }, []);

    // Event handlers
    const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
    const handleLogout = useCallback(() => {
        localStorage.clear();
        navigate('/login');
    }, [navigate]);

    const handleRefresh = useCallback(() => {
        fetchReportData();
    }, [fetchReportData]);

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    // This is the primary fix that prevents the crash.
    // This one-line change prevents the crash
    if (loading) {
    return (
        <div className="panel-loader">
            <h2>🏥 Generating Your Health Report...</h2>
            <div className="loading-spinner"></div>
            <button 
                onClick={() => window.location.href = "/health-report"} 
                className="retry-btn" 
                style={{ marginTop: "20px" }}
            >
                🔄 Refresh
            </button>
        </div>
    );
}




    // CORRECTED: Check for an error state second
    if (error) {
        return (
            <div className="error-message">
                <h2>⚠️ Error Generating Report</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/dashboard')} className="retry-btn">
                    📊 Go to Dashboard
                </button>
            </div>
        );
    }

    // CORRECTED: Check if data is missing third
    if (!reportData || !currentDataInfo) {
        return <div className="error-message"><h2>📊 No Report Data</h2><p>Network error occurred. Please refresh the page and try again..</p></div>;
    }

    // If all checks pass, then safely render the page
    const { health_assessment, forecasts } = reportData;
    const forecastForNearest = nearestStation ? forecasts[nearestStation.id] : null;

    return (
        <div className="report-page">
            {/* Real-time Status Bar */}
            <div className="realtime-status">
                🔴 LIVE HEALTH REPORT • Updated: {currentTime.toLocaleTimeString('en-IN')} • 
                {interpolatedData ? ' Location-Based Analysis' : ' Government Standards Applied'}
            </div>

            {/* Navigation (same as Dashboard) */}
            <nav className="navbar">
                <div className="navbar-content">
                    <Link to="/" className="navbar-brand">
                        {/* 2. USE THE IMPORTED VARIABLE */}
                        <img src={logoImage} alt="AQM Logo" width={isMobileView ? "32" : "40"} height={isMobileView ? "32" : "40"} />
                        AirAware
                    </Link>

                    <div className="menu-toggle" onClick={toggleMenu}>☰</div>

                    <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
                        <li><Link to="/" className="nav-link">🏠 Home</Link></li>
                        <li><Link to="/dashboard" className="nav-link">👤 Profile</Link></li>
                        <li><Link to="/health-assessment" className="nav-link">📋 Health Update</Link></li>
                        <li><Link to="/add-family" className="nav-link">👥 Add Family</Link></li>
                        {/*<li><Link to="/map" className="nav-link">🗺️ Live Map</Link></li>*/}
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

            {/* AQI Alert Banner */}
            <div className={`alert-banner ${aqiStatus.status.toLowerCase()}`} style={{ backgroundColor: getAQIColor(displayAqi) + '20', borderBottom: `3px solid ${getAQIColor(displayAqi)}` }}>
                ℹ️ <span>
                    <strong>CURRENT AIR QUALITY:</strong> 
                    {interpolatedData ? ' Your Location' : ' Nearest Monitor'} AQI is {Math.round(displayAqi)} - {aqiStatus.status}
                    {nearestStation && nearestStation.distance !== null && nearestStation.distance !== undefined && ` • Distance: ${formatDistance(nearestStation.distance)}km from nearest monitor`}
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
                        {interpolatedData && ' Using advanced location analysis for precise monitoring.'}
                    </p>
                    <div className="report-metadata">
                        <div className="metadata-item">
                            <strong>Generated:</strong> {new Date().toLocaleString('en-IN')}
                        </div>
                        <div className="metadata-item">
                            <strong>Name:</strong> {username}
                        </div>
                        {/*<div className="metadata-item">
                            <strong>Location:</strong> {interpolatedData ? 'Your Current Location' : 'Nearest Monitor Data'}
                        </div>*/}
                        <div className="metadata-item">
                            <strong>Data Source:</strong> {friendlyStationName}
                        </div>
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
                                {interpolatedData ? '🎯 Your Location' : `📍 ${friendlyStationName}`}
                                {nearestStation && nearestStation.distance !== null && nearestStation.distance !== undefined && (
                                    <div className="distance-info">
                                        Distance: {formatDistance(nearestStation.distance)}km
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
                            {interpolatedData && (
                                <div className="interpolation-badge">
                                    🎯 Calculated for Your Location
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
                
                {/* Dashboard Grid - Mobile Optimized */}
                <div className="dashboard-grid">
                    <div className="dashboard-card forecast-card">
                        <h3>📊 4-Day Air Quality Forecast</h3>
                        <div className="forecast-info">
                            <div className="forecast-source">
                                Data from: {friendlyStationName}
                            </div>
                            <div className="forecast-update">
                                Last updated: {currentTime.toLocaleTimeString()}
                            </div>
                        </div>
                        <div className="forecast-chart-container">
                            <Suspense fallback={<div className="panel-loader">📊 Loading forecast chart...</div>}>
                                <LazyChart forecastData={forecastForNearest?.data} selectedParameter={'pm25'} />
                            </Suspense>
                        </div>
                    </div>
                    
                    <div className="dashboard-card health-details-card">
                        <h3>📋 Your Health Profile Details</h3>
                       
                        <div className="health-details-list">
                            {/* This check ensures .details exists before we try to use it */}
                            {health_assessment.details && Object.entries(health_assessment.details).map(([key, value]) => (
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
                    <button onClick={handlePrint} className="action-btn primary">
                        🖨️ Print Report
                    </button>
                    
                </div>

                {/* Data Source Information */}
                
                {/* Government Disclaimer */}
                <div className="disclaimer-section">
                <h3>📄 Official Disclaimer</h3>
                <div className="disclaimer-content">
                    <p><strong>🏛️ Data Authority:</strong> Air quality data is collected and analyzed using IoT-based sensors developed by the Center for AI & IoT Innovation, Adi Shankara Institute of Engineering and Technology (ASIET). This data is independent of government monitoring networks.</p>
                    
                    <p><strong>⚕️ Health Advisory:</strong> Recommendations are generated using our AI-powered analysis of real-time sensor data. For personal medical advice, please consult a healthcare professional.</p>
                    
                    <p><strong>📞 Emergency:</strong> If you experience severe symptoms related to air pollution, seek immediate medical help (108) or visit the nearest healthcare facility.</p>
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
              
              <div className="social-links">
                <a href="https://www.linkedin.com/in/aiiot-asiet-b22302308" 
                    className="social-link" 
                    target="_blank" 
                    rel="noopener noreferrer">
                    <i className="fab fa-linkedin-in"></i>
                  </a>

                <a href="https://www.instagram.com/aiiot_adishankara?igsh=aXY4bXQ2cjVhYWM2"
                    className="social-link"
                    target="_blank"
                    rel="noopener noreferrer">
                    <i className="fab fa-instagram"></i>
                </a>

                <a href="#" className="social-link">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="social-link">
                  <i className="fab fa-twitter"></i>
                </a>
                
              </div>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="/"> Home</a></li>
                <li><a href="/health-report"> Health Report</a></li>
                <li><a href="/add-family"> Add Family</a></li>
                <li><a href="/map" >Live Map</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Data Sources</h4>
              <ul>
                <li>ASIET Campus Station </li>
                <li>Mattoor Junction Station</li>
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
                <strong>Phone:</strong> 9846900310
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy;  2025 AirAware kalady. All rights reserved. Developed and managed by Center for AI & IoT Innovation, Adi Shankara Institute of Engineering and Technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default HealthReport;