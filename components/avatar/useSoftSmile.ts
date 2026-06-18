"use client";

import { useEffect, useState } from "react";

const MIN_SMILE_DELAY_MS = 20000;
const MAX_SMILE_DELAY_MS = 45000;
const MIN_SMILE_DURATION_MS = 1200;
const MAX_SMILE_DURATION_MS = 2500;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function useSoftSmile(enabled = true) {
  const [isSmiling, setIsSmiling] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsSmiling(false);
      return undefined;
    }

    let smileTimer: number | undefined;
    let resetTimer: number | undefined;
    let disposed = false;

    const scheduleSmile = () => {
      smileTimer = window.setTimeout(() => {
        if (disposed) return;
        setIsSmiling(true);

        resetTimer = window.setTimeout(() => {
          if (disposed) return;
          setIsSmiling(false);
          scheduleSmile();
        }, randomBetween(MIN_SMILE_DURATION_MS, MAX_SMILE_DURATION_MS));
      }, randomBetween(MIN_SMILE_DELAY_MS, MAX_SMILE_DELAY_MS));
    };

    scheduleSmile();

    return () => {
      disposed = true;
      if (smileTimer) window.clearTimeout(smileTimer);
      if (resetTimer) window.clearTimeout(resetTimer);
    };
  }, [enabled]);

  return isSmiling;
}
