import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  // High-fidelity auto-routing of standard window.alert calls
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      if (!message) return;
      
      const lower = message.toLowerCase();
      let type: ToastType = 'info';
      
      if (
        lower.includes('sucesso') || 
        lower.includes('concluíd') || 
        lower.includes('salv') || 
        lower.includes('parabéns') ||
        lower.includes('êxito') ||
        lower.includes('reconhecido') ||
        lower.includes('grato')
      ) {
        type = 'success';
      } else if (
        lower.includes('erro') || 
        lower.includes('falha') || 
        lower.includes('eliminar') || 
        lower.includes('excluír') ||
        lower.includes('cancelada') ||
        lower.includes('inexistente')
      ) {
        type = 'error';
      } else if (
        lower.includes('atenção') || 
        lower.includes('aviso') || 
        lower.includes('suspenso') ||
        lower.includes('remover')
      ) {
        type = 'warning';
      }
      
      showToast(message, type);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast container aligned to top-right with high z-index and padding */}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-3.5 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            // Setup status styles
            let bgStyle = 'bg-cream-100/95 border-l-4 shadow-xl border-ink-900 text-slate-800';
            let iconColor = 'text-ink-900';
            let progressBg = 'bg-ink-900';
            let Icon = Info;

            if (toast.type === 'success') {
              bgStyle = 'bg-white/95 border-l-4 border-emerald-500 shadow-xl text-slate-800';
              iconColor = 'text-emerald-500';
              progressBg = 'bg-emerald-500';
              Icon = CheckCircle2;
            } else if (toast.type === 'error') {
              bgStyle = 'bg-white/95 border-l-4 border-rose-500 shadow-xl text-slate-800';
              iconColor = 'text-rose-500';
              progressBg = 'bg-rose-500';
              Icon = AlertCircle;
            } else if (toast.type === 'warning') {
              bgStyle = 'bg-white/95 border-l-4 border-amber-500 shadow-xl text-slate-800';
              iconColor = 'text-amber-500';
              progressBg = 'bg-amber-500';
              Icon = AlertTriangle;
            }

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 50 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className={`${bgStyle} rounded-xl overflow-hidden p-4 flex gap-3.5 pointer-events-auto shadow-2xl backdrop-blur-md relative border border-slate-100/50`}
              >
                {/* Status Indicator Icon */}
                <div className={`p-1 rounded-lg ${iconColor}/10 shrink-0`}>
                  <Icon size={20} className={iconColor} />
                </div>

                {/* Toast Message */}
                <div className="flex-grow pr-4 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono text-[9px]">
                    {toast.type === 'success' ? 'Sucesso' : toast.type === 'error' ? 'Aviso de Erro' : toast.type === 'warning' ? 'Atenção' : 'Notificação'}
                  </p>
                  <p className="text-xs font-medium leading-relaxed text-slate-700">
                    {toast.message}
                  </p>
                </div>

                {/* Manual Close Button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 transition-all shrink-0 self-start"
                  aria-label="Fechar"
                >
                  <X size={14} />
                </button>

                {/* Premium countdown visual line */}
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 h-[3px] ${progressBg} opacity-85`}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
