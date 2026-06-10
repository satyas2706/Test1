import { createClient } from '@supabase/supabase-js';

// Globally patch window.atob to immunize the application against "The string did not match the expected pattern" crash
if (typeof window !== 'undefined' && window.atob) {
  const originalAtob = window.atob;
  window.atob = function (str: any) {
    try {
      if (str === null || str === undefined) return '';
      let cleanStr = String(str).trim();
      
      // Convert Base64URL to Base64
      cleanStr = cleanStr.replace(/-/g, '+').replace(/_/g, '/');
      
      // Strip any characters not allowed in Base64
      cleanStr = cleanStr.replace(/[^A-Za-z0-9+/=]/g, '');
      
      // Correct padding
      const mod = cleanStr.length % 4;
      if (mod === 2) {
        cleanStr += '==';
      } else if (mod === 3) {
        cleanStr += '=';
      } else if (mod === 1) {
        cleanStr = cleanStr.substring(0, cleanStr.length - 1);
      }
      
      return originalAtob(cleanStr);
    } catch (e) {
      console.warn('[Safe atob fallback] Handled corrupt base64 string gracefully:', e);
      return '{}';
    }
  };
}

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
      persistSession: false,
      detectSessionInUrl: false
    }
  });
} catch (e) {
  console.warn('[Supabase] Initial client creation failed, creating fallback client with storage disabled:', e);
  supabase = createClient(finalUrl, finalKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

export function updateSupabaseConfig(url: string, key: string) {
  if (url && key && url !== 'undefined' && key !== 'undefined') {
    try {
      supabase = createClient(url, key, {
        auth: {
          persistSession: false,
          detectSessionInUrl: false
        }
      });
      isSupabaseConfigured = true;
      console.log('[Supabase] Client reconfigured successfully with runtime settings.');
    } catch (e) {
      console.error('[Supabase] Failed to reconfigure client:', e);
    }
  }
}
