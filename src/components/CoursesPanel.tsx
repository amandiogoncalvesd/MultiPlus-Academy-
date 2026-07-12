import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase/client';
import { Course, PageId } from '../types';
import { COURSES_LIST } from '../data';
import StarBorder from './ui/StarBorder';
import { 
  Search, 
  Clock, 
  Calendar, 
  X, 
  SearchX, 
  CheckCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface CoursesPanelProps {
  setCurrentPage: (page: PageId) => void;
  onOpenSignUp: () => void;
}

export default function CoursesPanel({ setCurrentPage, onOpenSignUp }: CoursesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [activeCourseDetails, setActiveCourseDetails] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('status', 'PUBLISHED');
        
        if (error) throw error;
        if (data && data.length > 0) {
          const mapped: Course[] = data.map((d: any) => ({
            id: d.id,
            slug: d.slug || d.id,
            title: d.title || d.titulo,
            subtitle: d.description || d.descricao || '',
            summary: d.description || d.descricao || '',
            duration: d.duration || d.duracao || '12 Semanas',
            hours: '72 Horas',
            language: 'Inglês / Português',
            modality: d.category === 'Online' ? 'Online' : 'Híbrido',
            schedule: 'Terças e Quintas, 18h30',
            startDate: 'Em breve',
            targetAudience: [
              'Advogados e Juristas Associados',
              'Magistrados Judiciais',
              'Consultores Jurídicos e de Compliance'
            ],
            modules: [
              {
                number: 'MÊS I',
                title: 'Terminologia Fundamental',
                topics: ['Fundamentos de Common Law vs Civil Law', 'A redação e oratória jurídica técnica']
              },
              {
                number: 'MÊS II',
                title: 'Prática de Drafting',
                topics: ['Redação de Cláusulas Contratuais de elite', 'Resolução de disputas internacionais']
              }
            ]
          }));
          setCourses(mapped);
        } else {
          // Fallback to high quality mock data in source
          setCourses(COURSES_LIST);
        }
      } catch (err) {
        console.error('Error fetching courses in catalog:', err);
        setCourses(COURSES_LIST);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  // Filter implementation
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesModality = 
      selectedModality === 'all' || 
      course.modality.toLowerCase() === selectedModality.toLowerCase();

    return matchesSearch && matchesModality;
  });

  return (
    <div id="courses-panel-root" className="bg-white text-slate-800 pt-24 pb-16">
      
      {/* Banner design */}
      <section className="py-16 bg-slate-50 text-slate-900 overflow-hidden relative border-b border-slate-200">
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#C89B3C_1px,transparent_1px)] bg-[size:30px_30px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C89B3C]">Catálogo Académico</span>
          <h1 className="text-4xl font-serif font-black tracking-tight text-slate-900 m-0">Formações Especializadas de Alta Carreira</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Consulte a nossa trilha curricular desenhada para cobrir as exigências legislativas, aduaneiras e corporativas do mercado soberano de Angola.
          </p>
        </div>
      </section>

      {/* Filter and Search Bar Section */}
      <section className="py-8 bg-white border-b border-slate-200/60 sticky top-[80px] z-40 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por termos, contratos ou áreas..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#C89B3C] focus:bg-white transition-colors text-slate-900 placeholder-slate-400 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-slate-100 p-1 rounded text-slate-400 hover:text-slate-600"
                  aria-label="Limpar pesquisa"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Modality Filter Pills */}
            <div className="flex items-center gap-2 self-stretch md:self-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              <span className="text-xs text-slate-400 font-mono uppercase tracking-wider mr-2 whitespace-nowrap">Opções de Formato:</span>
              
              <button
                onClick={() => setSelectedModality('all')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all uppercase whitespace-nowrap ${
                  selectedModality === 'all'
                    ? 'bg-[#0A2E5D] text-white border border-[#0A2E5D] shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                Todos ({courses.length})
              </button>

              <button
                onClick={() => setSelectedModality('híbrido')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all uppercase whitespace-nowrap ${
                  selectedModality === 'híbrido'
                    ? 'bg-[#0A2E5D] text-white border border-[#0A2E5D] shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                Híbrido
              </button>

              <button
                onClick={() => setSelectedModality('online')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all uppercase whitespace-nowrap ${
                  selectedModality === 'online'
                    ? 'bg-[#0A2E5D] text-white border border-[#0A2E5D] shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                Online
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Grid of Course Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <AnimatePresence mode="popLayout">
            {filteredCourses.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredCourses.map((course) => (
                  <motion.div
                    layout
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4 }}
                    className="h-full"
                  >
                    <StarBorder
                      as="div"
                      color="#C89B3C"
                      speed="8s"
                      thickness={1.5}
                      className="w-full h-full rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col justify-between"
                      innerClassName="relative z-1 flex flex-col justify-between bg-white h-full rounded-2xl w-full border border-slate-100"
                    >
                      
                      {/* Visual header */}
                      <div className="bg-slate-50/80 border-b border-slate-100 p-6 text-slate-900 relative w-full">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#C89B3C]/5 to-transparent rounded-full pointer-events-none" />
                        
                        <div className="flex justify-between items-center mb-4">
                          <span className="bg-white text-[#C89B3C] text-[9px] font-mono tracking-widest font-extrabold px-2.5 py-1 rounded-md uppercase border border-slate-200 shadow-xs">
                            {course.modality}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">{course.duration}</span>
                        </div>

                        <h3 className="text-xl font-serif font-bold text-slate-900 leading-snug hover:text-[#C89B3C] transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-[11px] text-[#C89B3C] font-semibold mt-1.5 tracking-wide font-sans">{course.subtitle}</p>
                      </div>

                      {/* Summary prose */}
                      <div className="p-6 flex-1 space-y-4 w-full bg-white text-left">
                        <p className="text-xs text-slate-500 leading-relaxed font-sans line-clamp-3 m-0">
                          {course.summary}
                        </p>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-[#C89B3C]" />
                            <span className="font-medium">{course.hours}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-[#C89B3C]" />
                            <span className="font-medium">{course.startDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Operational Block Button */}
                      <div className="p-6 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-3 w-full">
                        <button
                          onClick={() => setActiveCourseDetails(course)}
                          className="py-2.5 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-wider text-center transition-colors cursor-pointer shadow-xs"
                        >
                          Ver Detalhes
                        </button>

                        <button
                          onClick={onOpenSignUp}
                          className="py-2.5 bg-[#0A2E5D] hover:bg-[#123C73] text-white rounded-lg text-xs font-bold uppercase tracking-wider text-center transition-colors cursor-pointer shadow-xs"
                        >
                          Inscrever-se
                        </button>
                      </div>

                    </StarBorder>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24 max-w-md mx-auto space-y-4"
              >
                <div className="w-16 h-16 bg-slate-50 text-slate-400 border border-slate-200 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <SearchX size={24} />
                </div>
                <h4 className="text-lg font-serif font-bold text-slate-700">Nenhum curso correspondente</h4>
                <p className="text-xs text-slate-500">
                  Tente alterar os termos da sua pesquisa ou selecione outra modalidade técnica de formato de curso.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedModality('all'); }}
                  className="px-4 py-2 bg-[#0A2E5D] hover:bg-[#123C73] text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider shadow-sm"
                >
                  Limpar Todos os Filtros
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>

      {/* CURRICULUM DISCLOSURE MODAL PANEL */}
      <AnimatePresence>
        {activeCourseDetails && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            
            {/* Dark glass backdrop layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCourseDetails(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ cubicBezier: [0.16, 1, 0.3, 1], duration: 0.4 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]"
            >
              {/* Premium golden visual bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#C89B3C]" />

              {/* Modal Banner */}
              <div className="bg-slate-50 text-slate-900 p-6 sm:p-8 relative pt-10 border-b border-slate-100 text-left">
                <button
                  onClick={() => setActiveCourseDetails(null)}
                  className="absolute right-6 top-8 p-2 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all focus:outline-none"
                  aria-label="Retroceder"
                >
                  <X size={16} />
                </button>
                
                <span className="px-3 py-1 rounded-lg bg-white text-[#C89B3C] text-[9px] font-mono tracking-widest font-black uppercase border border-slate-200 shadow-xs">
                  {activeCourseDetails.modality}
                </span>

                <h3 className="text-xl sm:text-2xl font-serif font-bold mt-4 pr-10 text-slate-900 leading-tight">
                  {activeCourseDetails.title}
                </h3>
                <p className="text-xs text-[#C89B3C] font-semibold mt-1.5 font-mono">{activeCourseDetails.subtitle}</p>
              </div>

              {/* Scrollable description box */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-thin text-left">
                
                {/* General facts row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-200">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 shadow-xs">
                    <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">Duração</span>
                    <span className="text-xs font-bold text-slate-900">{activeCourseDetails.duration}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 shadow-xs">
                    <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">Carga Horária</span>
                    <span className="text-xs font-bold text-slate-900">{activeCourseDetails.hours}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 shadow-xs">
                    <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">Idioma Oficial</span>
                    <span className="text-xs font-bold text-slate-900">{activeCourseDetails.language}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 shadow-xs">
                    <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">Início letivo</span>
                    <span className="text-xs font-bold text-slate-900">{activeCourseDetails.startDate}</span>
                  </div>
                </div>

                {/* Scope descriptive body */}
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="block font-serif font-bold text-slate-900 text-base mb-1">Enquadramento Científico</span>
                  <p className="text-slate-600 font-medium leading-relaxed m-0">{activeCourseDetails.summary}</p>
                </div>

                {/* Target Audience Bullet Point list */}
                {activeCourseDetails.targetAudience && activeCourseDetails.targetAudience.length > 0 && (
                  <div className="space-y-3">
                    <span className="block font-mono font-bold uppercase text-[9px] tracking-widest text-[#C89B3C]">Grupo De Candidaturas Elegíveis</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {activeCourseDetails.targetAudience.map((aud, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-slate-700 bg-white p-3 rounded-xl border border-slate-200 shadow-xs hover:border-[#C89B3C]/30 transition-all">
                          <CheckCircle size={15} className="text-[#C89B3C] flex-shrink-0" />
                          <span className="font-semibold text-slate-700">{aud}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modules Schedule outline */}
                {activeCourseDetails.modules && activeCourseDetails.modules.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <span className="block font-serif font-bold text-slate-900 text-base">Trilha de Temas por Unidade</span>
                    
                    <div className="space-y-4">
                      {activeCourseDetails.modules.map((mod, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs hover:border-[#C89B3C]/30 transition-all group">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-bold text-slate-800 border border-slate-200 group-hover:bg-[#0A2E5D] group-hover:text-white group-hover:border-[#0A2E5D] transition-all">
                              {mod.number}
                            </span>
                            <h4 className="text-sm font-serif font-bold text-slate-900 m-0">{mod.title}</h4>
                          </div>
                          <ul className="grid grid-cols-1 gap-2 text-xs text-slate-500 pl-4 list-disc font-medium m-0">
                            {mod.topics.map((topic, tIdx) => (
                              <li key={tIdx} className="text-slate-500 hover:text-slate-800 transition-colors">{topic}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Modal controls */}
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
                <div className="text-xs text-slate-500 self-start sm:self-center text-left">
                  <span className="block font-mono tracking-wider text-[8px] uppercase text-slate-400">Dúvidas Letivas?</span>
                  <span className="font-semibold text-slate-600">Telefone: +244 956 449 084</span>
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveCourseDetails(null)}
                    className="flex-1 sm:flex-none px-6 py-3 border border-slate-250 rounded-xl text-xs font-semibold uppercase text-slate-600 bg-white hover:bg-slate-100 transition-all font-mono active:scale-[0.98]"
                  >
                    Fechar
                  </button>

                  <button
                    onClick={() => {
                      setActiveCourseDetails(null);
                      onOpenSignUp();
                    }}
                    className="flex-1 sm:flex-none px-8 py-3 bg-[#0A2E5D] hover:bg-[#123C73] text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg active:scale-[0.98]"
                  >
                    Prosseguir Inscrição
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
