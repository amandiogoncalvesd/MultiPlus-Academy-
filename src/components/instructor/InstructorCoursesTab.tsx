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
import CourseEditorModal from '../course/CourseEditorModal';

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
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<Course | null>(null);
  const [isCreatingNewCourse, setIsCreatingNewCourse] = useState(false);
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
    setEditPrice(course.price || '450.000 Kz');
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
      <div className="space-y-6 text-left animate-fade-in">
        {/* Header Navigation panel */}
        <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,155,60,0.04),transparent_60%)] pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <button
              onClick={() => setActiveCourseForStudents(null)}
              className="px-3 py-1.5 border border-gray-250 dark:border-ink-800 text-neutral-400 dark:text-cream-200 hover:text-ink-900 dark:hover:text-cream-100 hover:bg-cream-200 dark:hover:bg-ink-800 rounded-xl text-3xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer bg-transparent"
            >
              <ArrowLeft size={12} />
              <span>Voltar aos Cursos</span>
            </button>
            <div className="pt-2">
              <span className="text-[10px] font-mono tracking-widest text-gold-600 uppercase block mb-1">
                Matrículas & Controle de Acesso
              </span>
              <h3 className="text-xl font-serif font-black text-ink-900 dark:text-cream-100 m-0">
                {activeCourseForStudents.title}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Gerencie exatamente quais alunos têm acesso a este programa letivo e acompanhe suas datas de admissão.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowStudentSelector(true)}
            className="px-4 py-2 bg-gold-600 hover:bg-[#b58b35] border-0 text-cream-100 text-xs font-mono font-bold uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs relative z-10"
          >
            <UserPlus size={14} />
            <span>Matricular Aluno</span>
          </button>
        </div>

        {/* Students Table/Card list */}
        <div className="bg-cream-100 dark:bg-ink-900 rounded-3xl border border-gray-150 dark:border-ink-800/60 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-gray-150 dark:border-ink-800/60 flex justify-between items-center bg-cream-200 dark:bg-ink-900">
            <span className="text-xs font-mono font-bold text-ink-900 dark:text-cream-100 uppercase">
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
              <div className="w-12 h-12 bg-cream-200 dark:bg-ink-950 text-neutral-400 rounded-full flex items-center justify-center mx-auto">
                <Users size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-black text-sm text-ink-900 dark:text-cream-100">Nenhum aluno matriculado neste curso.</h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                  Use o botão acima para adicionar juristas registrados na plataforma institucional a este programa.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-cream-200 dark:bg-ink-950 border-b border-gray-150 dark:border-ink-850 text-neutral-400 dark:text-cream-200/60 font-mono text-2xs uppercase">
                    <th className="p-4 font-bold">Aluno</th>
                    <th className="p-4 font-bold">Email</th>
                    <th className="p-4 font-bold">Estado Académico</th>
                    <th className="p-4 font-bold">Admitido Em</th>
                    <th className="p-4 font-bold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-150 dark:divide-ink-800/30">
                  {courseStudents.map(student => (
                    <tr key={student.id} className="hover:bg-cream-200/50 dark:hover:bg-ink-900/40 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256'}
                          alt={student.firstName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-semibold text-ink-900 dark:text-cream-100">
                          {student.firstName} {student.lastName}
                        </span>
                      </td>
                      <td className="p-4 text-neutral-400 dark:text-cream-200/60 font-mono text-2xs">{student.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 text-2xs font-mono font-bold rounded-full border ${
                          student.status === 'ACTIVE'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                        }`}>
                          {student.status === 'ACTIVE' ? 'ATIVO' : 'SUSPENSO'}
                        </span>
                      </td>
                      <td className="p-4 text-neutral-400 dark:text-cream-200/60 font-mono text-2xs">
                        {student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString('pt-PT') : 'N/D'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50/10 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 border-0 bg-transparent"
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
    <div className="space-y-6 text-left relative">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-gold-600/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      
      {/* Visual Analytics Header Panel */}
      <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,155,60,0.04),transparent_60%)] pointer-events-none" />
        <div className="relative z-10">
          <span className="text-[10px] font-mono tracking-widest text-gold-600 uppercase block mb-1">
            Plano e Catálogo
          </span>
          <h3 className="text-xl font-serif font-black text-ink-900 dark:text-cream-100 m-0">Meus Cursos e Programas</h3>
          <p className="text-xs text-neutral-400 mt-1">Inscreva juristas, defina metas letivas presenciais ou online e configure valores fiscais.</p>
        </div>

        <button
          onClick={() => setIsCreatingNewCourse(true)}
          className="px-4 py-2 bg-gold-600 hover:bg-[#b58b35] border-0 text-cream-100 text-xs font-mono font-bold uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs relative z-10"
        >
          <Plus size={14} />
          <span>Criar Novo Curso</span>
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="bg-cream-100 dark:bg-ink-900 border border-gray-150 dark:border-ink-800/60 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6 shadow-sm mt-6 relative overflow-hidden">
          <div className="w-16 h-16 bg-ink-900/5 dark:bg-ink-800/80 text-gold-600 rounded-full flex items-center justify-center mx-auto">
            <BookOpen size={28} />
          </div>
          <div className="space-y-2 relative z-10">
            <h4 className="font-serif font-black text-lg text-ink-900 dark:text-cream-100 leading-tight m-0">
              Nenhum curso registado sob sua responsabilidade jurídica.
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans m-0">
              Seja o pioneiro e publique o primeiro programa oficial para juristas em Angola hoje mesmo.
            </p>
          </div>
          <button
            onClick={() => setIsCreatingNewCourse(true)}
            className="w-full sm:w-auto px-6 py-2.5 bg-gold-600 hover:bg-[#b58b35] border-0 text-cream-100 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-2 mx-auto relative z-10"
          >
            <Plus size={14} />
            <span>Criar Novo Curso</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {courses.map((course) => {
            const state = mapStatusToState(course.status);
            const isEditing = editingCourseId === course.id;

            return (
              <div 
                key={course.id} 
                className="bg-cream-100 dark:bg-ink-900 rounded-3xl overflow-hidden border border-gray-150 dark:border-ink-800/60 flex flex-col justify-between hover:shadow-lg hover:scale-[1.01] transition-all relative group"
              >
                
                {/* Header Cover Preset Visual */}
                <div className="h-44 bg-ink-950 relative p-6 flex flex-col justify-between text-cream-100 select-none">
                  {/* Background overlay patterns */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/80 to-transparent" />
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-2.5 py-1 text-[9px] font-mono font-extrabold uppercase rounded-full shadow-sm border ${
                      state === 'Ativo' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : state === 'Arquivado'
                          ? 'bg-red-500/10 text-red-450 border-red-500/30'
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
                <div className="p-6 space-y-4 text-left flex-grow relative z-10">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[8px] font-mono text-neutral-400 block uppercase mb-1">Subtítulo do Curso</span>
                        <input
                          type="text"
                          value={editSubtitle}
                          onChange={(e) => setEditSubtitle(e.target.value)}
                          className="w-full p-2 text-xs bg-cream-200 dark:bg-ink-950 border border-gray-150 dark:border-ink-850 rounded-lg text-ink-900 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[8px] font-mono text-neutral-400 block uppercase mb-1">Duração</span>
                          <input
                            type="text"
                            value={editDuration}
                            onChange={(e) => setEditDuration(e.target.value)}
                            className="w-full p-2 text-xs bg-cream-200 dark:bg-ink-950 border border-gray-150 dark:border-ink-850 rounded-lg text-ink-900 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                          />
                        </div>
                        <div>
                          <span className="text-[8px] font-mono text-neutral-400 block uppercase mb-1">Preço Sugerido (USD)</span>
                          <input
                            type="text"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-full p-2 text-xs bg-cream-200 dark:bg-ink-950 border border-gray-150 dark:border-ink-850 rounded-lg text-ink-900 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xs sm:text-xs text-neutral-400 dark:text-cream-100/70 leading-relaxed font-sans m-0 line-clamp-2">
                        {course.subtitle || course.summary || 'Formação complementar vocacional acelerada.'}
                      </p>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-150 dark:border-ink-800/60">
                        <div 
                          className="text-left cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            setActiveCourseForStudents(course);
                            loadCourseStudents(course.id);
                          }}
                        >
                          <span className="text-[8px] font-mono text-neutral-400 block uppercase">Alunos Ativos</span>
                          <span className="font-serif font-black text-xs text-ink-900 dark:text-cream-100 flex items-center gap-1.5 mt-0.5">
                            <Users size={12} className="text-gold-600" />
                            {studentCounts[course.id] !== undefined ? studentCounts[course.id] : 0} inscritos
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="text-[8px] font-mono text-neutral-400 block uppercase">Duração</span>
                          <span className="font-serif font-black text-xs text-ink-900 dark:text-cream-100 flex items-center gap-1.5 mt-0.5">
                            <Clock size={12} className="text-gold-600" />
                            {course.duration}
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="text-[8px] font-mono text-neutral-400 block uppercase">Nível Ementa</span>
                          <span className="font-serif font-black text-xs text-ink-900 dark:text-cream-100 block mt-0.5 uppercase">
                            • {course.level || 'Geral'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Rows */}
                <div className="px-6 pb-6 pt-3 border-t border-gray-150 dark:border-ink-800/60 flex items-center justify-between gap-2 overflow-x-auto relative z-10">
                  <div className="flex gap-1 shrink-0">
                    {isEditing ? (
                      <button
                        onClick={() => saveEdit(course.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-cream-100 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer border-0 shadow-xs"
                      >
                        Salvar
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedCourseForModal(course)}
                        className="p-1.5 border border-gray-200 dark:border-ink-800 hover:border-gold-600/50 dark:hover:border-gold-600/50 hover:bg-gold-600/10 rounded-lg text-neutral-400 dark:text-cream-250 hover:text-gold-600 transition-all cursor-pointer bg-transparent"
                        title="Editar"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDuplicate(course.id)}
                      className="p-1.5 border border-gray-200 dark:border-ink-800 hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded-lg text-neutral-400 dark:text-cream-250 hover:text-sky-600 transition-all cursor-pointer bg-transparent"
                      title="Duplicar"
                    >
                      <Copy size={13} />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="p-1.5 border border-gray-200 dark:border-ink-800 hover:bg-red-50/20 dark:hover:bg-red-950/20 rounded-lg text-neutral-400 dark:text-cream-250 hover:text-red-500 transition-all cursor-pointer bg-transparent"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                    
                    <button
                      onClick={() => {
                        setActiveCourseForStudents(course);
                        loadCourseStudents(course.id);
                      }}
                      className="p-1.5 border border-gray-200 dark:border-ink-800 hover:bg-gold-600/10 rounded-lg text-neutral-400 dark:text-cream-250 hover:text-gold-600 transition-all cursor-pointer bg-transparent"
                      title="Matrículas e Alunos"
                    >
                      <Users size={13} />
                    </button>
                  </div>

                  <div className="flex gap-1 text-3xs font-mono shrink-0">
                    <button
                      onClick={() => handleToggleState(course.id, 'Ativo')}
                      className={`px-2 py-1 rounded-lg border cursor-pointer transition-all ${
                        state === 'Ativo' ? 'bg-gold-600 text-ink-900 font-extrabold border-gold-600' : 'bg-transparent text-neutral-400 dark:text-cream-200/60 border-gray-200 dark:border-ink-800'
                      }`}
                    >
                      Ativo
                    </button>
                    <button
                      onClick={() => handleToggleState(course.id, 'Rascunho')}
                      className={`px-2 py-1 rounded-lg border cursor-pointer transition-all ${
                        state === 'Rascunho' ? 'bg-gold-600 text-ink-900 font-extrabold border-gold-600' : 'bg-transparent text-neutral-400 dark:text-cream-200/60 border-gray-200 dark:border-ink-800'
                      }`}
                    >
                      Rascunho
                    </button>
                    <button
                      onClick={() => handleToggleState(course.id, 'Arquivado')}
                      className={`px-2 py-1 rounded-lg border cursor-pointer transition-all ${
                        state === 'Arquivado' ? 'bg-gold-600 text-ink-900 font-extrabold border-gold-600' : 'bg-transparent text-neutral-400 dark:text-cream-200/60 border-gray-200 dark:border-ink-800'
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

      {selectedCourseForModal && (
        <CourseEditorModal
          courseId={selectedCourseForModal.id}
          teacherId={selectedCourseForModal.teacher_id}
          onClose={() => setSelectedCourseForModal(null)}
          onSave={() => {
            setSelectedCourseForModal(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {isCreatingNewCourse && (
        <CourseEditorModal
          onClose={() => setIsCreatingNewCourse(false)}
          onSave={() => {
            setIsCreatingNewCourse(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}

    </div>
  );
}
