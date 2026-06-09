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
                const payloadPart = parts[1];
                try {
                  // Use native atob to check validity
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
  supabase = createClient(finalUrl, finalKey);
} catch (e) {
  console.warn('[Supabase] Initial client creation failed, creating fallback client with storage disabled:', e);
  supabase = createClient(finalUrl, finalKey, {
    auth: {
      persistSession: false
    }
  });
}

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
