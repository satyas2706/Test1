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
  const response = await fetch('/api/storage/product-upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      productId: productIdOrPrefix,
      contentType: compressed.mimeType
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error(errorData.error || 'Your session has expired. Please sign in again.');
    }
    if (response.status === 403) {
      throw new Error(errorData.error || 'You are not authorized to upload product images.');
    }
    if (response.status === 503) {
      throw new Error(errorData.error || 'Product image storage is not configured.');
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
