import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') || '';
const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '') || '';

const isUrlValid = rawUrl && rawUrl.startsWith('http') && !rawUrl.includes('placeholder') && !rawUrl.includes('your-project');
const isKeyValid = rawKey && rawKey !== 'placeholder-anon-key' && rawKey !== 'your-anon-key' && !rawKey.startsWith('your-');

if (!isUrlValid || !isKeyValid) {
  console.warn('Real Supabase credentials not found. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. Falling back to Mock Auth Mode.');
}

export const supabase = createClient(
  isUrlValid ? rawUrl : 'https://placeholder-project.supabase.co',
  isKeyValid ? rawKey : 'placeholder-anon-key'
);

export const isSupabaseMock = !isUrlValid || !isKeyValid;
