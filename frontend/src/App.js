import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Components
import HomePage from './components/HomePage';
import Support from './components/Support';
import Login from './components/Login';
import Signup from './components/Signup';
import HealthAssessment from './components/HealthAssessment';
import Dashboard from './components/Dashboard';
import MapPage from './components/MapPage';
import HealthReport from './components/HealthReport';
import FamilyPage from './components/FamilyPage';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import AiIotInnovationCenter from './component_aiiot/Aiiot_index';
import ProjectDetail from './component_aiiot/ProjectDetail';
import WeatherHomepage from './weather_component/WeatherHomepage';
import MapComponent from './weather_component/MapComponent';
import RiverDashboard from './weather_component/RiverDashboard';

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
      const raw = JSON.parse(localStorage.getItem('user') || 'null');
      if (!raw) return null;
      // Normalize fields so UI can rely on `name` and `username`
      if (!raw.name) raw.name = raw.username || raw.phone_number || '';
      if (!raw.username) raw.username = raw.name || raw.phone_number || '';
      return raw;
    } catch (err) {
      console.error('Failed to parse stored user:', err);
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

// Create AuthContext and helper hook
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);


// Protected Route with Health Assessment Check (async-aware)
const ProtectedRoute = ({ children, requireHealthAssessment = false }) => {
  const { user } = useAuth();
  const [checking, setChecking] = React.useState(false);
  const [allowed, setAllowed] = React.useState(null);

  useEffect(() => {
    // If no user, nothing to check here
    if (!user) return;

    // If the route doesn't require health assessment, allow immediately
    if (!requireHealthAssessment) {
      setAllowed(true);
      return;
    }

    // If user object already indicates assessment completed, allow
    if (user.has_health_assessment) {
      setAllowed(true);
      return;
    }

    // Otherwise, check with backend
    let cancelled = false;
    const check = async () => {
      setChecking(true);
      try {
        const identifier = user.username || user.name || user.phone_number || '';
        // Update the logic to point to the backend
const url = new URL(`https://aiiot-1.onrender.com/api/health-assessment-status/`);
        // Prefer query param 'username' as used elsewhere
        url.searchParams.append('username', identifier);
        const resp = await fetch(url.toString());
        if (!resp.ok) {
          setAllowed(false);
        } else {
          const data = await resp.json();
          if (!cancelled) setAllowed(Boolean(data.has_assessment));
        }
      } catch (err) {
        console.error('ProtectedRoute: failed to verify health assessment', err);
        if (!cancelled) setAllowed(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    check();
    return () => { cancelled = true; };
  }, [user, requireHealthAssessment]);

  // No user -> redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // While checking, show loading
  if (requireHealthAssessment && (checking || allowed === null)) return <LoadingScreen />;

  // If assessment required but not allowed, redirect to assessment
  if (requireHealthAssessment && allowed === false) return <Navigate to="/health-assessment" replace />;

  return children;
};

// Admin Protected Route
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
          <Route path="/" element={<AiIotInnovationCenter/>} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/weather-home" element={<WeatherHomepage/>} />
          
          {/* Redirect logged-in users from login/signup */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route 
            path="/signup" 
            element={user ? <Navigate to="/dashboard" replace /> : <Signup />} 
          />

          {/* Public Routes */}
          <Route path="/map" element={<MapPage />} />
          <Route path="/support" element={<Support />} />
          <Route path="/weather-map" element={<MapComponent />} />
          <Route path="/river-forecast" element={<RiverDashboard />} />

          {/* Protected Routes with Health Assessment Check */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requireHealthAssessment={true}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/health-assessment" 
            element={
              <ProtectedRoute>
                <HealthAssessment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/health-report" 
            element={
              <ProtectedRoute requireHealthAssessment={true}>
                <HealthReport />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-family" 
            element={
              <ProtectedRoute requireHealthAssessment={true}>
                <FamilyPage />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } 
          />
          
          {/* Legacy admin routes */}
          <Route path="/admin-login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;



