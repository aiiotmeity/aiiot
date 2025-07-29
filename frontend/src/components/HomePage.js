import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App'; // Make sure this path is correct
import './css/HomePage.css';

function HomePage() {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFeaturePopup, setShowFeaturePopup] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  // --- Add hooks for navigation and authentication ---
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Page load tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 1000); // Give the page 1 second to fully load
    
    return () => clearTimeout(timer);
  }, []);

  // Enhanced feature popup logic - only show after page is loaded and data is fetched
  useEffect(() => {
    if (!pageLoaded || loading) return; // Don't show popup while loading
    
    const hasSeenPopup = localStorage.getItem('hasSeenAirAwareFeaturePopup');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setShowFeaturePopup(true);
        localStorage.setItem('hasSeenAirAwareFeaturePopup', 'true');
        
        // Auto-hide after 15 seconds
        setTimeout(() => {
          setShowFeaturePopup(false);
        }, 15000);
      }, 3000); // Show after 3 seconds of page being fully loaded
      
      return () => clearTimeout(timer);
    }
  }, [pageLoaded, loading]);

  const closeFeaturePopup = () => {
    setShowFeaturePopup(false);
  };

  const fetchHomeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/home/`);
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const data = await response.json();
      setHomeData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchHomeData();
    const interval = setInterval(fetchHomeData, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, [fetchHomeData]);
  
  // --- Define event handler functions ---
  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
  const handleMapNavigation = useCallback(() => {
    setIsMenuOpen(false); // Close menu when navigating
    navigate('/map');
  }, [navigate]);
  const handleDashboardNavigation = useCallback(() => {
    setIsMenuOpen(false); // Close menu when navigating
    user ? navigate('/dashboard') : navigate('/login');
  }, [user, navigate]);
  const handleLogout = useCallback(() => {
    logout();
    setIsMenuOpen(false); // Close menu when logging out
    navigate('/');
  }, [logout, navigate]);

  const handleAdminPortalClick = useCallback(() => {
  // Clear any existing admin session to force login
  localStorage.removeItem('admin_user');
  navigate('/admin/login');
}, [navigate]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.navbar')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  // Close menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuOpen]);

  const aqiStatus = useMemo(() => {
    if (loading && !homeData) return { status: 'LOADING...', icon: 'fas fa-spinner fa-spin', color: '#9ca3af' };
    if (error || !homeData?.highest_sub_index) return { status: 'NO DATA', icon: 'fas fa-exclamation-triangle', color: '#ef4444' };
    
    const value = parseInt(homeData.highest_sub_index, 10);
    if (value <= 50) return { status: 'GOOD', icon: 'fas fa-smile', color: '#10b981' };
    if (value <= 100) return { status: 'MODERATE', icon: 'fas fa-meh', color: '#f59e0b' };
    if (value <= 200) return { status: 'SEVERE', icon: 'fas fa-exclamation-triangle', color: '#dc2626' };
    if (value <= 300) return { status: 'VERY SEVERE', icon: 'fas fa-skull', color: '#7c2d12' };
    return { status: 'HAZARDOUS', icon: 'fas fa-biohazard', color: '#4c1d95' };
  }, [homeData, loading, error]);

  const displayAQI = loading && !homeData ? "..." : homeData?.highest_sub_index ?? "N/A";
  const displayLastUpdate = loading && !homeData ? "Syncing..." : homeData?.last_updated_on ?? "No data";
  const displayStationName = homeData?.station_name || 'ASIET Campus Station';

  return (
    <div className="homepage">
      {/* --- Navbar --- */}
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <img src="/aqi.webp" alt="AQM Logo" loading="lazy" width="40" height="40" />
            AirAware
          </Link>
          <div className="menu-toggle" onClick={toggleMenu}>
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </div>
          <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <li><Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
            <li><a href="#cities" className="nav-link" onClick={() => setIsMenuOpen(false)}>Cities</a></li>
            <li><a href="#services" className="nav-link" onClick={() => setIsMenuOpen(false)}>Services</a></li>
            <li><a href="#contact" className="nav-link" onClick={() => setIsMenuOpen(false)}>Contact</a></li>
           
            {user ? (
              <>
                <li><button onClick={handleDashboardNavigation} className="nav-link nav-button">Profile</button></li>
                <li className="nav-link user-greeting">Hello, {user.name}</li>
                <li><button onClick={handleLogout} className="nav-link login-btn nav-button"><i className="fas fa-sign-out-alt"></i> Logout</button></li>
              </>
            ) : (
              <li><Link to="/login" className="nav-link login-btn" onClick={() => setIsMenuOpen(false)}><i className="fas fa-sign-in-alt"></i> Login</Link></li>
            )}
          </ul>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="hero-section" id="home">
        <div className="hero-content">
          <div className="hero-text-section">
            <h1 className="hero-title">Air Quality Monitoring</h1>
            <p className="hero-subtitle">Live air quality updates and insights from Kalady, Ernakulam</p>
            <p className="hero-note">Real-time AQI from {displayStationName}</p>
            
            <div className="hero-actions">
              <button onClick={handleMapNavigation} className="cta-button primary">
                <i className="fas fa-map-marked-alt"></i> 
                View Live AQI Map
              </button>
              <button onClick={handleDashboardNavigation} className="cta-button secondary">
                <i className="fas fa-tachometer-alt"></i> 
                Profile
              </button>
            </div>
          </div>
          
          <div className="aqi-display-section">
            <div className="aqi-display">
              <div className="aqi-header">
                <div className="aqi-label">Current Air Quality Index</div>
                <div className="aqi-timestamp">Last Updated: {displayLastUpdate}</div>
              </div>
              
              <div className="aqi-main">
                <div className="aqi-value" style={{ color: aqiStatus.color }}>
                  {displayAQI}
                </div>
                <div className="aqi-status-container">
                  <div className="aqi-status" style={{ color: aqiStatus.color }}>
                    {aqiStatus.status}
                  </div>
                  <div className="aqi-icon" style={{ color: aqiStatus.color }}>
                    <i className={aqiStatus.icon}></i>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="aqi-error">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- Stats Section --- */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="section-header">
            <h2 className="section-title">Kerala Air Quality Network</h2>
            <p className="section-subtitle">
              Comprehensive monitoring across multiple locations for accurate air quality assessment
            </p>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">2</div>
              <div className="stat-label">Active Monitoring Stations</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Real-time Monitoring</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">7</div>
              <div className="stat-label">Key Pollutants Tracked</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- AQI Scale Section --- */}
      <section className="section aqi-scale-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Understanding Air Quality Index</h2>
            <p className="section-subtitle">
              Know what the AQI numbers mean for your health and daily activities
            </p>
          </div>
          <div className="aqi-scale-grid">
            <div className="aqi-scale-item">
              <div className="aqi-range">
                <div className="aqi-color-indicator aqi-good"></div>
                <div className="aqi-range-text">Good (0-50)</div>
              </div>
              <div className="aqi-description">
                Air quality is satisfactory. Air pollution poses little or no risk for everyone.
              </div>
            </div>
            <div className="aqi-scale-item">
              <div className="aqi-range">
                <div className="aqi-color-indicator aqi-moderate"></div>
                <div className="aqi-range-text">Moderate (51-100)</div>
              </div>
              <div className="aqi-description">
                Air quality is acceptable. However, sensitive individuals may experience minor issues.
              </div>
            </div>
            <div className="aqi-scale-item">
              <div className="aqi-range">
                <div className="aqi-color-indicator aqi-unhealthy"></div>
                <div className="aqi-range-text">Unhealthy (101-200)</div>
              </div>
              <div className="aqi-description">
                Members of sensitive groups may experience health effects. Limit outdoor activities.
              </div>
            </div>
            <div className="aqi-scale-item">
              <div className="aqi-range">
                <div className="aqi-color-indicator aqi-hazardous"></div>
                <div className="aqi-range-text">Hazardous (201+)</div>
              </div>
              <div className="aqi-description">
                Health alert: The risk of health effects is increased for everyone. Avoid outdoor activities.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Cities Section --- */}
      <section className="section cities-section" id="cities">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Monitoring Locations</h2>
            <p className="section-subtitle">
              Air quality data from strategic locations across Ernakulam district
            </p>
          </div>
          <div className="cities-grid">
            <div className="city-card" onClick={handleMapNavigation}>
              <div className="city-icon">
                <i className="fas fa-university"></i>
              </div>
              <div className="city-content">
                <div className="city-name">ASIET Campus Station</div>
                <div className="city-type">Educational Institution</div>
                <div className="city-description">Main campus monitoring station</div>
              </div>
              <div className="city-action">
                <span>View on Map</span>
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>
            <div className="city-card" onClick={handleMapNavigation}>
              <div className="city-icon">
                <i className="fas fa-city"></i>
              </div>
              <div className="city-content">
                <div className="city-name">Mattoor Junction Station</div>
                <div className="city-type">Urban Area</div>
                <div className="city-description">Urban junction monitoring station</div>
              </div>
              <div className="city-action">
                <span>View on Map</span>
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Services Section --- */}
      <section className="section services-section" id="services">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Our Services</h2>
            <p className="section-subtitle">
              Advanced air quality solutions powered by cutting-edge technology
            </p>
          </div>
          <div className="services-grid">
            
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-heartbeat"></i>
              </div>
              <h3 className="service-title">Health Risk Assessment</h3>
              <p className="service-description">
                Receive personalized health recommendations based on current air quality 
                conditions and your individual health profile.
              </p>
              <button onClick={handleDashboardNavigation} className="service-button">
                <i className="fas fa-arrow-right"></i>Get Assessment
              </button>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 className="service-title">AQI Forecasting</h3>
              <p className="service-description">
                Get accurate air quality predictions with advanced meteorological models 
                and machine learning algorithms for better planning.
              </p>
              <button onClick={handleMapNavigation} className="service-button">
                <i className="fas fa-arrow-right"></i>View Forecast
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="footer" id="contact">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-section">
              <h3>About AirQuality Kerala</h3>
              <p className="footer-text">
                Leading provider of real-time air quality monitoring solutions in Kerala, 
                committed to environmental sustainability and public health awareness.
              </p>
              <div className="social-links">
                <a href="#" className="social-link">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="social-link">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="social-link">
                  <i className="fab fa-linkedin-in"></i>
                </a>
                <a href="#" className="social-link">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
            <div className="footer-section">
              <h3>Quick Links</h3>
              <Link to="/" className="footer-link">Home</Link>
              <a href="#cities" className="footer-link">Monitoring Stations</a>
              <a href="#services" className="footer-link">Services</a>
              <Link to="/map" className="footer-link">Live Map</Link>
              <button onClick={handleAdminPortalClick} className="footer-link footer-button">
  Admin Portal
</button>




              {user && (
                <button onClick={handleLogout} className="footer-link footer-button">
                  Logout
                </button>
              )}
            </div>
            <div className="footer-section">
              <h3>Services</h3>
              <button onClick={handleMapNavigation} className="footer-link footer-button">
                Interactive Map
              </button>
              <button onClick={handleDashboardNavigation} className="footer-link footer-button">
                Health Assessment
              </button>
              <button onClick={handleMapNavigation} className="footer-link footer-button">
                AQI Forecasting
              </button>
              <a href="#" className="footer-link">Data Analytics</a>
            </div>
            <div className="footer-section">
              <h3>Contact Information</h3>
              <p className="footer-text">
                Adi Shankara Institute of Engineering and Technology<br />
                Kalady 683574, Ernakulam<br />
                Kerala, India
              </p>
              <br />
              <p className="footer-text">
                <strong>Email:</strong> aiiot@adishankara.ac.in<br />
                <strong>Phone:</strong> 0484 246 3825
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 AirQuality Kerala. All rights reserved. Developed by ASIET AI & IoT Lab.</p>
          </div>
        </div>
      </footer>

      {/* Enhanced Feature Popup - Only shows after page load */}
      {showFeaturePopup && pageLoaded && !loading && (
        <div className="feature-popup-overlay" onClick={closeFeaturePopup}>
          <div className="feature-popup" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={closeFeaturePopup}>
              <i className="fas fa-times"></i>
            </button>
            
            <div className="popup-header">
              <div className="popup-icon">
                <i className="fas fa-leaf"></i>
              </div>
              <h2 className="popup-title">Welcome to AirAware!</h2>
              <p className="popup-subtitle">Your trusted partner for air quality monitoring</p>
            </div>

            <div className="features-showcase">
              <div className="feature-item" onClick={() => {closeFeaturePopup(); navigate('/map');}}>
                <div className="feature-icon">
                  <i className="fas fa-map-marked-alt"></i>
                </div>
                <div className="feature-content">
                  <h3>Live Interactive Map</h3>
                  <p>Real-time AQI data from multiple monitoring stations</p>
                </div>
                <div className="feature-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>

              <div className="feature-item" onClick={() => {closeFeaturePopup(); user ? navigate('/dashboard') : navigate('/login');}}>
                <div className="feature-icon">
                  <i className="fas fa-heartbeat"></i>
                </div>
                <div className="feature-content">
                  <h3>Personal Health Insights</h3>
                  <p>Get personalized recommendations based on your location</p>
                </div>
                <div className="feature-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>

              <div className="feature-item" onClick={() => {closeFeaturePopup(); navigate('/map');}}>
                <div className="feature-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="feature-content">
                  <h3>AQI Forecasting</h3>
                  <p>AI-powered predictions for better planning</p>
                </div>
                <div className="feature-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fas fa-satellite-dish"></i>
                </div>
                <div className="feature-content">
                  <h3>24/7 Monitoring</h3>
                  <p>Continuous tracking of 7 key air pollutants</p>
                </div>
                <div className="feature-badge">
                  <span>LIVE</span>
                </div>
              </div>
            </div>

            <div className="popup-footer">
              <button className="popup-cta" onClick={() => {closeFeaturePopup(); navigate('/home');}}>
                <i className="fas fa-play"></i>
                Start Exploring
              </button>
              <div className="popup-timer">
                <span>Welcome to cleaner air monitoring!</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;