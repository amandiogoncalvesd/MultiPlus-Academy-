import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = [
    'ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas!',
    '',
    'Certifique-se de que o ficheiro .env contém:',
    '  VITE_SUPABASE_URL=https://seu-projeto.supabase.co',
    '  VITE_SUPABASE_ANON_KEY=sua-anon-key',
    '',
    'A aplicação não pode funcionar sem estas variáveis.',
  ].join('\n');
  
  console.error(errorMsg);
  throw new Error(errorMsg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
});

