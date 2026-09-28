import React from 'react';

export interface MetricItem {
  label: string;
  value: string | number;
  detail?: string;
  trend?: 'up' | 'down' | 'flat';
  icon?: React.ReactNode;
}

interface DashboardMetricsProps {
  title?: string;
  subtitle?: string;
  metrics: MetricItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export default function DashboardMetrics({ title, subtitle, metrics, columns = 3, className = '' }: DashboardMetricsProps) {
  const colClass = columns === 2 ? 'sm:grid-cols-2' : columns === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3';
  return (
    <section className={`rounded-3xl border border-[#EAE6DF] bg-[#FAFAF9] p-5 shadow-xs dark:border-[#273244] dark:bg-[#101827] ${className}`.trim()} aria-label={title || 'Métricas'}>
      {(title || subtitle) && (
        <div className="mb-5">
          {title && <h3 className="font-serif text-xl font-black text-[#0B1629] dark:text-white">{title}</h3>}
          {subtitle && <p className="mt-1 text-xs text-[#78716C]">{subtitle}</p>}
        </div>
      )}
      <div className={`grid grid-cols-1 gap-3 ${colClass}`}>
        {metrics.map((m, i) => (
          <div key={i} className="rounded-2xl border border-[#EAE6DF] bg-white p-4 transition hover:shadow-md dark:border-[#273244] dark:bg-[#0B111C]">
            <div className="flex items-center gap-2 mb-2">
              {m.icon && <span className="text-[#A16207]">{m.icon}</span>}
              <span className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-[#78716C]">{m.label}</span>
            </div>
            <p className="font-serif text-2xl font-black text-[#0B1629] dark:text-white tracking-tight">{m.value}</p>
            {m.detail && <p className="mt-1 text-[10px] text-[#78716C]">{m.detail}</p>}
            {m.trend && (
              <div className="mt-2 flex items-center gap-1 text-[10px] font-mono font-bold">
                <span className={`h-1.5 w-1.5 rounded-full ${m.trend === 'up' ? 'bg-emerald-500' : m.trend === 'down' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                <span className={m.trend === 'up' ? 'text-emerald-600' : m.trend === 'down' ? 'text-rose-600' : 'text-amber-600'}>{m.trend === 'up' ? '+ Estável' : m.trend === 'down' ? '- Em queda' : '= Estável'}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
