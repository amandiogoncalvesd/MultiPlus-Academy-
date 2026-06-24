import React, { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { PageId } from '../../types';

interface AuthGuardProps {
  children: React.ReactNode;
  setCurrentPage: (page: PageId) => void;
  fallbackPage?: PageId;
}

export default function AuthGuard({ children, setCurrentPage, fallbackPage = 'login' }: AuthGuardProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      setCurrentPage(fallbackPage);
    }
  }, [user, loading, setCurrentPage, fallbackPage]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[300px] h-full">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 border-4 border-[#C89B3C] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono uppercase tracking-wider text-gray-400">Verificando Credenciais...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
