import { expect, test } from '@playwright/test';

const required = [
  'E2E_SUPABASE_URL', 'E2E_SUPABASE_ANON_KEY',
  'E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD',
  'E2E_TEACHER_EMAIL', 'E2E_TEACHER_PASSWORD',
  'E2E_STUDENT_EMAIL', 'E2E_STUDENT_PASSWORD',
];
const enabled = required.every((key) => Boolean(process.env[key]));

type Session = { access_token: string; user: { id: string } };

async function signIn(email: string, password: string): Promise<Session> {
  const url = process.env.E2E_SUPABASE_URL!;
  const anon = process.env.E2E_SUPABASE_ANON_KEY!;
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<Session>;
}

async function rest(path: string, accessToken: string, init: RequestInit = {}) {
  const response = await fetch(`${process.env.E2E_SUPABASE_URL!}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: process.env.E2E_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

test.describe('RLS institucional — ambiente de staging isolado', () => {
  test.skip(!enabled, 'requer URL/chave anônima e contas isoladas ADMIN, PROFESSOR e ALUNO no staging');

  test('administração, docência e aluno recebem apenas o escopo permitido', async () => {
    const [admin, teacher, student] = await Promise.all([
      signIn(process.env.E2E_ADMIN_EMAIL!, process.env.E2E_ADMIN_PASSWORD!),
      signIn(process.env.E2E_TEACHER_EMAIL!, process.env.E2E_TEACHER_PASSWORD!),
      signIn(process.env.E2E_STUDENT_EMAIL!, process.env.E2E_STUDENT_PASSWORD!),
    ]);

    const adminSections = await rest('course_sections?select=id&limit=1', admin.access_token);
    expect(adminSections.response.ok()).toBeTruthy();

    const teacherSections = await rest('course_sections?select=id,primary_teacher_id&limit=100', teacher.access_token);
    expect(teacherSections.response.ok()).toBeTruthy();
    expect(Array.isArray(teacherSections.body)).toBeTruthy();

    const otherStudentGrades = await rest(`grade_entries?select=student_id&student_id=neq.${student.user.id}`, student.access_token);
    expect(otherStudentGrades.response.ok()).toBeTruthy();
    expect(otherStudentGrades.body).toEqual([]);

    const forbiddenTermCreate = await rest('academic_terms', student.access_token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ code: 'RLS-BLOCKED', name: 'Tentativa bloqueada', starts_on: '2030-01-01', ends_on: '2030-01-31' }),
    });
    expect(forbiddenTermCreate.response.status).toBe(401);
  });
});
