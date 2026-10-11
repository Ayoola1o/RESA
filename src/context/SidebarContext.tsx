'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

interface SidebarContextType {
  isDesktopOpen: boolean;
  setIsDesktopOpen: (open: boolean) => void;
  toggleDesktopSidebar: () => void;
  closeDesktopSidebar: () => void;
  openDesktopSidebar: () => void;
}

const defaultContextValue: SidebarContextType = {
  isDesktopOpen: true,
  setIsDesktopOpen: () => {},
  toggleDesktopSidebar: () => {},
  closeDesktopSidebar: () => {},
  openDesktopSidebar: () => {},
};

const SidebarContext = createContext<SidebarContextType>(defaultContextValue);

const STORAGE_KEY = 'prophunta_desktop_sidebar_open';

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isDesktopOpen, setIsDesktopOpenState] = useState<boolean>(true);

  // Sync initial state from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsDesktopOpenState(stored === 'true');
      }
    } catch {
      // Ignore localStorage access restrictions in SSR/incognito
    }
  }, []);

  const setIsDesktopOpen = useCallback((open: boolean) => {
    setIsDesktopOpenState(open);
    try {
      localStorage.setItem(STORAGE_KEY, String(open));
    } catch {}
  }, []);

  const toggleDesktopSidebar = useCallback(() => {
    setIsDesktopOpenState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const closeDesktopSidebar = useCallback(() => {
    setIsDesktopOpen(false);
  }, [setIsDesktopOpen]);

  const openDesktopSidebar = useCallback(() => {
    setIsDesktopOpen(true);
  }, [setIsDesktopOpen]);

  // Global keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        // Prevent default browser bookmark shortcut if focused in app
        if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
          e.preventDefault();
          toggleDesktopSidebar();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDesktopSidebar]);

  return (
    <SidebarContext.Provider
      value={{
        isDesktopOpen,
        setIsDesktopOpen,
        toggleDesktopSidebar,
        closeDesktopSidebar,
        openDesktopSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useAppSidebar() {
  const context = useContext(SidebarContext);
  return context || defaultContextValue;
}
