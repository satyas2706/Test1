import { supabase } from '../lib/supabase';

export interface CompressedImageResult {
  blob: Blob;
  mimeType: 'image/webp' | 'image/jpeg';
  width: number;
  height: number;
  extension: 'webp' | 'jpg';
}

/**
 * Shared client-side image compression and resizing utility.
 * - Decodes image in browser
 * - Preserves aspect ratio
 * - Caps maximum longest edge to 1600px (avoids enlarging smaller images)
 * - Strips unnecessary EXIF/metadata via canvas re-encoding
 * - Prefers WebP output (quality 0.78), falls back to JPEG (quality 0.78)
 * - Throws useful error on non-image or invalid files
 */
export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.78
): Promise<CompressedImageResult> {
  if (!file) {
    throw new Error('No file provided for compression.');
  }

  // Validate MIME type
  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error(
      `Selected file "${file.name || 'unnamed'}" is not a valid image. Please select a JPG, PNG, or WebP image.`
    );
  }

  // Decode image in browser safely
  const imageBitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image file. The file may be corrupt or in an unsupported format.'));
    };

    img.src = objectUrl;
  });

  const originalWidth = imageBitmap.naturalWidth || imageBitmap.width;
  const originalHeight = imageBitmap.naturalHeight || imageBitmap.height;

  if (!originalWidth || !originalHeight) {
    throw new Error('Could not read dimensions from image file.');
  }

  // Calculate target dimensions without enlarging smaller images
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  // Re-encode via canvas to strip metadata and resize
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D rendering context is not available for image processing.');
  }

  // Draw image to canvas
  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

  // Attempt WebP encoding first
  let blob: Blob | null = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b),
      'image/webp',
      quality
    );
  });

  let mimeType: 'image/webp' | 'image/jpeg' = 'image/webp';
  let extension: 'webp' | 'jpg' = 'webp';

  // Fallback to JPEG if WebP is unsupported or conversion failed
  if (!blob || blob.type !== 'image/webp') {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b),
        'image/jpeg',
        quality
      );
    });
    mimeType = 'image/jpeg';
    extension = 'jpg';
  }

  if (!blob) {
    throw new Error('Image compression could not produce a valid output file.');
  }

  return {
    blob,
    mimeType,
    width: targetWidth,
    height: targetHeight,
    extension
  };
}

/**
 * Uploads a new product image to the Supabase "shop-products" storage bucket
 * using server-authorized signed upload URLs.
 * 
 * 1. Resizes & compresses image (max 1600px, 0.78 quality WebP with JPEG fallback)
 * 2. Requests signed upload authorization from server using HTTP-only session cookie
 * 3. Uploads compressed blob directly from browser to Supabase Storage via signed URL
 * 4. Retrieves and returns the public Storage URL for storage in the product record
 *
 * NOTE: Does NOT fall back to base64 on error.
 */
export async function uploadProductImage(
  file: File,
  productIdOrPrefix?: string
): Promise<string> {
  if (!file) {
    throw new Error('No image file selected.');
  }

  // 1. Compress image in browser
  const compressed = await compressImage(file, 1600, 0.78);

  if (!supabase) {
    throw new Error('Supabase client is not available. Please verify configuration.');
  }

  // 2. Request signed upload authorization from server using verified session
  const activeSessionToken = typeof window !== 'undefined' ? localStorage.getItem('jiffex_session_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (activeSessionToken) {
    headers['Authorization'] = `Bearer ${activeSessionToken}`;
    headers['x-jiffex-session'] = activeSessionToken;
  }

  const response = await fetch('/api/storage/product-upload-url', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({
      productId: productIdOrPrefix,
      contentType: compressed.mimeType
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jiffex_session_token');
        window.dispatchEvent(new CustomEvent('jiffex:session-expired', {
          detail: { message: errorData.error || 'Your session has expired. Please sign in again.' }
        }));
      }
      throw new Error(errorData.error || 'Your session has expired. Please sign in again.');
    }
    if (response.status === 403) {
      throw new Error(errorData.error || 'You are not authorized to upload product images.');
    }
    if (response.status === 503) {
      throw new Error(errorData.error || 'Product image storage is temporarily unavailable. Please try again later.');
    }
    if (response.status === 400) {
      throw new Error(errorData.error || 'Unsupported image format.');
    }
    throw new Error(errorData.error || 'Image upload failed. Please retry.');
  }

  const { path: storagePath, token } = await response.json();
  if (!storagePath || !token) {
    throw new Error('Image upload failed. Please retry.');
  }

  // 3. Direct browser-to-Supabase upload using the signed authorization token
  const { error: uploadError } = await supabase.storage
    .from('shop-products')
    .uploadToSignedUrl(storagePath, token, compressed.blob, {
      contentType: compressed.mimeType,
      cacheControl: '31536000'
    });

  if (uploadError) {
    console.error('[Storage Signed Upload Error]', uploadError);
    throw new Error('Image upload failed. Please retry.');
  }

  // 4. Retrieve permanent public URL
  const { data: publicUrlData } = supabase.storage
    .from('shop-products')
    .getPublicUrl(storagePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('Could not retrieve public URL for uploaded product image from Supabase Storage.');
  }

  return publicUrlData.publicUrl;
}

/**
 * Uploads an Agent pickup item photo to the private Supabase "pickup-items" storage bucket
 * using server-authorized signed upload URLs.
 * 
 * 1. Resizes & compresses image (max 1600px, 0.75 quality WebP with JPEG fallback)
 * 2. Requests signed upload authorization from server using HTTP-only session cookie / session token
 * 3. Uploads compressed blob directly from browser to Supabase Storage via signed URL
 * 4. Returns ONLY the Storage path (e.g., "pickups/<pickupId>/items/<itemId>/<ts>-<uuid>.webp")
 *    DOES NOT return public URL or base64.
 */
export async function uploadPickupItemPhoto(
  file: File,
  pickupId: string,
  itemId?: string
): Promise<string> {
  if (!file) {
    throw new Error('No photo selected.');
  }
  if (!pickupId) {
    throw new Error('No pickup ID specified for photo upload.');
  }

  // 1. Compress image in browser (max 1600px, 0.75 quality)
  const compressed = await compressImage(file, 1600, 0.75);

  if (!supabase) {
    throw new Error('Supabase client is not available. Please verify configuration.');
  }

  // 2. Request signed upload authorization from server using verified session
  const activeSessionToken = typeof window !== 'undefined' ? localStorage.getItem('jiffex_session_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (activeSessionToken) {
    headers['Authorization'] = `Bearer ${activeSessionToken}`;
    headers['x-jiffex-session'] = activeSessionToken;
  }

  const response = await fetch('/api/storage/pickup-items/upload-url', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({
      pickupId,
      itemId: itemId || 'new',
      contentType: compressed.mimeType
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jiffex_session_token');
        window.dispatchEvent(new CustomEvent('jiffex:session-expired', {
          detail: { message: errorData.error || 'Your session has expired. Please sign in again.' }
        }));
      }
      throw new Error(errorData.error || 'Your session has expired. Please sign in again.');
    }
    if (response.status === 403) {
      throw new Error(errorData.error || 'You are not authorized to upload photos for this pickup.');
    }
    if (response.status === 503) {
      throw new Error(errorData.error || 'Pickup item storage is temporarily unavailable. Please try again later.');
    }
    if (response.status === 400) {
      throw new Error(errorData.error || 'Unsupported image format.');
    }
    throw new Error(errorData.error || 'Photo upload failed. Please retry.');
  }

  const { path: storagePath, token } = await response.json();
  if (!storagePath || !token) {
    throw new Error('Photo upload failed. Please retry.');
  }

  // 3. Direct browser-to-Supabase upload using the signed authorization token
  const { error: uploadError } = await supabase.storage
    .from('pickup-items')
    .uploadToSignedUrl(storagePath, token, compressed.blob, {
      contentType: compressed.mimeType,
      cacheControl: '31536000'
    });

  if (uploadError) {
    console.error('[Storage Signed Pickup Item Upload Error]', uploadError);
    throw new Error('Photo upload to storage failed. Please retry.');
  }

  // 4. Return ONLY the storage path (no base64, no public URL)
  return storagePath;
}

// In-memory cache for resolved signed URLs for current view/session
const pickupSignedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Resolves a pickup item Storage path into a short-lived signed download URL.
 * Checks the in-memory cache first to avoid duplicate network requests.
 */
export async function getPickupItemSignedUrl(
  pickupId: string,
  storagePath: string
): Promise<string | null> {
  if (!pickupId || !storagePath) return null;

  // 1. Direct return for legacy base64 and standard http URLs
  if (storagePath.startsWith('data:') || storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }

  // 2. Check memory cache (with 30s buffer before expiration)
  const cacheKey = `${pickupId}:${storagePath}`;
  const cached = pickupSignedUrlCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt - 30000) {
    return cached.url;
  }

  try {
    const activeSessionToken = typeof window !== 'undefined' ? localStorage.getItem('jiffex_session_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (activeSessionToken) {
      headers['Authorization'] = `Bearer ${activeSessionToken}`;
      headers['x-jiffex-session'] = activeSessionToken;
    }

    const response = await fetch('/api/storage/pickup-items/signed-url', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        pickupId,
        path: storagePath
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data?.signedUrl) {
      const expiresIn = data.expiresIn || 600;
      pickupSignedUrlCache.set(cacheKey, {
        url: data.signedUrl,
        expiresAt: Date.now() + expiresIn * 1000
      });
      return data.signedUrl;
    }
  } catch (err) {
    console.warn('[Storage] Failed to resolve pickup item signed URL:', err);
  }

  return null;
}

/**
 * Uploads a KYC/document file (image or PDF) to the private "kyc-documents" bucket
 * using server-authorized signed upload URLs.
 * 
 * - If image: compressed (max 1600px, 0.75 quality WebP/JPEG)
 * - If PDF: uploaded directly without image compression
 * - Stores & returns ONLY the Storage path (orders/{orderId}/documents/{docId}/...)
 */
export async function uploadKycDocument(
  file: File,
  orderId: string,
  documentId?: string
): Promise<string> {
  if (!file) {
    throw new Error('No document file selected.');
  }
  if (!orderId) {
    throw new Error('No order/pickup ID specified for document upload.');
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  let uploadBlob: Blob = file;
  let contentType: string = file.type || 'application/pdf';

  if (!isPdf) {
    // Compress image (max 1600px, 0.75 quality)
    const compressed = await compressImage(file, 1600, 0.75);
    uploadBlob = compressed.blob;
    contentType = compressed.mimeType;
  }

  if (!supabase) {
    throw new Error('Supabase client is not available. Please verify configuration.');
  }

  // Request signed upload authorization from server
  const activeSessionToken = typeof window !== 'undefined' ? localStorage.getItem('jiffex_session_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (activeSessionToken) {
    headers['Authorization'] = `Bearer ${activeSessionToken}`;
    headers['x-jiffex-session'] = activeSessionToken;
  }

  const response = await fetch('/api/storage/kyc-documents/upload-url', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({
      orderId,
      documentId: documentId || ('doc_' + Date.now()),
      contentType
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jiffex_session_token');
        window.dispatchEvent(new CustomEvent('jiffex:session-expired', {
          detail: { message: errorData.error || 'Your session has expired. Please sign in again.' }
        }));
      }
      throw new Error(errorData.error || 'Your session has expired. Please sign in again.');
    }
    if (response.status === 403) {
      throw new Error(errorData.error || 'You are not authorized to upload documents for this order/pickup.');
    }
    if (response.status === 503) {
      throw new Error(errorData.error || 'KYC storage is temporarily unavailable. Please try again later.');
    }
    if (response.status === 400) {
      throw new Error(errorData.error || 'Unsupported document format.');
    }
    throw new Error(errorData.error || 'Document upload failed. Please retry.');
  }

  const { path: storagePath, token } = await response.json();
  if (!storagePath || !token) {
    throw new Error('Document upload failed. Please retry.');
  }

  // Direct browser-to-Supabase upload using signed authorization token
  const { error: uploadError } = await supabase.storage
    .from('kyc-documents')
    .uploadToSignedUrl(storagePath, token, uploadBlob, {
      contentType,
      cacheControl: '31536000'
    });

  if (uploadError) {
    console.error('[Storage Signed KYC Upload Error]', uploadError);
    throw new Error('Document upload to storage failed. Please retry.');
  }

  // Return ONLY the storage path
  return storagePath;
}

