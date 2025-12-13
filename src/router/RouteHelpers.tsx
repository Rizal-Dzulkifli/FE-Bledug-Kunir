import React from 'react';
import ProtectedRoute from './ProtectedRoute';
import { UserRole, RolePermissions } from '../types/auth';

// Helper function to wrap components with ProtectedRoute
export const withRoleProtection = (
  element: React.ReactElement, 
  requiredPermission?: keyof RolePermissions,
  requiredRole?: UserRole
) => {
  return (
    <ProtectedRoute 
      requiredPermission={requiredPermission}
      requiredRole={requiredRole}
    >
      {element}
    </ProtectedRoute>
  );
};

// Helper function for admin only routes
export const adminOnly = (element: React.ReactElement) => {
  return withRoleProtection(element, undefined, 'admin');
};

// Helper function for karyawan only routes
export const karyawanOnly = (element: React.ReactElement) => {
  return withRoleProtection(element, undefined, 'karyawan');
};

// Helper function for driver only routes
export const driverOnly = (element: React.ReactElement) => {
  return withRoleProtection(element, undefined, 'driver');
};

// Helper function for routes that require specific permissions
export const withPermission = (element: React.ReactElement, permission: keyof RolePermissions) => {
  return withRoleProtection(element, permission);
};

// Helper function for basic authentication (any authenticated user)
export const authenticated = (element: React.ReactElement) => {
  return <ProtectedRoute>{element}</ProtectedRoute>;
};