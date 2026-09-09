import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { getPickupItemSignedUrl } from '../utils/imageCompression';

interface PickupItemThumbnailProps {
  pickupId?: string;
  image?: string;
  alt?: string;
  className?: string;
  fallbackIconSize?: number;
}

/**
 * On-demand rendering component for pickup item images:
 * - If image starts with 'data:' -> render directly (legacy base64)
 * - If image starts with 'http://' or 'https://' -> render directly
 * - Otherwise treat as private pickup-items Storage path and fetch short-lived signed URL on-demand
 * - Uses in-memory cache to avoid redundant requests during view/session
 */
export const PickupItemThumbnail: React.FC<PickupItemThumbnailProps> = ({
  pickupId,
  image,
  alt = 'Item',
  className = 'w-full h-full object-cover',
  fallbackIconSize = 20
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => {
    if (!image) return null;
    if (image.startsWith('data:') || image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    return null;
  });

  useEffect(() => {
    if (!image) {
      setResolvedSrc(null);
      return;
    }

    if (image.startsWith('data:') || image.startsWith('http://') || image.startsWith('https://')) {
      setResolvedSrc(image);
      return;
    }

    // Storage path: resolve signed URL on-demand for this specific pickup item
    let isMounted = true;
    if (pickupId) {
      getPickupItemSignedUrl(pickupId, image).then((url) => {
        if (isMounted && url) {
          setResolvedSrc(url);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [pickupId, image]);

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={alt}
        className={className}
        referrerPolicy="no-referrer"
      />
    );
  }

  return <Package size={fallbackIconSize} />;
};
