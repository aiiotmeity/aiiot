import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/AdminDashboard.css';

// Create User Modal Component
const CreateUserModal = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({ name, phone_number: phone });
            setName('');
            setPhone('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="modal-backdrop">
                <div className="modal-content">
                    <h2>Create New User</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter full name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                id="phone"
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+919876543210"
                                required
                            />
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Edit User Modal Component
const EditUserModal = ({ user, onClose, onSave }) => {
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone_number);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            await onSave({ ...user, name, phone_number: phone });
        } catch (err) {
            setError(err.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="modal-backdrop">
                <div className="modal-content">
                    <h2>Edit User: {user.name}</h2>
                    {error && <div className="error-message-small">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                id="phone"
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Health Assessment Detail Modal
const HealthDetailModal = ({ assessment, onClose }) => {
    return (
        <div className="admin-dashboard">
            <div className="modal-backdrop">
                <div className="modal-content modal-large">
                    <h2>Health Assessment Details</h2>
                    <div className="health-detail-grid">
                        <div className="detail-section">
                            <h3>Basic Information</h3>
                            <p><strong>User:</strong> {assessment.user_name}</p>
                            <p><strong>Age Group:</strong> {assessment.age_group}</p>
                            <p><strong>Gender:</strong> {assessment.gender}</p>
                            <p><strong>Health Score:</strong> <span className={`health-score ${assessment.is_high_risk ? 'risk-high' : 'risk-low'}`}>{assessment.health_score}</span></p>
                            <p><strong>Risk Level:</strong> <span className={`risk-badge risk-${assessment.risk_level.toLowerCase()}`}>{assessment.risk_level}</span></p>
                        </div>
                        <div className="detail-section">
                            <h3>Health Conditions</h3>
                            <p><strong>Respiratory Conditions:</strong> {Array.isArray(assessment.respiratory_conditions) ? assessment.respiratory_conditions.join(', ') : assessment.respiratory_conditions || 'None'}</p>
                            <p><strong>Medical History:</strong> {Array.isArray(assessment.medical_history) ? assessment.medical_history.join(', ') : assessment.medical_history || 'None'}</p>
                            <p><strong>Smoking History:</strong> {assessment.smoking_history || 'Not specified'}</p>
                            <p><strong>Living Environment:</strong> {Array.isArray(assessment.living_environment) ? assessment.living_environment.join(', ') : assessment.living_environment || 'Not specified'}</p>
                        </div>
                        <div className="detail-section">
                            <h3>Timestamps</h3>
                            <p><strong>Created:</strong> {new Date(assessment.created_at).toLocaleString()}</p>
                            <p><strong>Updated:</strong> {new Date(assessment.updated_at).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button onClick={onClose} className="btn-primary">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isHealthDetailOpen, setIsHealthDetailOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    const navigate = useNavigate();
    const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://airaware-app-gcw7.onrender.com' 
        : 'http://localhost:8000';

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'No data';
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('en-IN', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch { 
            return timestamp; 
        }
    };
    
    const getAQIStatus = (aqi) => {
        if (aqi === null || aqi === undefined) return { status: 'No Data', class: 'aqi-moderate' };
        const value = parseInt(aqi);
        if (value <= 50) return { status: 'Good', class: 'aqi-good' };
        if (value <= 100) return { status: 'Moderate', class: 'aqi-moderate' };
        if (value <= 200) return { status: 'Unhealthy', class: 'aqi-unhealthy' };
        return { status: 'Hazardous', class: 'aqi-hazardous' };
    };

    const fetchData = useCallback(async () => {
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/`);
            if (!response.ok) {
                // If the fetch fails, try to get the text content for better error reporting
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            const data = await response.json();
            setDashboardData(data);
            setLastRefresh(new Date());
        } catch (err) {
            // Check for the specific JSON parsing error
            if (err instanceof SyntaxError && err.message.includes("Unexpected token '<'")) {
                setError("Error: The server returned an HTML page instead of data. Please check the server logs and URL configuration.");
            } else {
                setError(err.message.includes('fetch') ? `Cannot connect to server.` : err.message);
            }
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);


    useEffect(() => {
        if (!localStorage.getItem('admin_user')) {
            navigate('/admin/login');
            return;
        }
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData, navigate]);
    
    // ----- THIS FUNCTION IS NOW FIXED AND MORE ROBUST -----
    const handleDeleteUser = async (userId, userName) => {
        if (window.confirm(`Are you sure you want to delete user: ${userName}? This will also delete all their related data including health assessments. This action cannot be undone.`)) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/admin/users/delete/${userId}/`, {
                    method: 'DELETE',
                });

                // Check if the response is JSON before trying to parse it.
                const contentType = response.headers.get("content-type");
                
                if (response.ok) {
                    const result = await response.json();
                    alert(result.message || 'User deleted successfully.');
                    fetchData(); // Refresh the data
                } else {
                    let errorText = `Failed with status ${response.status}`;
                    // If the server sent a JSON error, use its message
                    if (contentType && contentType.includes("application/json")) {
                        const errorData = await response.json();
                        errorText = errorData.error || JSON.stringify(errorData);
                    } else {
                        // Otherwise, it's likely HTML, so just show the raw text
                        errorText = await response.text();
                    }
                    throw new Error(errorText);
                }
            } catch (err) {
                console.error("Delete error:", err);
                alert(`Error: Could not delete the user.\n\nServer Response:\n${err.message}`);
            }
        }
    };

    const handleUpdateUser = async (updatedUser) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/update/${updatedUser.id}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: updatedUser.name,
                    phone_number: updatedUser.phone_number
                })
            });
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Update failed');
            }
            
            const savedUser = await response.json();
            
            setDashboardData(prevData => ({
                ...prevData,
                users: prevData.users.map(u => 
                    u.id === savedUser.id ? { ...u, ...savedUser } : u
                )
            }));
            
            alert(savedUser.message || 'User updated successfully.');
            setIsEditModalOpen(false);
            setEditingUser(null);
            
        } catch (err) {
            console.error("Update error:", err);
            throw err; // Re-throw to be handled by modal
        }
    };

    const handleCreateUser = async (newUser) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/create/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Creation failed');
            }
            
            const createdUser = await response.json();
            alert(createdUser.message || 'User created successfully.');
            setIsCreateModalOpen(false);
            fetchData();
            
        } catch (err) {
            console.error("Create error:", err);
            alert(`Error: Could not create user.\n\n${err.message}`);
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const openHealthDetail = (assessment) => {
        setSelectedAssessment(assessment);
        setIsHealthDetailOpen(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_user');
        navigate('/admin/login');
    };

    const handleRefresh = () => {
        setLoading(true);
        fetchData();
    };

    const exportData = async (type) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/export/?type=${type}`);
            if (!response.ok) throw new Error('Export failed');
            
            const exportData = await response.json();
            
            if (exportData.data && exportData.data.length > 0) {
                const headers = Object.keys(exportData.data[0]).join(',');
                const rows = exportData.data.map(row => 
                    Object.values(row).map(value => 
                        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
                    ).join(',')
                );
                const csvContent = "data:text/csv;charset=utf-8," + 
                    headers + "\n" + rows.join("\n");
                
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `admin_export_${type}_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                alert(`Exported ${exportData.count} ${type} records successfully!`);
            } else {
                alert('No data available to export');
            }
            
        } catch (err) {
            console.error("Export error:", err);
            alert(`Error exporting data: ${err.message}`);
        }
    };

    if (loading) return (
        <div className="admin-dashboard">
            <div className="panel-loader"><h2>Loading Command Center...</h2></div>
        </div>
    );
    
    if (error) return (
        <div className="admin-dashboard">
            <div className="error-message"><h2>Error</h2><p>{error}</p><button onClick={handleRefresh}>Retry</button></div>
        </div>
    );
    
    if (!dashboardData) return (
        <div className="admin-dashboard">
            <div className="panel-loader"><h2>No Data Available</h2></div>
        </div>
    );

    const { station_data = {}, users = [], health_assessments = [], analytics = {} } = dashboardData;
    const allParameters = ['pm25', 'pm10', 'co', 'nh3', 'no2', 'so2', 'o3', 'temperature', 'humidity', 'pressure'];

    return (
        <div className="admin-dashboard">
            <div className="main-wrapper">
                {/* Modals */}
                {isEditModalOpen && (
                    <EditUserModal 
                        user={editingUser} 
                        onClose={() => setIsEditModalOpen(false)} 
                        onSave={handleUpdateUser} 
                    />
                )}
                {isCreateModalOpen && (
                    <CreateUserModal 
                        onClose={() => setIsCreateModalOpen(false)} 
                        onSave={handleCreateUser} 
                    />
                )}
                {isHealthDetailOpen && (
                    <HealthDetailModal 
                        assessment={selectedAssessment} 
                        onClose={() => setIsHealthDetailOpen(false)} 
                    />
                )}
                
                {/* Sidebar */}
                <aside className="sidebar">
                    <div className="sidebar-header">
                        <h1 className="sidebar-title">
                            <i className="fas fa-wind"></i> AQI Admin
                        </h1>
                    </div>
                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} 
                                href="#overview"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveTab('overview');
                                }}
                            >
                                <i className="fas fa-tachometer-alt nav-icon"></i> 
                                <span className="nav-text">Overview</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activeTab === 'stations' ? 'active' : ''}`} 
                                href="#stations"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveTab('stations');
                                }}
                            >
                                <i className="fas fa-satellite-dish nav-icon"></i> 
                                <span className="nav-text">Stations</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} 
                                href="#users"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveTab('users');
                                }}
                            >
                                <i className="fas fa-users nav-icon"></i> 
                                <span className="nav-text">Users</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activeTab === 'health' ? 'active' : ''}`} 
                                href="#health"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveTab('health');
                                }}
                            >
                                <i className="fas fa-heartbeat nav-icon"></i> 
                                <span className="nav-text">Health Reports</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`} 
                                href="#analytics"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveTab('analytics');
                                }}
                            >
                                <i className="fas fa-chart-bar nav-icon"></i> 
                                <span className="nav-text">Analytics</span>
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
                            <p>Last Updated: {formatTimestamp(lastRefresh)}</p>
                        </div>
                        <div className="user-dropdown">
                            <button onClick={handleRefresh} className="btn-refresh">
                                <i className="fas fa-sync-alt"></i> Refresh
                            </button>
                            <button onClick={() => exportData('users')} className="btn-export">
                                <i className="fas fa-download"></i> Export
                            </button>
                            <button onClick={handleLogout} className="btn-logout">
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div>
                            {/* Quick Stats */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon stat-users">
                                        <i className="fas fa-users"></i>
                                    </div>
                                    <div className="stat-info">
                                        <h3>{analytics.total_users || 0}</h3>
                                        <p>Total Users</p>
                                        <span className="stat-change positive">
                                            +{analytics.active_users || 0} active
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-icon stat-health">
                                        <i className="fas fa-heartbeat"></i>
                                    </div>
                                    <div className="stat-info">
                                        <h3>{analytics.health_assessments_completed || 0}</h3>
                                        <p>Health Assessments</p>
                                        <span className="stat-change negative">
                                            {analytics.high_risk_users || 0} high risk
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-icon stat-aqi">
                                        <i className="fas fa-wind"></i>
                                    </div>
                                    <div className="stat-info">
                                        <h3>{analytics.average_aqi || 'N/A'}</h3>
                                        <p>Average AQI</p>
                                        <span className="stat-change neutral">
                                            {Object.values(station_data).filter(s => s.health?.status === 'ONLINE').length}/2 stations online
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-icon stat-system">
                                        <i className="fas fa-server"></i>
                                    </div>
                                    <div className="stat-info">
                                        <h3>{analytics.system_uptime || '99.5%'}</h3>
                                        <p>System Uptime</p>
                                        <span className="stat-change positive">
                                            Operational
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="data-card">
                                <div className="card-header">
                                    <h4 className="card-title">
                                        <i className="fas fa-clock"></i> Recent Activity
                                    </h4>
                                </div>
                                <div className="card-body">
                                    <div className="activity-list">
                                        {users.slice(0, 5).map(user => (
                                            <div key={user.id} className="activity-item">
                                                <div className="activity-icon">
                                                    <i className="fas fa-user-plus"></i>
                                                </div>
                                                <div className="activity-content">
                                                    <p><strong>{user.name}</strong> {user.last_login ? 'logged in' : 'registered'}</p>
                                                    <small>{formatTimestamp(user.last_login || user.created_at)}</small>
                                                </div>
                                                <div className={`activity-status ${user.status?.toLowerCase()}`}>
                                                    {user.status}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stations Tab */}
                    {activeTab === 'stations' && (
                        <div className="station-grid">
                            {Object.entries(station_data).map(([stationId, stationInfo]) => {
                                const latestItem = stationInfo.latest_item || {};
                                const aqiStatus = getAQIStatus(stationInfo.aqi);
                                const health = stationInfo.health || {};
                                
                                return (
                                    <div className="dashboard-card station-card" key={stationId}>
                                        <div className="card-header">
                                            <h5 className="card-title">
                                                <i className="fas fa-broadcast-tower"></i> 
                                                {stationId.toUpperCase().replace('-', ' ')}
                                            </h5>
                                            <span className={`status-badge ${health.status === 'ONLINE' ? 'status-ONLINE' : 'status-OFFLINE'}`}>
                                                {health.status || 'UNKNOWN'}
                                            </span>
                                        </div>
                                        <div className="card-body">
                                            {/* AQI Display */}
                                            <div className="aqi-display">
                                                <div className={`aqi-value-large ${aqiStatus.class}`}>
                                                    {stationInfo.aqi ? Math.round(stationInfo.aqi) : 'N/A'}
                                                </div>
                                                <div className="aqi-status-text">{aqiStatus.status}</div>
                                            </div>

                                            {/* Sensor Parameters Grid */}
                                            <div className="sensor-grid">
                                                {allParameters.map(param => {
                                                    const value = latestItem[param];
                                                    const displayValue = value !== undefined && value !== null ? 
                                                        (typeof value === 'number' ? value.toFixed(2) : String(value)) : 'N/A';
                                                    
                                                    return (
                                                        <div className="sensor-item" key={param}>
                                                            <div className="sensor-label">{param.toUpperCase()}</div>
                                                            <div className="sensor-value">{displayValue}</div>
                                                            {param === 'temperature' && value && <div className="sensor-unit">°C</div>}
                                                            {param === 'humidity' && value && <div className="sensor-unit">%</div>}
                                                            {param === 'pressure' && value && <div className="sensor-unit">hPa</div>}
                                                            {['pm25', 'pm10', 'co', 'nh3', 'no2', 'so2', 'o3'].includes(param) && value && 
                                                                <div className="sensor-unit">µg/m³</div>}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Station Health */}
                                            <div className="station-health">
                                                <div className="health-item">
                                                    <span>Last Seen:</span>
                                                    <span>{formatTimestamp(health.last_seen)}</span>
                                                </div>
                                                <div className="health-item">
                                                    <span>Data Points (24h):</span>
                                                    <span>{health.data_points || 0}</span>
                                                </div>
                                                <div className="health-item">
                                                    <span>Signal Quality:</span>
                                                    <span>{health.signal_quality || 'Unknown'}</span>
                                                </div>
                                                <div className="health-item">
                                                    <span>Battery:</span>
                                                    <span>{latestItem.battery || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="data-card">
                            <div className="card-header">
                                <h4 className="card-title">
                                    <i className="fas fa-users"></i> 
                                    Registered Users ({users.length})
                                </h4>
                                <div className="card-actions">
                                    <button 
                                        onClick={() => setIsCreateModalOpen(true)} 
                                        className="btn-primary"
                                    >
                                        <i className="fas fa-plus"></i> Add User
                                    </button>
                                    <button 
                                        onClick={() => exportData('users')} 
                                        className="btn-secondary"
                                    >
                                        <i className="fas fa-download"></i> Export Users
                                    </button>
                                </div>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Phone</th>
                                                <th>Status</th>
                                                <th>Health Assessment</th>
                                                <th>Last Login</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(user => (
                                                <tr key={user.id}>
                                                    <td><strong>#{user.id}</strong></td>
                                                    <td>{user.name}</td>
                                                    <td>{user.phone_number}</td>
                                                    <td>
                                                        <span className={`status-badge status-${user.status?.toUpperCase()}`}>
                                                            {user.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`assessment-badge ${user.has_health_assessment ? 'completed' : 'pending'}`}>
                                                            {user.has_health_assessment ? 'Completed' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td>{formatTimestamp(user.last_login)}</td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button 
                                                                className="btn-action btn-edit" 
                                                                onClick={() => openEditModal(user)}
                                                                title="Edit User"
                                                            >
                                                                <i className="fas fa-pencil-alt"></i>
                                                            </button>
                                                            <button 
                                                                className="btn-action btn-delete" 
                                                                onClick={() => handleDeleteUser(user.id, user.name)}
                                                                title="Delete User"
                                                            >
                                                                <i className="fas fa-trash-alt"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Health Reports Tab */}
                    {activeTab === 'health' && (
                        <div className="data-card">
                            <div className="card-header">
                                <h4 className="card-title">
                                    <i className="fas fa-heartbeat"></i> 
                                    Health Assessments ({health_assessments.length})
                                </h4>
                                <div className="card-actions">
                                    <button 
                                        onClick={() => exportData('health_assessments')} 
                                        className="btn-secondary"
                                    >
                                        <i className="fas fa-download"></i> Export Reports
                                    </button>
                                </div>
                            </div>
                            <div className="card-body p-0">
                                {health_assessments.length > 0 ? (
                                    <div className="table-container">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>User</th>
                                                    <th>Age Group</th>
                                                    <th>Gender</th>
                                                    <th>Health Score</th>
                                                    <th>Risk Level</th>
                                                    <th>Last Updated</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {health_assessments.map(assessment => {
                                                    const riskClass = assessment.is_high_risk ? 'risk-high' : 
                                                                     assessment.health_score >= 50 ? 'risk-moderate' : 'risk-low';
                                                    
                                                    return (
                                                        <tr key={assessment.id}>
                                                            <td><strong>#{assessment.id}</strong></td>
                                                            <td>{assessment.user_name}</td>
                                                            <td>{assessment.age_group}</td>
                                                            <td>{assessment.gender}</td>
                                                            <td>
                                                                <span className={`health-score ${riskClass}`}>
                                                                    {assessment.health_score}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`risk-badge ${riskClass}`}>
                                                                    {assessment.risk_level}
                                                                </span>
                                                            </td>
                                                            <td>{formatTimestamp(assessment.updated_at)}</td>
                                                            <td>
                                                                <button 
                                                                    className="btn-action btn-view" 
                                                                    onClick={() => openHealthDetail(assessment)}
                                                                    title="View Details"
                                                                >
                                                                    <i className="fas fa-eye"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <i className="fas fa-heartbeat"></i>
                                        <h3>No Health Assessments</h3>
                                        <p>No users have completed health assessments yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <div>
                            <div className="analytics-grid">
                                <div className="data-card">
                                    <div className="card-header">
                                        <h4 className="card-title">
                                            <i className="fas fa-chart-pie"></i> System Analytics
                                        </h4>
                                    </div>
                                    <div className="card-body">
                                        <div className="analytics-stats">
                                            <div className="stat-row">
                                                <span>Total Users:</span>
                                                <span className="stat-value">{analytics.total_users || 0}</span>
                                            </div>
                                            <div className="stat-row">
                                                <span>Active Users:</span>
                                                <span className="stat-value positive">{analytics.active_users || 0}</span>
                                            </div>
                                            <div className="stat-row">
                                                <span>Inactive Users:</span>
                                                <span className="stat-value">{analytics.inactive_users || 0}</span>
                                            </div>
                                            <div className="stat-row">
                                                <span>Health Assessments:</span>
                                                <span className="stat-value">{analytics.health_assessments_completed || 0}</span>
                                            </div>
                                            <div className="stat-row">
                                                <span>High Risk Users:</span>
                                                <span className="stat-value negative">{analytics.high_risk_users || 0}</span>
                                            </div>
                                            <div className="stat-row">
                                                <span>Average AQI:</span>
                                                <span className="stat-value">{analytics.average_aqi || 'N/A'}</span>
                                            </div>
                                            <div className="stat-row">
                                                <span>System Uptime:</span>
                                                <span className="stat-value positive">{analytics.system_uptime || '99.5%'}</span>
                                            </div>
                                            <div className="stat-row">
                                                <span>Data Collection:</span>
                                                <span className="stat-value">{analytics.data_collection_rate || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="data-card">
                                    <div className="card-header">
                                        <h4 className="card-title">
                                            <i className="fas fa-exclamation-triangle"></i> System Alerts
                                        </h4>
                                    </div>
                                    <div className="card-body">
                                        <div className="alert-list">
                                            {analytics.high_risk_users > 0 && (
                                                <div className="alert-item warning">
                                                    <i className="fas fa-user-injured"></i>
                                                    <div>
                                                        <strong>High Risk Users Detected</strong>
                                                        <p>{analytics.high_risk_users} users have high health risk scores</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {Object.values(station_data).some(s => s.health?.status !== 'ONLINE') && (
                                                <div className="alert-item error">
                                                    <i className="fas fa-satellite-dish"></i>
                                                    <div>
                                                        <strong>Station Offline</strong>
                                                        <p>One or more monitoring stations are offline</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {analytics.average_aqi > 100 && (
                                                <div className="alert-item warning">
                                                    <i className="fas fa-wind"></i>
                                                    <div>
                                                        <strong>Poor Air Quality</strong>
                                                        <p>Average AQI is above healthy levels</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {!Object.values(station_data).some(s => s.health?.status !== 'ONLINE') && 
                                             analytics.high_risk_users === 0 && 
                                             (analytics.average_aqi || 0) <= 100 && (
                                                <div className="alert-item success">
                                                    <i className="fas fa-check-circle"></i>
                                                    <div>
                                                        <strong>All Systems Normal</strong>
                                                        <p>No critical alerts at this time</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;