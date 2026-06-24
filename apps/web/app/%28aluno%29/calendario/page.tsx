import { CalendarClock, MapPin } from 'lucide-react';

export default function StudentCalendarPage() {
  return (
    <div id="student-calendar-root" className="space-y-8 text-left">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Calendário Académico</h2>
        <p className="text-xs text-gray-500">Consulte as datas dos próximos webinars, simulações presenciais e workshops agendados.</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-150 space-y-6">
        <h3 className="font-serif font-black text-[#0A2E5D] text-lg">Próximos Eventos do Seu Cronograma</h3>

        <div className="space-y-4">
          <div className="p-4 bg-[#F8F8F6] rounded-2xl border border-gray-150 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs font-sans">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-[#0A2E5D]/5 text-[#C89B3C] rounded-xl flex-shrink-0">
                <CalendarClock size={20} />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold text-[#C89B3C] uppercase">Sessão Síncrona Híbrida</span>
                <h4 className="font-serif font-bold text-gray-800 text-sm">Aula Prática de Oratória e Opening Statement</h4>
                <p className="text-xs text-gray-500 leading-normal flex items-center gap-1.5 pt-0.5"><MapPin size={12} /> Auditório Principal MultiPlus (Huambo)</p>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-[10px] text-gray-400">
              <p className="font-bold text-[#0A2E5D]">18 JULHO 2026</p>
              <p>09:00 - 12:00 (GMT+1)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
