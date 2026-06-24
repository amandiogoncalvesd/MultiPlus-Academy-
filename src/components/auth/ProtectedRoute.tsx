import React from 'react';
import AuthGuard from './AuthGuard';
import RoleGuard from './RoleGuard';
import { PageId, UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  setCurrentPage: (page: PageId) => void;
  fallbackPage?: PageId;
}

export default function ProtectedRoute({ children, allowedRoles, setCurrentPage, fallbackPage }: ProtectedRouteProps) {
  // If allowedRoles is specified, chain AuthGuard then RoleGuard
  if (allowedRoles && allowedRoles.length > 0) {
    return (
      <AuthGuard setCurrentPage={setCurrentPage}>
        <RoleGuard allowedRoles={allowedRoles} setCurrentPage={setCurrentPage} fallbackPage={fallbackPage}>
          {children}
        </RoleGuard>
      </AuthGuard>
    );
  }

  // Otherwise, protect only with AuthGuard
  return <AuthGuard setCurrentPage={setCurrentPage}>{children}</AuthGuard>;
}
