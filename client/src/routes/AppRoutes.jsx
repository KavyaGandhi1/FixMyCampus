import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { StudentDashboardPage } from '../pages/StudentDashboardPage';
import { StaffDashboardPage } from '../pages/StaffDashboardPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { StaffDirectoryPage } from '../pages/StaffDirectoryPage';
import { IssueListPage } from '../pages/IssueListPage';
import { CreateIssuePage } from '../pages/CreateIssuePage';
import { IssueDetailPage } from '../pages/IssueDetailPage';
import { NotFoundPage } from '../pages/NotFoundPage';

const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'staff') return <Navigate to="/staff" replace />;
  return <Navigate to="/student" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Root redirect to respective role dashboard */}
      <Route path="/" element={<RootRedirect />} />

      {/* Protected SaaS Application Shell */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Student Route */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Staff Route */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StaffDirectoryPage />
            </ProtectedRoute>
          }
        />

        {/* Shared Issue Management */}
        <Route path="/issues" element={<IssueListPage />} />
        <Route path="/issues/new" element={<CreateIssuePage />} />
        <Route path="/issues/:id" element={<IssueDetailPage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
