import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COURSES_LIST } from '../data';
import { Course, PageId } from '../types';
import { 
  Search, 
  MapPin, 
  Clock, 
  Calendar, 
  Award, 
  X, 
  SearchX, 
  BookOpen, 
  GraduationCap, 
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

  // Filter implementation
  const filteredCourses = COURSES_LIST.filter((course) => {
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
    <div id="courses-panel-root" className="bg-[#F8F8F6] text-[#1C1C1C] pt-24 pb-16">
      
      {/* Banner design */}
      <section className="py-16 bg-[#0A2E5D] text-white overflow-hidden relative border-b border-[#C89B3C]/20">
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#C89B3C_1px,transparent_1px)] bg-[size:30px_30px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C89B3C]">Catálogo Académico</span>
          <h1 className="text-4xl font-serif font-black tracking-tight text-white m-0">Formações Especializadas de Alta Carreira</h1>
          <p className="text-xs sm:text-sm text-white/70 max-w-xl mx-auto leading-relaxed">
            Consulte a nossa trilha curricular desenhada para cobrir as exigências legislativas, aduaneiras e corporativas do mercado soberano de Angola.
          </p>
        </div>
      </section>

      {/* Filter and Search Bar Section */}
      <section className="py-12 bg-white border-b border-gray-100 sticky top-[80px] z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por termos, contratos ou áreas..."
                className="w-full neo-input rounded-xl pl-10 pr-4 py-3 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-gray-100 p-1 rounded text-gray-400 hover:text-gray-600"
                  aria-label="Limpar pesquisa"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Modality Filter Pills */}
            <div className="flex items-center gap-2 self-stretch md:self-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              <span className="text-xs text-gray-400 font-mono uppercase tracking-wider mr-2 whitespace-nowrap">Opções de Formato:</span>
              
              <button
                onClick={() => setSelectedModality('all')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all uppercase whitespace-nowrap ${
                  selectedModality === 'all'
                    ? 'bg-[#0A2E5D] text-white border border-[#0A2E5D] shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Todos ({COURSES_LIST.length})
              </button>

              <button
                onClick={() => setSelectedModality('híbrido')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all uppercase whitespace-nowrap ${
                  selectedModality === 'híbrido'
                    ? 'bg-[#0A2E5D] text-white border border-[#0A2E5D] shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Híbrido
              </button>

              <button
                onClick={() => setSelectedModality('online')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all uppercase whitespace-nowrap ${
                  selectedModality === 'online'
                    ? 'bg-[#0A2E5D] text-white border border-[#0A2E5D] shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Online
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Grid of Course Cards */}
      <section className="py-20">
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
                    className="neo-card rounded-2xl overflow-hidden flex flex-col justify-between bg-white group h-full relative"
                  >
                    
                    {/* Visual header */}
                    <div className="bg-[#0A2E5D] p-6 text-white relative">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#C89B3C]/10 to-transparent rounded-full" />
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="bg-white/10 text-[#C89B3C] text-[9px] font-mono tracking-widest font-bold px-2.5 py-1 rounded-md uppercase border border-white/10">
                          {course.modality}
                        </span>
                        <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">{course.duration}</span>
                      </div>

                      <h3 className="text-xl font-serif font-bold text-white leading-snug group-hover:text-[#C89B3C] transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-[11px] text-[#C89B3C] font-semibold mt-1 tracking-wide font-sans">{course.subtitle}</p>
                    </div>

                    {/* Summary prose */}
                    <div className="p-6 flex-1 space-y-4">
                      <p className="text-xs text-gray-500 leading-relaxed font-sans line-clamp-3">
                        {course.summary}
                      </p>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-mono text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-[#C89B3C]" />
                          <span>{course.hours}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-[#C89B3C]" />
                          <span>{course.startDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Block Button */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setActiveCourseDetails(course)}
                        className="py-2.5 border border-gray-250 text-[#0A2E5D] hover:bg-[#0A2E5D]/5 rounded-lg text-xs font-semibold uppercase tracking-wider text-center transition-colors"
                      >
                        Ver Detalhes
                      </button>

                      <button
                        onClick={onOpenSignUp}
                        className="py-2.5 bg-[#C89B3C] hover:bg-[#D4A747] text-white rounded-lg text-xs font-bold uppercase tracking-wider text-center transition-colors"
                      >
                        Inscrever-se
                      </button>
                    </div>

                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24 max-w-md mx-auto space-y-4"
              >
                <div className="w-16 h-16 bg-gray-100 text-gray-400 border border-gray-200 rounded-full flex items-center justify-center mx-auto">
                  <SearchX size={24} />
                </div>
                <h4 className="text-lg font-serif font-bold text-gray-600">Nenhum curso correspondente</h4>
                <p className="text-xs text-gray-400">
                  Tente alterar os termos da sua pesquisa ou selecione outra modalidade técnica de formato de curso.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedModality('all'); }}
                  className="px-4 py-2 bg-[#0A2E5D] hover:bg-[#123C73] text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider"
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
              className="absolute inset-0 bg-[#0A2E5D]/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ cubicBezier: [0.16, 1, 0.3, 1], duration: 0.4 }}
              className="relative w-full max-w-3xl bg-[#F8F8F6] rounded-3xl overflow-hidden shadow-2xl border border-[#C89B3C]/30 flex flex-col max-h-[85vh]"
            >
              
              {/* Modal Banner */}
              <div className="bg-[#0A2E5D] text-white p-6 sm:p-8 relative">
                <button
                  onClick={() => setActiveCourseDetails(null)}
                  className="absolute right-6 top-6 p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/15 transition-all"
                  aria-label="Retroceder"
                >
                  <X size={16} />
                </button>
                
                <span className="px-3 py-1 rounded bg-[#C89B3C]/10 text-[#C89B3C] text-[10px] font-mono tracking-widest font-bold uppercase border border-[#C89B3C]/20">
                  {activeCourseDetails.modality}
                </span>

                <h3 className="text-xl sm:text-2xl font-serif font-black mt-4 pr-10 text-white">
                  {activeCourseDetails.title}
                </h3>
                <p className="text-xs text-white/60 mt-1 font-mono">{activeCourseDetails.subtitle}</p>
              </div>

              {/* Scrollable description box */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                
                {/* General facts row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-gray-200">
                  <div>
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-gray-400">Duração</span>
                    <span className="text-xs font-semibold text-[#0A2E5D]">{activeCourseDetails.duration}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-gray-400">Carga Horária</span>
                    <span className="text-xs font-semibold text-[#0A2E5D]">{activeCourseDetails.hours}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-gray-400">Idioma Oficial</span>
                    <span className="text-xs font-semibold text-[#0A2E5D]">{activeCourseDetails.language}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-gray-400">Início letivo</span>
                    <span className="text-xs font-semibold text-[#0A2E5D]">{activeCourseDetails.startDate}</span>
                  </div>
                </div>

                {/* Scope descriptive body */}
                <div className="space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
                  <span className="block font-serif font-bold text-[#0A2E5D] text-base">Enquadramento Científico</span>
                  <p>{activeCourseDetails.summary}</p>
                </div>

                {/* Target Audience Bullet Point list */}
                <div className="space-y-3">
                  <span className="block font-mono font-bold uppercase text-[10px] tracking-widest text-[#C89B3C]">Grupo De Candidaturas Elegíveis</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {activeCourseDetails.targetAudience.map((aud, i) => (
                      <div key={i} className="flex items-center gap-2 text-gray-700 bg-white p-2.5 rounded-lg border border-gray-150">
                        <CheckCircle size={14} className="text-[#C89B3C] flex-shrink-0" />
                        <span>{aud}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modules Schedule outline */}
                <div className="space-y-4 pt-2">
                  <span className="block font-serif font-bold text-[#0A2E5D] text-base">Trilha de Temas por Unidade</span>
                  
                  <div className="space-y-4">
                    {activeCourseDetails.modules.map((mod, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-white border border-gray-150 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#0A2E5D]/5 text-[10px] font-mono font-bold text-[#0A2E5D] border border-[#0A2E5D]/10">
                            {mod.number}
                          </span>
                          <h4 className="text-sm font-serif font-bold text-[#0A2E5D]">{mod.title}</h4>
                        </div>
                        <ul className="grid grid-cols-1 gap-2 text-xs text-gray-500 pl-4 list-disc">
                          {mod.topics.map((topic, tIdx) => (
                            <li key={tIdx}>{topic}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Modal controls */}
              <div className="p-6 bg-white border-t border-gray-150 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="text-xs text-gray-500">
                  <span className="block font-mono tracking-wider text-[9px] uppercase">Dúvidas Letivas?</span>
                  <span className="font-semibold text-gray-600">Telefone: +244 956 449 084</span>
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveCourseDetails(null)}
                    className="flex-1 sm:flex-none px-6 py-3 border border-gray-200 rounded-xl text-xs font-semibold uppercase text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Fechar
                  </button>

                  <button
                    onClick={() => {
                      setActiveCourseDetails(null);
                      onOpenSignUp();
                    }}
                    className="flex-1 sm:flex-none px-8 py-3 bg-[#C89B3C] hover:bg-[#D4A747] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
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
