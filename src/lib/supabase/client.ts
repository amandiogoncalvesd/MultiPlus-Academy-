import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') || '';
const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '') || '';

const isUrlValid = rawUrl && rawUrl.startsWith('http');

if (!isUrlValid || !rawKey) {
  console.warn('Real Supabase credentials not found. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(
  isUrlValid ? rawUrl : 'https://placeholder-project.supabase.co',
  rawKey && rawKey !== 'placeholder-anon-key' ? rawKey : 'placeholder-anon-key'
);
