import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { User } from '../types';

export function useTeacherStudents(teacherId: string | undefined) {
  const [students, setStudents] = useState<User[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [progressMetrics, setProgressMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      // 1. Get courses of this teacher to filter if needed, or get all ALUNO role users
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id')
        .eq('teacher_id', teacherId);

      const teacherCourseIds = (coursesData || []).map(c => c.id);

      // 2. Load Students
      const { data: usersData, error: usersErr } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'ALUNO');

      if (usersErr) throw usersErr;

      // 3. Load Enrollments
      const { data: enrollData, error: enrollErr } = await supabase
        .from('enrollments')
        .select('*');

      if (enrollErr) throw enrollErr;

      // 4. Load vw_student_progress metrics
      const { data: progressData, error: progressErr } = await supabase
        .from('vw_student_progress')
        .select('*');

      // Setup mapped data
      const studentList: User[] = (usersData || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        firstName: u.nome_completo?.split(' ')[0] || u.firstName || 'Doutor(a)',
        lastName: u.nome_completo?.split(' ').slice(1).join(' ') || u.lastName || '',
        role: 'ALUNO',
        status: u.status || 'ACTIVE',
        streak: u.streak || 0,
        longestStreak: u.longestStreak || 0,
        totalHoursLearned: u.total_hours_learned || 0,
        avatarUrl: u.foto_perfil || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
        phone: u.telefone || ''
      }));

      // Filter enrollments to either all or those related to the teacher's courses
      const mappedEnrollments = (enrollData || []).map((e: any) => ({
        userId: e.student_id,
        courseId: e.course_id,
        progressPercent: e.progress_percent || 0,
        status: e.status,
        enrolledAt: e.data_inicio?.slice(0, 10) || e.created_at?.slice(0, 10) || ''
      }));

      setStudents(studentList);
      setEnrollments(mappedEnrollments);
      setProgressMetrics(progressData || []);
    } catch (err) {
      console.error('Error fetching teacher student data:', err);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    if (!teacherId) {
      setStudents([]);
      setEnrollments([]);
      setProgressMetrics([]);
      setLoading(false);
      return;
    }

    fetchData();

    // Listen to changes in users, enrollments, or progress
    const channel = supabase
      .channel(`teacher-students-${teacherId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lesson_progress' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId, fetchData]);

  return { students, enrollments, progressMetrics, loading, refetch: fetchData };
}
