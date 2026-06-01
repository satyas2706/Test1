import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export let isSupabaseConfigured = !!(
  rawUrl &&
  rawUrl !== 'undefined' &&
  rawUrl !== 'null' &&
  rawUrl.trim() !== '' &&
  rawKey &&
  rawKey !== 'undefined' &&
  rawKey !== 'null' &&
  rawKey.trim() !== ''
);

const finalUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder-url.supabase.co';
const finalKey = isSupabaseConfigured ? rawKey : 'placeholder-anon-key';

export let supabase = createClient(finalUrl, finalKey);

export function updateSupabaseConfig(url: string, key: string) {
  if (url && key && url !== 'undefined' && key !== 'undefined') {
    try {
      supabase = createClient(url, key);
      isSupabaseConfigured = true;
      console.log('[Supabase] Client reconfigured successfully with runtime settings.');
    } catch (e) {
      console.error('[Supabase] Failed to reconfigure client:', e);
    }
  }
}
