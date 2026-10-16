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
    __propHuntaGoogleMapsPromise?: Promise<any>;
    __propHuntaGoogleMapsAuthFailed?: boolean;
    __propHuntaAuthFailureListeners?: Array<() => void>;
  }
}

export type GoogleMapsStatus = 'idle' | 'loading' | 'ready' | 'error' | 'missing-key' | 'auth-failure';

export function getGoogleMapsApiKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
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

  // Already loaded and ready
  if (window.google?.maps) {
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

  // Hook gm_authFailure once
  const previousAuthFailure = window.gm_authFailure;
  window.gm_authFailure = () => {
    window.__propHuntaGoogleMapsAuthFailed = true;
    if (previousAuthFailure && typeof previousAuthFailure === 'function') {
      previousAuthFailure();
    }
    if (window.__propHuntaAuthFailureListeners) {
      window.__propHuntaAuthFailureListeners.forEach((listener) => {
        try {
          listener();
        } catch (e) {
          console.error('[GoogleMaps] Error in authFailure listener:', e);
        }
      });
    }
  };

  const scriptId = 'prophunta-google-maps-script';
  const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

  window.__propHuntaGoogleMapsPromise = new Promise((resolve, reject) => {
    if (existingScript) {
      // Script tag exists, wait for google.maps
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkInterval);
          resolve(window.google.maps);
        }
      }, 50);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.google?.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps script loading timed out'));
        }
      }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Poll briefly for maps object to attach
      const interval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(interval);
          resolve(window.google.maps);
        }
      }, 30);

      setTimeout(() => {
        clearInterval(interval);
        if (window.google?.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps loaded but google.maps was not initialized'));
        }
      }, 5000);
    };

    script.onerror = (err) => {
      window.__propHuntaGoogleMapsPromise = undefined;
      reject(new Error('Failed to load Google Maps script. Check network connection or API Key.'));
    };

    document.head.appendChild(script);
  });

  return window.__propHuntaGoogleMapsPromise;
}
