"use client";

import { useEffect, useState } from "react";

const TALK_FRAME_MS = 150;
const TALK_FRAME_SEQUENCE = [0, 1, 2, 1, 0];

export function useSpeakingMouth(active = false) {
  const [sequenceIndex, setSequenceIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setSequenceIndex(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setSequenceIndex((current) => (current + 1) % TALK_FRAME_SEQUENCE.length);
    }, TALK_FRAME_MS);

    return () => window.clearInterval(interval);
  }, [active]);

  return TALK_FRAME_SEQUENCE[sequenceIndex];
}
