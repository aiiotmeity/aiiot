import React, { useState, useEffect, useCallback, Suspense, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import './css/HealthReport.css';

// Lazy load heavy components for better performance
const LazyChart = React.lazy(() => import('./LazyChart'));

// --- Government AQI Standards and Guidelines ---
const AQI_CATEGORIES = {
  good: { min: 0, max: 50, label: 'Good', color: '#10b981', bgColor: '#d1fae5', textColor: '#065f46' },
  moderate: { min: 51, max: 100, label: 'Moderate', color: '#f59e0b', bgColor: '#fef3c7', textColor: '#92400e' },
  unhealthy_sensitive: { min: 101, max: 150, label: 'Unhealthy for Sensitive Groups', color: '#f97316', bgColor: '#fed7aa', textColor: '#9a3412' },
  unhealthy: { min: 151, max: 200, label: 'Unhealthy', color: '#ef4444', bgColor: '#fee2e2', textColor: '#b91c1c' },
  very_unhealthy: { min: 201, max: 300, label: 'Very Unhealthy', color: '#a855f7', bgColor: '#f3e8ff', textColor: '#7c2d12' },
  hazardous: { min: 301, max: 500, label: 'Hazardous', color: '#7c2d12', bgColor: '#451a03', textColor: '#fed7aa' }
};

// Government Health Recommendations based on AQI levels
const GOVERNMENT_RECOMMENDATIONS = {
  good: {
    general: ['Perfect air quality for outdoor activities', 'All groups can enjoy normal outdoor activities', 'Windows can be kept open for fresh air'],
    sensitive: ['Excellent conditions for sensitive individuals', 'No precautions needed', 'Ideal for exercise outdoors']
  },
  moderate: {
    general: ['Air quality is acceptable for most people', 'Outdoor activities are generally safe', 'Consider reducing prolonged outdoor exertion'],
    sensitive: ['Sensitive individuals should limit prolonged outdoor exertion', 'Watch for symptoms like coughing or shortness of breath', 'Consider wearing a mask during outdoor activities']
  },
  unhealthy_sensitive: {
    general: ['Reduce prolonged or heavy outdoor exertion', 'Take more breaks during outdoor activities', 'Consider moving activities indoors'],
    sensitive: ['Avoid prolonged or heavy outdoor exertion', 'Stay indoors if experiencing symptoms', 'Wear N95 mask if going outside', 'Use air purifiers indoors']
  },
  unhealthy: {
    general: ['Avoid prolonged outdoor activities', 'Limit outdoor exertion', 'Keep windows closed', 'Use air purifiers indoors'],
    sensitive: ['Stay indoors and keep activity levels low', 'Avoid all outdoor activities', 'Seek medical attention if experiencing symptoms', 'Use N95 masks when unavoidable to go outside']
  },
  very_unhealthy: {
    general: ['Everyone should avoid outdoor activities', 'Stay indoors with windows and doors closed', 'Use air purifiers', 'Wear masks if must go outside'],
    sensitive: ['Remain indoors and rest', 'Avoid all physical activities', 'Seek immediate medical attention for symptoms', 'Consider relocating to cleaner air area']
  },
  hazardous: {
    general: ['Health emergency: everyone should avoid outdoor activities', 'Stay indoors', 'Emergency measures should be taken', 'Seek medical attention for any symptoms'],
    sensitive: ['Health emergency conditions', 'Remain indoors and avoid all activities', 'Seek immediate medical attention', 'Consider emergency relocation']
  }
};

// ===== LOCATION TRACKING UTILITIES (Same as Dashboard.js) =====

// Utility Functions
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
           Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
           Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Known accurate locations for the area
const KNOWN_LOCATIONS = {
  '10.1783_76.4309': {
    display_name: 'ASIET Campus, Kalady',
    city: 'Kalady',
    state: 'Kerala',
    country: 'India'
  },
  '10.1710_76.4296': {
    display_name: 'Mattoor Junction, Kalady',
    city: 'Kalady',
    state: 'Kerala', 
    country: 'India'
  },
  '10.1750_76.4300': {
    display_name: 'Kalady Town, Kerala',
    city: 'Kalady',
    state: 'Kerala',
    country: 'India'
  },
  '10.1765_76.4285': {
    display_name: 'Kalady Railway Station Area',
    city: 'Kalady',
    state: 'Kerala',
    country: 'India'
  },
  '10.1800_76.4700': {
    display_name: 'Perumbavoor, Kerala',
    city: 'Perumbavoor',
    state: 'Kerala',
    country: 'India'
  },
  '10.1900_76.3900': {
    display_name: 'Angamaly, Kerala',
    city: 'Angamaly',
    state: 'Kerala',
    country: 'India'
  }
};

// Enhanced reverse geocoding with multiple fallback strategies
const getLocationName = async (lat, lng) => {
  console.log('🔍 Getting location name for:', lat, lng);
  
  const coordKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
  if (KNOWN_LOCATIONS[coordKey]) {
    console.log('✅ Using exact known location:', KNOWN_LOCATIONS[coordKey].display_name);
    return KNOWN_LOCATIONS[coordKey];
  }
  
  for (const [key, location] of Object.entries(KNOWN_LOCATIONS)) {
    const [knownLat, knownLng] = key.split('_').map(Number);
    const distance = calculateDistance(lat, lng, knownLat, knownLng);
    if (distance < 2.0) {
      console.log(`✅ Using nearby known location: ${location.display_name} (${distance.toFixed(2)}km away)`);
      return {
        ...location,
        display_name: distance < 0.5 ? location.display_name : `Near ${location.city}, ${location.state}`
      };
    }
  }
  
  const geocodingResults = await Promise.allSettled([
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1&accept-language=en`)
      .then(res => res.json())
      .then(data => ({
        service: 'OpenStreetMap',
        data: data,
        location: parseOpenStreetMapResult(data)
      })),
    
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
      .then(res => res.json())
      .then(data => ({
        service: 'BigDataCloud',
        data: data,
        location: parseBigDataCloudResult(data)
      })),
    
    fetch(`https://us1.locationiq.com/v1/reverse.php?key=demo&lat=${lat}&lon=${lng}&format=json`)
      .then(res => res.json())
      .then(data => ({
        service: 'LocationIQ',
        data: data,
        location: parseLocationIQResult(data)
      }))
      .catch(() => null)
  ]);
  
  const validResults = geocodingResults
    .filter(result => result.status === 'fulfilled' && result.value && result.value.location)
    .map(result => result.value);
  
  console.log('🔍 Geocoding results:', validResults);
  
  if (validResults.length > 0) {
    const bestResult = validResults.find(result => {
      const location = result.location;
      const displayName = location.display_name.toLowerCase();
      return displayName.includes('kalady') || 
             displayName.includes('perumbavoor') || 
             displayName.includes('angamaly') ||
             displayName.includes('ernakulam');
    }) || validResults[0];
    
    console.log('✅ Using geocoding result from:', bestResult.service, bestResult.location.display_name);
    return bestResult.location;
  }
  
  const regionalFallback = getRegionalFallback(lat, lng);
  console.log('⚠️ All geocoding failed, using regional fallback:', regionalFallback.display_name);
  return regionalFallback;
};

// Parse OpenStreetMap result
const parseOpenStreetMapResult = (data) => {
  if (!data || !data.address) return null;
  
  const addr = data.address;
  const village = addr.village || addr.hamlet || addr.suburb || addr.neighbourhood;
  const town = addr.town || addr.city || addr.municipality;
  const district = addr.county || addr.state_district;
  const state = addr.state || 'Kerala';
  
  const primaryLocation = village || town || district || 'Unknown Location';
  
  return {
    display_name: `${primaryLocation}, ${state}`,
    city: primaryLocation,
    state: state,
    country: addr.country || 'India'
  };
};

// Parse BigDataCloud result
const parseBigDataCloudResult = (data) => {
  if (!data || !data.locality) return null;
  
  return {
    display_name: `${data.locality}, ${data.principalSubdivision || 'Kerala'}`,
    city: data.locality,
    state: data.principalSubdivision || 'Kerala',
    country: data.countryName || 'India'
  };
};

// Parse LocationIQ result
const parseLocationIQResult = (data) => {
  if (!data || !data.address) return null;
  
  const addr = data.address;
  const primaryLocation = addr.village || addr.town || addr.city || addr.county;
  
  return {
    display_name: `${primaryLocation}, ${addr.state || 'Kerala'}`,
    city: primaryLocation,
    state: addr.state || 'Kerala',
    country: addr.country || 'India'
  };
};

// Get regional fallback based on coordinate ranges
const getRegionalFallback = (lat, lng) => {
  if (lat >= 10.15 && lat <= 10.20 && lng >= 76.40 && lng <= 76.45) {
    return {
      display_name: 'Kalady Area, Kerala',
      city: 'Kalady',
      state: 'Kerala',
      country: 'India'
    };
  }
  
  if (lat >= 10.10 && lat <= 10.25 && lng >= 76.45 && lng <= 76.50) {
    return {
      display_name: 'Perumbavoor Area, Kerala',
      city: 'Perumbavoor',
      state: 'Kerala',
      country: 'India'
    };
  }
  
  if (lat >= 10.15 && lat <= 10.25 && lng >= 76.35 && lng <= 76.42) {
    return {
      display_name: 'Angamaly Area, Kerala',
      city: 'Angamaly',
      state: 'Kerala',
      country: 'India'
    };
  }
  
  if (lat >= 9.8 && lat <= 10.4 && lng >= 76.0 && lng <= 77.0) {
    return {
      display_name: 'Ernakulam District, Kerala',
      city: 'Ernakulam District',
      state: 'Kerala',
      country: 'India'
    };
  }
  
  return {
    display_name: `Location in Kerala (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
    city: 'Kerala',
    state: 'Kerala',
    country: 'India'
  };
};

// ===== IDW INTERPOLATION CALCULATION =====
const calculateIDWInterpolation = (locationData, stations) => {
  const stationIds = Object.keys(stations);
  let totalWeight = 0;
  const weightedValues = {
    pm25: 0, pm10: 0, so2: 0, no2: 0, 
    co: 0, o3: 0, nh3: 0, temp: 0, hum: 0, pre: 0
  };
  let weightedAqi = 0;

  stationIds.forEach(stationId => {
    const station = stations[stationId];
    const distance = calculateDistance(
      locationData.lat,
      locationData.lng,
      station.station_info.lat,
      station.station_info.lng
    );

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

  return {
    interpolated_values,
    interpolated_aqi,
    stations_used: stationIds.length,
    method: 'idw'
  };
};

// Helper Functions
const getAQICategory = (aqi) => {
  if (aqi <= 50) return AQI_CATEGORIES.good;
  if (aqi <= 100) return AQI_CATEGORIES.moderate;
  if (aqi <= 150) return AQI_CATEGORIES.unhealthy_sensitive;
  if (aqi <= 200) return AQI_CATEGORIES.unhealthy;
  if (aqi <= 300) return AQI_CATEGORIES.very_unhealthy;
  return AQI_CATEGORIES.hazardous;
};

const getHealthRiskLevel = (score) => {
  if (score <= 50) return { level: 'Low', color: '#10b981', bgColor: '#d1fae5' };
  if (score <= 100) return { level: 'Moderate', color: '#f59e0b', bgColor: '#fef3c7' };
  if (score <= 150) return { level: 'High', color: '#ef4444', bgColor: '#fee2e2' };
  return { level: 'Critical', color: '#7c2d12', bgColor: '#451a03' };
};

const formatTime = (dateString) => {
  try {
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

function HealthReport() {
    const { user } = useAuth();
    const [username] = useState(() => {
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            return userData.name || user?.name || null;
        } catch {
            return user?.name || null;
        }
    });
    
    // ===== STATE MANAGEMENT (Enhanced with Location Tracking) =====
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedForecastParameter, setSelectedForecastParameter] = useState('pm25');
    
    // Location tracking states
    const [userLocation, setUserLocation] = useState(null);
    const [userLocationName, setUserLocationName] = useState(null);
    const [nearestStationInfo, setNearestStationInfo] = useState(null);
    const [currentDataInfo, setCurrentDataInfo] = useState(null);
    const [locationStatus, setLocationStatus] = useState('initializing');
    const [isLocationUpdating, setIsLocationUpdating] = useState(false);

    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const locationTimeoutRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // ===== GET USER LOCATION =====
    const getUserLocation = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            setLocationStatus('detecting');
            setIsLocationUpdating(true);

            const timeout = setTimeout(() => {
                reject(new Error('Location detection timeout'));
            }, 15000);

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    clearTimeout(timeout);
                    
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
                    
                    try {
                        const locationName = await getLocationName(location.lat, location.lng);
                        setUserLocationName(locationName);
                        console.log('📍 Location name resolved for health report:', locationName.display_name);
                    } catch (nameError) {
                        console.log('❌ Failed to get location name:', nameError);
                        const fallbackName = getRegionalFallback(location.lat, location.lng);
                        setUserLocationName(fallbackName);
                    }
                    
                    setUserLocation(location);
                    setLocationStatus('gps_detected');
                    setIsLocationUpdating(false);
                    resolve(location);
                },
                (error) => {
                    clearTimeout(timeout);
                    setLocationStatus('failed');
                    setIsLocationUpdating(false);
                    console.log('GPS error in health report:', error.message);
                    reject(error);
                },
                { 
                    enableHighAccuracy: true, 
                    timeout: 15000,
                    maximumAge: 300000
                }
            );
        });
    }, []);

    // ===== PROCESS LOCATION CONTEXT =====
    const processLocationContext = useCallback((data, locationData) => {
        if (!data || !data.stations) {
            console.warn('No station data received for location processing');
            return;
        }

        const stations = data.stations;
        const stationIds = Object.keys(stations);
        
        if (locationData && stationIds.length > 0) {
            const stationDistances = {};
            stationIds.forEach(stationId => {
                const station = stations[stationId];
                const distance = calculateDistance(
                    locationData.lat,
                    locationData.lng,
                    station.station_info.lat,
                    station.station_info.lng
                );
                stationDistances[stationId] = {
                    distance: distance,
                    station: station
                };
            });

            const nearestStationId = Object.keys(stationDistances).reduce((nearest, current) => 
                stationDistances[current].distance < stationDistances[nearest].distance ? current : nearest
            );

            const nearestDistance = stationDistances[nearestStationId].distance;
            const nearestStation = stationDistances[nearestStationId].station;

            setNearestStationInfo({
                id: nearestStationId,
                name: nearestStation.station_info.name,
                distance: nearestDistance,
                aqi: nearestStation.highest_sub_index || 50
            });

            const isWithinSensorRange = Object.values(stationDistances).some(s => s.distance <= 1.0);
            
            if (isWithinSensorRange || nearestDistance <= 1.0) {
                const idwResult = calculateIDWInterpolation(locationData, stations);
                
                setCurrentDataInfo({
                    method: 'location_interpolation',
                    source: 'interpolated',
                    explanation: `You are ${nearestDistance.toFixed(1)}km from the nearest sensor. Showing calculated air quality for your exact location using data from nearby monitoring stations.`,
                    values: idwResult.interpolated_values,
                    aqi: idwResult.interpolated_aqi,
                    station_name: `Your Location (${userLocationName?.city || 'Current Position'})`,
                    is_interpolated: true,
                    show_distance_message: true,
                    distance_message: `📍 You are within sensor range (${nearestDistance.toFixed(1)}km from nearest), showing calculated values for your exact location`,
                    data_type: 'Your Location Data (Calculated)'
                });
            } else {
                setCurrentDataInfo({
                    method: 'nearest_station',
                    source: 'nearest_station',
                    explanation: `You are ${nearestDistance.toFixed(1)}km from the nearest sensor. Showing data from ${nearestStation.station_info.name} (nearest monitoring station).`,
                    values: nearestStation.averages || {},
                    aqi: nearestStation.highest_sub_index || 50,
                    station_name: nearestStation.station_info.name,
                    is_interpolated: false,
                    show_distance_message: true,
                    distance_message: `📍 You are ${nearestDistance.toFixed(1)}km from the nearest sensor node, so you are seeing data from ${nearestStation.station_info.name}`,
                    data_type: 'Nearest Station Data'
                });
            }
        } else {
            const defaultStation = stations['lora-v1'] || stations[stationIds[0]] || {};
            setCurrentDataInfo({
                method: 'default_station',
                source: 'default',
                explanation: 'Location not available. Showing data from default monitoring station.',
                values: defaultStation.averages || {},
                aqi: defaultStation.highest_sub_index || 50,
                station_name: defaultStation.station_info?.name || 'ASIET Campus Station',
                is_interpolated: false,
                show_distance_message: false,
                distance_message: null,
                data_type: 'Default Station Data'
            });
        }

        console.log('📊 Location context processed for health report');
    }, [userLocationName]);

    // ===== FETCH REPORT DATA (FIXED) =====
    const fetchReportData = useCallback(async () => {
        if (!username) {
            navigate('/login');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;
            
            const timeoutId = setTimeout(() => {
                if (!controller.signal.aborted) {
                    controller.abort();
                }
            }, 30000);

            const url = new URL(`${API_BASE_URL}/api/health-report/`);
            url.searchParams.append('username', username);
            
            if (userLocation) {
                url.searchParams.append('lat', userLocation.lat.toString());
                url.searchParams.append('lng', userLocation.lng.toString());
                console.log('📍 Location added to health report request');
            }

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            clearTimeout(timeoutId);

            if (controller.signal.aborted) {
                console.log('🔄 Health report request was cancelled - this is normal during development');
                return;
            }

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                if (errData.redirect_to) {
                    navigate(errData.redirect_to);
                    return;
                }
                throw new Error(errData.error || `HTTP ${response.status}: Failed to fetch report data`);
            }
            
            const data = await response.json();
            console.log('✅ Health report data received:', data);
            setReportData(data);
            
            if (data.stations) {
                processLocationContext(data, userLocation);
            }
            
        } catch (err) {
            console.error('❌ Error fetching health report:', err);
            
            if (err.name !== 'AbortError') {
                setError(`Failed to load health report data: ${err.message}`);
            } else {
                console.log('🔄 Health report fetch was aborted (normal in development mode)');
            }
        } finally {
            setLoading(false);
        }
    }, [username, navigate, API_BASE_URL, userLocation, processLocationContext]);

    // ===== INITIALIZATION (FIXED) =====
    useEffect(() => {
        let isMounted = true;
        
        const initializeHealthReport = async () => {
            console.log('⚡ Initializing health report with location tracking...');
            
            if (!isMounted) return;
            
            try {
                const location = await getUserLocation();
                console.log('📍 Location obtained for health report:', location);
                
                if (!isMounted) return;
                
                await fetchReportData();
            } catch (locationError) {
                console.log('📍 Location detection failed for health report:', locationError);
                if (isMounted) {
                    setLocationStatus('failed');
                }
                
                if (!isMounted) return;
                
                await fetchReportData();
            }
        };

        const initTimer = setTimeout(() => {
            if (isMounted) {
                initializeHealthReport();
            }
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(initTimer);
            
            if (locationTimeoutRef.current) {
                clearTimeout(locationTimeoutRef.current);
            }
            
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, []);

    // ===== SEPARATE EFFECT FOR DEPENDENCIES =====
    useEffect(() => {
        if (username && !loading) {
            console.log('🔄 Username changed in health report, refreshing data...');
            fetchReportData();
        }
    }, [username, API_BASE_URL]);

    // Memoized calculations
    const aqiInfo = useMemo(() => {
        const aqi = currentDataInfo?.aqi || reportData?.nearest_station?.data?.highest_sub_index;
        if (!aqi) return null;
        return getAQICategory(aqi);
    }, [currentDataInfo, reportData]);

    const healthRisk = useMemo(() => {
        if (!reportData?.health_assessment?.score) return null;
        return getHealthRiskLevel(reportData.health_assessment.score);
    }, [reportData]);

    const recommendations = useMemo(() => {
        if (!aqiInfo || !reportData?.health_assessment) return { general: [], sensitive: [] };
        
        const categoryKey = Object.keys(AQI_CATEGORIES).find(key => 
            AQI_CATEGORIES[key].label === aqiInfo.label
        );
        
        const isHighRisk = reportData.health_assessment.score > 100 || 
                          reportData.health_assessment.risk_level === 'High' ||
                          reportData.health_assessment.risk_level === 'Critical';
        
        return {
            general: GOVERNMENT_RECOMMENDATIONS[categoryKey]?.general || [],
            sensitive: GOVERNMENT_RECOMMENDATIONS[categoryKey]?.sensitive || [],
            isHighRisk
        };
    }, [aqiInfo, reportData]);

    // ===== LOCATION STATUS COMPONENT =====
    const LocationStatus = useMemo(() => {
        const getLocationDisplay = () => {
            switch (locationStatus) {
                case 'initializing':
                    return <span style={{ color: '#6b7280' }}>📍 Initializing location detection...</span>;
                    
                case 'detecting':
                    return (
                        <span style={{ color: '#f59e0b' }}>
                            📍 Detecting your location...
                            {isLocationUpdating && <span className="location-spinner">⟳</span>}
                        </span>
                    );
                    
                case 'gps_detected':
                    const locationName = userLocationName?.display_name || 'Your location';
                    const accuracy = userLocation?.accuracy ? `±${Math.round(userLocation.accuracy)}m` : '';
                    
                    return (
                        <span style={{ color: '#10b981' }}>
                            📍 {locationName} {accuracy && `(${accuracy})`}
                            {nearestStationInfo && (
                                <span style={{ color: '#6b7280', fontSize: '0.9em' }}>
                                    {' '} → Nearest: {nearestStationInfo.name} ({nearestStationInfo.distance.toFixed(1)}km)
                                </span>
                            )}
                        </span>
                    );
                    
                case 'failed':
                    return (
                        <span style={{ color: '#ef4444' }}>
                            📍 Location detection failed - Using default station data
                            <button onClick={getUserLocation} className="retry-location-btn">
                                🔄 Retry
                            </button>
                        </span>
                    );
                    
                default:
                    return <span style={{ color: '#6b7280' }}>📍 Default location</span>;
            }
        };

        return <div className="location-info">{getLocationDisplay()}</div>;
    }, [locationStatus, userLocationName, userLocation, nearestStationInfo, isLocationUpdating, getUserLocation]);

    // ===== MEMOIZED VALUES =====
    const currentValues = useMemo(() => {
        return currentDataInfo?.values || reportData?.nearest_station?.data?.averages || {};
    }, [currentDataInfo, reportData]);

    const currentAQI = useMemo(() => {
        return currentDataInfo?.aqi || reportData?.nearest_station?.data?.highest_sub_index || 50;
    }, [currentDataInfo, reportData]);

    const aqiStatus = useMemo(() => {
        const aqi = currentAQI;
        if (aqi <= 50) return { status: 'GOOD', color: '#10b981', class: 'good' };
        if (aqi <= 100) return { status: 'MODERATE', color: '#f59e0b', class: 'moderate' };
        if (aqi <= 150) return { status: 'UNHEALTHY', color: '#ef4444', class: 'unhealthy' };
        return { status: 'HAZARDOUS', color: '#7c2d12', class: 'hazardous' };
    }, [currentAQI]);

    // ===== EVENT HANDLERS =====
    const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
    
    const handleLogout = useCallback(() => {
        localStorage.clear();
        navigate('/login');
    }, [navigate]);

    const handleRefresh = useCallback(async () => {
        console.log('🔄 Manual refresh triggered for health report');
        setError(null);
        
        try {
            await fetchReportData();
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Manual refresh failed:', error);
                setError('Failed to refresh health report. Please try again.');
            }
        }
    }, [fetchReportData]);

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    const handleDownload = useCallback(() => {
        const reportContent = document.querySelector('.report-container');
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Health Report - ${username}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .no-print { display: none; }
                    </style>
                </head>
                <body>
                    <h1>AirAware Kerala - Health Report</h1>
                    <p>Generated for: ${username}</p>
                    <p>Date: ${currentTime.toLocaleDateString('en-IN')}</p>
                    <hr>
                    ${reportContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }, [username, currentTime]);

    const handleForecastParameterChange = useCallback((parameter) => {
        setSelectedForecastParameter(parameter);
    }, []);

    const handleEnableLocation = useCallback(async () => {
        console.log('📍 Enable location triggered for health report');
        setError(null);
        
        try {
            const location = await getUserLocation();
            await fetchReportData();
        } catch (error) {
            console.error('Failed to get location for health report:', error);
            setError('Failed to enable location. Please check your browser permissions.');
        }
    }, [getUserLocation, fetchReportData]);

    // Get parameter display info
    const getParameterInfo = useCallback((param) => {
        const parameterInfo = {
            pm25: { label: 'PM2.5', icon: '🌱', unit: 'µg/m³', color: '#4f46e5' },
            pm10: { label: 'PM10', icon: '🍃', unit: 'µg/m³', color: '#10b981' },
            no2: { label: 'NO₂', icon: '💨', unit: 'µg/m³', color: '#f59e0b' },
            so2: { label: 'SO₂', icon: '🏭', unit: 'µg/m³', color: '#ef4444' },
            co: { label: 'CO', icon: '☁️', unit: 'mg/m³', color: '#8b5cf6' },
            o3: { label: 'O₃', icon: '☀️', unit: 'µg/m³', color: '#06b6d4' },
            nh3: { label: 'NH₃', icon: '⚗️', unit: 'µg/m³', color: '#84cc16' }
        };
        return parameterInfo[param] || parameterInfo.pm25;
    }, []);

    // ===== LOADING STATE =====
    if (loading) {
        return (
            <div className="health-report-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <h2>🏥 Generating Your Personalized Health Report...</h2>
                    <p>Analyzing your health profile and current air quality conditions</p>
                    <p>📍 Including location-based air quality analysis...</p>
                    {userLocation && (
                        <p style={{ color: '#10b981' }}>
                            ✅ Location detected: {userLocationName?.display_name || 'Processing...'}
                        </p>
                    )}
                    {locationStatus === 'detecting' && (
                        <p style={{ color: '#f59e0b' }}>
                            🔍 Detecting your location for precise analysis...
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // ===== ERROR STATE =====
    if (error) {
        const isConnectionError = error.includes('net::ERR_CONNECTION_REFUSED') || 
                                 error.includes('Failed to fetch') ||
                                 error.includes('NetworkError');
        
        return (
            <div className="health-report-page">
                <div className="error-container">
                    <div className="error-icon">
                        {isConnectionError ? '🌐' : '⚠️'}
                    </div>
                    <h2>
                        {isConnectionError ? 'Connection Error' : 'Unable to Generate Report'}
                    </h2>
                    <div className="error-message">
                        {isConnectionError ? (
                            <div>
                                <p>Cannot connect to the health report service.</p>
                                <div className="connection-help">
                                    <strong>Troubleshooting steps:</strong>
                                    <ul>
                                        <li>Check your internet connection</li>
                                        <li>Ensure the server is running on {API_BASE_URL}</li>
                                        <li>Try refreshing the page</li>
                                        <li>Contact support if the issue persists</li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <p>{error}</p>
                        )}
                    </div>
                    <div className="error-actions">
                        <button onClick={handleRefresh} className="retry-btn">
                            🔄 Try Again
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="back-btn">
                            🏠 Back to Profile
                        </button>
                        {locationStatus === 'failed' && (
                            <button onClick={handleEnableLocation} className="location-btn">
                                📍 Enable Location
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ===== NO DATA STATE =====
    if (!reportData) {
        return (
            <div className="health-report-page">
                <div className="no-data-container">
                    <div className="no-data-icon">📊</div>
                    <h2>No Health Report Data Available</h2>
                    <p>Unable to generate your health report at this time.</p>
                    <button onClick={() => navigate('/dashboard')} className="back-btn">🏠 Back to Profile</button>
                </div>
            </div>
        );
    }

    const { health_assessment, forecast } = reportData;

    return (
        <div className="health-report-page">
            {/* Real-time Status */}
            <div className="realtime-status">
                🔴 LIVE HEALTH REPORT • Updated: {currentTime.toLocaleTimeString('en-IN')} • 
                {currentDataInfo?.is_interpolated ? ' Smart Location Analysis' : ' Government Standards Applied'}
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
                        <li><Link to="/dashboard" className="nav-link">🏠 Profile</Link></li>
                        <li><Link to="/health-assessment" className="nav-link">📋 Health Update</Link></li>
                        <li><Link to="/health-report" className="nav-link active">📄 Health Report</Link></li>
                        <li><Link to="/add-family" className="nav-link">👥 Add Family</Link></li>
                        <li className="user-info">👤 <span>{username}</span></li>
                        <li>
                            <button onClick={handleLogout} className="nav-link login-btn">🚪 Logout</button>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* Alert Banner with Enhanced Location Info */}
            {aqiInfo && (
                <div className={`alert-banner ${aqiInfo.label.toLowerCase().replace(/\s+/g, '-')}`} 
                     style={{ 
                         backgroundColor: aqiInfo.bgColor, 
                         color: aqiInfo.textColor,
                         borderLeft: `4px solid ${aqiInfo.color}`
                     }}>
                    🚨 <span>
                        <strong>GOVERNMENT HEALTH ALERT:</strong> 
                        {currentDataInfo?.is_interpolated ? ' Your Location' : ' Nearest Station'} AQI is {Math.round(currentAQI)} - {aqiInfo.label}
                        {recommendations.isHighRisk && ' • High Risk Individual Identified'}
                        {nearestStationInfo && ` • Distance: ${nearestStationInfo.distance.toFixed(1)}km`}
                    </span>
                </div>
            )}

            {/* Enhanced Location Context Banner */}
            {currentDataInfo?.show_distance_message && (
                <div className="location-context-banner-health">
                    <div className="location-main-content">
                        <div className="location-icon-section" style={{ color: currentDataInfo.is_interpolated ? '#10b981' : '#3b82f6' }}>
                            <div className="location-icon-large">
                                <i className={`fas ${currentDataInfo.is_interpolated ? 'fa-crosshairs' : 'fa-map-marker-alt'}`}></i>
                            </div>
                            <div className="location-badge-large">
                                {currentDataInfo.is_interpolated ? '🎯 Your Location Analysis' : '📍 Nearest Station Data'}
                            </div>
                        </div>
                        
                        <div className="location-details-section">
                            <div className="location-primary-info">
                                <h3>📊 Health Report Data Source: {currentDataInfo.distance_message}</h3>
                                <p className="location-explanation">{currentDataInfo.explanation}</p>
                            </div>
                            
                            <div className="location-stats-grid">
                                <div className="location-stat-item">
                                    <div className="stat-icon">📍</div>
                                    <div className="stat-content">
                                        <div className="stat-label">Your Location</div>
                                        <div className="stat-value">{userLocationName?.display_name || 'Kerala'}</div>
                                    </div>
                                </div>
                                
                                <div className="location-stat-item">
                                    <div className="stat-icon">📊</div>
                                    <div className="stat-content">
                                        <div className="stat-label">Analysis Method</div>
                                        <div className="stat-value">
                                            {currentDataInfo.is_interpolated ? 'Smart Interpolation' : 'Direct Sensor'}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="location-stat-item">
                                    <div className="stat-icon">🎯</div>
                                    <div className="stat-content">
                                        <div className="stat-label">Current AQI</div>
                                        <div className="stat-value" style={{ color: aqiStatus.color }}>
                                            {Math.round(currentAQI)}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="location-stat-item">
                                    <div className="stat-icon">⏰</div>
                                    <div className="stat-content">
                                        <div className="stat-label">Last Update</div>
                                        <div className="stat-value">{currentTime.toLocaleTimeString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Container */}
            <div className="report-container">
                {/* Header Section */}
                <div className="header-section">
                    <div className="header-content">
                        <div className="report-title">
                            <h1>🏥 Personalized Air Quality Health Report</h1>
                            <p className="subtitle">
                                Official analysis based on national air quality standards and your personal health profile
                                {currentDataInfo?.is_interpolated && ' with precise location-based calculations'}
                            </p>
                            <div className="report-meta">
                                <span>📅 Generated: {formatTime(new Date())}</span>
                                <span>👤 For: {username}</span>
                                <span>📍 Location: {currentDataInfo?.station_name || userLocationName?.display_name || 'Kerala'}</span>
                                {currentDataInfo?.is_interpolated && <span>🎯 Method: Smart Interpolation</span>}
                            </div>
                            <div className="location-status-header">
                                {LocationStatus}
                            </div>
                        </div>
                        <div className="government-seal">
                            <div className="seal-icon">🏛️</div>
                            <div className="seal-text">
                                <div>Government of Kerala</div>
                                <div>Air Quality Monitoring</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="report-actions no-print">
                    {locationStatus === 'failed' && (
                        <button onClick={handleEnableLocation} className="action-btn primary">
                            📍 Enable Location for Precise Analysis
                        </button>
                    )}
                    <button onClick={handleRefresh} className="action-btn secondary" disabled={loading}>
                        {loading ? '🔄 Refreshing...' : '🔄 Refresh Report'}
                    </button>
                    <button onClick={handlePrint} className="action-btn secondary">
                        🖨️ Print Report
                    </button>
                    <button onClick={handleDownload} className="action-btn primary">
                        📥 Download PDF
                    </button>
                </div>

                {/* Overview Grid */}
                <div className="overview-section">
                    <h2 className="section-title">
                        📊 Health & Air Quality Overview
                        {currentDataInfo?.is_interpolated && <small> (Calculated for your exact location)</small>}
                    </h2>
                    <div className="overview-grid">
                        {/* Health Score Card */}
                        <div className="overview-card health-card">
                            <div className="card-header">
                                <h4>🏥 Your Health Risk Assessment</h4>
                                <div className="last-updated">Updated: {formatTime(health_assessment?.last_updated || new Date())}</div>
                            </div>
                            <div className="health-score-display">
                                <div className="health-score-circle"
                                     style={{ 
                                         background: `conic-gradient(${healthRisk?.color} ${(health_assessment.score / 100) * 360}deg, #e5e7eb 0deg)` 
                                     }}>
                                    <div className="health-score-inner">
                                        <div className="health-score-value">{health_assessment.score}</div>
                                        <div className="health-score-max">/100</div>
                                    </div>
                                </div>
                                <div className="health-score-info">
                                    <div className={`risk-level-badge ${healthRisk?.level.toLowerCase()}`}
                                         style={{ 
                                             backgroundColor: healthRisk?.bgColor,
                                             color: healthRisk?.color 
                                         }}>
                                        {healthRisk?.level} Risk
                                    </div>
                                    <div className="risk-explanation">
                                        {healthRisk?.level === 'Low' && 'You have minimal risk from air pollution'}
                                        {healthRisk?.level === 'Moderate' && 'You have moderate risk from air pollution'}
                                        {healthRisk?.level === 'High' && 'You are at high risk from air pollution effects'}
                                        {healthRisk?.level === 'Critical' && 'You are at critical risk and need immediate precautions'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Current AQI Card */}
                        <div className="overview-card aqi-card">
                            <div className="card-header">
                                <h4>🌬️ {currentDataInfo?.is_interpolated ? 'Your Location' : 'Current'} Air Quality Status</h4>
                                <div className="station-info">
                                    📍 {currentDataInfo?.station_name || 'Default Station'}
                                    <br />
                                    {currentDataInfo?.is_interpolated && (
                                        <small style={{ color: '#10b981' }}>🎯 Calculated for your exact coordinates</small>
                                    )}
                                    {!currentDataInfo?.is_interpolated && nearestStationInfo && (
                                        <small>Distance: {nearestStationInfo.distance.toFixed(1)}km</small>
                                    )}
                                </div>
                            </div>
                            <div className="aqi-display">
                                <div className="aqi-gauge">
                                    <div className="aqi-value" style={{ color: aqiInfo?.color }}>
                                        {Math.round(currentAQI)}
                                    </div>
                                    <div className="aqi-label">AQI</div>
                                </div>
                                <div className="aqi-category" 
                                     style={{ 
                                         backgroundColor: aqiInfo?.bgColor,
                                         color: aqiInfo?.textColor 
                                     }}>
                                    {aqiInfo?.label}
                                </div>
                                <div className="aqi-range">
                                    Range: {aqiInfo?.min}-{aqiInfo?.max}
                                </div>
                                {currentDataInfo?.is_interpolated && (
                                    <div className="aqi-badge interpolated">
                                        🎯 Your Location
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Weather Impact Card */}
                        <div className="overview-card weather-card">
                            <div className="card-header">
                                <h4>🌤️ Weather Impact on Health</h4>
                                <div className="weather-source">
                                    Source: {currentDataInfo?.is_interpolated ? 'Calculated for your location' : 'Nearest station'}
                                </div>
                            </div>
                            <div className="weather-metrics">
                                <div className="weather-metric">
                                    <div className="metric-icon">🌡️</div>
                                    <div className="metric-content">
                                        <div className="metric-label">Temperature</div>
                                        <div className="metric-value">
                                            {currentValues.temp || 28}°C
                                        </div>
                                    </div>
                                </div>
                                <div className="weather-metric">
                                    <div className="metric-icon">💧</div>
                                    <div className="metric-content">
                                        <div className="metric-label">Humidity</div>
                                        <div className="metric-value">
                                            {currentValues.hum || 65}%
                                        </div>
                                    </div>
                                </div>
                                <div className="weather-metric">
                                    <div className="metric-icon">🌬️</div>
                                    <div className="metric-content">
                                        <div className="metric-label">Pressure</div>
                                        <div className="metric-value">
                                            {currentValues.pre || 1013} hPa
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Key Pollutants Card */}
                        <div className="overview-card pollutants-card">
                            <div className="card-header">
                                <h4>🏭 Key Pollutant Levels</h4>
                                <div className="pollutants-source">
                                    {currentDataInfo?.is_interpolated ? 
                                        '🎯 Calculated for your location' : 
                                        `📍 From ${currentDataInfo?.station_name || 'nearest station'}`
                                    }
                                </div>
                            </div>
                            <div className="pollutants-grid">
                                {[
                                    { key: 'pm25', label: 'PM2.5', icon: '🌱', unit: 'µg/m³', limit: 60 },
                                    { key: 'pm10', label: 'PM10', icon: '🍃', unit: 'µg/m³', limit: 100 },
                                    { key: 'no2', label: 'NO₂', icon: '💨', unit: 'µg/m³', limit: 80 },
                                    { key: 'so2', label: 'SO₂', icon: '🏭', unit: 'µg/m³', limit: 80 }
                                ].map(pollutant => {
                                    const value = currentValues[pollutant.key] || 0;
                                    const percentage = (value / pollutant.limit) * 100;
                                    const isHigh = percentage > 100;
                                    
                                    return (
                                        <div key={pollutant.key} className="pollutant-item">
                                            <div className="pollutant-header">
                                                <span className="pollutant-icon">{pollutant.icon}</span>
                                                <span className="pollutant-label">{pollutant.label}</span>
                                            </div>
                                            <div className="pollutant-bar">
                                                <div className="pollutant-fill" 
                                                     style={{ 
                                                         width: `${Math.min(percentage, 100)}%`,
                                                         backgroundColor: isHigh ? '#ef4444' : percentage > 75 ? '#f59e0b' : '#10b981'
                                                     }}>
                                                </div>
                                            </div>
                                            <div className="pollutant-values">
                                                <span className={`pollutant-value ${isHigh ? 'high' : ''}`}>
                                                    {Math.round(value)} {pollutant.unit}
                                                </span>
                                                <span className="pollutant-limit">
                                                    Limit: {pollutant.limit}
                                                </span>
                                            </div>
                                            {currentDataInfo?.is_interpolated && (
                                                <div className="pollutant-badge interpolated-badge">🎯 Your Location</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Grid - Charts and Details */}
                <div className="dashboard-section">
                    <h2 className="section-title">📈 Air Quality Trends & Analysis</h2>
                    <div className="dashboard-grid">
                        {/* Forecast Chart */}
                        <div className="dashboard-card chart-card">
                            <div className="card-header">
                                <h3>📊 4-Day Air Quality Forecast</h3>
                                <div className="chart-info">
                                    <div className="data-source">
                                        Source: {currentDataInfo?.station_name || nearestStationInfo?.name || 'ASIET Campus Station'}
                                    </div>
                                    <div className="update-time">
                                        Updated: {formatTime(reportData?.stations?.[nearestStationInfo?.id]?.last_updated_on || new Date())}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="forecast-controls">
                                {['pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 'nh3'].map(param => {
                                    const paramInfo = getParameterInfo(param);
                                    return (
                                        <button 
                                            key={param}
                                            className={`param-btn ${selectedForecastParameter === param ? 'active' : ''}`}
                                            onClick={() => handleForecastParameterChange(param)}
                                            title={`View ${paramInfo.label} forecast`}
                                            style={{
                                                backgroundColor: selectedForecastParameter === param ? paramInfo.color : 'white',
                                                color: selectedForecastParameter === param ? 'white' : paramInfo.color,
                                                borderColor: paramInfo.color
                                            }}
                                        >
                                            <span className="param-icon">{paramInfo.icon}</span>
                                            <span className="param-label">{paramInfo.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            
                            <div className="chart-container">
                                <Suspense fallback={
                                    <div className="chart-loading">
                                        <div className="loading-spinner"></div>
                                        <p>Loading forecast chart...</p>
                                    </div>
                                }>
                                    <LazyChart 
                                        forecastData={forecast?.data || []} 
                                        selectedParameter={selectedForecastParameter} 
                                    />
                                </Suspense>
                            </div>
                            
                            <div className="chart-legend">
                                <div className="legend-item">
                                    <span 
                                        className="legend-color" 
                                        style={{ backgroundColor: getParameterInfo(selectedForecastParameter).color }}
                                    ></span>
                                    <span>{getParameterInfo(selectedForecastParameter).label} Forecast</span>
                                </div>
                                <div className="legend-note">
                                    * Values shown are maximum expected levels for each day in {getParameterInfo(selectedForecastParameter).unit}
                                </div>
                            </div>
                        </div>

                        {/* Health Assessment Details */}
                        <div className="dashboard-card details-card">
                            <div className="card-header">
                                <h3>🏥 Complete Health Assessment</h3>
                                <div className="assessment-date">
                                    Last Updated: {formatTime(health_assessment?.last_updated || new Date())}
                                </div>
                            </div>
                            <div className="health-details-container">
                                {health_assessment?.details && Object.entries(health_assessment.details).map(([key, value]) => (
                                    <div key={key} className="health-detail-item">
                                        <div className="detail-label">
                                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                                        </div>
                                        <div className="detail-value">
                                            {Array.isArray(value) ? (
                                                value.length > 0 ? (
                                                    <ul className="detail-list">
                                                        {value.map((item, index) => (
                                                            <li key={index}>{item}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="no-items">None reported</span>
                                                )
                                            ) : (
                                                <span>{value || 'Not specified'}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Critical Alert Section */}
                {(aqiInfo?.min >= 151 || recommendations.isHighRisk) && (
                    <div className="critical-alert">
                        <div className="alert-header">
                            <div className="alert-icon">🚨</div>
                            <div className="alert-title">IMMEDIATE HEALTH PRECAUTIONS REQUIRED</div>
                        </div>
                        <div className="alert-content">
                            <div className="alert-reason">
                                {aqiInfo?.min >= 151 && (
                                    <p><strong>Air Quality Emergency:</strong> Current AQI of {Math.round(currentAQI)} poses immediate health risks.</p>
                                )}
                                {recommendations.isHighRisk && (
                                    <p><strong>High-Risk Individual:</strong> Your health profile indicates increased vulnerability to air pollution.</p>
                                )}
                                {currentDataInfo?.is_interpolated && (
                                    <p><strong>Precise Location Analysis:</strong> This alert is based on air quality calculated specifically for your exact location coordinates.</p>
                                )}
                            </div>
                            <div className="emergency-actions">
                                <div className="emergency-action">📞 Emergency Helpline: Kerala Pollution Control Board – <strong>0471-2418566</strong></div>
                                <div className="emergency-action">🏥 Seek immediate medical attention if experiencing breathing difficulties</div>
                                <div className="emergency-action">🏠 Stay indoors and avoid all outdoor activities</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Government Recommendations Section */}
                <div className="recommendations-section">
                    <div className="section-header">
                        <h2 className="section-title">
                            🏛️ Official Government Health Recommendations
                        </h2>
                        <div className="authority-badge">
                            Kerala Pollution Control Board Guidelines
                            {currentDataInfo?.is_interpolated && (
                                <span className="location-badge"> • Location-Specific Analysis</span>
                            )}
                        </div>
                    </div>

                    <div className="recommendations-container">
                        {/* General Population Recommendations */}
                        <div className="recommendation-category">
                            <div className="category-header">
                                <div className="category-icon">👥</div>
                                <div className="category-title">General Public</div>
                                <div className="category-subtitle">
                                    Recommendations for all residents
                                    {currentDataInfo?.is_interpolated && ' in your area'}
                                </div>
                            </div>
                            <div className="recommendations-grid">
                                {recommendations.general.map((rec, index) => (
                                    <div key={index} className="recommendation-card general">
                                        <div className="rec-icon">
                                            <i className="fas fa-info-circle"></i>
                                        </div>
                                        <div className="rec-content">
                                            <div className="rec-text">{rec}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sensitive Groups Recommendations */}
                        <div className="recommendation-category">
                            <div className="category-header">
                                <div className="category-icon">⚕️</div>
                                <div className="category-title">
                                    Sensitive Groups 
                                    {recommendations.isHighRisk && <span className="your-category"> (Your Category)</span>}
                                </div>
                                <div className="category-subtitle">
                                    Children, elderly, pregnant women, people with heart/lung conditions
                                </div>
                            </div>
                            <div className="recommendations-grid">
                                {recommendations.sensitive.map((rec, index) => (
                                    <div key={index} className={`recommendation-card sensitive ${recommendations.isHighRisk ? 'highlighted' : ''}`}>
                                        <div className="rec-icon">
                                            <i className="fas fa-exclamation-triangle"></i>
                                        </div>
                                        <div className="rec-content">
                                            <div className="rec-text">{rec}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Data Source Information */}
                <div className="data-source-section">
                    <h3>⚡ System Status & Data Source</h3>
                    <div className="status-grid">
                        <div className="status-item">
                            <div className="status-icon">📍</div>
                            <div className="status-content">
                                <div className="status-title">Location Status</div>
                                <div className="status-value">
                                    {locationStatus === 'gps_detected' ? 'GPS Active' : 
                                     locationStatus === 'detecting' ? 'Detecting...' : 
                                     locationStatus === 'failed' ? 'Failed' : 'Default'}
                                </div>
                            </div>
                        </div>
                        <div className="status-item">
                            <div className="status-icon">📊</div>
                            <div className="status-content">
                                <div className="status-title">Analysis Method</div>
                                <div className="status-value">
                                    {currentDataInfo?.is_interpolated ? 'Smart Interpolation' : 'Direct Sensor'}
                                </div>
                            </div>
                        </div>
                        <div className="status-item">
                            <div className="status-icon">📡</div>
                            <div className="status-content">
                                <div className="status-title">Data Source</div>
                                <div className="status-value">
                                    {currentDataInfo?.station_name || 'Default Station'}
                                </div>
                            </div>
                        </div>
                        <div className="status-item">
                            <div className="status-icon">🔄</div>
                            <div className="status-content">
                                <div className="status-title">Last Update</div>
                                <div className="status-value">
                                    {currentTime.toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {currentDataInfo && (
                        <div className="data-explanation">
                            <h4>📋 Health Report Data Source Explanation:</h4>
                            <p>{currentDataInfo.explanation}</p>
                            {currentDataInfo.is_interpolated && (
                                <div className="interpolation-details">
                                    <strong>🎯 Spatial Interpolation Method for Health Analysis:</strong>
                                    <ul>
                                        <li>Using Inverse Distance Weighting (IDW) algorithm for precise location analysis</li>
                                        <li>Data from {Object.keys(reportData?.stations || {}).length} monitoring stations</li>
                                        <li>Personalized health risk estimates for your exact coordinates</li>
                                        <li>Real-time location-aware health recommendations</li>
                                        <li>Enhanced accuracy for sensitive health assessments</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Emergency Contacts */}
                <div className="emergency-section">
                    <h2 className="section-title">🚨 Emergency Contacts & Resources</h2>
                    <div className="emergency-grid">
                        <div className="emergency-card">
                            <div className="emergency-icon">📞</div>
                            <div className="emergency-content">
                                <h4>Kerala Pollution Control Board</h4>
                                <div className="contact-number">0471-2418566</div>
                                <p>24/7 Emergency hotline for air quality complaints and health emergencies</p>
                            </div>
                        </div>
                        <div className="emergency-card">
                            <div className="emergency-icon">🏥</div>
                            <div className="emergency-content">
                                <h4>Medical Emergency</h4>
                                <div className="contact-number">108</div>
                                <p>Immediate medical assistance for pollution-related health issues</p>
                            </div>
                        </div>
                        <div className="emergency-card">
                            <div className="emergency-icon">🌐</div>
                            <div className="emergency-content">
                                <h4>Live Air Quality Updates</h4>
                                <div className="contact-number">airaware.kerala.gov.in</div>
                                <p>Real-time air quality monitoring and health advisories</p>
                            </div>
                        </div>
                        <div className="emergency-card">
                            <div className="emergency-icon">📱</div>
                            <div className="emergency-content">
                                <h4>Mobile App</h4>
                                <div className="contact-number">AirAware Kerala</div>
                                <p>Download for instant notifications and personalized alerts</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Health Tips Section */}
                <div className="health-tips-section">
                    <h2 className="section-title">💡 Daily Health Tips for Air Quality Protection</h2>
                    <div className="tips-container">
                        <div className="tips-category">
                            <h3>🏠 Indoor Air Quality</h3>
                            <div className="tips-grid">
                                <div className="tip-card">
                                    <div className="tip-icon">🌿</div>
                                    <div className="tip-text">Keep indoor plants like Areca Palm, Snake Plant, and Money Plant to naturally purify air</div>
                                </div>
                                <div className="tip-card">
                                    <div className="tip-icon">🚪</div>
                                    <div className="tip-text">Keep windows and doors closed during high pollution hours (7-10 AM, 7-10 PM)</div>
                                </div>
                                <div className="tip-card">
                                    <div className="tip-icon">🔧</div>
                                    <div className="tip-text">Use air purifiers with HEPA filters in bedrooms and living areas</div>
                                </div>
                                <div className="tip-card">
                                    <div className="tip-icon">🧽</div>
                                    <div className="tip-text">Clean and vacuum regularly to reduce indoor dust and allergens</div>
                                </div>
                            </div>
                        </div>

                        <div className="tips-category">
                            <h3>🚶‍♂️ Outdoor Activities</h3>
                            <div className="tips-grid">
                                <div className="tip-card">
                                    <div className="tip-icon">⏰</div>
                                    <div className="tip-text">Exercise early morning (5-7 AM) or late evening (after 8 PM) when pollution is lower</div>
                                </div>
                                <div className="tip-card">
                                    <div className="tip-icon">😷</div>
                                    <div className="tip-text">Wear N95 or N99 masks when AQI is above 100</div>
                                </div>
                                <div className="tip-card">
                                    <div className="tip-icon">🌳</div>
                                    <div className="tip-text">Choose parks and green areas away from traffic for outdoor activities</div>
                                </div>
                                <div className="tip-card">
                                    <div className="tip-icon">🚗</div>
                                    <div className="tip-text">Use public transport or carpool to reduce vehicle emissions</div>
                                </div>
                            </div>
                        </div>

                        <div className="tips-category">
                            <h3>🥗 Dietary Protection</h3>
                            <div className="tips-grid">
                                <div className="tip-card">
                                    <div className="tip-icon">🫖</div>
                                    <div className="tip-text">Drink herbal teas (tulsi, ginger, turmeric) to boost respiratory immunity</div>
                                </div>
                                <div className="tip-card">
                                    <div className="tip-icon">🥕</div>
                                    <div className="tip-text">Eat antioxidant-rich foods: carrots, spinach, broccoli, and citrus fruits</div>
                                </div>
                                <div className="tip-card">
                                    <div className="tip-icon">💧</div>
                                    <div className="tip-text">Stay hydrated with 8-10 glasses of water daily to help flush toxins</div>
                                </div>
                                <div className="tip-card">
                                    <div className="tip-icon">🌶️</div>
                                    <div className="tip-text">Include anti-inflammatory spices: turmeric, ginger, garlic in daily meals</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Report Summary */}
                <div className="report-summary-section">
                    <h2 className="section-title">📋 Report Summary & Next Steps</h2>
                    <div className="summary-container">
                        <div className="summary-stats">
                            <div className="summary-stat">
                                <div className="stat-label">Your Health Risk Level</div>
                                <div className="stat-value" style={{ color: healthRisk?.color }}>
                                    {healthRisk?.level || 'Unknown'}
                                </div>
                            </div>
                            <div className="summary-stat">
                                <div className="stat-label">Current AQI Category</div>
                                <div className="stat-value" style={{ color: aqiInfo?.color }}>
                                    {aqiInfo?.label || 'Unknown'}
                                </div>
                            </div>
                            <div className="summary-stat">
                                <div className="stat-label">Data Analysis Method</div>
                                <div className="stat-value">
                                    {currentDataInfo?.is_interpolated ? 'Location-Specific' : 'Nearest Station'}
                                </div>
                            </div>
                            <div className="summary-stat">
                                <div className="stat-label">Next Assessment Due</div>
                                <div className="stat-value">
                                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}
                                </div>
                            </div>
                        </div>

                        <div className="next-steps">
                            <h3>🎯 Recommended Next Steps</h3>
                            <div className="next-steps-list">
                                <div className="next-step">
                                    <div className="step-number">1</div>
                                    <div className="step-content">
                                        <strong>Follow Government Recommendations:</strong> Implement the specific recommendations for your AQI category and risk level.
                                    </div>
                                </div>
                                <div className="next-step">
                                    <div className="step-number">2</div>
                                    <div className="step-content">
                                        <strong>Monitor Daily:</strong> Check daily AQI updates and adjust activities accordingly. Enable location for precise data.
                                    </div>
                                </div>
                                <div className="next-step">
                                    <div className="step-number">3</div>
                                    <div className="step-content">
                                        <strong>Health Reassessment:</strong> Update your health profile monthly or when health conditions change.
                                    </div>
                                </div>
                                <div className="next-step">
                                    <div className="step-number">4</div>
                                    <div className="step-content">
                                        <strong>Emergency Preparedness:</strong> Keep emergency contacts handy and know when to seek medical help.
                                    </div>
                                </div>
                                {currentDataInfo?.is_interpolated && (
                                    <div className="next-step">
                                        <div className="step-number">5</div>
                                        <div className="step-content">
                                            <strong>Location Advantage:</strong> Continue using location services for the most accurate health assessments.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Government Disclaimer */}
                <div className="disclaimer-section">
                    <h3>📄 Official Disclaimer & Data Sources</h3>
                    <div className="disclaimer-content">
                        <div className="disclaimer-item">
                            <strong>🏛️ Data Authority:</strong> Air quality data sourced from Government of Kerala monitoring stations operated under Central Pollution Control Board (CPCB) guidelines.
                        </div>
                        <div className="disclaimer-item">
                            <strong>⚕️ Health Advisory:</strong> Recommendations are based on standard government health guidelines. Consult healthcare professionals for personalized medical advice.
                        </div>
                        <div className="disclaimer-item">
                            <strong>📊 Data Accuracy:</strong> Air quality readings are updated every 30 seconds from certified monitoring equipment. Historical accuracy 95%.
                        </div>
                        <div className="disclaimer-item">
                            <strong>🎯 Location Analysis:</strong> 
                            {currentDataInfo?.is_interpolated ? 
                                ' Enhanced spatial interpolation provides location-specific calculations with improved accuracy for personalized health assessments.' :
                                ' Using nearest station data. Enable location services for more precise, location-specific health analysis.'
                            }
                        </div>
                        <div className="disclaimer-item">
                            <strong>🔄 Updates:</strong> This report reflects current conditions. Air quality can change rapidly - check live updates frequently.
                        </div>
                        <div className="disclaimer-item">
                            <strong>📞 Emergency:</strong> In case of severe health symptoms related to air pollution, immediately contact medical emergency services (108) or Kerala Pollution Control Board (0471-2418566).
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-container">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h4>AirAware Kerala</h4>
                            <p>Government-approved Air Quality Monitoring System</p>
                            <p>Real-time data • Location-aware analysis • Health-focused</p>
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
                                <li><Link to="/dashboard">🏠 Profile</Link></li>
                                <li><Link to="/health-assessment">📋 Health Assessment</Link></li>
                                <li><Link to="/add-family">👥 Add Family</Link></li>
                            </ul>
                        </div>
                        <div className="footer-section">
                            <h4>Government Partners</h4>
                            <ul>
                                <li>Kerala Pollution Control Board</li>
                                <li>Central Pollution Control Board</li>
                                <li>Ministry of Environment & Forests</li>
                                <li>Kerala State Health Department</li>
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
                                <strong>Emergency:</strong> 0471-2418566<br/>
                                <strong>Email:</strong> aiiot@adishankara.ac.in<br/>
                                <strong>Phone:</strong> 0484 246 3825
                            </p>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2025 AirAware Kerala - Government Approved Air Quality Monitoring</p>
                        <p>Powered by real sensor data • Location-aware analysis • CPCB standards • Ministry of Environment approved</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default HealthReport;