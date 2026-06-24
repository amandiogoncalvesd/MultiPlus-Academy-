import { createClient } from '@supabase/supabase-js';

const rawUrl = (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') || '';
const rawKey = (typeof process !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY : '') || '';

const isUrlValid = rawUrl && rawUrl.startsWith('http');
const supabaseUrl = isUrlValid ? rawUrl : 'https://placeholder-project.supabase.co';
const supabaseServiceKey = rawKey && rawKey.trim() !== '' ? rawKey : 'placeholder-service-key';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

