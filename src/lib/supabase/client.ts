import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

const isUrlValid = rawUrl && rawUrl.startsWith('http') && !rawUrl.includes('placeholder') && !rawUrl.includes('your-project');
const isKeyValid = rawKey && rawKey !== 'placeholder-anon-key' && rawKey !== 'your-anon-key' && !rawKey.startsWith('your-');

if (!isUrlValid || !isKeyValid) {
  console.warn(
    'Supabase: Credenciais inválidas ou ausentes. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env. A autenticação não funcionará.'
  );
}

export const supabase = createClient(
  isUrlValid ? rawUrl : 'https://placeholder-project.supabase.co',
  isKeyValid ? rawKey : 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

export const isSupabaseMock = !isUrlValid || !isKeyValid;

