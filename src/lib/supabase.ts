import './patch-atob';
import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export let isSupabaseConfigured = !!(
  rawUrl &&
  rawUrl !== 'undefined' &&
  rawUrl !== 'null' &&
  rawUrl.trim() !== '' &&
  !rawUrl.includes('placeholder') &&
  rawKey &&
  rawKey !== 'undefined' &&
  rawKey !== 'null' &&
  rawKey.trim() !== '' &&
  !rawKey.includes('placeholder')
);

// Clean any corrupted local storage tokens from other preview containers on the same origin/port to prevent decode crashes
function sanitizeAuthStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  
  try {
    const keysToClean: string[] = [];
    
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      
      // Match Supabase auth tokens
      if (key.startsWith('sb-') || key.includes('supabase.auth.token')) {
        const val = window.localStorage.getItem(key);
        if (!val) continue;
        
        try {
          const parsed = JSON.parse(val);
          if (parsed && typeof parsed === 'object') {
            const token = parsed.access_token || (parsed.currentSession && parsed.currentSession.access_token);
            if (token && typeof token === 'string') {
              const parts = token.split('.');
              if (parts.length === 3) {
                // Verify if parts are valid base64
                let payloadPart = parts[1];
                while (payloadPart.length % 4 !== 0) {
                  payloadPart += '=';
                }
                try {
                  // Use native atob to check validity with safe padding length
                  window.atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
                } catch (e) {
                  console.warn(`[Storage Sanitizer] Corrupted base64 payload found in token for key ${key}. Clearing.`);
                  keysToClean.push(key);
                }
              } else {
                console.warn(`[Storage Sanitizer] Invalid JWT structure in key ${key}. Clearing.`);
                keysToClean.push(key);
              }
            }
          } else {
            console.warn(`[Storage Sanitizer] Token is not a valid JSON object for key ${key}. Clearing.`);
            keysToClean.push(key);
          }
        } catch (e) {
          console.warn(`[Storage Sanitizer] JSON parsing failed for key ${key}. Clearing.`);
          keysToClean.push(key);
        }
      }
    }
    
    // Clear flagged keys
    keysToClean.forEach(k => {
      try {
        window.localStorage.removeItem(k);
      } catch (e) {
        console.error(`Failed to remove key ${k}`, e);
      }
    });
  } catch (err) {
    console.warn('[Storage Sanitizer] Error checking localStorage:', err);
  }
}

sanitizeAuthStorage();

const finalUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder-url.supabase.co';
const finalKey = isSupabaseConfigured ? rawKey : 'placeholder-anon-key';

export let supabase: any;
try {
  supabase = createClient(finalUrl, finalKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });
} catch (e) {
  console.warn('[Supabase] Initial client creation failed, creating fallback client:', e);
  supabase = createClient(finalUrl, finalKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });
}

export function updateSupabaseConfig(url: string, key: string) {
  if (
    url && 
    key && 
    url !== 'undefined' && 
    key !== 'undefined' &&
    url.trim() !== '' &&
    key.trim() !== '' &&
    !url.includes('placeholder') &&
    !key.includes('placeholder')
  ) {
    try {
      supabase = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      });
      isSupabaseConfigured = true;
      console.log('[Supabase] Client reconfigured successfully with runtime settings.');
    } catch (e) {
      console.warn('[Supabase] Failed to reconfigure client:', e);
    }
  }
}

/**
 * Resilient Supabase query execution with automatic retry for transient schema cache / PostgREST warming states (PGRST002, 503, timeout).
 */
export async function safeSupabaseQuery<T = any>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: { retries?: number; initialDelayMs?: number; label?: string } = {}
): Promise<{ data: T | null; error: any }> {
  const retries = options.retries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 600;
  const label = options.label || 'Supabase query';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await queryFn();
      const err = result?.error;
      if (!err) {
        return result;
      }

      const isTransient =
        err.code === 'PGRST002' ||
        err.code === 'PGRST000' ||
        err.code === '57014' ||
        err.code === '53300' ||
        err.status === 503 ||
        err.status === 502 ||
        err.status === 504 ||
        (typeof err.message === 'string' && (
          err.message.includes('schema cache') ||
          err.message.includes('connection') ||
          err.message.includes('timeout') ||
          err.message.includes('fetch failed') ||
          err.message.includes('NetworkError')
        ));

      if (isTransient && attempt < retries) {
        const delay = initialDelayMs * Math.pow(1.8, attempt - 1);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }

      return result;
    } catch (caughtErr: any) {
      const isTransient =
        caughtErr?.code === 'PGRST002' ||
        caughtErr?.message?.includes('schema cache') ||
        caughtErr?.message?.includes('fetch failed') ||
        caughtErr?.message?.includes('timeout');

      if (isTransient && attempt < retries) {
        const delay = initialDelayMs * Math.pow(1.8, attempt - 1);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }

      return { data: null, error: caughtErr };
    }
  }

  return { data: null, error: new Error(`${label} failed after ${retries} attempts`) };
}
