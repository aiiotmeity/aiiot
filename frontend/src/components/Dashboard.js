import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../App';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import './css/Dashboard.css';
import logoImage from '../assets/aqi.webp'; 
import { calculateDistance, formatDistance } from '../utils/distance';

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
// Using shared calculateDistance from utils/distance.js
// ...

// Known accurate locations for the area
const KNOWN_LOCATIONS = {
  '10.1783_76.4305': {
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
  '10.165_76.420': {
    display_name: 'Airport Road, Kalady',
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

    // Only call LocationIQ if an API key is provided via env (avoid demo key 401s)
    (process.env.REACT_APP_LOCATIONIQ_KEY && process.env.REACT_APP_LOCATIONIQ_KEY !== 'demo') ?
      fetch(`https://us1.locationiq.com/v1/reverse.php?key=${process.env.REACT_APP_LOCATIONIQ_KEY}&lat=${lat}&lon=${lng}&format=json`)
        .then(res => res.json())
        .then(data => ({
          service: 'LocationIQ',
          data: data,
          location: parseLocationIQResult(data)
        }))
        .catch(() => null)
      : Promise.resolve(null)
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
      return user.username || 'User';
    } catch {
      return 'User';
    }
  });
  const [phoneNumber] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.phone_number || null;
    } catch {
      return null;
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
  // ===== GET USER LOCATION (IMPROVED) =====
  const getUserLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      // 1. Check for browser support first
      if (!navigator.geolocation) {
        reject({ code: -1, message: 'Geolocation is not supported by this browser.' });
        return;
      }

      setLocationStatus('detecting');
      setIsLocationUpdating(true);

      // 2. Define clearer, more lenient options
      const options = {
        enableHighAccuracy: true, // Keep for best results, but be aware it's slower
        timeout: 15000,           // 3. Increased timeout to 15 seconds
        maximumAge: 60000         // 4. Accept a cached location up to 1 minute old
      };

      // 5. Use the built-in error handling, no need for a manual setTimeout
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'gps',
            timestamp: Date.now()
          };

          // Validate coordinates
          if (isNaN(location.lat) || isNaN(location.lng)) {
            reject({ code: -2, message: 'Received invalid GPS coordinates.' });
            return;
          }

          // Fetch location name and update state
          try {
            const locationName = await getLocationName(location.lat, location.lng);
            setUserLocationName(locationName);
            console.log('📍 Location name resolved:', locationName.display_name);
          } catch (nameError) {
            console.warn('⚠️ Could not resolve location name, using fallback.', nameError);
            const fallbackName = getRegionalFallback(location.lat, location.lng);
            setUserLocationName(fallbackName);
          }
          
          setUserLocation(location);
          setLocationStatus('gps_detected');
          setIsLocationUpdating(false);
          resolve(location);
        },
        (error) => {
          // 6. Handle specific errors from the Geolocation API
          setIsLocationUpdating(false);
          setLocationStatus('failed');
          console.error('GPS error:', error.code, error.message);
          reject(error); // Reject with the original error object
        },
        options // Pass the refined options here
      );
    });
  }, []);

  // ===== FETCH DASHBOARD DATA =====
  const fetchDashboardData = useCallback(async (locationData = null) => {
    setLoading(true);
    setError(null);
    try {
      // Do not force-abort previous requests here - allow them to finish or timeout.
      // This prevents frequent AbortError noise when multiple fetches are started quickly.
      const controller = new AbortController();
      abortControllerRef.current = controller;
      // Increase timeout to 30s to accommodate slower local/dev backends
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const url = new URL(`${API_BASE_URL}/api/dashboard_api/`);

      // backend is mounted under /api/ and expects `phone_number` (underscore)
      if (phoneNumber) url.searchParams.append("phone_number", phoneNumber);

      if (locationData) {
        url.searchParams.append('lat', locationData.lat.toString());
        url.searchParams.append('lng', locationData.lng.toString());
      }

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);

      // If response isn't OK, try to read the body to surface any error trace
      if (!response.ok) {
        let text = '';
        try {
          text = await response.text();
        } catch (e) {
          text = `Could not read response body: ${e.message}`;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${text}`);
      }

      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        const body = await response.text().catch(() => '(<unreadable body>)');
        throw new Error(`Invalid JSON response from dashboard API: ${e.message} - ${body}`);
      }

      console.log('✅ Dashboard data received:', data);
      if (data && data.health_data) {
        setHealthData(data.health_data);
      }
      processDashboardData(data, locationData);
      setLastUpdateTime(new Date());
      setError(null);
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ Dashboard fetch aborted (timeout or cancelled):', error.message || error);
      } else {
        console.error('❌ Error fetching dashboard data:', error);
      }
      // Do NOT immediately load sample data here. Return null and let callers decide
      // whether to show sample data (prevents flicker when a retry is about to succeed).
      return null;
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, API_BASE_URL]);

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
            distance_message: `📍 You are within sensor range (${formatDistance(nearestDistance)} from nearest), showing calculated values for your exact location`,
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
            distance_message: `📍 You are ${formatDistance(nearestDistance)} from the nearest sensor node, so you are seeing data from ${nearestStation.station_info.name}`,
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
  // [REPLACE this function - around line 558]

  const loadSampleData = useCallback((locationData = null) => {
    console.log('🔄 Loading sample data...');
    const sampleData = {
      // (Your existing sampleData object is fine, I've just truncated it here)
      stations: {
        'lora-v1': {
          station_info: { name: 'ASIET Campus Station', lat: 10.178322, lng: 76.430891 },
          averages: { pm25: 25, pm10: 42, so2: 8, no2: 40, co: 1.1, o3: 46, nh3: 93, temp: 28, hum: 65, pre: 1013 },
          highest_sub_index: 50,
        },
        // ... other sample stations ...
      },
      forecasts: {
        'lora-v1': [
          { day: 'Today', pm25_max: 30, pm10_max: 37 },
          { day: 'Tomorrow', pm25_max: 24, pm10_max: 34 },
          // ... other sample forecasts ...
        ],
      },
      health_data: { risk_level: 'Low', score: 75, recommendations: ['Enjoy outdoor activities'] }
    };

    setDashboardData(sampleData); // Set the full data object
    setHealthData(sampleData.health_data);

    if (locationData) {
      // Mimic interpolation
      setNearestStationInfo({
        id: 'lora-v1',
        name: 'ASIET Campus Station',
        distance: 1.2, // Fake distance
        aqi: 48
      });
      setCurrentDataInfo({
        method: 'location_interpolation',
        values: { pm25: 24, pm10: 40, so2: 7, no2: 38, co: 1.0, o3: 45, nh3: 90, temp: 28, hum: 65, pre: 1013 },
        aqi: 48,
        station_name: 'Your Location (Sample)',
        is_interpolated: true,
        distance_message: '🎯 Showing sample interpolated data for your location.'
      });
    } else {
      // Mimic default
      const defaultStation = sampleData.stations['lora-v1'];
      setNearestStationInfo({
        id: 'lora-v1',
        name: defaultStation.station_info.name,
        distance: null,
        aqi: defaultStation.highest_sub_index
      });
      setCurrentDataInfo({
        method: 'default_station',
        values: defaultStation.averages || {},
        aqi: defaultStation.highest_sub_index || 50,
        station_name: defaultStation.station_info.name,
        is_interpolated: false,
        distance_message: '📍 Showing sample data for ASIET Campus.'
      });
    }
    
    setLastUpdateTime(new Date());
    console.log('📊 Sample data processed successfully');
  }, []); // Dependencies are now empty

  // ===== INITIALIZATION =====
 // [REPLACE this entire useEffect block - around line 610]

  // ===== INITIALIZATION (REFACTORED) =====
  useEffect(() => {
    // This helper function finds the nearest station from the base data
    const findNearestStation = (location, stations) => {
      const stationIds = Object.keys(stations);
      let nearestDist = Infinity;
      let nearestId = stationIds[0];

      stationIds.forEach(stationId => {
        const station = stations[stationId];
        if (station.station_info && station.station_info.lat) {
          const distance = calculateDistance(
            location.lat,
            location.lng,
            station.station_info.lat,
            station.station_info.lng
          );
          if (distance < nearestDist) {
            nearestDist = distance;
            nearestId = stationId;
          }
        }
      });
      
      const nearest = stations[nearestId];
      return {
        id: nearestId,
        distance: nearestDist,
        name: nearest.station_info.name,
        aqi: nearest.highest_sub_index,
        station: nearest
      };
    };

    // This is the main function that runs on page load
    const initialize = async () => {
      console.log('⚡ Initializing dashboard...');
      setLoading(true);
      let location = null;
      let locationName = null;

      // 1. Try to get location
      try {
        location = await getUserLocation(); // This function is fine
        locationName = await getLocationName(location.lat, location.lng);
        setUserLocation(location);
        setUserLocationName(locationName);
        setLocationStatus('gps_detected');
      } catch (locationError) {
        console.warn('📍 Location detection failed:', locationError.message);
        setLocationStatus('failed');
        let userMessage = 'Could not fetch your location.';
        if (locationError.code === 1) userMessage = "Location access was denied. Please enable it for personalized data.";
        setError(userMessage);
      }

      // 2. Fetch ALL data from the backend
      try {
        // A. Fetch base data (health, all stations, all forecasts)
        let baseData = await fetchDashboardData();
        // If the first attempt returned null (abort or transient error), retry once before failing
        if (!baseData) {
          console.warn('⚠️ First dashboard fetch failed or was aborted — retrying once...');
          await new Promise(r => setTimeout(r, 500));
          baseData = await fetchDashboardData();
        }

        if (!baseData) {
          console.error('❌ Could not fetch base dashboard data after retry — falling back to sample data');
          setError('loading....');
          loadSampleData(location);
          setLoading(false);
          return; // Gracefully exit initialization
        }

        console.log('✅ Base data received (health, stations, forecasts):', baseData);

        // B. If we have a location, fetch personalized AQI
        if (location) {
          const aqiUrl = `${API_BASE_URL}/api/user-aqi/?lat=${location.lat}&lng=${location.lng}`;
          const aqiResponse = await fetch(aqiUrl);
          
          if (!aqiResponse.ok) {
            // Don't fail the whole page, just log a warning and use nearest station
            console.warn('⚠️ Could not fetch personalized AQI. Falling back to nearest station.');
            const nearest = findNearestStation(location, baseData.stations);
            setNearestStationInfo(nearest);
            setCurrentDataInfo({
              method: 'nearest_station_fallback',
              values: nearest.station.averages || {},
              aqi: nearest.station.highest_sub_index || 50,
              station_name: nearest.station.station_info.name,
              is_interpolated: false,
              distance_message: `📍 Using data from nearest sensor: ${nearest.station.station_info.name} (${formatDistance(nearest.distance)})`
            });

          } else {
            const aqiData = await aqiResponse.json();
            console.log('✅ Personalized AQI received:', aqiData);

            // This is the IDEAL state
            const nearestStationId = aqiData.closest_sensor.sensor_id;
            const nearestStation = baseData.stations[nearestStationId];

            setNearestStationInfo({
              id: nearestStationId,
              name: nearestStation.station_info.name,
              distance: aqiData.closest_sensor.distance_km,
              aqi: aqiData.user_aqi
            });
            
            setCurrentDataInfo({
              method: 'location_interpolation',
              values: aqiData.interpolated_values, // <-- This is the fix for metric cards
              aqi: aqiData.user_aqi,
              station_name: locationName?.display_name || 'Your Location',
              is_interpolated: true,
              distance_message: `🎯 Calculated for your location (nearest sensor ${formatDistance(aqiData.closest_sensor.distance_km)} away)`
            });
          }
          
        } else {
          // C. No location, just use default (lora-v1)
          const defaultStation = baseData.stations['lora-v1'];
          setNearestStationInfo({
            id: 'lora-v1',
            name: defaultStation.station_info.name,
            distance: null,
            aqi: defaultStation.highest_sub_index
          });
          setCurrentDataInfo({
            method: 'default_station',
            values: defaultStation.averages || {},
            aqi: defaultStation.highest_sub_index || 50,
            station_name: defaultStation.station_info.name,
            is_interpolated: false,
            distance_message: '📍 Enable location to get data for your exact position.'
          });
        }
        
        setLastUpdateTime(new Date());
        setError(null); // Clear any location errors if data fetch succeeded

      } catch (fetchError) {
        console.error('❌ Error fetching dashboard data:', fetchError);
        console.log("error fetching");
        
        if (fetchError.name !== 'AbortError') {
          setError('Failed to load dashboard data. Showing sample data.');
          loadSampleData(location); // Pass location to sample data
        }
      } finally {
        setLoading(false);
      }
    };

    // Check for phone number before initializing
    if (phoneNumber) {
      initialize();
    } else {
      // This should not happen, but as a safeguard
      setError("User phone number not found. Please log in again.");
      setLoading(false);
      navigate('/login');
    }
    
    // Cleanup function (no change)
    return () => {
      if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [phoneNumber, API_BASE_URL, getUserLocation, loadSampleData, navigate]); // Add new dependencies

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
        // This is the NEW block with the disclaimer
        case 'gps_detected':
          const locationName = userLocationName?.display_name || 'Your location';

          return (
            // Use a div to stack the location and the disclaimer
            <div>
              <span style={{ color: '#10b981' }}>
                  📍 {locationName}
                  {nearestStationInfo && (
                    <span style={{ color: '#6b7280', fontSize: '0.9em' }}>
                        {' '} → Nearest: {nearestStationInfo.name} ({formatDistance(nearestStationInfo.distance)})
                      </span>
                  )}
              </span>
              {/* THIS IS THE NEW DISCLAIMER */}
              <div className="location-disclaimer">
                Note: If your location seems incorrect, it may be due to a slow network. Please refresh the page or check again shortly.
              </div>
            </div>
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

  const { logout } = useAuth();

  const handleLogout = useCallback(() => {
    if (isMobileView) closeMenu();
    try {
      // Use centralized logout so we don't accidentally clear unrelated localStorage keys
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  }, [navigate, isMobileView, closeMenu, logout]);






  const handleRefreshData = useCallback(async () => {
    const res = await fetchDashboardData(userLocation);
    if (!res) {
      setError('Failed to refresh data. Showing last available data or sample.');
      // Optionally load sample only if no dashboardData exists yet
      if (!dashboardData) loadSampleData(userLocation);
    }
  }, [fetchDashboardData, userLocation, dashboardData, loadSampleData]);

  const handleEnableLocation = useCallback(async () => {
    try {
      const location = await getUserLocation();
      const res = await fetchDashboardData(location);
      if (!res) {
        setError('Failed to fetch personalized data. Showing nearest station or sample.');
        if (!dashboardData) loadSampleData(location);
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      setError('Could not get location. Showing default data.');
      if (!dashboardData) loadSampleData(null);
    }
  }, [getUserLocation, fetchDashboardData, dashboardData, loadSampleData]);

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
            <li><Link to="/homepage" className="nav-link" onClick={handleNavLinkClick}>🏠 Home</Link></li>
            <li><Link to="/health-assessment" className="nav-link" onClick={handleNavLinkClick}>📋 Health Update</Link></li>
            <li><Link to="/health-report" className="nav-link" onClick={handleNavLinkClick}>📄 Health Report</Link></li>
            <li><Link to="/add-family" className="nav-link" onClick={handleNavLinkClick}>👥 Add Family</Link></li>
            
            <li className="user-info">👤 <span>{username}</span></li>
            <li><button onClick={handleLogout} className="nav-link login-btn">🚪 Logout</button></li>
          </ul>
        </div>
      </nav>

      <div className={`alert-banner ${aqiStatus.class}`}>
        ℹ️ <span>
          {currentDataInfo?.station_name || 'Your Location'} AQI: {Math.round(currentAQI)} - {aqiStatus.status}
              {nearestStationInfo && !isMobileView && ` • Distance to nearest sensor: ${formatDistance(nearestStationInfo.distance)}`}
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
                    <div className="health-recommendations">
                      {Array.isArray(healthData.recommendations)
                        ? healthData.recommendations.map((rec, index) => (
                            <div key={index} className="recommendation">• {rec}</div>
                          ))
                        : (healthData.recommendations ? (
                            <div className="recommendation">• {String(healthData.recommendations)}</div>
                          ) : null)}
                    </div>
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
      </div>

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
                <li><Link to="/homepage"> Home</Link></li>
                <li><Link to="/health-report">Health Report</Link></li>
                <li><Link to="/add-family">Add Family</Link></li>
                <li><Link to="/map">Live map</Link></li>
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

export default Dashboard;
