import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import './css/Dashboard.css';
import logoImage from '../assets/aqi.webp'; 

// Lazy loading components
const LazyMap = React.lazy(() =>
  import('./LazyMap').catch(() => ({
    default: () => (
      <div className="map-fallback">
        <div className="map-placeholder">
          <div className="map-icon">🗺️</div>
          <p>Interactive map loading...</p>
        </div>
      </div>
    )
  }))
);

const LazyChart = React.lazy(() =>
  import('./LazyChart').catch(() => ({
    default: () => (
      <div className="chart-fallback">
        <div className="chart-placeholder">
          <div className="chart-icon">📊</div>
          <p>Chart loading...</p>
        </div>
      </div>
    )
  }))
);

// Utility Functions
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
// ...

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

  // Strategy 1: Check known locations first (within 1km radius)
  const coordKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
  if (KNOWN_LOCATIONS[coordKey]) {
    console.log('✅ Using exact known location:', KNOWN_LOCATIONS[coordKey].display_name);
    return KNOWN_LOCATIONS[coordKey];
  }

  // Strategy 2: Check nearby known locations (within 2km)
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

  // Strategy 3: Try multiple geocoding services
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

  // CORRECTED: Smart logic to find the best location name
  if (validResults.length > 0) {
    const bestResult = validResults.find(r => r.location && r.location.city) || validResults[0];
    console.log('✅ Using best available geocoding result from:', bestResult.service, bestResult.location.display_name);
    return bestResult.location;
  }

  // Strategy 4: Intelligent regional fallback
  const regionalFallback = getRegionalFallback(lat, lng);
  console.log('⚠️ ', regionalFallback.display_name);
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

// CORRECTED: Improved regional fallback logic
const getRegionalFallback = (lat, lng) => {
  if (lat >= 9.8 && lat <= 10.4 && lng >= 76.1 && lng <= 76.6) {
    return {
      display_name: 'Near Ernakulam, Kerala',
      city: 'Ernakulam District',
      state: 'Kerala',
      country: 'India'
    };
  }
  if (lat >= 10.15 && lat <= 10.20 && lng >= 76.40 && lng <= 76.45) {
    return {
      display_name: 'Kalady Area, Kerala',
      city: 'Kalady',
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

function Dashboard() {
  // ===== STATE MANAGEMENT =====
  const [username] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.name || 'User';
    } catch {
      return 'User';
    }
  });

  const [selectedParameter, setSelectedParameter] = useState('pm25');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userLocationName, setUserLocationName] = useState(null);
  const [nearestStationInfo, setNearestStationInfo] = useState(null);
  const [currentDataInfo, setCurrentDataInfo] = useState(null);
  const [locationStatus, setLocationStatus] = useState('initializing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLocationUpdating, setIsLocationUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [healthData, setHealthData] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const handleParameterChange = useCallback((param) => setSelectedParameter(param), []);


  const navigate = useNavigate();
  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://airaware-app-gcw7.onrender.com'
    : 'http://localhost:8000';

  const locationTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // ===== MOBILE DETECTION AND RESIZE HANDLER =====
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);
      if (!mobile && isMenuOpen) {
        setIsMenuOpen(false);
        document.body.style.overflow = '';
      }
    };
    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };
    window.addEventListener('resize', debouncedResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, [isMenuOpen]);

  // ===== MOBILE NAVIGATION HANDLERS =====
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => {
      const newState = !prev;
      document.body.style.overflow = newState ? 'hidden' : '';
      return newState;
    });
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
      }
    };
    const handleClickOutside = (e) => {
      if (isMenuOpen && isMobileView) {
        const navLinks = document.querySelector('.nav-links');
        const menuToggle = document.querySelector('.menu-toggle');
        if (navLinks && !navLinks.contains(e.target) &&
            menuToggle && !menuToggle.contains(e.target)) {
          closeMenu();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen, isMobileView, closeMenu]);

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
      }, 10000);
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
            console.log('📍 Location name resolved:', locationName.display_name);
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
          console.log('GPS error:', error.message);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }, []);

  // ===== FETCH DASHBOARD DATA =====
  const fetchDashboardData = useCallback(async (locationData = null) => {
    setLoading(true);
    setError(null);
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const url = new URL(`${API_BASE_URL}/api/dashboard/`);
      url.searchParams.append('username', username);
      if (locationData) {
        url.searchParams.append('lat', locationData.lat.toString());
        url.searchParams.append('lng', locationData.lng.toString());
      }
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('✅ Dashboard data received:', data);
      if (data.health_data) {
        console.log('✅ Health data found:', data.health_data);
        setHealthData(data.health_data);
      }
      processDashboardData(data, locationData);
      setLastUpdateTime(new Date());
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      if (error.name !== 'AbortError') {
        loadSampleData();
      }
    } finally {
      setLoading(false);
    }
  }, [username, API_BASE_URL]);

  // ===== PROCESS DASHBOARD DATA =====
  const processDashboardData = useCallback((data, locationData) => {
    if (!data || !data.stations) {
      console.warn('No station data received');
      return;
    }
    setDashboardData(data);
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
      const isWithinSensorRange = Object.values(stationDistances).some(s => s.distance <= 2.0);
      if (isWithinSensorRange || nearestDistance <= 1.0) {
        const idwResult = calculateIDWInterpolation(locationData, stations);
        setCurrentDataInfo({
          method: 'location_interpolation',
          source: 'interpolated',
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
        source: '',
        explanation: '',
        values: defaultStation.averages || {},
        aqi: defaultStation.highest_sub_index || 50,
        station_name: defaultStation.station_info?.name || 'ASIET Campus Station',
        is_interpolated: false,
        show_distance_message: false,
        distance_message: null,
        data_type: ' Station Data'
      });
    }
    console.log('📊 Dashboard data processed successfully');
  }, [userLocationName]);

  // ===== IDW INTERPOLATION CALCULATION =====
  const calculateIDWInterpolation = useCallback((locationData, stations) => {
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
  }, []);

  // ===== LOAD SAMPLE DATA =====
  const loadSampleData = useCallback(() => {
    console.log('🔄 Loading sample data...');
    const sampleData = {
      stations: {
        'lora-v1': {
          station_info: { name: 'ASIET Campus Station', lat: 10.178322, lng: 76.430891, description: 'Educational Institution Area' },
          averages: { pm25: 25, pm10: 42, so2: 8, no2: 40, co: 1.1, o3: 46, nh3: 93, temp: 28, hum: 65, pre: 1013 },
          highest_sub_index: 50,
          last_updated_on: 'Sample Data'
        },
        'loradev2': {
          station_info: { name: 'Mattoor Junction Station', lat: 10.170950, lng: 76.429628, description: 'Urban Commercial Area' },
          averages: { pm25: 22, pm10: 38, so2: 7, no2: 35, co: 1.0, o3: 43, nh3: 88, temp: 27, hum: 68, pre: 1012 },
          highest_sub_index: 45,
          last_updated_on: 'Sample Data'
        }
      },
      forecasts: {
        'lora-v1': [
          { day: 'Today', pm25_max: 30, pm10_max: 37, so2_max: 8, no2_max: 40, co_max: 1.1, o3_max: 46, nh3_max: 93 },
          { day: 'Tomorrow', pm25_max: 24, pm10_max: 34, so2_max: 8, no2_max: 45, co_max: 1.2, o3_max: 43, nh3_max: 100 },
          { day: 'Day 3', pm25_max: 24, pm10_max: 30, so2_max: 8, no2_max: 42, co_max: 1.2, o3_max: 45, nh3_max: 100 },
          { day: 'Day 4', pm25_max: 20, pm10_max: 23, so2_max: 8, no2_max: 38, co_max: 1.2, o3_max: 47, nh3_max: 100 }
        ],
        'loradev2': [
          { day: 'Today', pm25_max: 28, pm10_max: 35, so2_max: 7, no2_max: 38, co_max: 1.0, o3_max: 44, nh3_max: 90 },
          { day: 'Tomorrow', pm25_max: 22, pm10_max: 32, so2_max: 7, no2_max: 42, co_max: 1.1, o3_max: 41, nh3_max: 95 },
          { day: 'Day 3', pm25_max: 22, pm10_max: 28, so2_max: 7, no2_max: 40, co_max: 1.1, o3_max: 43, nh3_max: 95 },
          { day: 'Day 4', pm25_max: 18, pm10_max: 21, so2_max: 7, no2_max: 36, co_max: 1.1, o3_max: 45, nh3_max: 95 }
        ]
      },
      health_data: { risk_level: 'Low', score: 75, recommendations: ['Enjoy outdoor activities', 'Open windows for fresh air'] }
    };
    setHealthData(sampleData.health_data);
    processDashboardData(sampleData, userLocation);
    setLastUpdateTime(new Date());
    console.log('');
  }, [userLocation, processDashboardData]);

  // ===== INITIALIZATION =====
  useEffect(() => {
    const initializeDashboard = async () => {
      console.log('⚡ Initializing dashboard...');
      await fetchDashboardData();
      try {
        const location = await getUserLocation();
        console.log('📍 Location obtained:', location);
        await fetchDashboardData(location);
      } catch (locationError) {
        console.log('📍 Location detection failed:', locationError);
        setLocationStatus('failed');
      }
    };
    initializeDashboard();
    return () => {
      if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchDashboardData, getUserLocation]);

  // ===== MEMOIZED VALUES =====
  const currentValues = useMemo(() => currentDataInfo?.values || {}, [currentDataInfo]);
  const currentAQI = useMemo(() => currentDataInfo?.aqi || 50, [currentDataInfo]);
  const aqiStatus = useMemo(() => {
    const aqi = currentAQI;
    if (aqi <= 50) return { status: 'GOOD', color: '#10b981', class: 'good' };
    if (aqi <= 100) return { status: 'MODERATE', color: '#f59e0b', class: 'moderate' };
    if (aqi <= 150) return { status: 'UNHEALTHY', color: '#ef4444', class: 'unhealthy' };
    return { status: 'HAZARDOUS', color: '#7c2d12', class: 'hazardous' };
  }, [currentAQI]);

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
          const accuracy = userLocation?.accuracy ? `${Math.round(userLocation.accuracy)}m` : '';

          return (
            <span style={{ color: '#10b981' }}>
        📍 {locationName}
            {nearestStationInfo && (
              <span style={{ color: '#6b7280', fontSize: '0.9em' }}>
                {' '} → Nearest: {nearestStationInfo.name} ({nearestStationInfo.distance.toFixed(1)}km)
              </span>
            )}
      </span>

          );
        case 'failed':
            return null;
        default:
          return <span style={{ color: '#6b7280' }}>📍 </span>;
      }
    };
    return <div className="location-info">{getLocationDisplay()}</div>;
  }, [locationStatus, userLocationName, userLocation, nearestStationInfo, isLocationUpdating, getUserLocation]);

  // ===== UI HELPER FUNCTIONS =====
  const formatValue = useCallback((value, metric) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0';
    return metric === 'co' ? numValue.toFixed(1) : Math.round(numValue);
  }, [])

  const metricIcons = useMemo(() => ({
    pm25: '🌱', pm10: '🍃', so2: '🏭', no2: '💨',
    co: '☁️', o3: '☀️', nh3: '⚗️'
  }), []);

  // ===== METRIC CARDS =====
  const MetricCards = useMemo(() => {
    const parameters = ['pm25', 'pm10', 'so2', 'no2', 'co', 'o3', 'nh3'];
    return parameters.map((key) => {
      const value = currentValues[key] || 0;
      return (
        <div key={key} className="metric-card">
          <div className="metric-icon">{metricIcons[key] || '📊'}</div>
          <div className="metric-value">{formatValue(value, key)}</div>
          <div className="metric-label">{key.toUpperCase()}</div>
          <div className="metric-unit">{key === 'co' ? 'mg/m³' : 'µg/m³'}</div>
          {currentDataInfo?.is_interpolated && (<div className="metric-badge interpolated-badge">🎯 Your Location</div>)}
          {!currentDataInfo?.is_interpolated && (<div className="metric-badge nearest-badge">📍 Nearest Station</div>)}
        </div>
      );
    });
  }, [currentValues, metricIcons, formatValue, currentDataInfo]);

  // ===== EVENT HANDLERS =====
  const handleNavLinkClick = useCallback(() => { 
  if (isMobileView) closeMenu(); 
}, [isMobileView, closeMenu]);

  const handleLogout = useCallback(() => {
    if (isMobileView) closeMenu();
    
    // FIXED: Clear storage and navigate properly
    try {
      localStorage.clear();
      // Force a clean navigation to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback navigation
      navigate('/login');
    }
  }, [navigate, isMobileView, closeMenu]);






  const handleRefreshData = useCallback(() => fetchDashboardData(userLocation), [fetchDashboardData, userLocation]);
  const handleEnableLocation = useCallback(async () => {
    try {
      const location = await getUserLocation();
      await fetchDashboardData(location);
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  }, [getUserLocation, fetchDashboardData]);

  return (
    <div className="dashboard-page">
      <div className="realtime-status">
        🔴 LIVE • Real-time air quality monitoring system active
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={() => setError(null)} className="error-close">✕</button>
        </div>
      )}

      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
                      {/* 2. USE THE IMPORTED VARIABLE */}
                      <img src={logoImage} alt="AQM Logo" width={isMobileView ? "32" : "40"} height={isMobileView ? "32" : "40"} />
                      AirAware
                    </Link>
          <div className="menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? '✕' : '☰'}
          </div>
          <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <li><Link to="/" className="nav-link" onClick={handleNavLinkClick}>🏠 Home</Link></li>
            <li><Link to="/health-assessment" className="nav-link" onClick={handleNavLinkClick}>📋 Health Update</Link></li>
            <li><Link to="/health-report" className="nav-link" onClick={handleNavLinkClick}>📄 Health Report</Link></li>
            <li><Link to="/add-family" className="nav-link" onClick={handleNavLinkClick}>👥 Add Family</Link></li>
            <li><Link to="/map" className="nav-link" onClick={handleNavLinkClick}>🗺️ Live Map</Link></li>
            <li className="user-info">👤 <span>{username}</span></li>
            <li><button onClick={handleLogout} className="nav-link login-btn">🚪 Logout</button></li>
          </ul>
        </div>
      </nav>

      <div className={`alert-banner ${aqiStatus.class}`}>
        ℹ️ <span>
          {currentDataInfo?.station_name || 'Your Location'} AQI: {Math.round(currentAQI)} - {aqiStatus.status}
          {nearestStationInfo && !isMobileView && ` • Distance to nearest sensor: ${nearestStationInfo.distance.toFixed(1)}km`}
        </span>
      </div>

      <div className="main-container">
        <div className="welcome-header">
          <div className="welcome-content">
            <div className="welcome-info">
              <div className="user-avatar">👤</div>
              <div className="welcome-text">
                <h1>Welcome, {username}!</h1>
                {LocationStatus}
                {healthData && (
                  <div className="health-status-inline">
                    <span className="health-label">Your Health Risk Level: </span>
                    <span className={`health-level ${healthData.risk_level.toLowerCase()}`}>{healthData.risk_level} (Score: {healthData.score})</span>
                  </div>
                )}
              </div>
            </div>
            <div className="aqi-overview">
              <div className="aqi-value" style={{ color: aqiStatus.color }}>{Math.round(currentAQI)}</div>
              <div className="aqi-status">{currentDataInfo?.is_interpolated ? 'Your Location AQI' : 'Nearest Station AQI'}</div>
              <div className="aqi-badge">
                {currentDataInfo?.station_name || 'Your Location'}
                {currentDataInfo?.is_interpolated && <span className="location-indicator"> 🎯 Your Location</span>}
                {!currentDataInfo?.is_interpolated && <span className="nearest-indicator"> 📍 Nearest</span>}
              </div>
              <div className="last-updated">Last updated: {lastUpdateTime.toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        {currentDataInfo?.show_distance_message && (
          <div className="location-context-banner-horizontal">
            <div className="location-main-content">
              <div className="location-icon-section" style={{ color: currentDataInfo.is_interpolated ? '#10b981' : '#3b82f6' }}>
                <div className="location-icon-large"><i className={`fas ${currentDataInfo.is_interpolated ? 'fa-crosshairs' : 'fa-map-marker-alt'}`}></i></div>
                <div className="location-badge-large">{currentDataInfo.is_interpolated ? '🎯 Your Location' : '📍 Nearest Station'}</div>
              </div>
              <div className="location-details-section">
                <div className="location-primary-info">
                  <h3>{currentDataInfo.distance_message}</h3>
                  <p className="location-explanation">{currentDataInfo.explanation}</p>
                </div>
                <div className="location-stats-grid">
                  <div className="location-stat-item"><div className="stat-icon">📍</div><div className="stat-content"><div className="stat-label">Data Source</div><div className="stat-value">{currentDataInfo?.station_name}</div></div></div>
                  <div className="location-stat-item"><div className="stat-icon">📊</div><div className="stat-content"><div className="stat-label">Method</div><div className="stat-value">{currentDataInfo.is_interpolated ? 'Smart Interpolation' : 'Direct Sensor'}</div></div></div>
                  <div className="location-stat-item"><div className="stat-icon">🎯</div><div className="stat-content"><div className="stat-label">Current AQI</div><div className="stat-value" style={{ color: aqiStatus.color }}>{Math.round(currentAQI)}</div></div></div>
                  <div className="location-stat-item"><div className="stat-icon">⏰</div><div className="stat-content"><div className="stat-label">Last Update</div><div className="stat-value">{lastUpdateTime.toLocaleTimeString()}</div></div></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="action-buttons">
          {locationStatus === 'failed' && (
            <button onClick={handleEnableLocation} className="action-btn primary">📍 Enable Location for Personalized Data</button>
          )}
          
        </div>

        <div className="metrics-section">
          <h2 className="section-title">
            🌬️ {currentDataInfo?.is_interpolated ? 'Your Location Air Quality' : 'Nearest Station Air Quality'}
            {currentDataInfo?.is_interpolated && <small> (Calculated for your exact coordinates)</small>}
            {!currentDataInfo?.is_interpolated && <small> (Data from {currentDataInfo?.station_name})</small>}
          </h2>
          <div className="metrics-grid">{MetricCards}</div>
        </div>

        <div className="dashboard-grid">
          <div id="map-section" className="dashboard-card map-card">
            <div className="card-header">
              <h3 className="card-title">🗺️ Live Sensor Network</h3>
              <div className="map-controls">
                {userLocationName && <div className="location-display">📍 {isMobileView ? userLocationName.city : userLocationName.display_name}</div>}
                <div className="map-legend">
                  <span className="legend-item"><span className="legend-dot user-location"></span>Your Location</span>
                  <span className="legend-item"><span className="legend-dot sensor-station"></span>Sensor Stations</span>
                </div>
              </div>
            </div>
            <div className="map-container">
              <React.Suspense fallback={<div className="map-fallback"><div className="map-placeholder"><div className="map-icon">🗺️</div><p>Loading interactive map...</p><div className="loading-spinner"></div></div></div>}>
                <LazyMap
                  userLocation={userLocation}
                  stations={dashboardData?.stations}
                  currentAQI={currentAQI}
                  dataType={currentDataInfo?.method || 'default'}
                  nearestStation={nearestStationInfo}
                  userLocationName={userLocationName}
                />
              </React.Suspense>
            </div>
            <div className="map-info">
              <div className="map-status">
                <span className="status-indicator">🔴 LIVE • {Object.keys(dashboardData?.stations || {}).length} stations active</span>
                {currentDataInfo?.is_interpolated && <span className="smart-badge">🎯 Smart Interpolation Active</span>}
              </div>
              <div className="map-description">Blue marker shows your location • Tower markers show monitoring stations • Click any marker for detailed readings</div>
            </div>
          </div>

          <div className="dashboard-card forecast-card">
            <div className="card-header">
              <h3 className="card-title">📊 4-Day Air Quality Forecast</h3>
              <div className="forecast-info">
                <div className="forecast-source">Data source: {nearestStationInfo?.name || 'ASIET Campus Station'}</div>
                <div className="forecast-update">Updated: {lastUpdateTime.toLocaleTimeString()}</div>
              </div>
            </div>
            <div className="forecast-controls">
              {['pm25', 'pm10', 'no2', 'o3', 'so2', 'co', 'nh3'].map(param => (
                <button key={param} className={`param-btn ${selectedParameter === param ? 'active' : ''}`} onClick={() => handleParameterChange(param)} title={`View ${param.toUpperCase()} forecast`}>
                  {param.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="forecast-content">
              <div className="chart-section">
                <React.Suspense fallback={<div className="chart-fallback"><div className="chart-placeholder"><div className="chart-icon">📊</div><p>Loading forecast chart...</p><div className="loading-spinner"></div></div></div>}>
                  <LazyChart
                    forecastData={nearestStationInfo ? dashboardData?.forecasts?.[nearestStationInfo.id] : dashboardData?.forecasts?.['lora-v1']}
                    selectedParameter={selectedParameter}
                  />
                </React.Suspense>
              </div>
              <div className="forecast-table-section">
                <table className="forecast-table">
                  <thead><tr><th>📅 Day</th><th>📈 Max {selectedParameter.toUpperCase()}</th><th>📊 Unit</th></tr></thead>
                  <tbody>
                    {(nearestStationInfo && dashboardData?.forecasts?.[nearestStationInfo.id] || dashboardData?.forecasts?.['lora-v1'] || []).map((item, index) => (
                      <tr key={index}>
                        <td className="day-cell">{item.day}</td>
                        <td className="value-cell">{formatValue(item[`${selectedParameter}_max`] || 0, selectedParameter)}</td>
                        <td className="unit-cell">{selectedParameter === 'co' ? 'mg/m³' : 'µg/m³'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {healthData && (
          <div className="health-section">
            <div className="health-content">
              <div className="health-chart-section">
                <div className="card-header"><h3 className="card-title">❤️ Health Status Monitor</h3></div>
                <div className="health-display">
                  <div className="health-score-circle"><div className="health-score-value">{healthData.score}</div><div className="health-score-label">Health Score</div></div>
                  <div className="health-details">
                    <div className={`risk-level ${healthData.risk_level.toLowerCase()}`}>{healthData.risk_level} Risk</div>
                    <div className="health-recommendations">{healthData.recommendations?.map((rec, index) => <div key={index} className="recommendation">• {rec}</div>)}</div>
                  </div>
                </div>
              </div>
              <div className="health-advisory">
                <h3><i className="fas fa-shield-alt"></i> Health Advisory</h3>
                <p>People with asthma, heart disease, older adults, and young children are more susceptible to air pollution. Please follow health advisories closely and seek medical attention if you experience any adverse symptoms.</p>
                {healthData.risk_level === 'High' && <div className="emergency-contact"><strong>Emergency Contact:</strong> Kerala Pollution Control Board – 0471-2418566</div>}
              </div>
            </div>
          </div>
        )}

        <div className="weather-section">
          <h2 className="section-title">🌤️ Weather Conditions</h2>
          <div className="weather-grid">
            <div className="weather-card"><div className="weather-icon">🌡️</div><div className="weather-content"><div className="weather-value">{formatValue(currentValues.temp || 28, 'temp')}°C</div><div className="weather-label">Temperature</div></div></div>
            <div className="weather-card"><div className="weather-icon">💧</div><div className="weather-content"><div className="weather-value">{formatValue(currentValues.hum || 65, 'hum')}%</div><div className="weather-label">Humidity</div></div></div>
            <div className="weather-card"><div className="weather-icon">📏</div><div className="weather-content"><div className="weather-value">{formatValue(currentValues.pre || 1013, 'pre')} hPa</div><div className="weather-label">Atmospheric Pressure</div></div></div>
          </div>
        </div>

        <div className="data-source-section">
          <h3>⚡ System Status & Data Source</h3>
          <div className="status-grid">
            <div className="status-item"><div className="status-icon">📍</div><div className="status-content"><div className="status-title">Location Status</div><div className="status-value">{locationStatus === 'gps_detected' ? 'GPS Active' : locationStatus === 'detecting' ? 'Detecting...' : locationStatus === 'failed' ? 'Failed' : 'Default'}</div></div></div>
            <div className="status-item"><div className="status-icon">📊</div><div className="status-content"><div className="status-title">Data Method</div><div className="status-value">{currentDataInfo?.is_interpolated ? 'Advanced Data Interpolation' : 'Direct Sensor'}</div></div></div>
            <div className="status-item"><div className="status-icon">📡</div><div className="status-content"><div className="status-title">Data Source</div><div className="status-value">{currentDataInfo?.station_name || 'Default Station'}</div></div></div>
            <div className="status-item"><div className="status-icon">🔄</div><div className="status-content"><div className="status-title">Last Update</div><div className="status-value">{lastUpdateTime.toLocaleTimeString()}</div></div></div>
          </div>
          
        </div>

        
      </div>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>AirAware Kerala</h4>
              <p>Smart Air Quality Monitoring System</p>
              <p>Real-time data • Personalized insights • Health-focused</p>
              <div className="social-links">
                <a href="#" className="social-link">📘</a>               
                <a href="#" className="social-link">💼</a>
                <a href="#" className="social-link">📷</a>
              </div>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">🏠 Home</Link></li>
                <li><Link to="/health-report">📄 Health Report</Link></li>
                <li><Link to="/add-family">👥 Add Family</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Data Sources</h4>
              <ul>
                <li>ASIET Campus Station </li>
                <li>Mattoor Junction Station</li>
                <li>Advanced spatial interpolation algorithms</li>
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

export default Dashboard;