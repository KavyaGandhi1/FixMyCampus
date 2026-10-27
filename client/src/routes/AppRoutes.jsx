import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Portal Landing & Auth Pages
import { LandingPage } from '../pages/LandingPage';
import { StudentLoginPage } from '../pages/auth/StudentLoginPage';
import { StaffLoginPage } from '../pages/auth/StaffLoginPage';
import { AdminLoginPage } from '../pages/auth/AdminLoginPage';
import { ActivateStaffPage } from '../pages/auth/ActivateStaffPage';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';

// Portal Dashboards & Workflow Pages
import { StudentDashboardPage } from '../pages/StudentDashboardPage';
import { StaffDashboardPage } from '../pages/StaffDashboardPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { StaffDirectoryPage } from '../pages/StaffDirectoryPage';
import { IssueListPage } from '../pages/IssueListPage';
import { CreateIssuePage } from '../pages/CreateIssuePage';
import { IssueDetailPage } from '../pages/IssueDetailPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Landing Page with Exactly Three Portals */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Portal-Specific Login & Registration Pages */}
      <Route path="/student/login" element={<StudentLoginPage />} />
      <Route path="/student/register" element={<RegisterPage />} />

      <Route path="/staff/login" element={<StaffLoginPage />} />
      <Route path="/staff/activate" element={<ActivateStaffPage />} />
      <Route path="/activate-staff" element={<ActivateStaffPage />} />

      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* General aliases for convenience */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Navigate to="/student/register" replace />} />

      {/* 3. Protected Portals Shell */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Student Portal Dashboard */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Staff Portal Dashboard */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Portal Dashboard & Staff Management */}
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

        {/* Shared Workflows: Issues List, Report Issue, Issue Details */}
        <Route path="/issues" element={<IssueListPage />} />
        <Route path="/issues/new" element={<CreateIssuePage />} />
        <Route path="/issues/:id" element={<IssueDetailPage />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
