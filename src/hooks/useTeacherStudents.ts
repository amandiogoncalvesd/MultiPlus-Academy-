import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { User } from '../types';

export function useTeacherStudents() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'ALUNO');

      if (error) throw error;

      if (data && data.length > 0) {
        setStudents(data.map((u: any) => ({
          id: u.id,
          email: u.email,
          firstName: u.nome_completo?.split(' ')[0] || '',
          lastName: u.nome_completo?.split(' ').slice(1).join(' ') || '',
          role: 'ALUNO' as const,
          status: u.status || 'ACTIVE',
          streak: 0,
          longestStreak: 0,
          totalHoursLearned: 0,
          avatarUrl: u.foto_perfil || '',
          phone: u.telefone || '',
          foto_perfil: u.foto_perfil
        })));
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return { students, loading, refetch: fetchStudents };
}
