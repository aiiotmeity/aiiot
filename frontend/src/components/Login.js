import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import './css/Login.css';

function Login() {
  // Views: 'login' | 'forgot_request' | 'forgot_verify'
  const [view, setView] = useState('login'); 
  
  const [formData, setFormData] = useState({
    phone_number: '',
    password: '',
    otp_code: '',
    new_password: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';

  // --- CSRF Handling (Keep existing logic) ---
  const getCsrfToken = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') return decodeURIComponent(value);
    }
    return null;
  };

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try { await fetch(`${API_BASE_URL}/csrf/`, { credentials: 'include' }); } 
      catch (error) { console.error('Failed to fetch CSRF token', error); }
    };
    fetchCsrfToken();
  }, [API_BASE_URL]);

  // --- Input Handler ---
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

    setFormData({ ...formData, [e.target.name]: value });
    setError('');
    setSuccess('');
  };

  // --- 1. Login Logic ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user_login_api/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        credentials: 'include',
        body: JSON.stringify({
          phone_number: formData.phone_number,
          password: formData.password
        }),
      });

      const data = await response.json();
      if (data.success) {
        const userObj = {
          phone_number: data.user.phone_number,
          user_id: data.user.user_id,
          username: data.user.username || data.user.name || '',
          name: data.user.username || data.user.name || data.user.phone_number || '',
          has_health_assessment: data.has_health_assessment
        };
        try {
            login(userObj);
        } catch (e) {
            localStorage.setItem('user', JSON.stringify(userObj));
        }
        setTimeout(() => navigate(data.redirect_to), 100);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Forgot Password: Request OTP ---
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password-request/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: formData.phone_number })
      });
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Phone validated — enter new password');
        setTimeout(() => {
            setSuccess('');
            setView('forgot_verify'); // Move to next step
        }, 800);
      } else {
        setError(data.error || 'Validation failed');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Forgot Password: Verify & Reset ---
  const handleForgotReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password-reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: formData.phone_number,
          new_password: formData.new_password
        })
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess('Password updated successfully! Redirecting to Login...');
        setTimeout(() => {
            setSuccess('');
            setFormData({ ...formData, password: '', otp_code: '', new_password: '' });
            setView('login'); // Return to login
        }, 2000);
      } else {
        setError(data.error || 'Reset failed');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-section">
        <div className="login-container">
          
          <div className="login-header">
            {view === 'login' && <h2>👤 User Login</h2>}
            {view === 'forgot_request' && <h2>🔑 Forgot Password</h2>}
            {view === 'forgot_verify' && <h2>🔐 Reset Password</h2>}
            
            <p>
                  {view === 'login' && "Enter your credentials to continue"}
                  {view === 'forgot_request' && "Enter your phone number to proceed"}
                  {view === 'forgot_verify' && "Enter your new password"}
            </p>
          </div>

          {(success || error) && (
            <div className={`toast-notification ${success ? 'toast-success' : 'toast-error'}`}>
              <span>{success || error}</span>
              <button className="toast-close" onClick={() => { setSuccess(''); setError(''); }}>×</button>
            </div>
          )}

          {/* === VIEW 1: NORMAL LOGIN === */}
          {view === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="phone_number">Phone Number</label>
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+919876543210"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                />
                <div style={{ textAlign: 'right', marginTop: '5px' }}>
                    <button 
                        type="button" 
                        className="forgot-password-link"
                        onClick={() => { setError(''); setSuccess(''); setView('forgot_request'); }}
                    >
                        Forgot Password?
                    </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}

          {/* === VIEW 2: REQUEST OTP === */}
          {view === 'forgot_request' && (
            <form onSubmit={handleForgotRequest}>
              <div className="form-group">
                <label htmlFor="phone_number">Phone Number</label>
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+919876543210"
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Validating...' : 'Validate Phone'}
              </button>

              <div className="back-button-container">
                <button type="button" className="back-button" onClick={() => setView('login')}>
                    ← Back to Login
                </button>
              </div>
            </form>
          )}

          {/* === VIEW 3: VERIFY & RESET === */}
          {view === 'forgot_verify' && (
            <form onSubmit={handleForgotReset}>
              <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="new_password"
                    value={formData.new_password}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    required
                  />
              </div>

              <button type="submit" className="btn-primary otp-verify" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>

              <div className="back-button-container">
                <button type="button" className="back-button" onClick={() => setView('forgot_request')}>
                    ← Change Phone
                </button>
              </div>
            </form>
          )}

          {/* Footer (Only show on login page to avoid clutter) */}
          {view === 'login' && (
            <div className="login-footer">
              <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}

export default Login;