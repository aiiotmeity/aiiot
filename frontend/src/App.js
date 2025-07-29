// App.js
import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Components
import HomePage from './components/HomePage';
import Login from './components/Login';
import Signup from './components/Signup';
import HealthAssessment from './components/HealthAssessment';
import Dashboard from './components/Dashboard';
import MapPage from './components/MapPage';
import HealthReport from './components/HealthReport';
import FamilyPage from './components/FamilyPage';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';

// Session Manager
const SessionManager = {
  SESSION_DURATION: 60 * 60 * 1000, // 1 hour

  isLoggedIn: () => {
    try {
      const user = localStorage.getItem('user');
      const loginTime = localStorage.getItem('loginTime');
      if (!user || !loginTime) return false;

      const sessionAge = Date.now() - parseInt(loginTime);
      if (sessionAge > SessionManager.SESSION_DURATION) {
        SessionManager.logout();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  getCurrentUser: () => {
    if (!SessionManager.isLoggedIn()) return null;
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      SessionManager.logout();
      return null;
    }
  },

  login: (userData) => {
    try {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('loginTime', Date.now().toString());
      SessionManager.setAutoLogout();
    } catch (error) {
      console.error('Login failed:', error);
    }
  },

  logout: () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('userLocation');
    } catch (error) {
      console.error('Logout error:', error);
    }

    if (window.sessionTimeout) clearTimeout(window.sessionTimeout);
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  },

  setAutoLogout: () => {
    if (window.sessionTimeout) clearTimeout(window.sessionTimeout);
    window.sessionTimeout = setTimeout(() => {
      alert('Session expired. Please login again.');
      SessionManager.logout();
    }, SessionManager.SESSION_DURATION);
  }
};

// Auth Context
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Protected Route
const ProtectedRoute = ({ children }) => {
  return SessionManager.isLoggedIn() ? children : <Navigate to="/login" replace />;
};

// Admin Protected Route - Fixed to check for admin_user
const AdminProtectedRoute = ({ children }) => {
  const adminUser = localStorage.getItem('admin_user');
  return adminUser ? children : <Navigate to="/admin/login" replace />;
};

// Loading Screen
const LoadingScreen = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Arial, sans-serif'
  }}>
    <div style={{
      width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTop: '3px solid #3b82f6',
      borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px'
    }}></div>
    <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading AirAware...</p>
    <style>{`@keyframes spin {0% { transform: rotate(0deg);}100% { transform: rotate(360deg);}}`}</style>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const currentUser = SessionManager.getCurrentUser();
      setUser(currentUser);
      if (currentUser) SessionManager.setAutoLogout();
      setLoading(false);
    };
    const timer = setTimeout(initializeAuth, 100);

    // Activity detection
    const handleActivity = () => {
      if (SessionManager.isLoggedIn()) SessionManager.setAutoLogout();
    };
    let activityTimer;
    const throttledActivity = () => {
      if (activityTimer) return;
      activityTimer = setTimeout(() => {
        handleActivity();
        activityTimer = null;
      }, 30000);
    };
    document.addEventListener('click', throttledActivity);
    document.addEventListener('keydown', throttledActivity);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', throttledActivity);
      document.removeEventListener('keydown', throttledActivity);
      if (activityTimer) clearTimeout(activityTimer);
    };
  }, []);

  const authValue = {
    user,
    login: (userData) => {
      SessionManager.login(userData);
      setUser(userData);
    },
    logout: () => {
      SessionManager.logout();
      setUser(null);
    },
    isLoggedIn: () => SessionManager.isLoggedIn()
  };

  if (loading) return <LoadingScreen />;

  return (
    <AuthContext.Provider value={authValue}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
          <Route path="/map" element={<MapPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/health-assessment" element={<ProtectedRoute><HealthAssessment /></ProtectedRoute>} />
          <Route path="/health-report" element={<ProtectedRoute><HealthReport /></ProtectedRoute>} />
          <Route path="/add-family" element={<ProtectedRoute><FamilyPage /></ProtectedRoute>} />

          {/* Admin Routes - Fixed paths */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          
          {/* Legacy admin routes for backwards compatibility */}
          <Route path="/admin-login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;