/**
 * PropHunta AI — Google Maps Platform Script Loader
 * 
 * Safely loads Google Maps JavaScript API without duplicate script tags,
 * supports React 19 / Next.js client navigation, and intercepts gm_authFailure
 * for graceful UI error recovery.
 */

// Global type declarations for window.google
declare global {
  interface Window {
    google?: any;
    gm_authFailure?: () => void;
    __propHuntaGoogleMapsReady?: () => void;
    __propHuntaGoogleMapsPromise?: Promise<any>;
    __propHuntaGoogleMapsAuthFailed?: boolean;
    __propHuntaAuthFailureListeners?: Array<() => void>;
  }
}

export type GoogleMapsStatus = 'idle' | 'loading' | 'ready' | 'error' | 'missing-key' | 'auth-failure';

export function getGoogleMapsApiKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';
}

/**
 * Register a listener for Google Maps authentication failures
 * (triggered when an API key is restricted, expired, or invalid).
 */
export function onGoogleMapsAuthFailure(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  if (!window.__propHuntaAuthFailureListeners) {
    window.__propHuntaAuthFailureListeners = [];
  }
  window.__propHuntaAuthFailureListeners.push(callback);

  if (window.__propHuntaGoogleMapsAuthFailed) {
    callback();
  }

  return () => {
    if (window.__propHuntaAuthFailureListeners) {
      window.__propHuntaAuthFailureListeners = window.__propHuntaAuthFailureListeners.filter(
        (cb) => cb !== callback
      );
    }
  };
}

/**
 * Singleton script loader for Google Maps JavaScript API
 */
export function loadGoogleMapsScript(customApiKey?: string): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only be loaded in a browser environment'));
  }

  if (window.__propHuntaGoogleMapsAuthFailed) return Promise.reject(new Error('MAPS_AUTH_FAILURE'));

  // Already loaded and ready
  if (typeof window.google?.maps?.Map === 'function') {
    return Promise.resolve(window.google.maps);
  }

  // Re-use active loading promise to prevent duplicate injection
  if (window.__propHuntaGoogleMapsPromise) {
    return window.__propHuntaGoogleMapsPromise;
  }

  const apiKey = (customApiKey || getGoogleMapsApiKey()).trim();

  if (!apiKey) {
    const missingKeyError = new Error('MISSING_API_KEY');
    return Promise.reject(missingKeyError);
  }

  const script = document.createElement('script');
  const previousAuthFailure = window.gm_authFailure;
  let authHandler: () => void;
  const pending = new Promise((resolve, reject) => {
    function finish(error?: Error) {
      clearTimeout(timeout);
      delete window.__propHuntaGoogleMapsReady;
      script.onerror = null;
      if (!error) {
        resolve(window.google.maps);
        return;
      }
      script.remove();
      if (window.gm_authFailure === authHandler) window.gm_authFailure = previousAuthFailure;
      reject(error);
    }

    const timeout = setTimeout(() => finish(new Error('Google Maps script loading timed out.')), 10000);
    window.__propHuntaGoogleMapsReady = () => finish(
      typeof window.google?.maps?.Map === 'function' ? undefined : new Error('Google Maps could not initialize.'),
    );
    authHandler = () => {
      window.__propHuntaGoogleMapsAuthFailed = true;
      if (window.__propHuntaGoogleMapsReady) finish(new Error('MAPS_AUTH_FAILURE'));
      for (const listener of window.__propHuntaAuthFailureListeners ?? []) listener();
      previousAuthFailure?.();
    };
    window.gm_authFailure = authHandler;
    script.id = 'prophunta-google-maps-script';
    const params = new URLSearchParams({
      key: apiKey,
      v: 'weekly',
      loading: 'async',
      callback: '__propHuntaGoogleMapsReady',
    });
    script.src = 'https://maps.googleapis.com/maps/api/js?' + params;
    script.async = true;
    script.onerror = () => finish(new Error('Failed to load Google Maps. Check your connection.'));
    document.head.appendChild(script);
  });

  window.__propHuntaGoogleMapsPromise = pending.catch((error) => {
    window.__propHuntaGoogleMapsPromise = undefined;
    throw error;
  });
  return window.__propHuntaGoogleMapsPromise;
}
