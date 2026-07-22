import { describe, expect, it } from 'vitest';
import { mapSupabaseUserToAppUser } from './userMapper';

describe('mapSupabaseUserToAppUser', () => {
  it('normalizes a Supabase user row to the application user model', () => {
    const user = mapSupabaseUserToAppUser({
      id: 'user-1',
      email: 'ana@example.com',
      nome_completo: 'Ana Maria Silva',
      role: 'PROFESSOR',
      foto_perfil: 'https://example.com/avatar.png',
      telefone: '+244900000000',
      status: 'ACTIVE',
    });

    expect(user).toMatchObject({
      id: 'user-1',
      firstName: 'Ana',
      lastName: 'Maria Silva',
      role: 'PROFESSOR',
      avatarUrl: 'https://example.com/avatar.png',
      phone: '+244900000000',
      status: 'ACTIVE',
    });
  });

  it('uses safe student and metric defaults for incomplete rows', () => {
    const user = mapSupabaseUserToAppUser({ id: 'user-2', email: 'student@example.com' });

    expect(user.role).toBe('ALUNO');
    expect(user.status).toBe('ACTIVE');
    expect(user.streak).toBe(0);
    expect(user.totalHoursLearned).toBe(0);
  });
});
