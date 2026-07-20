import { User, UserRole } from '../../types';

interface SupabaseUserRow {
  id: string;
  email: string;
  nome_completo?: string;
  role?: string;
  foto_perfil?: string;
  telefone?: string;
  status?: string;
  streak?: number;
  longestStreak?: number;
  totalHoursLearned?: number;
}

/**
 * Converte uma linha da tabela `users` do Supabase
 * no tipo `User` utilizado pelo frontend.
 */
export function mapSupabaseUserToAppUser(
  row: SupabaseUserRow,
  defaults?: Partial<User>
): User {
  const nameParts = (row.nome_completo || '').trim().split(/\s+/);
  const mappedRole: UserRole = 
    row.role === 'ADMIN' ? 'ADMIN' :
    row.role === 'PROFESSOR' ? 'PROFESSOR' :
    'ALUNO';

  return {
    id: row.id,
    email: row.email || '',
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    role: mappedRole,
    avatarUrl: row.foto_perfil || undefined,
    foto_perfil: row.foto_perfil || undefined,
    phone: row.telefone || '',
    status: (row.status as 'ACTIVE' | 'SUSPENDED') || 'ACTIVE',
    streak: row.streak ?? defaults?.streak ?? 0,
    longestStreak: row.longestStreak ?? defaults?.longestStreak ?? 0,
    totalHoursLearned: row.totalHoursLearned ?? defaults?.totalHoursLearned ?? 0,
  };
}
