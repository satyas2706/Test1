import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';
import { getKycDocumentSignedUrl } from '../utils/imageCompression';

interface KycDocumentThumbnailProps {
  orderId?: string;
  image?: string;
  alt?: string;
  className?: string;
  onOpenDocument?: (url: string, isPdf: boolean) => void;
}

/**
 * On-demand rendering component for KYC documents (images & PDFs):
 * - If image starts with 'data:' -> render directly (legacy base64)
 * - If image starts with 'http://' or 'https://' -> render directly
 * - Otherwise treat as private kyc-documents Storage path and fetch short-lived signed URL on-demand
 * - If PDF: displays PDF icon badge and provides click action to view PDF via signed URL
 * - If Image: displays thumbnail image
 * - Uses in-memory cache to avoid redundant requests during view/session
 */
export const KycDocumentThumbnail: React.FC<KycDocumentThumbnailProps> = ({
  orderId,
  image,
  alt = 'Document',
  className = 'w-full h-full object-cover',
  onOpenDocument
}) => {
  const isPdf = Boolean(
    image && (
      image.toLowerCase().endsWith('.pdf') ||
      image.includes('.pdf?') ||
      image.startsWith('data:application/pdf')
    )
  );

  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => {
    if (!image) return null;
    if (image.startsWith('data:') || image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!image) {
      setResolvedSrc(null);
      return;
    }

    if (image.startsWith('data:') || image.startsWith('http://') || image.startsWith('https://')) {
      setResolvedSrc(image);
      return;
    }

    // Storage path: resolve signed URL on-demand for this specific KYC document
    let isMounted = true;
    if (orderId) {
      setLoading(true);
      getKycDocumentSignedUrl(orderId, image)
        .then((url) => {
          if (isMounted) {
            setResolvedSrc(url);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [orderId, image]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!resolvedSrc) {
      if (orderId && image) {
        getKycDocumentSignedUrl(orderId, image).then((url) => {
          if (url) {
            setResolvedSrc(url);
            if (onOpenDocument) {
              onOpenDocument(url, isPdf);
            } else {
              window.open(url, '_blank', 'noopener,noreferrer');
            }
          }
        });
      }
      return;
    }

    if (onOpenDocument) {
      onOpenDocument(resolvedSrc, isPdf);
    } else {
      window.open(resolvedSrc, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }

  if (isPdf) {
    return (
      <button
        type="button"
        onClick={handleClick}
        title="View PDF document"
        className="w-full h-full flex flex-col items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors p-1 text-center cursor-pointer group"
      >
        <FileText size={18} className="text-rose-500 group-hover:scale-110 transition-transform" />
        <span className="text-[8px] font-black uppercase tracking-wider text-rose-700 mt-0.5">PDF</span>
      </button>
    );
  }

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={alt}
        className={`${className} cursor-pointer`}
        onClick={handleClick}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div 
      onClick={handleClick}
      className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
    >
      <ImageIcon size={18} />
    </div>
  );
};
