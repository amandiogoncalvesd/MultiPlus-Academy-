import { useState, useEffect } from 'react';
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
  FileText,
  ArrowLeft,
  UserPlus,
  Loader2,
  Trash
} from 'lucide-react';
import { Course } from '../../types';
import { courseService } from '../../services/supabase/courseService';
import { enrollmentService } from '../../services/supabase/enrollmentService';
import StudentSelector from './StudentSelector';

interface InstructorCoursesTabProps {
  courses: Course[];
  onUpdateCourses: (updated: Course[]) => void;
  onNavigateToCreate: () => void;
  onRefresh?: () => void;
}

export default function InstructorCoursesTab({
  courses,
  onUpdateCourses,
  onNavigateToCreate,
  onRefresh
}: InstructorCoursesTabProps) {
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Course student management states
  const [activeCourseForStudents, setActiveCourseForStudents] = useState<Course | null>(null);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});

  // Fetch real student counts for all courses
  useEffect(() => {
    loadAllStudentCounts();
  }, [courses]);

  const loadAllStudentCounts = async () => {
    const counts: Record<string, number> = {};
    for (const course of courses) {
      try {
        const list = await enrollmentService.getCourseStudents(course.id);
        counts[course.id] = list.length;
      } catch (err) {
        console.error('Error fetching student counts for course:', course.id, err);
        counts[course.id] = 0;
      }
    }
    setStudentCounts(counts);
  };

  const loadCourseStudents = async (courseId: string) => {
    try {
      setLoadingStudents(true);
      const list = await enrollmentService.getCourseStudents(courseId);
      setCourseStudents(list);
    } catch (err) {
      console.error('Error loading course students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleEnrollStudents = async (studentIds: string[]) => {
    if (!activeCourseForStudents) return;
    try {
      for (const id of studentIds) {
        await enrollmentService.enrollStudent(id, activeCourseForStudents.id);
      }
      alert('Aluno(s) matriculado(s) com sucesso!');
      setShowStudentSelector(false);
      loadCourseStudents(activeCourseForStudents.id);
      loadAllStudentCounts();
    } catch (err: any) {
      console.error('Error enrolling students:', err);
      alert('Erro ao matricular alunos: ' + (err.message || err));
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!activeCourseForStudents) return;
    if (confirm('Tem a certeza de que deseja remover este aluno do curso? Ele perderá imediatamente o acesso ao conteúdo académico.')) {
      try {
        await enrollmentService.removeStudent(studentId, activeCourseForStudents.id);
        alert('Aluno removido do curso com sucesso!');
        loadCourseStudents(activeCourseForStudents.id);
        loadAllStudentCounts();
      } catch (err: any) {
        console.error('Error removing student:', err);
        alert('Erro ao remover aluno: ' + (err.message || err));
      }
    }
  };

  const mapStatusToState = (status?: string): 'Ativo' | 'Rascunho' | 'Arquivado' => {
    if (status === 'PUBLISHED' || status === 'ACTIVE') return 'Ativo';
    if (status === 'ARCHIVED') return 'Arquivado';
    return 'Rascunho';
  };

  const handleDuplicate = async (id: string) => {
    const original = courses.find(c => c.id === id);
    if (!original) return;
    try {
      await courseService.createCourse({
        title: `${original.title} (Cópia)`,
        slug: `${original.slug}-copia-${Math.floor(Math.random() * 1000)}`,
        description: original.subtitle || original.summary || '',
        duration: original.duration,
        category: original.category || 'Geral',
        level: original.level || 'Intermédio',
        thumbnail: original.thumbnail || '',
        status: 'DRAFT',
        teacher_id: original.teacher_id
      });
      alert(`Curso "${original.title}" duplicado com sucesso!`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Error duplicating course:', err);
      alert('Falha ao duplicar curso no Supabase: ' + (err.message || err));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza de que deseja eliminar indefinidamente este curso e todas as avaliações associadas sob as normas da MultiPlus?')) {
      try {
        await courseService.deleteCourse(id);
        alert('Curso eliminado com êxito do Supabase.');
        if (onRefresh) onRefresh();
      } catch (err: any) {
        console.error('Error deleting course:', err);
        alert('Falha ao deletar curso no Supabase: ' + (err.message || err));
      }
    }
  };

  const handleToggleState = async (id: string, newState: 'Ativo' | 'Rascunho' | 'Arquivado') => {
    const dbStatus = newState === 'Ativo' ? 'PUBLISHED' : newState === 'Arquivado' ? 'ARCHIVED' : 'DRAFT';
    try {
      await courseService.updateCourse(id, {
        status: dbStatus
      });
      alert(`Estado do curso alterado com integridade para: "${newState}"`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Error toggling course state:', err);
      alert('Falha ao alterar estado do curso no Supabase: ' + (err.message || err));
    }
  };

  const startEdit = (course: Course) => {
    setEditingCourseId(course.id);
    setEditTitle(course.title);
    setEditSubtitle(course.subtitle || course.summary || '');
    setEditDuration(course.duration);
    setEditPrice(course.price || '€450');
  };

  const saveEdit = async (id: string) => {
    try {
      await courseService.updateCourse(id, {
        title: editTitle,
        description: editSubtitle,
        duration: editDuration
      });
      alert('Informação do currículo do curso salva com sucesso!');
      setEditingCourseId(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Error updating course in DB:', err);
      alert('Falha ao atualizar curso no Supabase: ' + (err.message || err));
    }
  };

  // Render the Course-Specific Students view
  if (activeCourseForStudents) {
    const alreadyEnrolledIds = courseStudents.map(s => s.id);

    return (
      <div className="space-y-6 text-left animate-fadeIn">
        {/* Header Navigation panel */}
        <div className="bg-cream-100 p-6 rounded-3xl border border-gray-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <button
              onClick={() => setActiveCourseForStudents(null)}
              className="px-3 py-1.5 border border-gray-250 text-neutral-400 hover:text-ink-900 hover:bg-gray-100 rounded-xl text-3xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={12} />
              <span>Voltar aos Cursos</span>
            </button>
            <span className="text-[10px] font-mono tracking-widest text-gold-600 uppercase block mb-1">
              Matrículas & Controle de Acesso
            </span>
            <h3 className="text-xl font-serif font-black text-ink-900 m-0">
              {activeCourseForStudents.title}
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Gerencie exatamente quais alunos têm acesso a este programa letivo e acompanhe suas datas de admissão.
            </p>
          </div>

          <button
            onClick={() => setShowStudentSelector(true)}
            className="px-4 py-2 bg-ink-900 hover:bg-gold-600 hover:text-slate-900 border-0 text-cream-100 text-xs font-mono font-bold uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <UserPlus size={14} />
            <span>Matricular Aluno</span>
          </button>
        </div>

        {/* Students Table/Card list */}
        <div className="bg-cream-100 rounded-3xl border border-gray-150 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-cream-200">
            <span className="text-xs font-mono font-bold text-ink-900 uppercase">
              Alunos Inscritos ({courseStudents.length})
            </span>
          </div>

          {loadingStudents ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="animate-spin text-gold-600" size={28} />
              <span className="text-xs font-mono text-neutral-400">Consultando matrículas ativas...</span>
            </div>
          ) : courseStudents.length === 0 ? (
            <div className="p-16 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 bg-cream-200 text-neutral-400 rounded-full flex items-center justify-center mx-auto">
                <Users size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-black text-sm text-ink-900">Nenhum aluno matriculado neste curso.</h4>
                <p className="text-xs text-gray-450 leading-relaxed font-sans">
                  Use o botão acima para adicionar juristas registrados na plataforma institucional a este programa.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-cream-200 border-b border-gray-150 text-neutral-400 font-mono text-2xs uppercase">
                    <th className="p-4 font-bold">Aluno</th>
                    <th className="p-4 font-bold">Email</th>
                    <th className="p-4 font-bold">Estado Académico</th>
                    <th className="p-4 font-bold">Admitido Em</th>
                    <th className="p-4 font-bold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {courseStudents.map(student => (
                    <tr key={student.id} className="hover:bg-cream-200/50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={student.avatarUrl}
                          alt={student.firstName}
                          className="w-8 h-8 rounded-full object-cover border border-gray-100"
                        />
                        <span className="font-semibold text-neutral-400">
                          {student.firstName} {student.lastName}
                        </span>
                      </td>
                      <td className="p-4 text-neutral-400 font-mono text-2xs">{student.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 text-2xs font-mono font-bold rounded-full border ${
                          student.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-amber-50 text-amber-600 border-amber-200'
                        }`}>
                          {student.status === 'ACTIVE' ? 'ATIVO' : 'SUSPENSO'}
                        </span>
                      </td>
                      <td className="p-4 text-neutral-400 font-mono text-2xs">
                        {student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString('pt-PT') : 'N/D'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          className="p-2 text-neutral-400 hover:text-danger-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                          title="Remover Aluno"
                        >
                          <Trash size={13} />
                          <span className="hidden md:inline font-mono text-3xs font-bold uppercase">Remover</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Student selector modal */}
        {showStudentSelector && (
          <StudentSelector
            courseId={activeCourseForStudents.id}
            alreadyEnrolledIds={alreadyEnrolledIds}
            onEnroll={handleEnrollStudents}
            onClose={() => setShowStudentSelector(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Visual Analytics Header Panel */}
      <div className="bg-cream-100 p-6 rounded-3xl border border-gray-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-gold-600 uppercase block mb-1">
            Plano e Catálogo
          </span>
          <h3 className="text-xl font-serif font-black text-ink-900 m-0">Meus Cursos e Programas</h3>
          <p className="text-xs text-neutral-400 mt-1">Inscreva juristas, defina metas letivas presenciais ou online e configure valores fiscais.</p>
        </div>

        <button
          onClick={onNavigateToCreate}
          className="px-4 py-2 bg-ink-900 hover:bg-gold-600 hover:text-slate-900 border-0 text-cream-100 text-xs font-mono font-bold uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus size={14} />
          <span>Criar Novo Curso</span>
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="bg-cream-100 border border-gray-150 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6 shadow-sm mt-6">
          <div className="w-16 h-16 bg-ink-900/5 text-gold-600 rounded-full flex items-center justify-center mx-auto">
            <BookOpen size={28} />
          </div>
          <div className="space-y-2">
            <h4 className="font-serif font-black text-lg text-ink-900 leading-tight m-0">
              Nenhum curso registado sob sua responsabilidade jurídica.
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans m-0">
              Seja o pioneiro e publique o primeiro programa oficial para juristas em Angola hoje mesmo.
            </p>
          </div>
          <button
            onClick={onNavigateToCreate}
            className="w-full sm:w-auto px-6 py-2.5 bg-ink-900 hover:bg-gold-600 hover:text-ink-900 border-0 text-cream-100 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-2 mx-auto"
          >
            <Plus size={14} />
            <span>Criar Novo Curso</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => {
            const state = mapStatusToState(course.status);
            const isEditing = editingCourseId === course.id;

            return (
              <div 
                key={course.id} 
                className="bg-cream-100 rounded-3xl overflow-hidden border border-gray-150 flex flex-col justify-between hover:shadow-lg transition-all"
              >
                
                {/* Header Cover Preset Visual */}
                <div className="h-44 bg-ink-900 relative p-6 flex flex-col justify-between text-cream-100 select-none">
                  {/* Background overlay patterns */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-ink-900/20" />
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-2.5 py-1 text-[9px] font-mono font-extrabold uppercase rounded-full shadow-sm border ${
                      state === 'Ativo' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : state === 'Arquivado'
                          ? 'bg-danger-700/10 text-danger-700 border-danger-700/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-400/30'
                    }`}>
                      ● {state}
                    </span>
                  </div>

                  <div className="relative z-10 mt-auto text-left">
                    <span className="text-[9px] font-mono text-gold-600 font-bold tracking-widest uppercase block">
                      {course.modality || 'Online'} • {course.hours || '36 Horas'}
                    </span>
                    
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-cream-100/10 text-cream-100 mt-1 border-0 border-b border-white focus:outline-none focus:border-gold-600 font-serif font-black text-base"
                      />
                    ) : (
                      <h4 
                        onClick={() => {
                          setActiveCourseForStudents(course);
                          loadCourseStudents(course.id);
                        }}
                        className="text-base sm:text-lg font-serif font-black text-cream-100 m-0 leading-tight mt-1 hover:text-gold-600 transition-colors cursor-pointer"
                      >
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
                        <span className="text-[8px] font-mono text-neutral-400 block uppercase mb-1">Subtítulo do Curso</span>
                        <input
                          type="text"
                          value={editSubtitle}
                          onChange={(e) => setEditSubtitle(e.target.value)}
                          className="w-full p-2 text-xs bg-cream-200 border border-gray-200 rounded-lg text-[#1C1C1C]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[8px] font-mono text-neutral-400 block uppercase mb-1">Duração</span>
                          <input
                            type="text"
                            value={editDuration}
                            onChange={(e) => setEditDuration(e.target.value)}
                            className="w-full p-2 text-xs bg-cream-200 border border-gray-200 rounded-lg text-[#1C1C1C]"
                          />
                        </div>
                        <div>
                          <span className="text-[8px] font-mono text-neutral-400 block uppercase mb-1">Preço Sugerido (USD)</span>
                          <input
                            type="text"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-full p-2 text-xs bg-cream-200 border border-gray-200 rounded-lg text-[#1C1C1C]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xs sm:text-xs text-neutral-400 leading-relaxed font-sans m-0">
                        {course.subtitle || course.summary || 'Formação complementar vocacional acelerada.'}
                      </p>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                        <div 
                          className="text-left cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            setActiveCourseForStudents(course);
                            loadCourseStudents(course.id);
                          }}
                        >
                          <span className="text-[8px] font-mono text-neutral-400 block uppercase">Alunos Ativos</span>
                          <span className="font-serif font-black text-xs text-ink-900 flex items-center gap-1.5 mt-0.5">
                            <Users size={12} className="text-gold-600" />
                            {studentCounts[course.id] !== undefined ? studentCounts[course.id] : 0} inscritos
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="text-[8px] font-mono text-neutral-400 block uppercase">Duração</span>
                          <span className="font-serif font-black text-xs text-ink-900 flex items-center gap-1.5 mt-0.5">
                            <Clock size={12} className="text-gold-600" />
                            {course.duration}
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="text-[8px] font-mono text-neutral-400 block uppercase">Nível Ementa</span>
                          <span className="font-serif font-black text-xs text-ink-900 block mt-0.5 uppercase">
                            • {course.level || 'Geral'}
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
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-cream-100 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer"
                      >
                        Salvar
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(course)}
                        className="p-1.5 border border-gray-200 hover:border-gold-600/50 hover:bg-gold-600/10 rounded-lg text-neutral-400 hover:text-gold-600 transition-all cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDuplicate(course.id)}
                      className="p-1.5 border border-gray-200 hover:bg-sky-50 rounded-lg text-neutral-400 hover:text-sky-600 transition-all cursor-pointer"
                      title="Duplicar"
                    >
                      <Copy size={13} />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="p-1.5 border border-gray-200 hover:bg-red-50 rounded-lg text-neutral-400 hover:text-danger-700 transition-all cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>

                    <button
                      onClick={() => {
                        setActiveCourseForStudents(course);
                        loadCourseStudents(course.id);
                      }}
                      className="p-1.5 border border-gray-200 hover:bg-amber-50 rounded-lg text-neutral-400 hover:text-amber-600 transition-all cursor-pointer"
                      title="Matrículas e Alunos"
                    >
                      <Users size={13} />
                    </button>
                  </div>

                  <div className="flex gap-1 text-3xs font-mono">
                    <button
                      onClick={() => handleToggleState(course.id, 'Ativo')}
                      className={`px-2 py-1 rounded-lg border ${
                        state === 'Ativo' ? 'bg-ink-900 text-cream-100' : 'bg-transparent text-neutral-400 border-gray-200'
                      }`}
                    >
                      Ativo
                    </button>
                    <button
                      onClick={() => handleToggleState(course.id, 'Rascunho')}
                      className={`px-2 py-1 rounded-lg border ${
                        state === 'Rascunho' ? 'bg-gold-600 text-slate-900 font-bold' : 'bg-transparent text-neutral-400 border-gray-200'
                      }`}
                    >
                      Rascunho
                    </button>
                    <button
                      onClick={() => handleToggleState(course.id, 'Arquivado')}
                      className={`px-2 py-1 rounded-lg border ${
                        state === 'Arquivado' ? 'bg-neutral-400 text-cream-100' : 'bg-transparent text-neutral-400 border-gray-200'
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
      )}

    </div>
  );
}
