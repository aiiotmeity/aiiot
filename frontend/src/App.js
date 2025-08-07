// frontend/src/App.js - FULLY CORRECTED
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Your Components
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

// --- START: NEW, STABLE AUTHENTICATION PROVIDER ---

// 1. Create the context to hold the user data
const AuthContext = createContext(null);

// 2. Create the AuthProvider component to manage the logic
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Start in a loading state

    // This runs only once when the app starts
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            // Clear corrupted data if it exists
            localStorage.removeItem('user');
        }
        setLoading(false); // Finished checking, the app can now be shown
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.clear(); // Clear all session-related data
        window.location.href = '/login'; // Redirect to login page
    };

    // The value provided to all other components
    const authValue = { user, loading, login, logout };

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. Create the useAuth hook for easy access from any component
export const useAuth = () => {
    return useContext(AuthContext);
};
// --- END: NEW, STABLE AUTHENTICATION PROVIDER ---


// 4. Update ProtectedRoute to use the new, reliable hook
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        // While we're checking the user's status, show a loading screen
        return <LoadingScreen />;
    }

    if (!user) {
        // If the check is complete and there's no user, redirect to login
        return <Navigate to="/login" replace />;
    }

    return children;
};

const AdminProtectedRoute = ({ children }) => {
    const adminUser = localStorage.getItem('admin_user');
    return adminUser ? children : <Navigate to="/admin/login" replace />;
};

// Loading Screen (your component is unchanged)
const LoadingScreen = () => (
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
    <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
    <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading AirAware...</p>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);


function App() {
  return (
    // 5. Wrap the entire application in the AuthProvider
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/map" element={<MapPage />} />

          {/* Protected Routes now use the corrected ProtectedRoute */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/health-assessment" element={<ProtectedRoute><HealthAssessment /></ProtectedRoute>} />
          <Route path="/health-report" element={<ProtectedRoute><HealthReport /></ProtectedRoute>} />
          <Route path="/add-family" element={<ProtectedRoute><FamilyPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;