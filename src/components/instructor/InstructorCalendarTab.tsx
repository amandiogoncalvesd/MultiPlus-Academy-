import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Video, 
  Clock, 
  Users, 
  ExternalLink, 
  CheckCheck, 
  PlusCircle, 
  Trash2, 
  Sparkles, 
  HelpCircle,
  Copy
} from 'lucide-react';
import { User, Course } from '../../types';

interface InstructorCalendarTabProps {
  students: User[];
  courses: Course[];
}

export default function InstructorCalendarTab({
  students = [],
  courses = []
}: InstructorCalendarTabProps) {
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

  // Interactive Live Stream / GMeet Creator
  const [selectedMeetingCourse, setSelectedMeetingCourse] = useState('eng-legal-angola');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('2026-06-15');
  const [meetingTime, setMeetingTime] = useState('18:30');
  const [meetingDuration, setMeetingDuration] = useState('2 horas');

  // Pre-populated active events lists
  const [eventsList, setEventsList] = useState([
    { id: 1, title: 'Drafting Workshop I - Contratos internacionais', date: '2026-06-12', time: '18:30', type: 'Prática' },
    { id: 2, title: 'Exame Intermédio: Common Law Enfoque de Luanda', date: '2026-06-18', time: '14:00', type: 'Avaliação' },
    { id: 3, title: 'Sessão Conversacional Síncrona (Esmeralda B.S)', date: '2026-06-25', time: '19:00', type: 'Ao Vivo' }
  ]);

  const [liveSessions, setLiveSessions] = useState([
    {
      id: 'gmeet-1',
      title: 'Discussão de Jurisprudência Recente no Setor de Minas em Angola',
      courseName: 'English for the Legal Field',
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      date: '2026-06-14',
      time: '18:30',
      participantsCount: 24,
      attendanceTaken: true
    },
    {
      id: 'gmeet-2',
      title: 'Simulação Prática de Arbitragem de Propriedades Intelectuais',
      courseName: 'Advanced Legal Writing',
      meetUrl: 'https://meet.google.com/xyz-uvwx-yza',
      date: '2026-06-21',
      time: '09:00',
      participantsCount: 12,
      attendanceTaken: false
    }
  ]);

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;

    // Generate random mock code for Meet link
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const randomCode = `${Array.from({length: 3}, () => alphabet[Math.floor(Math.random() * 26)]).join('')}-${Array.from({length: 4}, () => alphabet[Math.floor(Math.random() * 26)]).join('')}-${Array.from({length: 3}, () => alphabet[Math.floor(Math.random() * 26)]).join('')}`;
    const generatedUrl = `https://meet.google.com/${randomCode}`;

    const newMeeting = {
      id: `gmeet-${Date.now()}`,
      title: meetingTitle,
      courseName: courses.find(c => c.id === selectedMeetingCourse)?.title || 'Especialização Integrada',
      meetUrl: generatedUrl,
      date: meetingDate,
      time: meetingTime,
      participantsCount: selectedMeetingCourse === 'eng-legal-angola' ? 24 : 12,
      attendanceTaken: false
    };

    setLiveSessions([newMeeting, ...liveSessions]);
    
    // Also append as calendar event automatically
    const newCalEvent = {
      id: Date.now(),
      title: `Live Meet: ${meetingTitle}`,
      date: meetingDate,
      time: meetingTime,
      type: 'Ao Vivo'
    };
    setEventsList([...eventsList, newCalEvent]);

    alert(`Link do Google Meet gerado com êxito! Sincronizado com o Google Calendar da turma.\nLINK: ${generatedUrl}`);
    setMeetingTitle('');
  };

  const handleDeleteSession = (id: string) => {
    setLiveSessions(prev => prev.filter(s => s.id !== id));
    alert('Sessão ao vivo cancelada e excluída de toda a ementa.');
  };

  const handleRecordAttendance = (title: string) => {
    alert(`Registo de Presença concluído para a sessão "${title}"! Todos os 24 auscultados foram pontuados com 100% de atividade síncrona.`);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Link copiado para a Área de Transferência!');
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* View Selector top navigation header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[9px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">Canais Síncronos</span>
          <h3 className="text-lg font-serif font-black text-[#0A2E5D] m-0">Aulas ao Vivo (Google Meet) & Calendário</h3>
          <p className="text-xs text-gray-400 mt-1">Gere reuniões exclusivas com verificação de presença integrada no LMS.</p>
        </div>

        <div className="flex gap-2">
          {['month', 'week', 'day'].map((view) => (
            <button
              key={view}
              onClick={() => setCalendarView(view as any)}
              className={`px-3 py-1.5 rounded-lg border text-3xs font-mono font-bold uppercase cursor-pointer ${
                calendarView === view ? 'bg-[#0A2E5D] text-white' : 'text-gray-500 bg-transparent hover:bg-gray-50 hover:text-slate-900'
              }`}
            >
              {view === 'month' ? 'Mensal' : view === 'week' ? 'Semanal' : 'Diário'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: LIVE STREAM MEETING GENERATOR */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border border-[#C89B3C]/20 text-left space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C89B3C]/5 rounded-bl-full pointer-events-none" />
            
            <div className="border-b border-gray-100 pb-3">
              <span className="text-[9px] font-mono text-[#C89B3C] font-black tracking-widest block uppercase">CRIAÇÃO RÁPIDA DE SALAS DE TRANSCRIÇÃO</span>
              <h4 className="font-serif font-black text-[#0A2E5D] text-sm leading-snug mt-1">Lançar Aula no Google Meet & Sincronizar Calendários</h4>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-[8.5px] font-mono font-bold uppercase text-gray-400 tracking-wider mb-1.5">Ementa Temática da Aula Síncrona</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Módulo III - Elaboração de Cláusulas Boilerplate em Projetos do Gás"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C89B3C] text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                
                <div className="col-span-2">
                  <label className="block text-[8.5px] font-mono font-bold uppercase text-gray-400 tracking-wider mb-1.5">Curso Vinculado</label>
                  <select
                    value={selectedMeetingCourse}
                    onChange={(e) => setSelectedMeetingCourse(e.target.value)}
                    className="w-full p-2.5 text-2xs bg-gray-50 border border-gray-200 rounded-xl text-slate-800"
                  >
                    <option value="eng-legal-angola">English for the Legal Field (Default)</option>
                    {courses.filter(c => c.id !== 'eng-legal-angola').map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[8.5px] font-mono font-bold uppercase text-gray-400 tracking-wider mb-1.5 font-sans">Data Prevista</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-center text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[8.5px] font-mono font-bold uppercase text-gray-400 tracking-wider mb-1.5">Hora (UTC+1)</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-center text-slate-800"
                  />
                </div>

              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0A2E5D] hover:bg-[#C89B3C] hover:text-slate-900 border-0 text-white font-mono text-3xs font-black uppercase rounded-xl tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Video size={14} />
                <span>AGENDAR REUNIÃO E NOTIFICAR TURMAS</span>
              </button>
            </form>

          </div>

          {/* List of active planned live sessions */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest font-black block text-left">Próximas Transmissões Síncronas Ativas</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {liveSessions.map((session) => (
                <div key={session.id} className="bg-white p-5 rounded-3xl border border-gray-150 relative overflow-hidden hover:shadow transition-all space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start text-[8px] font-mono font-extrabold text-[#C89B3C]">
                      <span className="uppercase">{session.courseName}</span>
                      <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded">● AGENDADO GMEET</span>
                    </div>

                    <h5 className="font-serif font-black text-[#0A2E5D] text-xs leading-tight mt-1.5 m-0">
                      {session.title}
                    </h5>

                    <div className="flex gap-4 text-3xs text-gray-400 font-mono mt-3">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {session.date} • {session.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {session.participantsCount} Juristas
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3.5 space-y-2">
                    {/* Share & Copy Row */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={session.meetUrl}
                        className="flex-grow p-1.5 text-4xs font-mono bg-gray-50 border border-gray-150 rounded text-slate-500 text-center"
                      />
                      <button
                        onClick={() => handleCopyLink(session.meetUrl)}
                        className="p-1 text-slate-500 hover:text-[#C89B3C] border-0 bg-transparent cursor-pointer"
                        title="Copiar Link de Convite"
                      >
                        <Copy size={13} />
                      </button>
                    </div>

                    {/* Presencas controller */}
                    <div className="flex justify-between items-center pt-1.5">
                      <button
                        onClick={() => handleRecordAttendance(session.title)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-emerald-600 hover:text-white border-0 text-slate-700 text-3xs font-mono font-bold uppercase rounded-lg cursor-pointer transition-colors"
                      >
                        {session.attendanceTaken ? 'Presença Confirmada✓' : 'Abrir Registro Presença'}
                      </button>

                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-1.5 text-gray-350 hover:text-red-500 transition-all border-0 bg-transparent cursor-pointer"
                        title="Cancelar Sessão"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CALENDAR VISUAL VIEW GRID */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-gray-150 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2">
              <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Calendário Académico</span>
              <h4 className="text-sm font-serif font-black text-[#0A2E5D] m-0 leading-tight">Mês Coerente (Junho 2026)</h4>
            </div>

            {/* Custom Monthly Render Grid Mock */}
            <div className="grid grid-cols-7 gap-1 text-center text-4xs font-mono mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, dIdx) => (
                <div key={dIdx} className="font-extrabold text-[#0A2E5D] text-[9px] uppercase pb-1">{day}</div>
              ))}
              {Array.from({ length: 4 }).map((_, emptyIdx) => (
                <div key={`empty-${emptyIdx}`} className="p-2 text-gray-300"></div>
              ))}
              {Array.from({ length: 30 }).map((_, dayIdx) => {
                const dayNum = dayIdx + 1;
                const matchesEvent = eventsList.some(e => e.date === `2026-06-${dayNum < 10 ? '0' + dayNum : dayNum}`);
                return (
                  <div 
                    key={dayNum} 
                    className={`p-2.5 rounded-lg text-2xs flex flex-col items-center justify-center relative cursor-help select-none ${
                      matchesEvent 
                        ? 'bg-[#C89B3C]/10 text-[#C89B3C] font-black border border-[#C89B3C]/30' 
                        : 'hover:bg-gray-50 text-slate-700'
                    }`}
                    title={matchesEvent ? eventsList.find(e => e.date === `2026-06-${dayNum < 10 ? '0' + dayNum : dayNum}`)?.title : `Sem compromisso no dia ${dayNum}`}
                  >
                    <span>{dayNum}</span>
                    {matchesEvent && <span className="w-1 h-1 bg-[#C89B3C] rounded-full absolute bottom-1"></span>}
                  </div>
                );
              })}
            </div>

            {/* Listed events of the month */}
            <div className="space-y-2 max-h-52 overflow-y-auto pt-2.5 border-t border-gray-150">
              <span className="text-[8px] font-mono font-bold text-gray-450 uppercase block">Lista Metas Cronológicas</span>
              
              {eventsList.map((evt) => (
                <div key={evt.id} className="p-2.5 bg-gray-50/60 rounded-xl border border-gray-150 flex justify-between items-center text-left">
                  <div>
                    <h6 className="font-serif font-black text-slate-700 text-[10px] m-0 leading-tight">{evt.title}</h6>
                    <span className="text-[8px] font-mono text-gray-400 block mt-0.5">{evt.date} • {evt.time}</span>
                  </div>
                  <span className="text-[7.5px] font-mono uppercase bg-amber-50 text-[#C89B3C] px-1.5 py-0.5 rounded font-black tracking-wider">
                    {evt.type}
                  </span>
                </div>
              ))}
            </div>

          </div>

          <div className="bg-[#0A2E5D]/5 p-3 rounded-2xl border border-[#0A2E5D]/10 text-left mt-4">
            <span className="text-[8px] font-mono text-[#0A2E5D] font-bold block uppercase mb-1">GOOGLE SYNC ACTIVE</span>
            <p className="text-4xs text-gray-500 leading-normal m-0 leading-relaxed">
              Quaisquer alterações registadas serão replicadas e espelhadas para contas Microsoft Exchange ligadas de outros diretores e secretários de Luanda e Huambo.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
