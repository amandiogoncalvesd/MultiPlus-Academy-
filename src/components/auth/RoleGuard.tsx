import React, { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { PageId, UserRole } from '../../types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  setCurrentPage: (page: PageId) => void;
  fallbackPage?: PageId;
}

export default function RoleGuard({ children, allowedRoles, setCurrentPage, fallbackPage = 'home' }: RoleGuardProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      const isAllowed = allowedRoles.includes(user.role);
      if (!isAllowed) {
        // Automatically redirect unauthorized users back safely
        setCurrentPage(fallbackPage);
      }
    }
  }, [user, loading, allowedRoles, setCurrentPage, fallbackPage]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[300px] h-full">
        <div className="h-8 w-8 border-4 border-[#C89B3C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex-grow flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 bg-white rounded-2xl border border-red-150 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto text-lg font-bold">!</div>
          <h3 className="text-base font-serif font-bold text-[#0A2E5D]">Acesso Não Autorizado</h3>
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
            A sua credencial atual não possui os privilégios letivos requeridos para visualizar este painel institucional.
          </p>
          <button
            onClick={() => setCurrentPage(fallbackPage)}
            className="px-6 py-2 bg-[#0A2E5D] text-white rounded-xl uppercase tracking-wider text-[10px] font-mono font-bold hover:bg-[#123C73] transition-all"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
