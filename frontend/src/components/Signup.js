import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Signup.css';
import logoImage from '../assets/aqi.webp';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '+91', // Start with the prefix
    email: '',           // Make sure this is an empty string
    password: '',
    otp: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Initialize as empty string
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [showPassword, setShowPassword] = useState(false);

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
  // 1. Remove everything that isn't a number
  const digits = value.replace(/\D/g, '');
  
  // 2. Remove '91' if it's already at the start so we don't double it
  const numberPart = digits.startsWith('91') ? digits.substring(2, 12) : digits.substring(0, 10);
  
  // 3. Force the final value to always be +91 followed by the 10 digits
  value = '+91' + numberPart;
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
        setResendTimer(30); // start 30s countdown for resend
        setSuccess('OTP sent successfully. Check your phone.'); // <--- Use setSuccess
      } else {
        setError(data.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('Network error. Could not send OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Resend helper — only works when timer is 0
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    await handleSendOtp();
  };

  // Countdown effect for resend timer
  useEffect(() => {
    if (!otpSent) {
      setResendTimer(0);
      return;
    }
    if (resendTimer <= 0) return;
    const id = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(id);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [otpSent, resendTimer]);

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
      username: formData.name.trim(), // CHANGE 'name' TO 'username' HERE
      phone_number: formData.phone_number,
      email: formData.email.trim(),
      password: formData.password
    })
  });

      const data = await response.json();

      if (response.ok && data.success) {
  setSuccess('Account created successfully! Redirecting...'); // <--- New string message
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
                autoComplete="email" // Helps the browser distinguish it from a phone field
                disabled={loading || otpVerified}
              />
            </div>

            <div className="form-group">
  <label htmlFor="password">Password</label>
  <div className="password-wrapper" style={{ position: 'relative' }}>
    <input
      type={showPassword ? "text" : "password"}
      id="password"
      name="password"
      value={formData.password}
      onChange={handleChange}
      placeholder="Min. 8 characters"
      required
      disabled={loading || otpVerified}
      style={{ width: '100%', paddingRight: '40px' }}
    />
    <span 
      className="password-toggle-icon"
      onClick={() => setShowPassword(!showPassword)}
      style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        cursor: 'pointer',
        color: '#666'
      }}
    >
      {showPassword ? '👁️' : '👁️‍🗨️'} 
    </span>
  </div>
</div>

            <div className="form-group">
            <label htmlFor="phone_number">Phone Number</label>
            
            {/* Input Field */}
            <div className="input-group" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                color: '#555',
                fontWeight: '500'
              }}>+91</span>
              <input
                type="tel"
                name="phone_number"
                // Extract only the 10 digits for display if you go this route
                value={formData.phone_number.replace('+91', '')} 
                onChange={handleChange}
                placeholder="9876543210"
                style={{ paddingLeft: '45px' }} // Push text to the right of +91
                required
                maxLength="10"
              />
            </div>

            {/* Send OTP Button - Now Independent & Full Width */}
            <button
              type="button"
              className={`btn-otp ${otpSent ? 'sent' : ''}`} 
              onClick={handleSendOtp}
              disabled={isSendingOtp || otpSent}
            >
              {isSendingOtp ? (
                <span className="loader-spinner"></span>
              ) : otpSent ? (
                <>
                  <span>✓ OTP Sent</span>
                  {/* <span style={{fontSize: '0.8em', marginLeft: '5px', opacity: 0.8}}>(Resend?)</span> */}
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </div>
            {otpSent && !otpVerified && (
              <div className="form-group">
                <label htmlFor="otp">Enter OTP</label>
                <div className="input-group" style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="\d*"
                    id="otp"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="6-digit code"
                    required
                    disabled={loading || isVerifyingOtp || otpVerified}
                    maxLength="6"
                    autoFocus
                    style={{flex: 1, padding: '10px 12px', borderRadius: '8px', fontSize: '1rem'}}
                  />

                  <button
                    type="button"
                    className={`btn-secondary ${otpVerified ? 'verified' : ''}`}
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp || otpVerified}
                  >
                    {isVerifyingOtp ? 'Verifying...' : (otpVerified ? 'Verified' : 'Verify')}
                  </button>
                </div>

                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems: 'center'}}>
                  <small style={{color: '#666'}}>
                    Didn't receive the OTP?
                    {resendTimer > 0 ? (
                      <span style={{marginLeft: 6}}> Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isSendingOtp}
                        className="btn-link"
                        style={{marginLeft: 8, padding: '4px 8px', cursor: isSendingOtp ? 'not-allowed' : 'pointer'}}
                      >
                        {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                      </button>
                    )}
                  </small>

                  <div style={{minWidth: 120, textAlign: 'right'}}>
                    {otpVerified && <span style={{color: 'green'}}>✅ Verified</span>}
                  </div>
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
