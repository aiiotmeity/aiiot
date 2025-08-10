import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import './css/AdminDashboard.css';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const navigate = useNavigate();
    const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://airaware-app-gcw7.onrender.com' 
    : 'http://localhost:8000';


    // Helper function to format timestamps
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'No data';
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return timestamp;
        }
    };

    // Helper function to determine AQI status color
    const getAQIStatus = (aqi) => {
        if (!aqi) return { status: 'No Data', class: 'aqi-moderate' };
        const value = parseInt(aqi);
        if (value <= 50) return { status: 'Good', class: 'aqi-good' };
        if (value <= 100) return { status: 'Moderate', class: 'aqi-moderate' };
        if (value <= 200) return { status: 'Unhealthy', class: 'aqi-unhealthy' };
        return { status: 'Hazardous', class: 'aqi-hazardous' };
    };

    // Helper function to check if timestamp is recent (within 1 hour)
    const isTimestampFresh = (timestamp) => {
        if (!timestamp) return false;
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMinutes = (now - date) / (1000 * 60);
            return diffMinutes <= 60;
        } catch {
            return false;
        }
    };

    const fetchData = useCallback(async () => {
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch dashboard data`);
            }
            const data = await response.json();
            console.log('Dashboard data:', data); // Debug log
            setDashboardData(data);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            if (err.message.includes('Failed to fetch')) {
                setError(`Cannot connect to server. Please ensure Django server is running on ${API_BASE_URL}`);
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        // Check admin authentication
        const adminUser = localStorage.getItem('admin_user');
        if (!adminUser) {
            navigate('/admin/login');
            return;
        }

        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [fetchData, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('admin_user');
        navigate('/admin/login');
    };

    const handleRefresh = () => {
        setLoading(true);
        fetchData();
    };

    if (loading) {
        return (
            <div className="panel-loader">
                <h2>Loading Command Center...</h2>
                <div className="loading-pulse">
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#3b82f6', marginTop: '20px' }}></i>
                </div>
                <p style={{ marginTop: '15px', color: '#6b7280' }}>Fetching real-time data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-message">
                <h2><i className="fas fa-exclamation-triangle"></i> Dashboard Error</h2>
                <p>{error}</p>
                <div style={{ marginTop: '20px' }}>
                    <button onClick={handleRefresh}>
                        <i className="fas fa-redo"></i> Retry
                    </button>
                    <button onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i> Back to Login
                    </button>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="panel-loader">
                <h2>No Data Available</h2>
                <button onClick={handleRefresh}>Retry</button>
            </div>
        );
    }

    const { station_data = {}, users = [], health_assessments = [] } = dashboardData;

    return (
        <div className="main-wrapper">
            {/* Sidebar Navigation */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h1 className="sidebar-title">
                        <i className="fas fa-wind" style={{ marginRight: '8px' }}></i>
                        AQI Monitor
                    </h1>
                </div>
                <ul className="nav flex-column">
                    <li className="nav-item">
                        <a className="nav-link active" href="#">
                            <i className="fas fa-tachometer-alt nav-icon"></i>
                            <span className="nav-text">Dashboard</span>
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#stations">
                            <i className="fas fa-satellite-dish nav-icon"></i>
                            <span className="nav-text">Monitoring Stations</span>
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#users">
                            <i className="fas fa-users nav-icon"></i>
                            <span className="nav-text">Registered Users</span>
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#assessments">
                            <i className="fas fa-heartbeat nav-icon"></i>
                            <span className="nav-text">Health Reports</span>
                        </a>
                    </li>
                </ul>
            </aside>

            {/* Main Content */}
            <main className="content-area">
                {/* Top Bar */}
                <div className="topbar">
                    <div>
                        <h1 className="topbar-title">Admin Command Center</h1>
                        <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                            Last Updated: {formatTimestamp(lastRefresh)}
                        </p>
                    </div>
                    <div className="user-dropdown">
                        <div className="user-avatar">
                            <i className="fas fa-user-shield"></i>
                        </div>
                        <span className="user-name">Administrator</span>
                        <button onClick={handleRefresh} style={{ 
                            marginLeft: '10px', 
                            padding: '8px 12px', 
                            background: '#3b82f6', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '6px',
                            fontSize: '0.85rem'
                        }}>
                            <i className="fas fa-sync-alt"></i> Refresh
                        </button>
                        <button onClick={handleLogout} style={{ 
                            marginLeft: '8px', 
                            padding: '8px 12px', 
                            background: '#dc2626', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '6px',
                            fontSize: '0.85rem'
                        }}>
                            <i className="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>

                {/* Station Monitoring Cards */}
                <div className="station-grid" id="stations">
                    {Object.entries(station_data).map(([stationId, stationInfo]) => {
                        const latestItem = stationInfo.latest_item || {};
                        const aqi = stationInfo.aqi;
                        const aqiStatus = getAQIStatus(aqi);
                        const timestamp = latestItem.time;
                        const isFresh = isTimestampFresh(timestamp);

                        return (
                            <div className="dashboard-card" key={stationId}>
                                <div className="card-header">
                                    <h5 className="card-title">
                                        <i className="fas fa-broadcast-tower" style={{ marginRight: '8px', color: '#3b82f6' }}></i>
                                        {stationId.toUpperCase().replace('-', ' ')} Station
                                    </h5>
                                    <span className={`status-badge ${latestItem.time ? 'status-ONLINE' : 'status-OFFLINE'}`}>
                                        {latestItem.time ? 'ONLINE' : 'OFFLINE'}
                                    </span>
                                </div>
                                
                                <div className="card-body">
                                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                        <div className={`aqi-value-large ${aqiStatus.class}`}>
                                            {aqi ? Math.round(aqi) : 'N/A'}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#6b7280' }}>
                                            {aqiStatus.status}
                                        </div>
                                    </div>

                                    <div className="station-details">
                                        <div className="detail-item">
                                            <div className="detail-label">Temperature</div>
                                            <div className="detail-value">{latestItem.temperature ? `${latestItem.temperature}°C` : 'N/A'}</div>
                                        </div>
                                        <div className="detail-item">
                                            <div className="detail-label">Humidity</div>
                                            <div className="detail-value">{latestItem.humidity ? `${latestItem.humidity}%` : 'N/A'}</div>
                                        </div>
                                        <div className="detail-item">
                                            <div className="detail-label">PM2.5</div>
                                            <div className="detail-value">{latestItem.pm25 ? `${latestItem.pm25} µg/m³` : 'N/A'}</div>
                                        </div>
                                        <div className="detail-item">
                                            <div className="detail-label">PM10</div>
                                            <div className="detail-value">{latestItem.pm10 ? `${latestItem.pm10} µg/m³` : 'N/A'}</div>
                                        </div>
                                        <div className="detail-item">
                                            <div className="detail-label">CO</div>
                                            <div className="detail-value">{latestItem.co ? `${latestItem.co} ppm` : 'N/A'}</div>
                                        </div>
                                        <div className="detail-item">
                                            <div className="detail-label">NH3</div>
                                            <div className="detail-value">{latestItem.nh3 ? `${latestItem.nh3} ppm` : 'N/A'}</div>
                                        </div>
                                    </div>

                                    <div className={`last-updated ${isFresh ? 'timestamp-fresh' : 'timestamp-stale'}`}>
                                        <i className="fas fa-clock"></i> Last Updated: {formatTimestamp(timestamp)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Registered Users Table */}
                <div className="data-card" id="users">
                    <div className="card-header">
                        <h4 className="card-title">
                            <i className="fas fa-users"></i> 
                            Registered Users ({users.length})
                        </h4>
                    </div>
                    <div className="card-body p-0">
                        {users.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>User ID</th>
                                        <th>Full Name</th>
                                        <th>Phone Number</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td><strong>#{user.id}</strong></td>
                                            <td>{user.name}</td>
                                            <td>{user.phone_number}</td>
                                            <td>
                                                <span className="status-badge status-ONLINE">Active</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                <i className="fas fa-users" style={{ fontSize: '2rem', marginBottom: '16px' }}></i>
                                <p>No registered users found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Health Assessments Table */}
                <div className="data-card" id="assessments">
                    <div className="card-header">
                        <h4 className="card-title">
                            <i className="fas fa-heartbeat"></i> 
                            Health Assessments ({health_assessments.length})
                        </h4>
                    </div>
                    <div className="card-body p-0">
                        {health_assessments.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Assessment ID</th>
                                        <th>User Name</th>
                                        <th>Age Group</th>
                                        <th>Gender</th>
                                        <th>Health Score</th>
                                        <th>Risk Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {health_assessments.map(assessment => {
                                        const score = assessment.health_score;
                                        let riskLevel = 'Low Risk';
                                        let scoreClass = 'health-score-high';
                                        
                                        if (score < 40) {
                                            riskLevel = 'High Risk';
                                            scoreClass = 'health-score-low';
                                        } else if (score < 70) {
                                            riskLevel = 'Medium Risk';
                                            scoreClass = 'health-score-medium';
                                        }

                                        return (
                                            <tr key={assessment.id}>
                                                <td><strong>#{assessment.id}</strong></td>
                                                <td>{assessment.user__name}</td>
                                                <td>{assessment.age_group}</td>
                                                <td>{assessment.gender}</td>
                                                <td>
                                                    <span className={`health-score ${scoreClass}`}>
                                                        {score}/100
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${scoreClass === 'health-score-high' ? 'status-ONLINE' : 'status-OFFLINE'}`}>
                                                        {riskLevel}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                <i className="fas fa-heartbeat" style={{ fontSize: '2rem', marginBottom: '16px' }}></i>
                                <p>No health assessments found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Statistics */}
                <div className="data-card">
                    <div className="card-header">
                        <h4 className="card-title">
                            <i className="fas fa-chart-bar"></i> 
                            System Overview
                        </h4>
                    </div>
                    <div className="card-body">
                        <div className="station-details">
                            <div className="detail-item">
                                <div className="detail-label">Active Stations</div>
                                <div className="detail-value">
                                    {Object.values(station_data).filter(station => station.latest_item?.time).length}/{Object.keys(station_data).length}
                                </div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label">Total Users</div>
                                <div className="detail-value">{users.length}</div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label">Health Assessments</div>
                                <div className="detail-value">{health_assessments.length}</div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label">High Risk Users</div>
                                <div className="detail-value" style={{ color: '#dc2626' }}>
                                    {health_assessments.filter(h => h.health_score < 40).length}
                                </div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label">Average AQI</div>
                                <div className="detail-value">
                                    {Object.values(station_data).length > 0 ? 
                                        Math.round(Object.values(station_data)
                                            .filter(s => s.aqi)
                                            .reduce((sum, s) => sum + s.aqi, 0) / 
                                            Object.values(station_data).filter(s => s.aqi).length) || 'N/A'
                                        : 'N/A'
                                    }
                                </div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label">System Status</div>
                                <div className="detail-value" style={{ color: '#16a34a' }}>
                                    <i className="fas fa-check-circle"></i> Operational
                                </div>
                            </div>
                        </div>
                        
                        <div className={`last-updated timestamp-fresh`} style={{ marginTop: '20px', textAlign: 'center' }}>
                            <i className="fas fa-sync-alt"></i> Dashboard refreshed: {formatTimestamp(lastRefresh)}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;