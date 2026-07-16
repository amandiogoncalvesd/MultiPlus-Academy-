import { useState, useEffect } from 'react';
import { academicService } from '../services/supabase/academicService';
import { supabase } from '../lib/supabase/client';
import { messageService } from '../services/supabase/messageService';

export function useStudentData(userId: string | undefined) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [realLessons, setRealLessons] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [scheduledLessons, setScheduledLessons] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const enrollData = await academicService.getStudentEnrollments(userId);
      setEnrollments(enrollData || []);

      if (enrollData && enrollData.length > 0) {
        const activeCourseId = selectedCourseId || enrollData[0].course_id;
        setSelectedCourseId(activeCourseId);
        const lessonsData = await academicService.getLessons(activeCourseId);
        setRealLessons(lessonsData || []);
        const completions = await academicService.getCompletedLessons(userId, activeCourseId);
        setCompletedLessons(completions || []);
      } else {
        setRealLessons([]);
        setCompletedLessons([]);
      }

      const certs = await academicService.getStudentCertificates(userId);
      setCertificates(certs || []);

      const schedules = await academicService.getScheduledLessonsForStudent(userId);
      setScheduledLessons(schedules || []);

      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(notifs || []);
    } catch (err) {
      console.warn('Erro ao carregar dados do aluno:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!userId) return;
    try {
      const parts = await messageService.getConversationPartners(userId);
      setUnreadMessagesCount(parts.reduce((acc, p) => acc + (p.unreadCount || 0), 0));
    } catch {}
  };

  const changeCourse = async (courseId: string) => {
    if (!userId) return;
    setSelectedCourseId(courseId);
    try {
      setLoading(true);
      const lessonsData = await academicService.getLessons(courseId);
      setRealLessons(lessonsData || []);
      const completions = await academicService.getCompletedLessons(userId, courseId);
      setCompletedLessons(completions || []);
    } catch (err) {
      console.error('Erro ao trocar de curso:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [userId]);
  useEffect(() => { fetchUnreadCount(); }, [userId]);

  // Real-time subscription para mensagens
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('student-unread-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchUnreadCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Real-time subscription para notificações
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('student-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return {
    enrollments, certificates, realLessons, completedLessons,
    scheduledLessons, notifications, setNotifications, unreadMessagesCount,
    loading, selectedCourseId, changeCourse,
    refetch: fetchData
  };
}
