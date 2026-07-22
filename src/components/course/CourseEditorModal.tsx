import React, { useState, useEffect } from 'react';
import {
  X, Upload, BookOpen, Users, Plus, Trash2, Edit2, Save,
  AlertCircle, Check, CheckCircle2, Calendar, FileText,
  ArrowLeft, Eye, Bold, Italic, List, Heading, HelpCircle, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { courseService, SupabaseCourse } from '../../services/supabase/courseService';
import { lessonService, SupabaseLesson } from '../../services/supabase/lessonService';
import { enrollmentService } from '../../services/supabase/enrollmentService';
import StudentSelector from '../instructor/StudentSelector';
import { useAuth } from '../auth/AuthProvider';

interface CourseEditorModalProps {
  courseId?: string; // If undefined, we are creating a new course
  teacherId?: string; // Teacher associated with the course
  onClose: () => void;
  onSave: (course: any) => void;
}

export default function CourseEditorModal({
  courseId: initialCourseId,
  teacherId: initialTeacherId,
  onClose,
  onSave
}: CourseEditorModalProps) {
  const { role: userRole, user } = useAuth();
  const [courseId, setCourseId] = useState<string | undefined>(initialCourseId);
  const [activeTab, setActiveTab] = useState<'details' | 'lessons' | 'students'>('details');
  const [isSaving, setIsSaving] = useState(false);

  // Selected teacher ID state and teachers list
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(initialTeacherId || '');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const isAdmin = userRole === 'ADMIN';

  // Fetch instructors if user is Admin
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const { data, error } = await supabase
          .from('users')
          .select('id, nome_completo')
          .eq('role', 'PROFESSOR');

        if (error) throw error;
        setTeachers(data || []);
      } catch (err) {
        console.error('Error fetching teachers:', err);
      } finally {
        setLoadingTeachers(false);
      }
    };

    if (isAdmin) {
      fetchTeachers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (initialTeacherId) {
      setSelectedTeacherId(initialTeacherId);
    }
  }, [initialTeacherId]);

  // Course Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState('Geral');
  const [level, setLevel] = useState('Intermédio');
  const [duration, setDuration] = useState('12 Semanas');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [thumbnail, setThumbnail] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  // Lessons list & states
  const [lessons, setLessons] = useState<SupabaseLesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Partial<SupabaseLesson> | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonVideo, setLessonVideo] = useState('');
  const [lessonDuration, setLessonDuration] = useState('45 min');
  const [lessonStatus, setLessonStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [lessonStartsAt, setLessonStartsAt] = useState('');
  const [lessonEndsAt, setLessonEndsAt] = useState('');

  // Quiz Builder states
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

  // Lesson Target states
  const [targetType, setTargetType] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedTargetStudentIds, setSelectedTargetStudentIds] = useState<string[]>([]);

  // Enrolled Students list
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);

  // Cloudinary URL warning state
  const [cloudinaryWarning, setCloudinaryWarning] = useState(false);

  // Load course details if editing
  useEffect(() => {
    if (courseId) {
      loadCourseDetails(courseId);
      loadLessons(courseId);
      loadEnrolledStudents(courseId);
    }
  }, [courseId]);

  const loadCourseDetails = async (id: string) => {
    try {
      const course = await courseService.getCourseById(id);
      if (course) {
        setTitle(course.title);
        setDescription(course.description || '');
        setPrice(course.price ? String(course.price) : '');
        setCategory(course.category || 'Geral');
        setLevel(course.level || 'Intermédio');
        setDuration(course.duration || '12 Semanas');
        setStatus(course.status || 'DRAFT');
        setThumbnail(course.thumbnail || '');
        if (course.teacher_id) {
          setSelectedTeacherId(course.teacher_id);
        }
      }
    } catch (err) {
      console.error('Error loading course details:', err);
    }
  };

  const loadLessons = async (id: string) => {
    try {
      setLoadingLessons(true);
      const list = await lessonService.getLessons(id);
      setLessons(list);
    } catch (err) {
      console.error('Error loading lessons:', err);
    } finally {
      setLoadingLessons(false);
    }
  };

  const loadEnrolledStudents = async (id: string) => {
    try {
      setLoadingStudents(true);
      const list = await enrollmentService.getCourseStudents(id);
      setEnrolledStudents(list);
    } catch (err) {
      console.error('Error loading enrolled students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Format Helper for prices on other screens
  const formatKz = (val: any) => {
    if (!val) return '0 Kz';
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ' Kz';
  };

  // Cover image upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !courseId) return;

    try {
      setUploadingCover(true);
      const ext = file.name.split('.').pop();
      const filePath = `course-covers/${courseId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      setThumbnail(publicUrl);

      // Auto-update course row with thumbnail
      await courseService.updateCourse(courseId, { thumbnail: publicUrl });
    } catch (err: any) {
      console.error('Error uploading cover:', err);
      alert('Erro ao carregar imagem de capa: ' + (err.message || err));
    } finally {
      setUploadingCover(false);
    }
  };

  // Save general course details
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('Por favor, indique o nome do curso.');
      return;
    }

    if (isAdmin && !selectedTeacherId) {
      alert('Por favor, selecione e atribua este curso a um professor.');
      return;
    }

    try {
      setIsSaving(true);
      const cleanPrice = price ? parseFloat(price.replace(/[^\d.]/g, '')) : null;
      const slugVal = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const payload: Partial<SupabaseCourse> & { price?: number | null } = {
        title,
        slug: slugVal,
        description,
        price: isNaN(cleanPrice as any) ? null : cleanPrice,
        category,
        level,
        duration,
        status,
        teacher_id: isAdmin ? selectedTeacherId : (selectedTeacherId || initialTeacherId || user?.id)
      };

      let savedCourse: any;
      if (courseId) {
        savedCourse = await courseService.updateCourse(courseId, payload as any);
        alert('Curso atualizado com sucesso!');
      } else {
        savedCourse = await courseService.createCourse(payload as any);
        setCourseId(savedCourse.id);
        alert('Curso criado com sucesso! Agora pode adicionar aulas e matricular alunos.');
      }

      onSave({
        ...savedCourse,
        subtitle: savedCourse.description,
        price: formatKz(savedCourse.price)
      });
    } catch (err: any) {
      console.error('Error saving course:', err);
      alert('Erro ao salvar curso: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Remove Enrolled student
  const handleRemoveStudent = async (studentId: string) => {
    if (!courseId) return;
    if (confirm('Deseja realmente remover este formando deste curso? Ele perderá acesso imediatamente.')) {
      try {
        await enrollmentService.removeStudent(studentId, courseId);
        alert('Matrícula removida com sucesso!');
        loadEnrolledStudents(courseId);
      } catch (err: any) {
        console.error('Error removing enrollment:', err);
        alert('Erro ao remover aluno: ' + (err.message || err));
      }
    }
  };

  // Add Enrolled students via StudentSelector
  const handleEnrollStudents = async (studentIds: string[]) => {
    if (!courseId) return;
    try {
      for (const id of studentIds) {
        await enrollmentService.enrollStudent(id, courseId);
      }
      alert('Estudante(s) matriculado(s) com sucesso!');
      setShowStudentSelector(false);
      loadEnrolledStudents(courseId);
    } catch (err: any) {
      console.error('Error enrolling students:', err);
      alert('Erro ao matricular alunos: ' + (err.message || err));
    }
  };

  // Validate Cloudinary Pattern
  const validateCloudinaryUrl = (url: string) => {
    setLessonVideo(url);
    if (!url) {
      setCloudinaryWarning(false);
      return;
    }
    const isCloudinary = /^https?:\/\/(?:[a-z0-9-]+\.)?cloudinary\.com\/.*$/i.test(url);
    setCloudinaryWarning(!isCloudinary);
  };

  // Save lesson (includes Quiz and Targets)
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle || !courseId) return;

    if (lessonStatus === 'PUBLISHED' && (!lessonStartsAt || !lessonEndsAt)) {
      alert('Defina o início e o fim da janela de acesso antes de publicar a aula.');
      return;
    }

    if (lessonStartsAt && lessonEndsAt && new Date(lessonEndsAt) <= new Date(lessonStartsAt)) {
      alert('O fim da aula deve ser posterior ao início.');
      return;
    }

    try {
      setIsSaving(true);
      const quizPayload = quizQuestions.length > 0 ? quizQuestions : null;

      const payload: Partial<SupabaseLesson> = {
        course_id: courseId,
        titulo: lessonTitle,
        descricao: lessonDesc,
        video_url: lessonVideo,
        duracao: lessonDuration,
        quiz: quizPayload,
        // scheduled_at is kept for legacy calendar compatibility; access_* is authoritative.
        scheduled_at: lessonStartsAt ? new Date(lessonStartsAt).toISOString() : null,
        access_starts_at: lessonStartsAt ? new Date(lessonStartsAt).toISOString() : null,
        access_ends_at: lessonEndsAt ? new Date(lessonEndsAt).toISOString() : null,
        status: lessonStatus
      };

      let finalLessonId = editingLesson?.id;

      if (finalLessonId) {
        // Update lesson details
        await lessonService.updateLesson(finalLessonId, payload);
      } else {
        // Create new lesson
        payload.ordem = lessons.length + 1;
        const newL = await lessonService.createLesson(payload);
        finalLessonId = newL.id;
      }

      // Handle lesson targets
      if (finalLessonId) {
        // Clear previous targets
        await supabase.from('lesson_targets').delete().eq('lesson_id', finalLessonId);

        let targetIds: string[] = [];
        if (targetType === 'ALL') {
          targetIds = enrolledStudents.map(s => s.id);
        } else {
          targetIds = selectedTargetStudentIds;
        }

        if (targetIds.length > 0) {
          const targetPayloads = targetIds.map(sid => ({
            lesson_id: finalLessonId,
            student_id: sid,
            course_id: courseId
          }));
          const { error: targetErr } = await supabase.from('lesson_targets').insert(targetPayloads);
          if (targetErr) {
            console.warn('Erro ao inserir lesson_targets:', targetErr);
          }
        }
      }

      alert('Aula salva com sucesso!');
      setEditingLesson(null);
      loadLessons(courseId);
    } catch (err: any) {
      console.error('Error saving lesson:', err);
      alert('Erro ao salvar aula: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Lesson
  const handleDeleteLesson = async (lessonId: string) => {
    if (!courseId) return;
    if (confirm('Tem a certeza de que deseja eliminar esta aula permanentemente do curso?')) {
      try {
        await lessonService.deleteLesson(lessonId);
        alert('Aula eliminada com sucesso!');
        loadLessons(courseId);
      } catch (err: any) {
        console.error('Error deleting lesson:', err);
        alert('Erro ao eliminar aula: ' + (err.message || err));
      }
    }
  };

  // Load lesson details into editor
  const handleOpenLessonEditor = async (lesson?: SupabaseLesson) => {
    if (lesson) {
      // Editing
      setEditingLesson(lesson);
      setLessonTitle(lesson.titulo);
      setLessonDesc(lesson.descricao || '');
      setLessonVideo(lesson.video_url || '');
      setLessonDuration(lesson.duracao || '45 min');
      setLessonStatus(lesson.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');
      setLessonStartsAt((lesson.access_starts_at || lesson.scheduled_at) ? new Date(lesson.access_starts_at || lesson.scheduled_at || '').toISOString().slice(0, 16) : '');
      setLessonEndsAt(lesson.access_ends_at ? new Date(lesson.access_ends_at).toISOString().slice(0, 16) : '');
      setQuizQuestions(lesson.quiz || []);

      // Load current targets
      const { data: targets } = await supabase
        .from('lesson_targets')
        .select('student_id')
        .eq('lesson_id', lesson.id);

      const targetIds = (targets || []).map(t => t.student_id);
      if (targetIds.length === enrolledStudents.length && enrolledStudents.length > 0) {
        setTargetType('ALL');
        setSelectedTargetStudentIds([]);
      } else {
        setTargetType('SPECIFIC');
        setSelectedTargetStudentIds(targetIds);
      }
    } else {
      // Creating
      setEditingLesson({});
      setLessonTitle('');
      setLessonDesc('');
      setLessonVideo('');
      setLessonDuration('45 min');
      setLessonStatus('DRAFT');
      setLessonStartsAt('');
      setLessonEndsAt('');
      setQuizQuestions([]);
      setTargetType('ALL');
      setSelectedTargetStudentIds([]);
    }
    setCloudinaryWarning(false);
  };

  // Rich Text Editor Helpers
  const insertTextMarkup = (markupOpen: string, markupClose: string) => {
    const txtArea = document.getElementById('lesson-desc-editor') as HTMLTextAreaElement;
    if (!txtArea) return;
    const start = txtArea.selectionStart;
    const end = txtArea.selectionEnd;
    const text = txtArea.value;
    const selected = text.substring(start, end);
    const replacement = markupOpen + selected + markupClose;
    setLessonDesc(text.substring(0, start) + replacement + text.substring(end));
    setTimeout(() => {
      txtArea.focus();
      txtArea.setSelectionRange(start + markupOpen.length, start + markupOpen.length + selected.length);
    }, 10);
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-40 animate-fadeIn overflow-y-auto">
      <div className="bg-cream-100 dark:bg-ink-900 rounded-3xl max-w-4xl w-full overflow-hidden border border-gray-150 dark:border-ink-800/60 shadow-2xl flex flex-col max-h-[90vh] relative my-8">

        {/* Header decoration */}
        <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-gradient-to-br from-gold-600/5 to-transparent rounded-full blur-[90px] pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 border-b border-gray-150 dark:border-ink-800/60 flex justify-between items-center bg-cream-200 dark:bg-ink-950/40 relative z-10">
          <div>
            <h3 className="text-lg font-serif font-black text-ink-900 dark:text-cream-100 m-0">
              {courseId ? `Editor do Programa: ${title}` : 'Criar Nova Especialização'}
            </h3>
            <p className="text-2xs font-mono text-gold-600 tracking-wide uppercase mt-1">
              {courseId ? `ID: ${courseId}` : 'Configuração do Rascunho Curricular'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-cream-250 dark:hover:bg-ink-800 rounded-full text-neutral-400 hover:text-gray-650 dark:hover:text-cream-100 transition-colors border-0 bg-transparent cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs (only shown if course was already created) */}
        {courseId && (
          <div className="px-6 border-b border-gray-150 dark:border-ink-800/40 flex gap-4 bg-cream-150 dark:bg-ink-900/40 text-xs font-mono relative z-10">
            {[
              { id: 'details', label: '1. Detalhes Base', icon: <FileText size={13} /> },
              { id: 'lessons', label: '2. Grade de Aulas', icon: <BookOpen size={13} /> },
              { id: 'students', label: '3. Alunos Inscritos', icon: <Users size={13} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (editingLesson) {
                    if (confirm('Deseja sair do editor de aula? Alterações não salvas serão perdidas.')) {
                      setEditingLesson(null);
                    } else {
                      return;
                    }
                  }
                  setActiveTab(tab.id as any);
                }}
                className={`py-3.5 flex items-center gap-1.5 font-bold uppercase border-b-2 transition-all cursor-pointer bg-transparent border-0 ${
                  activeTab === tab.id
                    ? 'border-gold-600 text-gold-600'
                    : 'border-transparent text-neutral-400 hover:text-gray-650 dark:hover:text-cream-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Modal Body Container */}
        <div className="flex-grow overflow-y-auto p-6 relative z-10 max-h-[60vh]">

          {/* TAB 1: GENERAL DETAILS */}
          {activeTab === 'details' && (
            <form onSubmit={handleSaveCourse} className="space-y-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Column 1: Cover image */}
                <div className="space-y-3">
                  <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-black">Capa da Especialização</span>
                  <div className="relative group aspect-video rounded-2xl overflow-hidden bg-cream-200 dark:bg-ink-950 border border-gray-250 dark:border-ink-800 flex items-center justify-center">
                    {thumbnail ? (
                      <>
                        <img
                          src={thumbnail}
                          alt="Capa do Curso"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {courseId && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label htmlFor="course-cover-file" className="px-3 py-1.5 bg-gold-600 text-slate-950 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer">
                              Substituir
                            </label>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="mx-auto text-neutral-400 mb-2" size={24} />
                        <span className="text-[10px] text-neutral-400 font-mono">Nenhuma capa carregada</span>
                      </div>
                    )}
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="animate-spin text-gold-600" size={20} />
                      </div>
                    )}
                  </div>
                  {courseId ? (
                    <div className="text-center">
                      <label
                        htmlFor="course-cover-file"
                        className="text-3xs font-mono font-bold text-gold-600 uppercase hover:underline cursor-pointer"
                      >
                        {uploadingCover ? 'Enviando...' : 'Carregar Capa Real'}
                      </label>
                      <input
                        type="file"
                        id="course-cover-file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <p className="text-[10px] text-neutral-400 text-center leading-normal">
                      Poderá enviar uma imagem de capa real logo após salvar o rascunho inicial do curso.
                    </p>
                  )}
                </div>

                {/* Column 2: Core parameters */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Nome da Especialização</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Introdução ao Direito de Exploração de Hidrocarbonetos..."
                        required
                        className="w-full p-2.5 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-slate-850 dark:text-cream-100 rounded-xl text-xs font-serif font-black focus:outline-none focus:border-gold-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Preço (Mensalidade)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="Ex: 450000"
                          className="w-full pl-3 pr-10 py-2.5 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-slate-850 dark:text-cream-100 rounded-xl text-xs font-mono focus:outline-none focus:border-gold-600"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-mono font-bold">Kz</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 italic">O preço é registrado em moeda local. Visualização formatada: {formatKz(price)}</p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Atribuir ao Professor *</label>
                      <select
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        required
                        className="w-full p-2.5 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-slate-850 dark:text-cream-100 rounded-xl text-xs focus:outline-none focus:border-gold-600 font-sans"
                      >
                        <option value="">-- Selecione o Professor --</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nome_completo}
                          </option>
                        ))}
                      </select>
                      {loadingTeachers && <span className="text-[10px] text-gold-600 animate-pulse font-mono">A carregar lista de professores...</span>}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Categoria</label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Ex: Regulamentar / Petróleo"
                        className="w-full p-2.5 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-slate-850 dark:text-cream-100 rounded-xl text-xs focus:outline-none focus:border-gold-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Nível de Rigor</label>
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full p-2.5 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-slate-850 dark:text-cream-100 rounded-xl text-xs focus:outline-none focus:border-gold-600"
                      >
                        <option value="Iniciante">Iniciante</option>
                        <option value="Intermédio">Intermédio</option>
                        <option value="Avançado">Avançado</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Duração Estipulada</label>
                      <input
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="Ex: 10 Semanas"
                        className="w-full p-2.5 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-slate-850 dark:text-cream-100 rounded-xl text-xs focus:outline-none focus:border-gold-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Descrição Curricular</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Indique os objetivos primários de ensino e abrangência metodológica no Huambo..."
                      className="w-full p-2.5 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-slate-850 dark:text-cream-100 rounded-xl text-xs focus:outline-none focus:border-gold-600 resize-none"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase font-black">Estado de Publicação:</span>
                      <select
                        value={status}
                        onChange={(e: any) => setStatus(e.target.value)}
                        className="px-3 py-1 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-2xs font-mono font-bold uppercase rounded-xl text-current"
                      >
                        <option value="DRAFT">Rascunho (Privado)</option>
                        <option value="PUBLISHED">Publicado (Visível)</option>
                        <option value="ARCHIVED">Arquivado</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 bg-ink-900 dark:bg-gold-600 text-cream-100 dark:text-slate-950 hover:bg-gold-600 hover:text-slate-900 font-mono font-bold text-3xs uppercase rounded-xl border-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                      {courseId ? 'Salvar Detalhes' : 'Criar Curso'}
                    </button>
                  </div>
                </div>

              </div>
            </form>
          )}

          {/* TAB 2: LESSON GRADE */}
          {activeTab === 'lessons' && courseId && (
            <div className="space-y-6">
              {!editingLesson ? (
                // Lessons List View
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-serif font-black text-sm text-ink-900 dark:text-cream-100 m-0">Grade de Conteúdos Letivos</h4>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Planeie as exposições cronológicas, videoconferências associadas e exames rápidos.</p>
                    </div>
                    <button
                      onClick={() => handleOpenLessonEditor()}
                      className="px-3.5 py-1.5 bg-ink-900 dark:bg-gold-600 text-cream-100 dark:text-slate-950 hover:bg-gold-600 rounded-xl text-3xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 border-0 cursor-pointer"
                    >
                      <Plus size={12} /> Nova Aula
                    </button>
                  </div>

                  {loadingLessons ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="animate-spin text-gold-600" size={24} />
                      <span className="text-xs font-mono text-neutral-400">Carregando plano de aulas...</span>
                    </div>
                  ) : lessons.length === 0 ? (
                    <div className="py-12 text-center text-xs font-mono text-neutral-400 border border-dashed border-gray-250 dark:border-ink-800/60 rounded-2xl">
                      Nenhuma aula estruturada para este programa de estudos. Comece por criar uma!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lessons.map((lesson, idx) => (
                        <div
                          key={lesson.id}
                          className="p-4 bg-cream-150 dark:bg-ink-950/20 border border-gray-200 dark:border-ink-850 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-gold-600/10 text-gold-600 text-[9px] font-mono font-bold rounded">
                                AULA #{idx + 1}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                lesson.status === 'PUBLISHED' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800' : 'bg-amber-100 dark:bg-amber-950/30 text-amber-850'
                              }`}>
                                {lesson.status === 'PUBLISHED' ? 'Publicada' : 'Rascunho'}
                              </span>
                              {lesson.scheduled_at && (
                                <span className="text-[9px] text-neutral-400 flex items-center gap-1">
                                  <Calendar size={10} /> {new Date(lesson.scheduled_at).toLocaleDateString('pt-PT')}
                                </span>
                              )}
                            </div>
                            <h5 className="font-serif font-black text-xs text-ink-900 dark:text-cream-100 m-0 mt-1">
                              {lesson.titulo}
                            </h5>
                            <p className="text-[10px] text-neutral-400 font-mono m-0">Duração Estimada: {lesson.duracao || '45 min'}</p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenLessonEditor(lesson)}
                              className="px-2.5 py-1.5 bg-cream-200 dark:bg-ink-800 hover:bg-gold-600 hover:text-slate-950 transition-all text-ink-900 dark:text-cream-100 rounded text-3xs font-mono font-bold uppercase border border-gray-150 dark:border-ink-750 flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 size={10} /> Editar
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="px-2.5 py-1.5 bg-red-100/50 dark:bg-danger-700/10 hover:bg-red-500 hover:text-white dark:hover:bg-red-650 transition-all text-red-700 rounded text-3xs font-mono font-bold uppercase border border-red-200/40 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={10} /> Remover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Individual Lesson Editor Sub-view (Constructor)
                <form onSubmit={handleSaveLesson} className="space-y-6 text-left">
                  <div className="flex items-center gap-2 border-b border-gray-100 dark:border-ink-800/40 pb-3">
                    <button
                      type="button"
                      onClick={() => setEditingLesson(null)}
                      className="p-1 hover:bg-cream-200 dark:hover:bg-ink-800 rounded text-neutral-400 border-0 bg-transparent cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <h4 className="font-serif font-black text-sm text-ink-900 dark:text-cream-100 m-0">
                        {editingLesson.id ? 'Editar Detalhes da Aula' : 'Construtor da Nova Aula'}
                      </h4>
                      <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-wide">Vinculada à Especialização Ativa</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Lesson fields */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Título da Aula</label>
                        <input
                          type="text"
                          value={lessonTitle}
                          onChange={(e) => setLessonTitle(e.target.value)}
                          placeholder="Ex: Noções Gerais sobre a Concessão de Blocos do Kwanza..."
                          required
                          className="w-full p-2.5 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-slate-850 dark:text-cream-100 rounded-xl text-xs font-serif font-bold focus:outline-none focus:border-gold-600"
                        />
                      </div>

                      {/* Rich Text Editor Simulation for Description */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Conteúdo de Descrição Rich Text</label>
                          <div className="flex items-center gap-1 bg-cream-200 dark:bg-ink-950 border border-gray-200 dark:border-ink-850 rounded p-1">
                            <button
                              type="button"
                              onClick={() => insertTextMarkup('**', '**')}
                              title="Negrito"
                              className="p-1 hover:bg-cream-250 dark:hover:bg-ink-850 text-neutral-450 dark:text-cream-100 rounded border-0 bg-transparent cursor-pointer"
                            >
                              <Bold size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertTextMarkup('*', '*')}
                              title="Itálico"
                              className="p-1 hover:bg-cream-250 dark:hover:bg-ink-850 text-neutral-450 dark:text-cream-100 rounded border-0 bg-transparent cursor-pointer"
                            >
                              <Italic size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertTextMarkup('\n- ', '')}
                              title="Lista com Marcadores"
                              className="p-1 hover:bg-cream-250 dark:hover:bg-ink-850 text-neutral-450 dark:text-cream-100 rounded border-0 bg-transparent cursor-pointer"
                            >
                              <List size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertTextMarkup('### ', '')}
                              title="Título H3"
                              className="p-1 hover:bg-cream-250 dark:hover:bg-ink-850 text-neutral-450 dark:text-cream-100 rounded border-0 bg-transparent cursor-pointer"
                            >
                              <Heading size={11} />
                            </button>
                          </div>
                        </div>
                        <textarea
                          id="lesson-desc-editor"
                          rows={4}
                          value={lessonDesc}
                          onChange={(e) => setLessonDesc(e.target.value)}
                          placeholder="Escreva a descrição rica da aula usando markdown / texto estruturado..."
                          className="w-full p-2.5 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-slate-850 dark:text-cream-100 rounded-xl text-xs focus:outline-none focus:border-gold-600 resize-none font-sans leading-normal"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Duração Estimada</label>
                          <input
                            type="text"
                            value={lessonDuration}
                            onChange={(e) => setLessonDuration(e.target.value)}
                            placeholder="Ex: 1h 30min"
                            className="w-full p-2.5 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-slate-850 dark:text-cream-100 rounded-xl text-xs focus:outline-none focus:border-gold-600"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Início do acesso</label>
                          <input
                            type="datetime-local"
                            value={lessonStartsAt}
                            onChange={(e) => setLessonStartsAt(e.target.value)}
                            required={lessonStatus === 'PUBLISHED'}
                            className="w-full p-2.5 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-slate-850 dark:text-cream-100 rounded-xl text-xs font-mono focus:outline-none focus:border-gold-600"
                          />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Fim do acesso</label>
                          <input
                            type="datetime-local"
                            value={lessonEndsAt}
                            onChange={(e) => setLessonEndsAt(e.target.value)}
                            required={lessonStatus === 'PUBLISHED'}
                            className="w-full p-2.5 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-slate-850 dark:text-cream-100 rounded-xl text-xs font-mono focus:outline-none focus:border-gold-600"
                          />
                          <p className="text-[9px] text-neutral-400 m-0">Aulas publicadas ficam visíveis em “Minhas Aulas” apenas entre estes horários; depois seguem para o histórico do calendário.</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Link de Vídeo (Cloudinary)</label>
                          {cloudinaryWarning && (
                            <span className="text-[9px] text-amber-500 font-mono font-semibold">⚠ Não é um link Cloudinary padrão</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={lessonVideo}
                          onChange={(e) => validateCloudinaryUrl(e.target.value)}
                          placeholder="Ex: https://res.cloudinary.com/multiplus/video/upload/aula1.mp4"
                          className="w-full p-2.5 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-slate-850 dark:text-cream-100 rounded-xl text-xs focus:outline-none focus:border-gold-600"
                        />
                        <p className="text-[10px] text-neutral-400 italic">Insira links otimizados na infraestrutura Cloudinary para execução síncrona sem buffer.</p>
                      </div>

                      {/* Targets Audience checklist */}
                      <div className="p-3.5 bg-cream-200 dark:bg-ink-950 rounded-xl border border-gray-200 dark:border-ink-850 space-y-3">
                        <span className="block text-[10px] font-mono text-neutral-400 uppercase font-black">Alunos Alvo</span>
                        <div className="flex gap-4 text-xs font-mono">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="targetType"
                              checked={targetType === 'ALL'}
                              onChange={() => setTargetType('ALL')}
                            />
                            Todos Matriculados
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="targetType"
                              checked={targetType === 'SPECIFIC'}
                              onChange={() => setTargetType('SPECIFIC')}
                            />
                            Seleção Específica
                          </label>
                        </div>

                        {targetType === 'SPECIFIC' && (
                          <div className="pt-2 border-t border-gray-150 dark:border-ink-800/60 max-h-36 overflow-y-auto space-y-1.5">
                            {enrolledStudents.map(student => {
                              const isChecked = selectedTargetStudentIds.includes(student.id);
                              return (
                                <label key={student.id} className="flex items-center gap-2 p-1 text-xs select-none cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setSelectedTargetStudentIds(prev =>
                                        prev.includes(student.id)
                                          ? prev.filter(id => id !== student.id)
                                          : [...prev, student.id]
                                      );
                                    }}
                                  />
                                  <span>{student.firstName} {student.lastName} ({student.email})</span>
                                </label>
                              );
                            })}
                            {enrolledStudents.length === 0 && (
                              <p className="text-[10px] text-neutral-400">Nenhum aluno matriculado neste curso para selecionar.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Quiz questions builder */}
                    <div className="space-y-4">
                      <div className="p-4 bg-cream-200 dark:bg-ink-950 rounded-2xl border border-gray-250 dark:border-ink-850 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="block text-[10px] font-mono text-gold-600 uppercase font-black tracking-widest">Questionário Integrado ({quizQuestions.length})</span>
                          <button
                            type="button"
                            onClick={() => {
                              setQuizQuestions(prev => [
                                ...prev,
                                { question: 'Qual a resposta ideal sobre...', options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'], correctAnswer: 0 }
                              ]);
                            }}
                            className="px-2.5 py-1 bg-ink-900 dark:bg-gold-600 text-cream-100 dark:text-slate-950 font-mono text-3xs font-bold uppercase rounded border-0 cursor-pointer"
                          >
                            + Pergunta
                          </button>
                        </div>

                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {quizQuestions.map((q, qIdx) => (
                            <div key={qIdx} className="p-3 bg-cream-100 dark:bg-ink-900 rounded-xl border border-gray-200 dark:border-ink-800 space-y-2 relative text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setQuizQuestions(prev => prev.filter((_, idx) => idx !== qIdx));
                                }}
                                className="absolute top-2 right-2 text-red-550 hover:text-red-700 bg-transparent border-0 cursor-pointer p-1"
                              >
                                <Trash2 size={12} />
                              </button>

                              <div className="space-y-1">
                                <span className="block text-[9px] font-mono text-neutral-400 uppercase">Pergunta #{qIdx + 1}</span>
                                <input
                                  type="text"
                                  value={q.question}
                                  onChange={(e) => {
                                    const updated = [...quizQuestions];
                                    updated[qIdx].question = e.target.value;
                                    setQuizQuestions(updated);
                                  }}
                                  className="w-full p-2 bg-cream-200 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 rounded-lg text-xs"
                                  placeholder="Enunciado da pergunta..."
                                />
                              </div>

                              <div className="space-y-1.5">
                                <span className="block text-[8px] font-mono text-neutral-400 uppercase">Opções e Correto</span>
                                {q.options.map((opt: string, oIdx: number) => (
                                  <div key={oIdx} className="flex gap-2 items-center">
                                    <input
                                      type="radio"
                                      name={`correct-${qIdx}`}
                                      checked={q.correctAnswer === oIdx}
                                      onChange={() => {
                                        const updated = [...quizQuestions];
                                        updated[qIdx].correctAnswer = oIdx;
                                        setQuizQuestions(updated);
                                      }}
                                    />
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => {
                                        const updated = [...quizQuestions];
                                        updated[qIdx].options[oIdx] = e.target.value;
                                        setQuizQuestions(updated);
                                      }}
                                      className="flex-grow p-1 px-2 bg-cream-200 dark:bg-ink-950 border border-gray-200 dark:border-ink-850 rounded text-2xs"
                                      placeholder={`Opção ${oIdx + 1}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          {quizQuestions.length === 0 && (
                            <p className="text-[10px] text-neutral-400 text-center py-6">Este exame curricular não contém perguntas síncronas. Adicione uma pergunta acima.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer inside builder */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-150 dark:border-ink-800/60">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase font-black">Estado:</span>
                      <select
                        value={lessonStatus}
                        onChange={(e: any) => setLessonStatus(e.target.value)}
                        className="px-3 py-1 bg-cream-150 dark:bg-ink-950 border border-gray-250 dark:border-ink-850 text-2xs font-mono font-bold uppercase rounded-xl text-current"
                      >
                        <option value="DRAFT">Rascunho</option>
                        <option value="PUBLISHED">Publicada</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingLesson(null)}
                        className="px-4 py-2 border border-gray-250 dark:border-ink-750 text-xs font-mono font-bold rounded-xl hover:bg-cream-250 dark:hover:bg-ink-800 text-neutral-450 dark:text-cream-100 uppercase transition-all cursor-pointer bg-transparent"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2 bg-ink-900 dark:bg-gold-600 text-cream-100 dark:text-slate-950 hover:bg-gold-600 rounded-xl text-xs font-mono font-bold uppercase flex items-center gap-1 cursor-pointer border-0 shadow-sm"
                      >
                        {isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                        Salvar Aula
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: STUDENTS MANAGEMENT */}
          {activeTab === 'students' && courseId && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-serif font-black text-sm text-ink-900 dark:text-cream-100 m-0">Lista de Alunos Matriculados</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Utilizadores com privilégios de visualização curricular ativa e notas anexas.</p>
                </div>
                <button
                  onClick={() => setShowStudentSelector(true)}
                  className="px-3.5 py-1.5 bg-ink-900 dark:bg-gold-600 text-cream-100 dark:text-slate-950 hover:bg-gold-600 rounded-xl text-3xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 border-0 cursor-pointer"
                >
                  <Plus size={12} /> Matricular Alunos
                </button>
              </div>

              {loadingStudents ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="animate-spin text-gold-600" size={24} />
                  <span className="text-xs font-mono text-neutral-400">Consultando lista de matrículas...</span>
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-neutral-400 border border-dashed border-gray-250 dark:border-ink-800/60 rounded-2xl">
                  Ainda não existem juristas matriculados nesta especialização. Matricule formandos acima!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrolledStudents.map(student => (
                    <div
                      key={student.id}
                      className="p-4 bg-cream-150 dark:bg-ink-950/20 border border-gray-200 dark:border-ink-850 rounded-2xl flex justify-between items-center text-left"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256'}
                          alt={student.firstName}
                          className="w-10 h-10 rounded-full border border-gray-200 dark:border-ink-800 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h5 className="font-semibold block text-xs text-ink-900 dark:text-cream-100 m-0">
                            {student.firstName} {student.lastName}
                          </h5>
                          <span className="text-[10px] text-neutral-400 dark:text-cream-200/60 block">{student.email}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        className="p-2 text-red-550 hover:text-red-700 hover:bg-red-50/10 rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
                        title="Anular Matrícula"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Overlay / Student Selector Portal */}
        {showStudentSelector && (
          <StudentSelector
            courseId={courseId || ''}
            alreadyEnrolledIds={enrolledStudents.map(s => s.id)}
            onEnroll={handleEnrollStudents}
            onClose={() => setShowStudentSelector(false)}
          />
        )}

      </div>
    </div>
  );
}
