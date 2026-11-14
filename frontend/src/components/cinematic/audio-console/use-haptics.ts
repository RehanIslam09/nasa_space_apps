'use client';

import { useState, useCallback, useEffect } from 'react';

export type HapticPattern = 'tap' | 'double' | 'tick' | 'success' | 'pulse';

export interface HapticsControls {
  isSupported: boolean;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  triggerHaptic: (pattern?: HapticPattern) => void;
}

export function useHaptics(): HapticsControls {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      setIsSupported(true);
    }
  }, []);

  const triggerHaptic = useCallback(
    (pattern: HapticPattern = 'tick') => {
      if (!isEnabled || !isSupported || typeof navigator === 'undefined' || !navigator.vibrate) {
        return;
      }

      try {
        switch (pattern) {
          case 'tick':
            navigator.vibrate(10);
            break;
          case 'tap':
            navigator.vibrate(25);
            break;
          case 'double':
            navigator.vibrate([20, 40, 20]);
            break;
          case 'success':
            navigator.vibrate([15, 30, 25, 40, 35]);
            break;
          case 'pulse':
            navigator.vibrate([40, 60, 40]);
            break;
        }
      } catch {
        // Ignore vibration errors
      }
    },
    [isEnabled, isSupported]
  );

  return {
    isSupported,
    isEnabled,
    setIsEnabled,
    triggerHaptic,
  };
}
