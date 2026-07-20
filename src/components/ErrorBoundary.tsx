import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error bound by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#F8F8F6] flex flex-col justify-center items-center px-4 py-12 text-center select-none">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#C89B3C]" />
          
          <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C89B3C]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col items-center">
              <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 mb-6 border border-amber-100">
                <AlertTriangle size={36} className="animate-bounce" />
              </div>

              <span className="text-[10px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1 font-bold">
                MultiPlus Academy • Sistema de Proteção
              </span>
              
              <h1 className="text-xl font-serif font-black text-slate-900 leading-tight mb-3">
                Ocorreu um erro no carregamento
              </h1>
              
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Pedimos desculpa pelo inconveniente. A nossa equipa técnica foi notificada automaticamente para repor a estabilidade do sistema.
              </p>

              {this.state.error && (
                <div className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 mb-6 text-left font-mono text-[10px] text-slate-400 overflow-x-auto max-h-24">
                  {this.state.error.toString()}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={this.handleReset}
                  className="flex-grow flex items-center justify-center gap-2 py-3 px-4 bg-[#0A2E5D] hover:bg-[#08244a] text-white font-mono text-3xs font-extrabold uppercase rounded-xl transition-all cursor-pointer shadow-sm border-0"
                >
                  <RefreshCw size={12} />
                  Recarregar Aplicação
                </button>
                
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.href = '/';
                  }}
                  className="flex-grow flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono text-3xs font-extrabold uppercase rounded-xl transition-all cursor-pointer border-0"
                >
                  <Home size={12} />
                  Voltar ao Início
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
