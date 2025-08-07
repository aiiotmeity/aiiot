// Complete Fixed App.js - Replace your entire App.js file with this
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

// IMPROVED Session Manager - Frontend Only
const SessionManager = {
  SESSION_DURATION: 60 * 60 * 1000, // 1 hour - matches Django settings
  SESSION_WARNING_TIME: 5 * 60 * 1000, // 5 minutes before expiry
  
  // FIXED: More robust login check
  isLoggedIn: () => {
    try {
      const user = localStorage.getItem('user');
      const loginTime = localStorage.getItem('loginTime');
      
      if (!user || !loginTime) {
        console.log('❌ No user or loginTime found');
        return false;
      }

      const sessionAge = Date.now() - parseInt(loginTime);
      if (sessionAge > SessionManager.SESSION_DURATION) {
        console.log('❌ Session expired after', sessionAge, 'ms');
        SessionManager.logout();
        return false;
      }

      console.log('✅ Session valid, age:', Math.round(sessionAge / 60000), 'minutes');
      return true;
    } catch (error) {
      console.error('❌ Session check error:', error);
      SessionManager.logout();
      return false;
    }
  },

  // FIXED: Better user retrieval with error handling
  getCurrentUser: () => {
    if (!SessionManager.isLoggedIn()) return null;
    
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      SessionManager.logout();
      return null;
    }
  },

  // FIXED: Improved login with better error handling
  login: (userData) => {
    try {
      console.log('✅ Logging in user:', userData.name);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('loginTime', Date.now().toString());
      SessionManager.setAutoLogout();
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error);
      return false;
    }
  },

  // FIXED: Improved logout - prevents redirect loops
  logout: (showAlert = false) => {
    try {
      console.log('🚪 Logging out user');
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('userLocation');
      
      if (window.sessionTimeout) {
        clearTimeout(window.sessionTimeout);
        window.sessionTimeout = null;
      }

      if (showAlert) {
        alert('Session expired. Please login again.');
      }

      // FIXED: Better navigation after logout - prevents infinite loops
      const currentPath = window.location.pathname;
      if (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/signup') {
        // Use replace to prevent back button issues
        window.location.replace('/login');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  },

  // FIXED: Better auto-logout with warning
  setAutoLogout: () => {
    if (window.sessionTimeout) {
      clearTimeout(window.sessionTimeout);
    }

    // Set warning 5 minutes before expiry
    const warningTimeout = SessionManager.SESSION_DURATION - SessionManager.SESSION_WARNING_TIME;
    
    setTimeout(() => {
      if (SessionManager.isLoggedIn()) {
        const shouldExtend = window.confirm('Your session will expire in 5 minutes. Do you want to stay logged in?');
        if (shouldExtend) {
          // Extend session
          localStorage.setItem('loginTime', Date.now().toString());
          SessionManager.setAutoLogout();
          console.log('🔄 Session extended by user');
        }
      }
    }, warningTimeout);

    // Set final logout
    window.sessionTimeout = setTimeout(() => {
      if (SessionManager.isLoggedIn()) {
        SessionManager.logout(true);
      }
    }, SessionManager.SESSION_DURATION);
  },

  // NEW: Refresh session without full re-login
  refreshSession: () => {
    if (SessionManager.isLoggedIn()) {
      localStorage.setItem('loginTime', Date.now().toString());
      SessionManager.setAutoLogout();
      console.log('🔄 Session refreshed');
      return true;
    }
    return false;
  }
};

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// FIXED: Better Protected Route with loading state
const ProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = SessionManager.isLoggedIn();
      setIsAuthenticated(authStatus);
      setIsChecking(false);
    };

    // Quick check without delay
    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div style={{
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh', 
        backgroundColor: '#f8fafc',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '32px', 
          height: '32px', 
          border: '3px solid #e5e7eb', 
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite', 
          marginBottom: '16px'
        }}></div>
        <div style={{ color: '#6b7280' }}>Checking authentication...</div>
        <style>{`@keyframes spin {0% { transform: rotate(0deg);}100% { transform: rotate(360deg);}}`}</style>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// FIXED: Admin Protected Route
const AdminProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        const adminUser = localStorage.getItem('admin_user');
        setIsAuthenticated(!!adminUser);
      } catch (error) {
        console.error('Admin auth check error:', error);
        setIsAuthenticated(false);
      }
      setIsChecking(false);
    };

    checkAdminAuth();
  }, []);

  if (isChecking) {
    return (
      <div style={{
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh', 
        backgroundColor: '#f8fafc',
        flexDirection: 'column'
      }}>
        <div style={{ color: '#6b7280' }}>Checking admin authentication...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

// Loading Screen
const LoadingScreen = () => (
  <div style={{
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center', 
    alignItems: 'center',
    height: '100vh', 
    backgroundColor: '#f8fafc', 
    fontFamily: 'Arial, sans-serif'
  }}>
    <div style={{
      width: '40px', 
      height: '40px', 
      border: '3px solid #e5e7eb', 
      borderTop: '3px solid #3b82f6',
      borderRadius: '50%', 
      animation: 'spin 1s linear infinite', 
      marginBottom: '16px'
    }}></div>
    <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading AirAware...</p>
    <style>{`@keyframes spin {0% { transform: rotate(0deg);}100% { transform: rotate(360deg);}}`}</style>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // FIXED: Better initialization
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing authentication...');
        
        // Small delay to prevent flash of wrong content
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const currentUser = SessionManager.getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          console.log('✅ User found:', currentUser.name);
          SessionManager.setAutoLogout();
        } else {
          console.log('ℹ️ No active user session');
        }
        
        setAuthInitialized(true);
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // FIXED: Better activity detection to keep session alive
  useEffect(() => {
    if (!authInitialized || !user) return;

    let activityTimer;
    const handleActivity = () => {
      // Debounce activity detection
      if (!activityTimer && SessionManager.isLoggedIn()) {
        activityTimer = setTimeout(() => {
          SessionManager.refreshSession();
          activityTimer = null;
        }, 30000); // Refresh every 30 seconds of activity
      }
    };

    // Listen for user activity
    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (activityTimer) clearTimeout(activityTimer);
    };
  }, [authInitialized, user]);

  // FIXED: Improved auth context value
  const authValue = {
    user,
    loading: !authInitialized,
    login: (userData) => {
      console.log('📝 Login called for:', userData.name);
      const success = SessionManager.login(userData);
      if (success) {
        setUser(userData);
        return true;
      }
      console.error('❌ Login failed');
      return false;
    },
    logout: (showAlert = false) => {
      console.log('🚪 Logout called');
      SessionManager.logout(showAlert);
      setUser(null);
    },
    isLoggedIn: () => SessionManager.isLoggedIn(),
    refreshSession: () => SessionManager.refreshSession()
  };

  // Show loading screen while initializing
  if (loading) return <LoadingScreen />;

  return (
    <AuthContext.Provider value={authValue}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route 
            path="/signup" 
            element={user ? <Navigate to="/dashboard" replace /> : <Signup />} 
          />
          <Route path="/map" element={<MapPage />} />

          {/* Protected Routes - FIXED with better protection */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
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
              <ProtectedRoute>
                <HealthReport />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-family" 
            element={
              <ProtectedRoute>
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
          
          {/* Legacy admin routes for backwards compatibility */}
          <Route path="/admin-login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Catch-all redirect for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;