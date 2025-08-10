import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/Signup.css';
import logoImage from '../assets/aqi.webp'; 

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    phone_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  const navigate = useNavigate();
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://airaware-app-gcw7.onrender.com' 
    : 'http://localhost:8000';

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Auto-dismiss error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000); // Auto-dismiss after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [error]);

  // Memoize particles to prevent recreation on every render
  const particles = useMemo(() => {
    const particleElements = [];
    for (let i = 0; i < 20; i++) { // Reduced from 30 to 20
      particleElements.push(
        <div
          key={i}
          className="particle"
          style={{
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            width: '4px',
            height: '4px',
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            borderRadius: '50%',
            position: 'absolute',
            animationDelay: Math.random() * 5 + 's'
          }}
        />
      );
    }
    return particleElements;
  }, []);

  // Validate and format phone number
  const validatePhoneNumber = (phone) => {
    // Remove all non-digit characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Check if it's a valid +91 format (13 characters: +91xxxxxxxxxx)
    if (cleanPhone.length === 13 && cleanPhone.startsWith('+91')) {
      const numberPart = cleanPhone.substring(3); // Remove +91
      // Check if the remaining 10 digits start with 6, 7, 8, or 9
      if (numberPart.length === 10 && numberPart.match(/^[6-9]/)) {
        return cleanPhone; // Return full +91xxxxxxxxxx format
      }
    }
    
    return null;
  };

  const handleChange = (e) => {
    let value = e.target.value;
    
    // Special handling for phone number field
    if (e.target.name === 'phone_number') {
      // Remove all non-digit characters except +
      value = value.replace(/[^\d+]/g, '');
      
      // If user starts typing without +91, auto-add it
      if (value.length > 0 && !value.startsWith('+91')) {
        // If user typed only digits, prepend +91
        if (value.match(/^\d/)) {
          value = '+91' + value;
        }
      }
      
      // Ensure it starts with +91
      if (!value.startsWith('+91') && value.length > 0) {
        value = '+91';
      }
      
      // Limit to exactly 13 characters (+91 + 10 digits)
      if (value.length > 13) {
        value = value.substring(0, 13);
      }
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value
    });
    
    // Clear error when user types
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate name
      if (!formData.name.trim()) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }

      if (formData.name.trim().length < 2) {
        setError('Name must be at least 2 characters long');
        setLoading(false);
        return;
      }

      // Validate phone number
      const validatedPhone = validatePhoneNumber(formData.phone_number);
      if (!validatedPhone) {
        setError('Please enter a valid phone number with +91 prefix (e.g., +919876543210)');
        setLoading(false);
        return;
      }

      console.log('Submitting signup with data:', {
        name: formData.name.trim(),
        phone_number: validatedPhone
      });

      const response = await fetch(`${API_BASE_URL}/api/signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone_number: validatedPhone
        }),
      });

      const data = await response.json();
      console.log('Signup response:', data);

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="signup-page">
        <div className="success-container">
          <div className="success-animation">
            <div className="success-icon">✓</div>
          </div>
          <h2>Registration Successful!</h2>
          <p>Your account has been created successfully.</p>
          <p>Redirecting to login page...</p>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <img src={logoImage} alt="AQM Logo" width={isMobileView ? "32" : "40"} height={isMobileView ? "32" : "40"} />
            AirAware
          </Link>
        </div>
      </nav>

      {/* Signup Section */}
      <section className="signup-section">
        <div className="particles">
          {particles}
        </div>
        
        <div className="signup-container">
          <div className="signup-header">
            <h2>
              <span className="user-icon">👤</span> Sign Up
            </h2>
            <p>Create your account to get started</p>
          </div>

          {/* Compact Alert Messages */}
          <div className="alert-container">
            {/* Error message */}
            {error && (
              <div className="error-message">
                <span>⚠️</span>
                <span>{error}</span>
                <button 
                  type="button" 
                  onClick={() => setError('')}
                  className="alert-close"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-group">
                <span className="input-icon">
                  <span>👤</span>
                </span>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone_number">Phone Number</label>
              <div className="input-group">
                <span className="input-icon">
                  <span>📱</span>
                </span>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+919876543210"
                  required
                  disabled={loading}
                  maxLength="13"
                />
              </div>
              <small>
                Enter mobile number with +91 prefix (13 characters total)
              </small>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span>🔄</span>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="signup-footer">
            <p>
              Already have an account? 
              <a href="/login">
                <span>🔑</span> Login
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Signup;