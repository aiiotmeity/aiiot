import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import './css/Login.css';
import logoImage from '../assets/aqi.webp';

function Login() {
  const [formData, setFormData] = useState({
    phone_number: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();
  const { login } = useAuth();

  // CSRF Token Helper Function
  const getCsrfToken = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';

  useEffect(() => {
    // Fetch CSRF token when component mounts
    const fetchCsrfToken = async () => {
      try {
        await fetch(`${API_BASE_URL}/csrf/`, {
          credentials: 'include'
        });
      } catch (error) {
        console.error('Failed to fetch CSRF token', error);
      }
    };

    fetchCsrfToken();
  }, [API_BASE_URL]);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChange = (e) => {
    let value = e.target.value;

    // Phone number formatting
    if (e.target.name === 'phone_number') {
      value = value.replace(/[^\d+]/g, '');
      if (value.length > 0 && !value.startsWith('+91')) {
        if (value.match(/^\d/)) {
          value = '+91' + value;
        }
      }
      if (!value.startsWith('+91') && value.length > 0) {
        value = '+91';
      }
      if (value.length > 13) {
        value = value.substring(0, 13);
      }
    }

    setFormData({
      ...formData,
      [e.target.name]: value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const csrfToken = getCsrfToken();

      console.log('Attempting login with:', {
        phone_number: formData.phone_number,
        // Don't log password
      });

      const response = await fetch(`${API_BASE_URL}/api/user_login_api/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          phone_number: formData.phone_number,
          password: formData.password
        }),
      });

      console.log('Response status:', response.status);

      // More detailed error logging
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error('Login request failed');
      }

      const data = await response.json();
      console.log('Full response data:', data);

      if (data.success) {
        console.log('Redirect to:', data.redirect_to);

        // Build normalized user object and use auth context to log in
        const userObj = {
          phone_number: data.user.phone_number,
          user_id: data.user.user_id,
          username: data.user.username || data.user.name || '',
          name: data.user.username || data.user.name || data.user.phone_number || '',
          has_health_assessment: data.has_health_assessment
        };

        try {
          // Use Auth context so the App state updates immediately
          login(userObj);
        } catch (e) {
          // Fallback to localStorage if context isn't available
          localStorage.setItem('user', JSON.stringify(userObj));
          localStorage.setItem('loginTime', Date.now().toString());
        }

        // Navigate to the redirected route
        setTimeout(() => {
          console.log('Navigating to:', data.redirect_to);
          navigate(data.redirect_to);
        }, 100);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Rest of the component remains the same */}
      <section className="login-section">
        <div className="login-container">
          <div className="login-header">
            <h2>👤 User Login</h2>
            <p>Enter your credentials to continue</p>
          </div>

          {(success || error) && (
            <div className={`toast-notification ${success ? 'toast-success' : 'toast-error'}`}>
              <span>{success || error}</span>
              <button className="toast-close" onClick={() => { setSuccess(''); setError(''); }}>×</button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="phone_number">Phone Number</label>
              <input
                type="text"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+919876543210"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="login-footer">
              <p>
                Don't have an account? <Link to="/signup">Sign Up</Link>
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Login;
