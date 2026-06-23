import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';

// Views
import Hub from './views/Hub';
import CompetitionDetails from './views/CompetitionDetails';
import Login from './views/Login';
import Register from './views/Register';
import UserDashboard from './views/UserDashboard';
import GlobalLeaderboard from './views/GlobalLeaderboard';
import AdminPanel from './views/AdminPanel';
import AdminCreateCompetition from './views/AdminCreateCompetition';
import AdminResults from './views/AdminResults';
import ResetPassword from './views/ResetPassword';

// Route Protectors
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return user && profile?.role === 'admin' ? children : <Navigate to="/" replace />;
};

export default function App() {
  const basename = import.meta.env.DEV ? "" : "/competition";
  return (
    <AuthProvider>
      <Router basename={basename}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
          <Header />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Hub />} />
              <Route path="/competition/:id" element={<CompetitionDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/leaderboard" element={<GlobalLeaderboard />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* User Dashboard Route */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/create"
                element={
                  <AdminRoute>
                    <AdminCreateCompetition />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/edit/:id"
                element={
                  <AdminRoute>
                    <AdminCreateCompetition />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/results/:id"
                element={
                  <AdminRoute>
                    <AdminResults />
                  </AdminRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
