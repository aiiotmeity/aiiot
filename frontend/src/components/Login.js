import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/Login.css';
import logoImage from '../assets/aqi.webp'; 

function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  
  const navigate = useNavigate();

  // Safe API URL
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://airaware-app-gcw7.onrender.com' 
    : 'http://localhost:8000';


  
  // Simple particles without complex animations
  const createParticles = () => {
    const particles = [];
    for (let i = 0; i < 20; i++) {
      particles.push(
        <div
          key={i}
          className="particle"
          style={{
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            width: '4px',
            height: '4px',
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: '50%',
            position: 'absolute',
            animationDelay: Math.random() * 5 + 's'
          }}
        />
      );
    }
    return particles;
  };

  // Clear messages
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // Validate phone number - handles +91 prefix (13 characters total)
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

  // Handle phone number input - enforce +91 prefix
  const handlePhoneNumberChange = (e) => {
    let value = e.target.value;
    
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
    
    setPhoneNumber(value);
    clearMessages();
  };

  // Handle OTP input
  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    clearMessages();
  };
  useEffect(() => {
          const handleResize = () => {
              const width = window.innerWidth;
              setIsMobileView(width <= 768);
          };
  
          window.addEventListener('resize', handleResize);
          return () => window.removeEventListener('resize', handleResize);
      }, []);

  // Handle sending OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    console.log('Send OTP clicked');
    
    if (loading) return;
    
    setLoading(true);
    clearMessages();

    try {
      const validatedPhone = validatePhoneNumber(phoneNumber);
      
      if (!validatedPhone) {
        setError('Please enter a valid phone number with +91 prefix (e.g., +919876543210)');
        setLoading(false);
        return;
      }

      console.log('Sending OTP to:', validatedPhone); // This will be +919876543210 format

      const response = await fetch(`${API_BASE_URL}/api/send-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: validatedPhone }),
      });

      const data = await response.json();
      console.log('Send OTP Response:', data);

      if (response.ok && data.success) {
        setShowOTP(true);
        setSuccess('OTP sent successfully! ✅ Use 123456 for testing.');
        setPhoneNumber(validatedPhone); // Keep the +91 format
      } else {
        setError(data.error || data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Send OTP Error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification - FIXED VERSION
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    console.log('Verify OTP clicked');
    
    if (loading) return;
    
    setLoading(true);
    clearMessages();

    try {
      if (!otp || otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP');
        setLoading(false);
        return;
      }

      console.log('Verifying OTP:', otp, 'for phone:', phoneNumber);

      const response = await fetch(`${API_BASE_URL}/api/verify-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          otp_code: otp, 
          phone_number: phoneNumber 
        }),
      });

      const data = await response.json();
      console.log('Verify OTP Response:', data);

      if (response.ok && data.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginTime', Date.now().toString());
        
        setSuccess('Login successful! Redirecting...');
        
        // FIXED: Use the redirect_to from backend response
        setTimeout(() => {
          console.log('Backend redirect_to:', data.redirect_to);
          console.log('User has health assessment:', data.user.has_health_assessment);
          console.log('Debug info:', data.debug_info);
          
          // Use React Router navigate with the exact path from backend
          if (data.redirect_to === '/health-assessment') {
            console.log('Navigating to health assessment');
            navigate('/health-assessment');
          } else if (data.redirect_to === '/dashboard') {
            console.log('Navigating to dashboard');
            navigate('/dashboard');
          } else {
            // Fallback logic based on has_health_assessment
            if (data.user.has_health_assessment) {
              console.log('Fallback: Navigating to dashboard');
              navigate('/dashboard');
            } else {
              console.log('Fallback: Navigating to health assessment');
              navigate('/health-assessment');
            }
          }
        }, 1500);
        
      } else {
        console.log('OTP verification failed:', data);
        setError(data.error || data.message || 'Invalid OTP');
      }
    } catch (err) {
      console.error('Verify OTP Error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle back to phone
  const handleBackToPhone = () => {
    setShowOTP(false);
    setOtp('');
    clearMessages();
  };

  return (
    <div className="login-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
                      {/* 2. USE THE IMPORTED VARIABLE */}
                      <img src={logoImage} alt="AQM Logo" width={isMobileView ? "32" : "40"} height={isMobileView ? "32" : "40"} />
                      AirAware
                    </Link>
        </div>
      </nav>

      {/* Login Section */}
      <section className="login-section">
        <div className="particles">
          {createParticles()}
        </div>
        
        <div className="login-container">
          <div className="login-header">
            <h2>
              👤 {showOTP ? 'Verify OTP' : 'Login'}
            </h2>
            <p>
              {showOTP 
                ? `Enter the 6-digit OTP sent to ${phoneNumber}` 
                : 'Welcome back! Please log in to your account.'
              }
            </p>
            <li><a href="/">🏠 Home</a></li>
          </div>

          {/* Success message */}
          {success && (
            <div className="success-message" style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
              border: '1px solid #c3e6cb'
            }}>
              ✅ {success}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="error-message" style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
              border: '1px solid #f5c6cb'
            }}>
              ⚠️ {error}
            </div>
          )}

          {!showOTP ? (
            // Phone Number Form
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label htmlFor="phone_number">Enter your phone number</label>
                <input
                  type="tel"
                  id="phone_number"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  placeholder="+919876543210"
                  required
                  disabled={loading}
                  maxLength="13"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginTop: '8px'
                  }}
                />
                <small style={{ color: '#666', fontSize: '14px' }}>
                  Enter mobile number with +91 prefix (13 characters total)
                </small>
              </div>
              <button 
                type="submit" 
                disabled={loading || !phoneNumber}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  backgroundColor: loading ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '16px'
                }}
              >
                {loading ? '📤 Sending OTP...' : '📤 Send OTP'}
              </button>
            </form>
          ) : (
            // OTP Verification Form
            <form onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label htmlFor="otp">Enter OTP</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={handleOTPChange}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginTop: '8px',
                    textAlign: 'center',
                    letterSpacing: '2px'
                  }}
                />
                <small style={{ color: '#666', fontSize: '14px' }}>
                  Enter the 6-digit OTP sent to your phone
                </small>
              </div>
              
              <button 
                type="submit" 
                disabled={loading || otp.length !== 6}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  backgroundColor: loading ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '16px'
                }}
              >
                {loading ? '🔄 Verifying...' : '✅ Verify OTP'}
              </button>
              
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button 
                  type="button" 
                  onClick={handleBackToPhone}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginRight: '8px'
                  }}
                >
                  ← Back to Phone Number
                </button>
              </div>
            </form>
          )}

          <div className="login-footer" style={{ marginTop: '24px', textAlign: 'center' }}>
            <p>
              <a href="#" style={{ color: '#007bff', textDecoration: 'none' }}>
                🔑 Forgot Password?
              </a>
            </p>
            <p>
              Don't have an account? 
              <a href="/signup" style={{ color: '#007bff', textDecoration: 'none', marginLeft: '4px' }}>
                👤 Sign Up
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;
