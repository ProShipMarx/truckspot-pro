import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to generate signed URLs for private storage bucket files
 * @param storagePath - The storage path (not a URL)
 * @param bucket - The storage bucket name
 * @param expirySeconds - How long the signed URL should be valid (default 1 hour)
 */
export const useSignedUrl = (
  storagePath: string | null | undefined,
  bucket: string = 'delivery-proofs',
  expirySeconds: number = 3600
) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateSignedUrl = async () => {
      if (!storagePath) {
        setSignedUrl(null);
        return;
      }

      // If it's already a full URL (legacy data), use it directly
      if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
        setSignedUrl(storagePath);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(storagePath, expirySeconds);

        if (signError) {
          throw signError;
        }

        setSignedUrl(data.signedUrl);
      } catch (err: any) {
        console.error('Error generating signed URL:', err);
        setError(err.message || 'Failed to generate signed URL');
        setSignedUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    generateSignedUrl();
  }, [storagePath, bucket, expirySeconds]);

  return { signedUrl, isLoading, error };
};

/**
 * Component helper to display an image from private storage
 */
export const useDeliveryProofUrls = (photoPath: string | null | undefined, signaturePath: string | null | undefined) => {
  const { signedUrl: photoUrl, isLoading: photoLoading } = useSignedUrl(photoPath, 'delivery-proofs');
  const { signedUrl: signatureUrl, isLoading: signatureLoading } = useSignedUrl(signaturePath, 'delivery-proofs');

  return {
    photoUrl,
    signatureUrl,
    isLoading: photoLoading || signatureLoading
  };
};
