import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import './css/FamilyPage.css';
import logoImage from '../assets/aqi.webp'; 

function FamilyPage() {
    const { user, logout } = useAuth();
    
    // FIX 1: Safely extract 'username' or 'name' from user data context
    const [username] = useState(() => {
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            return userData.username || userData.name || user?.username || user?.name || null;
        } catch {
            return user?.username || user?.name || null;
        }
    });
    
    const [familyMembers, setFamilyMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const [formState, setFormState] = useState({ name: '', age: '', relationship: '' });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // --- NEW STATE FOR LOCATION AND AQI ---
    const [currentAQI, setCurrentAQI] = useState(null);
    const [locationStatus, setLocationStatus] = useState('Detecting location...');

    const navigate = useNavigate();
    const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://aiiot-1.onrender.com'
  : 'http://localhost:8000';
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    const fetchFamilyMembers = useCallback(async () => {
        if (!username) {
            navigate('/login');
            return;
        }
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/family-members/?username=${username}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch family members`);
            }
            
            const data = await response.json();
            console.log('✅ Family members fetched:', data);
            setFamilyMembers(data);
        } catch (err) {
            console.error('❌ Error fetching family members:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [username, navigate, API_BASE_URL]);

    // --- NEW LOGIC: Fetch User Location & AQI ---
    const fetchLocationAndAQI = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationStatus('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    setLocationStatus('Fetching local air quality...');
                    const { latitude, longitude } = position.coords;
                    
                    const response = await fetch(`${API_BASE_URL}/api/user-aqi/?lat=${latitude}&lng=${longitude}`);
                    if (!response.ok) throw new Error('Failed to fetch AQI');
                    
                    const data = await response.json();
                    setCurrentAQI(data.user_aqi);
                    setLocationStatus(`Local AQI: ${data.user_aqi} (${data.status})`);
                } catch (err) {
                    console.error('Error fetching AQI for family page:', err);
                    setLocationStatus('Failed to load local AQI. Using default risk profiles.');
                    setCurrentAQI(null); // Fallback to null
                }
            },
            (err) => {
                console.warn('Location access denied or failed.', err);
                setLocationStatus('Location access needed for dynamic health scoring.');
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
    }, [API_BASE_URL]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        fetchFamilyMembers();
        fetchLocationAndAQI(); // Fetch AQI on load
    }, [fetchFamilyMembers, fetchLocationAndAQI]);

    // --- NEW LOGIC: Dynamic Risk Matrix ---
    const getDynamicRisk = (age, aqi) => {
        // Fallback to static logic if we don't have location/AQI yet
        if (aqi === null) {
            return (age < 18 || age > 65) 
                ? { label: 'High Risk (Static)', class: 'high-risk' } 
                : { label: 'Normal Risk (Static)', class: 'normal' };
        }

        const isVulnerable = age < 18 || age > 65;

        if (aqi <= 50) {
            return { label: 'Low Risk', class: 'normal' };
        } else if (aqi <= 100) {
            return isVulnerable ? { label: 'Moderate Risk', class: 'moderate' } : { label: 'Low Risk', class: 'normal' };
        } else if (aqi <= 200) {
            return isVulnerable ? { label: 'High Risk', class: 'high-risk' } : { label: 'Moderate Risk', class: 'moderate' };
        } else {
            return { label: 'Critical Risk', class: 'high-risk' };
        }
    };

    // Event Handlers
    const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
    
    const handleLogout = useCallback(() => {
        try {
            logout();
            navigate('/login');
        } catch (e) {
            console.error('Logout failed:', e);
            navigate('/login');
        }
    }, [logout, navigate]);

    const handleAddMemberClick = () => {
        setEditingMember(null);
        setFormState({ name: '', age: '', relationship: '' });
        setFormError('');
        setIsModalOpen(true);
    };

    const handleEditMemberClick = (member) => {
        setEditingMember(member);
        setFormState({ 
            name: member.name, 
            age: member.age.toString(), 
            relationship: member.relationship 
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const handleDeleteMember = async (memberId, memberName) => {
        if (window.confirm(`Are you sure you want to delete ${memberName} from your family list? This action cannot be undone.`)) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/family-members/${memberId}/`, { 
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to delete member');
                }
                
                setFamilyMembers(prev => prev.filter(m => m.id !== memberId));
                console.log('✅ Family member deleted successfully');
            } catch (err) {
                console.error('❌ Error deleting member:', err);
                alert("Failed to delete member. Please try again.");
            }
        }
    };
    
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        // Validation
        if (!formState.name.trim()) {
            setFormError('Name is required');
            setFormLoading(false);
            return;
        }
        
        if (!formState.age || parseInt(formState.age) < 0 || parseInt(formState.age) > 150) {
            setFormError('Please enter a valid age (0-150)');
            setFormLoading(false);
            return;
        }
        
        if (!formState.relationship) {
            setFormError('Please select a relationship');
            setFormLoading(false);
            return;
        }

        const url = editingMember 
            ? `${API_BASE_URL}/api/family-members/update/${editingMember.id}/`
            : `${API_BASE_URL}/api/family-members/`;
        
        const method = editingMember ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    ...formState, 
                    age: parseInt(formState.age),
                    username 
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'An unknown error occurred.');
            }

            const updatedMember = await response.json();

            if (editingMember) {
                setFamilyMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
                console.log('✅ Family member updated successfully');
            } else {
                setFamilyMembers(prev => [...prev, updatedMember]);
                console.log('✅ Family member added successfully');
            }
            
            setIsModalOpen(false);
        } catch (err) {
            console.error('❌ Error saving family member:', err);
            setFormError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
        if (formError) setFormError('');
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setFormError('');
        setFormState({ name: '', age: '', relationship: '' });
        setEditingMember(null);
    };

    const getRelationshipIcon = (relationship) => {
        const icons = {
            'Father': '👨',
            'Mother': '👩',
            'Sibling': '👫',
            'Spouse': '💑',
            'Child': '👶',
            'Grandparent': '👴',
            'Other': '👤'
        };
        return icons[relationship] || '👤';
    };

    const getAgeCategory = (age) => {
        if (age < 13) return { category: 'Child', color: '#10b981', icon: '👶' };
        if (age < 20) return { category: 'Teen', color: '#f59e0b', icon: '👦' };
        if (age < 60) return { category: 'Adult', color: '#3b82f6', icon: '👨' };
        return { category: 'Senior', color: '#8b5cf6', icon: '👴' };
    };

    if (isLoading) {
        return (
            <div className="family-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <h2>👨‍👩‍👧‍👦 Loading Your Family...</h2>
                    <p>Fetching family member information</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="family-page">
                <div className="error-container">
                    <div className="error-icon">⚠️</div>
                    <h2>Unable to Load Family Data</h2>
                    <p className="error-message">{error}</p>
                    <div className="error-actions">
                        <button onClick={fetchFamilyMembers} className="retry-btn">🔄 Try Again</button>
                        <button onClick={() => navigate('/dashboard')} className="back-btn">🏠 Back to Dashboard</button>
                    </div>
                </div>
            </div>
        );
    }

    // Determine total high risk members dynamically based on current AQI
    const highRiskCount = familyMembers.filter(m => {
        const risk = getDynamicRisk(m.age, currentAQI);
        return risk.label.includes('High') || risk.label.includes('Critical');
    }).length;

    return (
        <div className="family-page">
            <div className="realtime-status">
                👨‍👩‍👧‍👦 FAMILY MANAGEMENT • {familyMembers.length} Members • Health Monitoring Active
            </div>

            <nav className="navbar">
                <div className="navbar-content">
                    <Link to="/" className="navbar-brand">
                        <img src={logoImage} alt="AQM Logo" width={isMobileView ? "32" : "40"} height={isMobileView ? "32" : "40"} />
                        AirAware
                    </Link>

                    <div className="menu-toggle" onClick={toggleMenu}>☰</div>

                    <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
                        <li><Link to="/dashboard" className="nav-link">👤 Profile</Link></li>
                        <li><Link to="/health-assessment" className="nav-link">📋 Health Update</Link></li>
                        <li><Link to="/health-report" className="nav-link">📄 Health Report</Link></li>
                        <li><Link to="/add-family" className="nav-link active">👥 Add Family</Link></li>
                        <li className="user-info">👤 <span>{username}</span></li>
                        <li>
                            <button onClick={handleLogout} className="nav-link login-btn">🚪 Logout</button>
                        </li>
                    </ul>
                </div>
            </nav>

            <div className="main-container">
                <div className="page-header">
                    <div className="header-content">
                        <div className="header-text">
                            <h1>👨‍👩‍👧‍👦 Family Health Management</h1>
                            <p className="subtitle">
                                Manage your family's health profiles and monitor air quality impact on each member
                            </p>
                            {/* AQI Status Banner */}
                            <div style={{ backgroundColor: '#f3f4f6', padding: '10px 15px', borderRadius: '8px', marginTop: '15px', fontSize: '0.9rem', color: '#4b5563', borderLeft: '4px solid #3b82f6' }}>
                                📍 <strong>Location Status:</strong> {locationStatus}
                            </div>
                        </div>
                        <div className="header-actions">
                            <button className="add-member-btn primary" onClick={handleAddMemberClick}>
                                <span className="btn-icon">➕</span>
                                <span>Add Family Member</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card profile-overview">
                        <div className="card-header">
                            <h3>👤 Your Profile</h3>
                        </div>
                        <div className="profile-content">
                            <div className="profile-avatar-large">
                                {username ? username.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="profile-details">
                                <h2 className="profile-name">{username}</h2>
                                <div className="profile-role">Family Administrator</div>
                                <div className="profile-stats">
                                    <div className="profile-stat">
                                        <div className="stat-icon">👥</div>
                                        <div className="stat-content">
                                            <div className="stat-value">{familyMembers.length}</div>
                                            <div className="stat-label">Total Members</div>
                                        </div>
                                    </div>
                                    <div className="profile-stat">
                                        <div className="stat-icon">🏥</div>
                                        <div className="stat-content">
                                            <div className="stat-value">{highRiskCount}</div>
                                            <div className="stat-label">High Risk Currently</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card family-overview">
                        <div className="card-header">
                            <h3>📊 Family Health Overview</h3>
                        </div>
                        <div className="overview-stats">
                            <div className="overview-stat">
                                <div className="stat-circle children">
                                    <div className="stat-number">
                                        {familyMembers.filter(m => m.age < 18).length}
                                    </div>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-title">Children</div>
                                    <div className="stat-desc">Under 18 years</div>
                                </div>
                            </div>
                            <div className="overview-stat">
                                <div className="stat-circle adults">
                                    <div className="stat-number">
                                        {familyMembers.filter(m => m.age >= 18 && m.age < 65).length}
                                    </div>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-title">Adults</div>
                                    <div className="stat-desc">18-64 years</div>
                                </div>
                            </div>
                            <div className="overview-stat">
                                <div className="stat-circle seniors">
                                    <div className="stat-number">
                                        {familyMembers.filter(m => m.age >= 65).length}
                                    </div>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-title">Seniors</div>
                                    <div className="stat-desc">65+ years</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="members-section">
                    <div className="section-header">
                        <h2 className="section-title">👨‍👩‍👧‍👦 Family Members</h2>
                    </div>

                    {familyMembers.length > 0 ? (
                        <div className="members-grid">
                            {familyMembers.map(member => {
                                const ageCategory = getAgeCategory(member.age);
                                const riskInfo = getDynamicRisk(member.age, currentAQI);
                                
                                return (
                                    <div className="member-card" key={member.id}>
                                        <div className="member-card-header">
                                            <div className="member-avatar">
                                                {getRelationshipIcon(member.relationship)}
                                            </div>
                                            <div className="member-status online"></div>
                                        </div>
                                        <div className="member-info">
                                            <h3 className="member-name">{member.name}</h3>
                                            <div className="member-details">
                                                <div className="detail-item">
                                                    <span className="detail-icon">👤</span>
                                                    <span className="detail-text">{member.relationship}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-icon">{ageCategory.icon}</span>
                                                    <span className="detail-text">{member.age} years • {ageCategory.category}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-icon">🏥</span>
                                                    {/* Dynamic Risk Calculation applied here */}
                                                    <span className={`health-status ${riskInfo.class}`}>
                                                        {riskInfo.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="member-actions">
                                            <button 
                                                className="action-btn edit-btn" 
                                                onClick={() => handleEditMemberClick(member)}
                                                title="Edit Member Details"
                                            >
                                                <span className="btn-icon">✏️</span>
                                                <span>Edit</span>
                                            </button>
                                            <button 
                                                className="action-btn delete-btn" 
                                                onClick={() => handleDeleteMember(member.id, member.name)}
                                                title="Remove Member"
                                            >
                                                <span className="btn-icon">🗑️</span>
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-members">
                            <div className="no-members-icon">👨‍👩‍👧‍👦</div>
                            <h3>No Family Members Added Yet</h3>
                            <p>Start building your family health profile by adding family members</p>
                            <button className="add-first-member-btn" onClick={handleAddMemberClick}>
                                <span className="btn-icon">➕</span>
                                <span>Add Your First Family Member</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="health-tips-section">
                    <h2 className="section-title">💡 Family Health Tips</h2>
                    <div className="tips-grid">
                        <div className="tip-card">
                            <div className="tip-icon">👶</div>
                            <div className="tip-content">
                                <h4>Children & Air Quality</h4>
                                <p>Children are more vulnerable to air pollution. Monitor AQI closely and limit outdoor activities when levels are high.</p>
                            </div>
                        </div>
                        <div className="tip-card">
                            <div className="tip-icon">👴</div>
                            <div className="tip-content">
                                <h4>Senior Care</h4>
                                <p>Elderly family members should avoid outdoor activities when AQI exceeds 100 and use air purifiers indoors.</p>
                            </div>
                        </div>
                        <div className="tip-card">
                            <div className="tip-icon">🏥</div>
                            <div className="tip-content">
                                <h4>Health Monitoring</h4>
                                <p>Regular health assessments help track how air quality affects each family member differently.</p>
                            </div>
                        </div>
                        <div className="tip-card">
                            <div className="tip-icon">🏠</div>
                            <div className="tip-content">
                                <h4>Indoor Air Quality</h4>
                                <p>Keep indoor plants, use air purifiers, and ensure good ventilation to protect your family's health.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={handleModalClose}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title-section">
                                <h3 className="modal-title">
                                    {editingMember ? '✏️ Edit Family Member' : '➕ Add Family Member'}
                                </h3>
                                <p className="modal-subtitle">
                                    {editingMember 
                                        ? 'Update the information for this family member'
                                        : 'Add a new family member to monitor their health'
                                    }
                                </p>
                            </div>
                            <button className="close-btn" onClick={handleModalClose}>✕</button>
                        </div>
                        
                        <form onSubmit={handleFormSubmit} className="modal-form">
                            {formError && (
                                <div className="form-error">
                                    <span className="error-icon">⚠️</span>
                                    <span>{formError}</span>
                                </div>
                            )}
                            
                            <div className="form-group">
                                <label htmlFor="name">
                                    <span className="label-icon">👤</span>
                                    Full Name *
                                </label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formState.name} 
                                    onChange={handleInputChange} 
                                    placeholder="Enter full name" 
                                    required 
                                    className="form-input"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="age">
                                    <span className="label-icon">🎂</span>
                                    Age *
                                </label>
                                <input 
                                    type="number" 
                                    name="age" 
                                    value={formState.age} 
                                    onChange={handleInputChange} 
                                    placeholder="Enter age" 
                                    min="0" 
                                    max="150"
                                    required 
                                    className="form-input"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="relationship">
                                    <span className="label-icon">👨‍👩‍👧‍👦</span>
                                    Relationship *
                                </label>
                                <select 
                                    name="relationship" 
                                    value={formState.relationship} 
                                    onChange={handleInputChange} 
                                    required 
                                    className="form-select"
                                >
                                    <option value="">Select Relationship</option>
                                    <option value="Father">👨 Father</option>
                                    <option value="Mother">👩 Mother</option>
                                    <option value="Sibling">👫 Sibling</option>
                                    <option value="Spouse">💑 Spouse</option>
                                    <option value="Child">👶 Child</option>
                                    <option value="Grandparent">👴 Grandparent</option>
                                    <option value="Other">👤 Other</option>
                                </select>
                            </div>
                            
                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    className="btn-cancel" 
                                    onClick={handleModalClose}
                                    disabled={formLoading}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-submit" 
                                    disabled={formLoading}
                                >
                                    {formLoading ? (
                                        <>
                                            <div className="btn-spinner"></div>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="btn-icon">
                                                {editingMember ? '💾' : '➕'}
                                            </span>
                                            <span>
                                                {editingMember ? 'Save Changes' : 'Add Member'}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <footer className="footer">
                    <div className="footer-container">
                      <div className="footer-content">
                        <div className="footer-section">
                          <h4>AirAware Kerala</h4>
                          <p>Smart Air Quality Monitoring System</p>
                          
                          <div className="social-links">
                            <a href="https://www.linkedin.com/in/aiiot-asiet-b22302308" 
                                className="social-link" 
                                target="_blank" 
                                rel="noopener noreferrer">
                                <i className="fab fa-linkedin-in"></i>
                              </a>
            
                            <a href="https://www.instagram.com/aiiot_adishankara?igsh=aXY4bXQ2cjVhYWM2"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer">
                                <i className="fab fa-instagram"></i>
                            </a>
                            <a href="#" className="social-link">
                              <i className="fab fa-facebook-f"></i>
                            </a>
                            <a href="#" className="social-link">
                              <i className="fab fa-twitter"></i>
                            </a>
                            
                          </div>
                        </div>
                        <div className="footer-section">
                          <h4>Quick Links</h4>
                          <ul>
                            <li><Link to="/homepage"> Home</Link></li>
                            <li><Link to="/health-report">Health Report</Link></li>
                            <li><Link to="/add-family">Add Family</Link></li>
                            <li><Link to="/map">Live map</Link></li>
                          </ul>
                        </div>
                        <div className="footer-section">
                          <h4>Data Sources</h4>
                          <ul>
                            <li>ASIET Campus Station </li>
                            <li>Mattoor Junction Station</li>
                            
                          </ul>
                        </div>
                        <div className="footer-section">
                          <h4>Contact Information</h4>
                          <p>
                            Adi Shankara Institute of Engineering and Technology<br/>
                            Kalady 683574, Ernakulam<br/>
                            Kerala, India
                          </p>
                          <p>
                            <strong>Email:</strong> aiiot@adishankara.ac.in<br/>
                            <strong>Phone:</strong> 9846900310
                          </p>
                        </div>
                      </div>
                      <div className="footer-bottom">
                        <p>&copy;  2025 AirAware kalady. All rights reserved. Developed and managed by Center for AI & IoT Innovation, Adi Shankara Institute of Engineering and Technology.</p>
                        
                      </div>
                    </div>
                  </footer>
        </div>
    );
}

export default FamilyPage;