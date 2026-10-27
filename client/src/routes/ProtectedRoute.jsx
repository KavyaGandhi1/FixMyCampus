import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Checking session authorization..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Direct unauthenticated user to their specific portal's login page
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    if (location.pathname.startsWith('/staff')) {
      return <Navigate to="/staff/login" state={{ from: location }} replace />;
    }
    if (location.pathname.startsWith('/student')) {
      return <Navigate to="/student/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect user to their own role dashboard
    const defaultDashboard =
      user.role === 'admin' ? '/admin' : user.role === 'staff' ? '/staff' : '/student';
    return <Navigate to={defaultDashboard} replace />;
  }

  return children;
};
