import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './css/AdminLogin.css';
import logoImage from '../assets/aqi.webp'; 

function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://airaware-app-gcw7.onrender.com' 
    : 'http://localhost:8000';


    // Check if user wants to logout first
    useEffect(() => {
        const forceLogout = searchParams.get('logout');
        if (forceLogout === 'true') {
            localStorage.removeItem('admin_user');
            // Remove the logout parameter from URL
            navigate('/admin/login', { replace: true });
            return;
        }

        // Redirect if already logged in (unless forcing logout)
        const adminUser = localStorage.getItem('admin_user');
        if (adminUser) {
            navigate('/admin/dashboard');
        }
    }, [navigate, searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed.');
            }

            // Store admin user info in localStorage and redirect on success
            localStorage.setItem('admin_user', JSON.stringify({ name: data.username }));
            navigate('/admin/dashboard');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForceLogin = () => {
        localStorage.removeItem('admin_user');
        setError('');
    };

    const isAlreadyLoggedIn = localStorage.getItem('admin_user');

    return (
        <div className="admin-login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1>Admin Portal</h1>
                    <p>Enter your credentials to access the dashboard</p>
                    <li><a href="/">🏠 Home</a></li>
                    <div className="login-icon"><i className="fas fa-shield-alt"></i></div>
                </div>
                <div className="login-body">
                    {isAlreadyLoggedIn && (
                        <div className="info-message" style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '4px' }}>
                            <i className="fas fa-info-circle"></i>
                            You're already logged in as admin. 
                            <button 
                                onClick={handleForceLogin} 
                                style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                            >
                                Login as Different Admin
                            </button>
                        </div>
                    )}
                    
                    {error && (
                        <div className="error-message">
                            <i className="fas fa-exclamation-triangle"></i>
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <div className="input-wrapper">
                                <i className="fas fa-user input-icon"></i>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <i className="fas fa-lock input-icon"></i>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? 'Signing In...' : 'Sign In'}
                            {!loading && <i className="fas fa-arrow-right" style={{ marginLeft: '10px' }}></i>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;