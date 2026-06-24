import { useState } from 'react';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Trash2, 
  Layers, 
  Archive, 
  Play, 
  Copy, 
  Edit2, 
  Check, 
  Plus,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Course } from '../../types';

interface InstructorCoursesTabProps {
  courses: Course[];
  onUpdateCourses: (updated: Course[]) => void;
  onNavigateToCreate: () => void;
}

export default function InstructorCoursesTab({
  courses,
  onUpdateCourses,
  onNavigateToCreate
}: InstructorCoursesTabProps) {
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Course presets mock states
  const [courseStates, setCourseStates] = useState<Record<string, 'Ativo' | 'Rascunho' | 'Arquivado'>>(() => {
    const states: Record<string, 'Ativo' | 'Rascunho' | 'Arquivado'> = {};
    courses.forEach(c => {
      states[c.id] = c.id === 'eng-legal-angola' ? 'Ativo' : 'Rascunho';
    });
    return states;
  });

  const getSutdentCount = (courseId: string) => {
    return courseId === 'eng-legal-angola' ? 24 : 0;
  };

  const handleDuplicate = (id: string) => {
    const original = courses.find(c => c.id === id);
    if (!original) return;
    const duplicated: Course = {
      ...original,
      id: `${original.id}-Cópia-${Math.floor(Math.random() * 1000)}`,
      title: `${original.title} (Cópia Dulicada)`
    };
    const updatedList = [...courses, duplicated];
    onUpdateCourses(updatedList);
    alert(`Curso "${original.title}" duplicado com sucesso!`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza de que deseja eliminar indefinidamente este curso e todas as avaliações associadas sob as normas da MultiPlus?')) {
      const filtered = courses.filter(c => c.id !== id);
      onUpdateCourses(filtered);
      alert('Curso eliminado com êxito do repositório físico do LMS.');
    }
  };

  const handleToggleState = (id: string, newState: 'Ativo' | 'Rascunho' | 'Arquivado') => {
    setCourseStates(prev => ({
      ...prev,
      [id]: newState
    }));
    alert(`Estado do curso alterado com integridade para: "${newState}"`);
  };

  const startEdit = (course: Course) => {
    setEditingCourseId(course.id);
    setEditTitle(course.title);
    setEditSubtitle(course.subtitle);
    setEditDuration(course.duration);
    setEditPrice(course.price || '€450');
  };

  const saveEdit = (id: string) => {
    const updated = courses.map(c => {
      if (c.id === id) {
        return {
          ...c,
          title: editTitle,
          subtitle: editSubtitle,
          duration: editDuration,
          price: editPrice
        };
      }
      return c;
    });
    onUpdateCourses(updated);
    setEditingCourseId(null);
    alert('Informação do currículo do curso salva com sucesso!');
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Visual Analytics Header Panel */}
      <div className="bg-white p-6 rounded-3xl border border-gray-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">
            Plano e Catálogo
          </span>
          <h3 className="text-xl font-serif font-black text-[#0A2E5D] m-0">Meus Cursos e Programas</h3>
          <p className="text-xs text-gray-400 mt-1">Inscreva juristas, defina metas letivas presenciais ou online e configure valores fiscais.</p>
        </div>

        <button
          onClick={onNavigateToCreate}
          className="px-4 py-2 bg-[#0A2E5D] hover:bg-[#C89B3C] hover:text-slate-900 border-0 text-white text-xs font-mono font-bold uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus size={14} />
          <span>Criar Novo Curso</span>
        </button>
      </div>

      {/* Courses List Grid wrapper */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => {
          const state = courseStates[course.id] || 'Rascunho';
          const isEditing = editingCourseId === course.id;

          return (
            <div 
              key={course.id} 
              className="bg-white rounded-3xl overflow-hidden border border-gray-150 flex flex-col justify-between hover:shadow-lg transition-all"
            >
              
              {/* Header Cover Preset Visual */}
              <div className="h-44 bg-[#0A2E5D] relative p-6 flex flex-col justify-between text-white select-none">
                {/* Background overlay patterns */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-[#0A2E5D]/20" />
                <div className="absolute top-4 right-4 z-10">
                  <span className={`px-2.5 py-1 text-[9px] font-mono font-extrabold uppercase rounded-full shadow-sm border ${
                    state === 'Ativo' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : state === 'Arquivado'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-400/30'
                  }`}>
                    ● {state}
                  </span>
                </div>

                <div className="relative z-10 mt-auto text-left">
                  <span className="text-[9px] font-mono text-[#C89B3C] font-bold tracking-widest uppercase block">
                    {course.modality} • {course.hours}
                  </span>
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-white/10 text-white mt-1 border-0 border-b border-white focus:outline-none focus:border-[#C89B3C] font-serif font-black text-base"
                    />
                  ) : (
                    <h4 className="text-base sm:text-lg font-serif font-black text-white m-0 leading-tight mt-1 hover:text-[#C89B3C] transition-colors">
                      {course.title}
                    </h4>
                  )}
                </div>
              </div>

              {/* Body stats & description */}
              <div className="p-6 space-y-4 text-left flex-grow">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-[8px] font-mono text-gray-400 block uppercase mb-1">Subtítulo do Curso</span>
                      <input
                        type="text"
                        value={editSubtitle}
                        onChange={(e) => setEditSubtitle(e.target.value)}
                        className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#1C1C1C]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[8px] font-mono text-gray-400 block uppercase mb-1">Duração</span>
                        <input
                          type="text"
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                          className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#1C1C1C]"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] font-mono text-gray-400 block uppercase mb-1">Preço Sugerido (USD)</span>
                        <input
                          type="text"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#1C1C1C]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-2xs sm:text-xs text-gray-500 leading-relaxed font-sans m-0">
                      {course.subtitle || 'Formação vocacional premium da MultiPlus focada nos pilares do mercado internacional.'}
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                      <div className="text-left">
                        <span className="text-[8px] font-mono text-gray-400 block uppercase">Alunos Ativos</span>
                        <span className="font-serif font-black text-xs text-[#0A2E5D] flex items-center gap-1.5 mt-0.5">
                          <Users size={12} className="text-[#C89B3C]" />
                          {getSutdentCount(course.id)} inscritos
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="text-[8px] font-mono text-gray-400 block uppercase">Duração</span>
                        <span className="font-serif font-black text-xs text-[#0A2E5D] flex items-center gap-1.5 mt-0.5">
                          <Clock size={12} className="text-[#C89B3C]" />
                          {course.duration}
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="text-[8px] font-mono text-gray-400 block uppercase">Nível Ementa</span>
                        <span className="font-serif font-black text-xs text-[#0A2E5D] block mt-0.5 uppercase">
                          • Avançado
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Rows */}
              <div className="px-6 pb-6 pt-3 border-t border-gray-50 flex items-center justify-between gap-2 overflow-x-auto">
                <div className="flex gap-1">
                  {isEditing ? (
                    <button
                      onClick={() => saveEdit(course.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer"
                    >
                      Salvar
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(course)}
                      className="p-1.5 border border-gray-200 hover:border-[#C89B3C]/50 hover:bg-[#C89B3C]/10 rounded-lg text-gray-500 hover:text-[#C89B3C] transition-all cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDuplicate(course.id)}
                    className="p-1.5 border border-gray-200 hover:bg-sky-50 rounded-lg text-gray-500 hover:text-sky-600 transition-all cursor-pointer"
                    title="Duplicar"
                  >
                    <Copy size={13} />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="p-1.5 border border-gray-200 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-all cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="flex gap-1 text-3xs font-mono">
                  <button
                    onClick={() => handleToggleState(course.id, 'Ativo')}
                    className={`px-2 py-1 rounded-lg border ${
                      state === 'Ativo' ? 'bg-[#0A2E5D] text-white' : 'bg-transparent text-gray-400 border-gray-200'
                    }`}
                  >
                    Ativo
                  </button>
                  <button
                    onClick={() => handleToggleState(course.id, 'Rascunho')}
                    className={`px-2 py-1 rounded-lg border ${
                      state === 'Rascunho' ? 'bg-[#C89B3C] text-slate-900 font-bold' : 'bg-transparent text-gray-400 border-gray-200'
                    }`}
                  >
                    Rascunho
                  </button>
                  <button
                    onClick={() => handleToggleState(course.id, 'Arquivado')}
                    className={`px-2 py-1 rounded-lg border ${
                      state === 'Arquivado' ? 'bg-gray-600 text-white' : 'bg-transparent text-gray-400 border-gray-200'
                    }`}
                  >
                    Arquivar
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
