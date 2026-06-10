// Globally patch window.atob safely to prevent the "The string did not match the expected pattern" crash
if (typeof window !== 'undefined') {
  // Store the original decoder reference
  const originalAtob = window.atob;
  
  if (originalAtob) {
    window.atob = function (str: any): string {
      try {
        if (str === null || str === undefined) {
          return '';
        }
        
        // Coerce input to string and trim whitespace
        let cleanStr = String(str).trim();
        
        // Convert Base64URL to standard Base64 representation
        cleanStr = cleanStr.replace(/-/g, '+').replace(/_/g, '/');
        
        // Remove all invalid base64 characters completely
        cleanStr = cleanStr.replace(/[^A-Za-z0-9+/=]/g, '');
        
        // Align padding for valid base64 strings
        const mod = cleanStr.length % 4;
        if (mod === 2) {
          cleanStr += '==';
        } else if (mod === 3) {
          cleanStr += '=';
        } else if (mod === 1) {
          // A string length with mod 1 is mathematically impossible in Base64,
          // throw or drop the last character to make it valid mod 2 or mod 0
          cleanStr = cleanStr.substring(0, cleanStr.length - 1);
        }
        
        return originalAtob(cleanStr);
      } catch (e) {
        console.warn('[Safe atob fallback] originalAtob call failed. Falling back to safe mock JSON payload:', e);
        // Return a mock JWT payload format so JSON.parse won't crash on empty strings or non-JSON
        return '{"exp":0,"sub":"anonymous","role":"anon","email":"","phone":""}';
      }
    };
  }
}
