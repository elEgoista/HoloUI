"use client";

import { useEffect, useState } from "react";

const MIN_BLINK_DELAY_MS = 3000;
const MAX_BLINK_DELAY_MS = 7000;
const MIN_BLINK_DURATION_MS = 120;
const MAX_BLINK_DURATION_MS = 180;

function getNextBlinkDelay() {
  return MIN_BLINK_DELAY_MS + Math.random() * (MAX_BLINK_DELAY_MS - MIN_BLINK_DELAY_MS);
}

function getNextBlinkDuration() {
  return MIN_BLINK_DURATION_MS + Math.random() * (MAX_BLINK_DURATION_MS - MIN_BLINK_DURATION_MS);
}

export function useBlink(enabled = true) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsBlinking(false);
      return undefined;
    }

    let blinkTimer: number | undefined;
    let resetTimer: number | undefined;
    let disposed = false;

    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(() => {
        if (disposed) return;
        setIsBlinking(true);

        resetTimer = window.setTimeout(() => {
          if (disposed) return;
          setIsBlinking(false);
          scheduleBlink();
        }, getNextBlinkDuration());
      }, getNextBlinkDelay());
    };

    scheduleBlink();

    return () => {
      disposed = true;
      if (blinkTimer) window.clearTimeout(blinkTimer);
      if (resetTimer) window.clearTimeout(resetTimer);
    };
  }, [enabled]);

  return isBlinking;
}
