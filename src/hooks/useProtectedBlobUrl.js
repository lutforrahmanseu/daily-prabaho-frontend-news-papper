import { useEffect, useState } from 'react';
import { fetchProtectedEpaperBlob } from '../utils/epaperHelpers.js';

/**
 * Safely fetches a permission-gated PDF or preview image via Bearer token
 * into an in-memory Blob URL and revokes it automatically on cleanup.
 */
export function useProtectedBlobUrl(streamUrl, token = null, skip = false) {
  const [blobUrl, setBlobUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!streamUrl || skip) {
      setBlobUrl('');
      setLoading(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    let createdUrl = '';
    setLoading(true);
    setError(null);

    fetchProtectedEpaperBlob(streamUrl, token)
      .then((blob) => {
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setBlobUrl('');
        setError(err?.status || 403);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [streamUrl, token, skip]);

  return { blobUrl, loading, error };
}

export default useProtectedBlobUrl;

