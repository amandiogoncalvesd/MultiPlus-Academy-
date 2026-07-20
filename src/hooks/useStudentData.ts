import { useState, useEffect, useCallback, useRef } from 'react';
import { academicService } from '../services/supabase/academicService';
import { supabase } from '../lib/supabase/client';
import { messageService } from '../services/supabase/messageService';
import { notificationService } from '../services/supabase/notificationService';

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

  // Usar ref para evitar stale closures nas subscrições realtime e callbacks
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const fetchData = useCallback(async () => {
    if (!userIdRef.current) return;
    setLoading(true);
    try {
      const enrollData = await academicService.getStudentEnrollments(userIdRef.current);
      setEnrollments(enrollData || []);

      if (enrollData && enrollData.length > 0) {
        const activeCourseId = selectedCourseId || enrollData[0].course_id;
        setSelectedCourseId(activeCourseId);
        const lessonsData = await academicService.getLessons(activeCourseId);
        setRealLessons(lessonsData || []);
        const completions = await academicService.getCompletedLessons(userIdRef.current, activeCourseId);
        setCompletedLessons(completions || []);
      } else {
        setRealLessons([]);
        setCompletedLessons([]);
      }

      const certs = await academicService.getStudentCertificates(userIdRef.current);
      setCertificates(certs || []);

      const schedules = await academicService.getScheduledLessonsForStudent(userIdRef.current);
      setScheduledLessons(schedules || []);

      const notifs = await notificationService.getNotifications(userIdRef.current);
      setNotifications(notifs || []);
    } catch (err) {
      console.warn('Erro ao carregar dados do aluno:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  const fetchUnreadCount = useCallback(async () => {
    if (!userIdRef.current) return;
    try {
      const parts = await messageService.getConversationPartners(userIdRef.current);
      setUnreadMessagesCount(parts.reduce((acc: number, p: any) => acc + (p.unreadCount || 0), 0));
    } catch {}
  }, []);

  const changeCourse = useCallback(async (courseId: string) => {
    if (!userIdRef.current) return;
    setSelectedCourseId(courseId);
    try {
      setLoading(true);
      const lessonsData = await academicService.getLessons(courseId);
      setRealLessons(lessonsData || []);
      const completions = await academicService.getCompletedLessons(userIdRef.current, courseId);
      setCompletedLessons(completions || []);
    } catch (err) {
      console.error('Erro ao trocar de curso:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [userId, fetchData]);

  useEffect(() => { 
    fetchUnreadCount(); 
  }, [userId, fetchUnreadCount]);

  // Real-time subscription para mensagens
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('student-unread-count')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        () => fetchUnreadCount()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchUnreadCount]);

  // Real-time subscription para notificações
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = notificationService.subscribeToNotifications(
      userId,
      (newNotif) => {
        // Apenas adicionar a nova notificação ao estado, sem refetch total
        setNotifications(prev => [newNotif, ...prev].slice(0, 30));
      }
    );
    return () => { unsubscribe(); };
  }, [userId]);

  return {
    enrollments, certificates, realLessons, completedLessons,
    scheduledLessons, notifications, setNotifications, unreadMessagesCount,
    loading, selectedCourseId, changeCourse,
    refetch: fetchData
  };
}
