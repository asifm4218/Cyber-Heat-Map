import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import RiskEntry from './pages/RiskEntry';

// Private Route Guard Component
const PrivateRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center font-mono text-xs text-slate-500">
        // SCANNING IDENTITY ACCESS KEYS...
      </div>
    );
  }

  return token ? children : <Navigate to="/login" replace />;
};

// Main Layout Shell
const LayoutShell = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-slate-950/20 cyber-grid overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <LayoutShell>
              <Dashboard />
            </LayoutShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/assets"
        element={
          <PrivateRoute>
            <LayoutShell>
              <Assets />
            </LayoutShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/risks"
        element={
          <PrivateRoute>
            <LayoutShell>
              <RiskEntry />
            </LayoutShell>
          </PrivateRoute>
        }
      />

      {/* Redirect all unmatched routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
