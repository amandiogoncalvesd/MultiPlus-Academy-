import React from 'react';
import DashboardProfileCard from './DashboardProfileCard';
import StatusDot from './StatusDot';
import NotificationBadge from './NotificationBadge';
import MessageButton from './MessageButton';
import DashboardShell from './DashboardShell';
import DashboardMetrics from './DashboardMetrics';
import DashboardTable from './DashboardTable';
import { Bell, Award, CheckCircle2, Clock, GraduationCap, TrendingUp, BookOpen, ShieldCheck, FileCheck2 } from 'lucide-react';

export default function DashboardComponentsDemo() {
  return (
    <DashboardShell
      sidebar={<div className="p-4 text-xs text-[#78716C]">Sidebar placeholder</div>}
      topbar={<div className="h-16 bg-[#F7F6F2] dark:bg-[#0B111C] px-6 flex items-center text-xs text-[#78716C]">Topbar placeholder</div>}
    >
      <div className="space-y-8 max-w-6xl mx-auto">
        <section>
          <h2 className="font-serif text-2xl font-black text-[#0B1629] dark:text-white mb-2">Perfil Reutilizável</h2>
          <p className="text-xs text-[#78716C] mb-4">DashboardProfileCard — avatar circular sem anel direto, status separado, nome + função</p>
          <DashboardProfileCard
            data={{ firstName: 'Formadora', lastName: 'S. M.', avatarUrl: '/brand/multiplus-academy-logo-original.png', roleLabel: 'Formadora · Huambo', subtitle: 'MultiPlus Academy LMS' }}
            size="lg"
            showSubtitle
            showEmail={false}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#0B1629] dark:text-white">Status Dot</h3>
            <div className="flex gap-4 items-center">
              <StatusDot status="online" label="Online" />
              <StatusDot status="typing" label="A escrever" />
              <StatusDot status="offline" label="Offline" />
              <StatusDot status="away" label="Ausente" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#0B1629] dark:text-white">Notificações & Mensagens</h3>
            <div className="flex gap-4 items-center">
              <NotificationBadge count={3} icon="bell" ariaLabel="3 avisos" />
              <NotificationBadge count={12} maxDisplay={9} icon="message" ariaLabel="12 mensagens" />
              <MessageButton unreadCount={3} onClick={() => {}} ariaLabel="Abrir mensagens" />
            </div>
          </div>
        </section>

        <DashboardMetrics
          title="Visão Institucional"
          subtitle="Dados consolidados do painel administrativo — 46 tabelas, 15 migrações, 5 funções"
          metrics={[
            { label: 'Tabelas', value: 46, detail: 'Com RLS ativo', icon: <BookOpen size={14} /> },
            { label: 'Migrações', value: 15, detail: 'Todas aplicadas', icon: <ShieldCheck size={14} /> },
            { label: 'Edge Functions', value: 5, detail: '4 ativas + 1 nova', icon: <Award size={14} /> },
            { label: 'Candidaturas', value: 4, detail: 'Pendente no painel', icon: <Clock size={14} /> },
          ]}
          columns={4}
        />

        <DashboardTable
          title="Candidaturas Recentes"
          subtitle="Amostra da tabela applications — 2 registros visíveis no painel administrativo"
          columns={[
            { key: 'nome_completo', label: 'Candidato', width: '30%' },
            { key: 'email', label: 'Email', width: '25%' },
            { key: 'modalidade', label: 'Modalidade', width: '15%' },
            { key: 'status', label: 'Estado', width: '10%', render: (row: any) => <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-amber-600">{row.status}</span> },
          ]}
          data={[
            { nome_completo: 'Teste Automação Arena', email: 'teste.arena@exemplo.ao', modalidade: 'Online Completo', status: 'PENDING' },
            { nome_completo: 'Teste Automação Arena', email: 'teste.arena@exemplo.ao', modalidade: 'Online Completo', status: 'CONTACTED' },
          ]}
        />
      </div>
    </DashboardShell>
  );
}
