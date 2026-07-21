import { useEffect } from 'react';

/**
 * Resets auth button state when the page is restored from the browser's
 * back-forward cache (bfcache). Without this, navigating back from the IdP
 * redirect leaves buttons stuck in their loading state indefinitely.
 */
export function useBfcacheReset(setLoading: (v: boolean) => void, setProvider: (v: null) => void): void {
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setLoading(false);
        setProvider(null);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
