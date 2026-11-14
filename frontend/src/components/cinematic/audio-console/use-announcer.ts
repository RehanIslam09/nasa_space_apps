'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface AnnouncerControls {
  announcement: string;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceDebounced: (message: string, delayMs?: number) => void;
}

export function useAnnouncer(): AnnouncerControls {
  const [announcement, setAnnouncement] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const announce = useCallback((message: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setAnnouncement(message);
  }, []);

  const announceDebounced = useCallback((message: string, delayMs = 350) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setAnnouncement(message);
    }, delayMs);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    announcement,
    announce,
    announceDebounced,
  };
}
