import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Video, 
  Clock, 
  Users, 
  ExternalLink, 
  PlusCircle, 
  Trash2, 
  Copy,
  Loader2,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';
import { User, Course } from '../../types';
import { academicService } from '../../services/supabase/academicService';

interface InstructorCalendarTabProps {
  students: User[];
  courses: Course[];
}

export default function InstructorCalendarTab({
  students = [],
  courses = []
}: InstructorCalendarTabProps) {
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

  // Database lesson and student agendamento state
  const [selectedMeetingCourse, setSelectedMeetingCourse] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [dbLessons, setDbLessons] = useState<any[]>([]);
  const [scheduledLessons, setScheduledLessons] = useState<any[]>([]);
  
  const [meetingDate, setMeetingDate] = useState('2026-06-15');
  const [meetingTime, setMeetingTime] = useState('18:30');
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  // Fallback initial list if no database schedules exist yet
  const [eventsList, setEventsList] = useState([
    { id: 'ev-1', title: 'Drafting Workshop I - Contratos internacionais', date: '2026-06-12', time: '18:30', type: 'Prática' },
    { id: 'ev-2', title: 'Exame Intermédio: Common Law Enfoque de Luanda', date: '2026-06-18', time: '14:00', type: 'Avaliação' },
    { id: 'ev-3', title: 'Sessão Conversacional Síncrona (Esmeralda B.S)', date: '2026-06-25', time: '19:00', type: 'Ao Vivo' }
  ]);

  // Set initial selected course and student
  useEffect(() => {
    if (courses && courses.length > 0) {
      setSelectedMeetingCourse(courses[0].id || '');
    }
  }, [courses]);

  useEffect(() => {
    if (students && students.length > 0) {
      const onlyAlunos = students.filter(s => s.role === 'STUDENT');
      const targetList = onlyAlunos.length > 0 ? onlyAlunos : students;
      setSelectedStudent(targetList[0].id || '');
    }
  }, [students]);

  // Load lessons for chosen course
  useEffect(() => {
    const loadLessonsForCourse = async () => {
      if (!selectedMeetingCourse) return;
      setLoadingLessons(true);
      try {
        const data = await academicService.getLessons(selectedMeetingCourse);
        setDbLessons(data || []);
        if (data && data.length > 0) {
          setSelectedLesson(data[0].id);
        } else {
          setSelectedLesson('fallback_lesson_1');
        }
      } catch (err) {
        console.error('Error fetching lessons:', err);
      } finally {
        setLoadingLessons(false);
      }
    };
    loadLessonsForCourse();
  }, [selectedMeetingCourse]);

  // Load all scheduled lessons (targets)
  const loadAllScheduled = async () => {
    try {
      const data = await academicService.getScheduledLessonsForProfessor();
      setScheduledLessons(data || []);
    } catch (err) {
      console.error('Error loading scheduled lessons:', err);
    }
  };

  useEffect(() => {
    loadAllScheduled();
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeetingCourse || !selectedStudent || !selectedLesson) {
      alert('Por favor, preencha todos os campos para efetuar o agendamento.');
      return;
    }

    setScheduling(true);
    const scheduledAtStr = `${meetingDate}T${meetingTime}:00`;

    try {
      // Save schedule to database via academicService
      await academicService.scheduleLesson(
        selectedLesson,
        selectedStudent,
        selectedMeetingCourse,
        scheduledAtStr
      );

      // Refresh list
      await loadAllScheduled();
      
      alert('Aula síncrona agendada e guardada no Supabase com sucesso! O aluno será notificado em tempo real.');
    } catch (err) {
      console.error('Error scheduling lesson:', err);
      alert('Ocorreu um erro ao guardar o agendamento no Supabase.');
    } finally {
      setScheduling(false);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Link copiado para a Área de Transferência!');
  };

  // Filter students with role 'STUDENT' for select dropdown
  const studentDropdownList = students.filter(s => s.role === 'STUDENT').length > 0
    ? students.filter(s => s.role === 'STUDENT')
    : students;

  // Compile combined events array for the calendar grid mapping
  const combinedEvents = [
    ...eventsList,
    ...scheduledLessons.map((sl, index) => {
      const title = sl.lesson?.titulo || sl.lesson?.title || 'Aula Síncrona';
      const sUser = sl.student;
      const studentName = sUser ? `${sUser.firstName || ''} ${sUser.lastName || ''}`.trim() || sUser.email : 'Aluno';
      return {
        id: sl.id || `sl-${index}`,
        title: `${title} (${studentName})`,
        date: sl.lesson?.scheduled_at?.split('T')[0] || '2026-06-15',
        time: sl.lesson?.scheduled_at?.split('T')[1]?.substring(0, 5) || '18:30',
        type: 'Síncrona'
      };
    })
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in">
      
      {/* View Selector top navigation header */}
      <div className="bg-cream-100 p-5 rounded-3xl border border-gray-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block mb-1">Canais Síncronos</span>
          <h3 className="text-lg font-serif font-black text-ink-900 m-0">Aulas ao Vivo & Agendamento Real</h3>
          <p className="text-xs text-neutral-400 mt-1">Gere reuniões exclusivas agendando aulas no Supabase em tempo real.</p>
        </div>

        <div className="flex gap-2">
          {['month', 'week', 'day'].map((view) => (
            <button
              key={view}
              onClick={() => setCalendarView(view as any)}
              className={`px-3 py-1.5 rounded-lg border text-3xs font-mono font-bold uppercase cursor-pointer ${
                calendarView === view ? 'bg-ink-900 text-cream-100' : 'text-neutral-400 bg-transparent hover:bg-cream-200 hover:text-slate-900'
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
          
          <div className="bg-cream-100 p-6 rounded-3xl border border-gold-600/20 text-left space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-600/5 rounded-bl-full pointer-events-none" />
            
            <div className="border-b border-gray-100 pb-3">
              <span className="text-[9px] font-mono text-gold-600 font-black tracking-widest block uppercase">CRIAÇÃO DE SESSÕES DINÂMICAS</span>
              <h4 className="font-serif font-black text-ink-900 text-sm leading-snug mt-1">Agendar Aula Síncrona para Aluno Alvo</h4>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Course Selection */}
                <div>
                  <label className="block text-[8.5px] font-mono font-bold uppercase text-neutral-400 tracking-wider mb-1.5">1. Selecionar Curso</label>
                  <select
                    value={selectedMeetingCourse}
                    onChange={(e) => setSelectedMeetingCourse(e.target.value)}
                    className="w-full p-2.5 text-xs bg-cream-200 border border-gray-200 rounded-xl focus:outline-none focus:border-gold-600 text-slate-850"
                  >
                    <option value="">-- Selecione o Curso --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {/* Student Selection */}
                <div>
                  <label className="block text-[8.5px] font-mono font-bold uppercase text-neutral-400 tracking-wider mb-1.5">2. Selecionar Aluno</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full p-2.5 text-xs bg-cream-200 border border-gray-200 rounded-xl focus:outline-none focus:border-gold-600 text-slate-850"
                  >
                    <option value="">-- Selecione o Aluno --</option>
                    {studentDropdownList.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Lesson Selection */}
                <div className="md:col-span-1">
                  <label className="block text-[8.5px] font-mono font-bold uppercase text-neutral-400 tracking-wider mb-1.5">3. Selecionar Lição</label>
                  {loadingLessons ? (
                    <div className="p-2.5 bg-cream-200 border border-gray-200 rounded-xl flex items-center justify-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                      <span className="text-3xs text-neutral-400">A obter lições...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedLesson}
                      onChange={(e) => setSelectedLesson(e.target.value)}
                      className="w-full p-2.5 text-xs bg-cream-200 border border-gray-200 rounded-xl focus:outline-none focus:border-gold-600 text-slate-850"
                    >
                      {dbLessons.length === 0 ? (
                        <>
                          <option value="fallback_lesson_1">Aula 1 - Introdução Geral</option>
                          <option value="fallback_lesson_2">Aula 2 - Redação Avançada</option>
                          <option value="fallback_lesson_3">Aula 3 - Drafting Comercial</option>
                        </>
                      ) : (
                        dbLessons.map(l => (
                          <option key={l.id} value={l.id}>{l.titulo || l.title}</option>
                        ))
                      )}
                    </select>
                  )}
                </div>

                {/* Meeting Date */}
                <div>
                  <label className="block text-[8.5px] font-mono font-bold uppercase text-neutral-400 tracking-wider mb-1.5">4. Data Agendada</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full p-2.5 text-xs bg-cream-200 border border-gray-200 rounded-xl focus:outline-none focus:border-gold-600 text-slate-800"
                  />
                </div>

                {/* Meeting Time */}
                <div>
                  <label className="block text-[8.5px] font-mono font-bold uppercase text-neutral-400 tracking-wider mb-1.5">5. Hora Prevista</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full p-2.5 text-xs bg-cream-200 border border-gray-200 rounded-xl focus:outline-none focus:border-gold-600 text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={scheduling || loadingLessons}
                className="w-full py-3 bg-ink-900 hover:bg-gold-600 hover:text-slate-900 border-0 text-cream-100 font-mono text-3xs font-black uppercase rounded-xl tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {scheduling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>A SALVAR NO SUPABASE...</span>
                  </>
                ) : (
                  <>
                    <CalendarCheck size={14} />
                    <span>PUBLICAR AGENDAMENTO DE AULA</span>
                  </>
                )}
              </button>
            </form>

          </div>

          {/* List of active planned live sessions */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-black block text-left">
              Próximas Transmissões Síncronas do Supabase
            </span>
            
            {scheduledLessons.length === 0 ? (
              <div className="bg-cream-100 p-6 rounded-3xl border border-gray-150 text-center py-8">
                <p className="text-xs text-neutral-400 m-0">Nenhuma aula síncrona agendada no momento. Utilize o formulário acima para criar novos agendamentos reais.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {scheduledLessons.map((session, index) => {
                  const courseName = session.lesson?.course?.title || 'English for the Legal Field';
                  const title = session.lesson?.titulo || session.lesson?.title || 'Aula Síncrona';
                  const dateVal = session.lesson?.scheduled_at?.split('T')[0] || '2026-06-15';
                  const timeVal = session.lesson?.scheduled_at?.split('T')[1]?.substring(0, 5) || '18:30';
                  const sUser = session.student;
                  const studentName = sUser ? `${sUser.firstName || ''} ${sUser.lastName || ''}`.trim() || sUser.email : 'Aluno';
                  const meetUrl = 'https://meet.google.com/lookup/mock-multiplus';

                  return (
                    <div key={session.id || index} className="bg-cream-100 p-5 rounded-3xl border border-gray-150 relative overflow-hidden hover:shadow transition-all space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start text-[8px] font-mono font-extrabold text-gold-600">
                          <span className="uppercase truncate max-w-[150px]">{courseName}</span>
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded uppercase">● Agendamento Ativo</span>
                        </div>

                        <h5 className="font-serif font-black text-ink-900 text-xs leading-tight mt-1.5 m-0">
                          {title}
                        </h5>

                        <p className="text-[9px] text-neutral-400 font-mono mt-1 m-0">
                          Aluno Alvo: <strong className="text-neutral-400">{studentName}</strong>
                        </p>

                        <div className="flex gap-4 text-3xs text-neutral-400 font-mono mt-3">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {dateVal} • {timeVal}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={11} />
                            Tutoria 1:1
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-3.5 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={meetUrl}
                            className="flex-grow p-1.5 text-4xs font-mono bg-cream-200 border border-gray-150 rounded text-slate-500 text-center"
                          />
                          <button
                            onClick={() => handleCopyLink(meetUrl)}
                            className="p-1 text-slate-500 hover:text-gold-600 border-0 bg-transparent cursor-pointer"
                            title="Copiar Link de Convite"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: CALENDAR VISUAL VIEW GRID */}
        <div className="lg:col-span-4 bg-cream-100 p-5 rounded-3xl border border-gray-150 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2">
              <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">Calendário Académico</span>
              <h4 className="text-sm font-serif font-black text-ink-900 m-0 leading-tight">Mês Coerente (Junho 2026)</h4>
            </div>

            {/* Custom Monthly Render Grid Map */}
            <div className="grid grid-cols-7 gap-1 text-center text-4xs font-mono mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, dIdx) => (
                <div key={dIdx} className="font-extrabold text-ink-900 text-[9px] uppercase pb-1">{day}</div>
              ))}
              {Array.from({ length: 4 }).map((_, emptyIdx) => (
                <div key={`empty-${emptyIdx}`} className="p-2 text-gray-300"></div>
              ))}
              {Array.from({ length: 30 }).map((_, dayIdx) => {
                const dayNum = dayIdx + 1;
                const formattedDate = `2026-06-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                const matchesEvent = combinedEvents.some(e => e.date === formattedDate);
                return (
                  <div 
                    key={dayNum} 
                    className={`p-2.5 rounded-lg text-2xs flex flex-col items-center justify-center relative cursor-help select-none ${
                      matchesEvent 
                        ? 'bg-gold-600/10 text-gold-600 font-black border border-gold-600/30' 
                        : 'hover:bg-cream-200 text-slate-700'
                    }`}
                    title={matchesEvent ? combinedEvents.find(e => e.date === formattedDate)?.title : `Sem compromisso no dia ${dayNum}`}
                  >
                    <span>{dayNum}</span>
                    {matchesEvent && <span className="w-1 h-1 bg-gold-600 rounded-full absolute bottom-1"></span>}
                  </div>
                );
              })}
            </div>

            {/* Listed events of the month */}
            <div className="space-y-2 max-h-52 overflow-y-auto pt-2.5 border-t border-gray-150">
              <span className="text-[8px] font-mono font-bold text-gray-450 uppercase block">Lista Metas Cronológicas</span>
              
              {combinedEvents.map((evt, idx) => (
                <div key={evt.id || idx} className="p-2.5 bg-cream-200/60 rounded-xl border border-gray-150 flex justify-between items-center text-left">
                  <div className="flex-1 min-w-0 pr-2">
                    <h6 className="font-serif font-black text-slate-700 text-[10px] m-0 leading-tight truncate">{evt.title}</h6>
                    <span className="text-[8px] font-mono text-neutral-400 block mt-0.5">{evt.date} • {evt.time}</span>
                  </div>
                  <span className="text-[7.5px] font-mono uppercase bg-amber-50 text-gold-600 px-1.5 py-0.5 rounded font-black tracking-wider shrink-0">
                    {evt.type}
                  </span>
                </div>
              ))}
            </div>

          </div>

          <div className="bg-ink-900/5 p-3 rounded-2xl border border-ink-900/10 text-left mt-4">
            <span className="text-[8px] font-mono text-ink-900 font-bold block uppercase mb-1">GOOGLE SYNC ACTIVE</span>
            <p className="text-4xs text-neutral-400 leading-normal m-0 leading-relaxed">
              Quaisquer alterações registadas serão replicadas e espelhadas para contas Microsoft Exchange ligadas de outros diretores e secretários de Luanda e Huambo.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
