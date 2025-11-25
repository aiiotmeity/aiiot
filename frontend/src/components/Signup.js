import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Signup.css';
import logoImage from '../assets/aqi.webp';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    password: '',
    otp: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  const navigate = useNavigate();

  const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const particles = useMemo(() => {
    const elements = [];
    for (let i = 0; i < 20; i++) {
      elements.push(<div key={i} className="particle" />);
    }
    return elements;
  }, []);

  const validatePhoneNumber = (phone) => {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (cleanPhone.length === 13 && cleanPhone.startsWith('+91')) {
      const numberPart = cleanPhone.substring(3);
      if (numberPart.length === 10 && numberPart.match(/^[6-9]/)) {
        return cleanPhone;
      }
    }
    return null;
  };

  const handleChange = (e) => {
    let value = e.target.value;

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
    if (error) setError('');
  };

  // --- SEND OTP FUNCTION ---
  const handleSendOtp = async () => {
    setError('');
    const validatedPhone = validatePhoneNumber(formData.phone_number);
    if (!validatedPhone) {
      setError('Please enter a valid phone number in +91xxxxxxxxxx format.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/send-signup-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: validatedPhone }),
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOtpSent(true);
        setError('OTP sent successfully. Check your phone.');
      } else {
        setError(data.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('Network error. Could not send OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // --- VERIFY OTP FUNCTION ---
  const handleVerifyOtp = async () => {
    setError('');
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: formData.phone_number,
          otp_code: formData.otp
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpVerified(true);
        setError('✅ Phone number verified successfully.');
      } else {
        setError(data.error || 'Invalid OTP.');
      }
    } catch (err) {
      setError('Network error. Could not verify OTP.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // --- SUBMIT FINAL SIGNUP ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Please enter a valid full name.');
      setLoading(false);
      return;
    }
    if (!formData.email.trim().includes('@')) {
      setError('Please enter a valid email.');
      setLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }
    if (!otpVerified) {
      setError('Please verify your phone number before signing up.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone_number: formData.phone_number,
          email: formData.email.trim(),
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || data.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <section className="signup-section">
        <div className="particles">{particles}</div>

        <div className="signup-container">
          <div className="signup-header">
            <h2><span className="user-icon">👤</span> Sign Up</h2>
            <p>Create your AirAware account</p>
          </div>

          {(success || error) && (
  <div className={`toast-notification ${success ? 'toast-success' : 'toast-error'}`}>
    <span>{success || error}</span>
    <button className="toast-close" onClick={() => { setSuccess(''); setError(''); }}>×</button>
  </div>
)}


          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                disabled={loading || otpVerified}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                disabled={loading || otpVerified}
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
                placeholder="Min. 8 characters"
                required
                disabled={loading || otpVerified}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone_number">Phone Number</label>
              <div className="input-group">
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+919876543210"
                  required
                  disabled={loading || otpSent}
                  maxLength="13"
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || otpSent}
                >
                  {isSendingOtp ? 'Sending...' : (otpSent ? 'Sent' : 'Send OTP')}
                </button>
              </div>
            </div>

            {otpSent && !otpVerified && (
              <div className="form-group">
                <label htmlFor="otp">Enter OTP</label>
                <div className="input-group">
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="6-digit code"
                    required
                    disabled={loading || isVerifyingOtp || otpVerified}
                    maxLength="6"
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp || otpVerified}
                  >
                    {isVerifyingOtp ? 'Verifying...' : (otpVerified ? 'Verified' : 'Verify')}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !otpVerified}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="signup-footer">
            <p>Already have an account? <a href="/login">Login</a></p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Signup;
