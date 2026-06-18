"use client";

import type { CSSProperties } from "react";
import {
  idleWaveformBars,
  listeningWaveformBars,
  markerPositions,
  particlePositions,
  runningWaveformBars
} from "./avatarBackplateData";
import styles from "./AvatarBackplate.module.css";
import type { HoloAvatarState } from "./types";

export type AvatarBackplateState = HoloAvatarState;

export interface AvatarBackplateProps {
  state: AvatarBackplateState;
  listening?: boolean;
  speaking?: boolean;
  mirrored?: boolean;
  animate?: boolean;
  className?: string;
}

function getBars(state: AvatarBackplateState, listening?: boolean, speaking?: boolean) {
  if (state === "running") return runningWaveformBars;
  if (state === "listening" || listening || speaking) return listeningWaveformBars;
  return idleWaveformBars;
}

export function AvatarBackplate({
  state,
  listening = false,
  speaking = false,
  mirrored = false,
  animate = true,
  className
}: AvatarBackplateProps) {
  const bars = getBars(state, listening, speaking);

  return (
    <div
      className={[
        styles.root,
        mirrored ? styles.mirrored : "",
        animate ? "" : styles.static,
        className ?? ""
      ].filter(Boolean).join(" ")}
      data-state={state}
      data-listening={listening ? "true" : "false"}
      data-speaking={speaking ? "true" : "false"}
      aria-hidden="true"
    >
      <div className={styles.coreGlow} />
      <div className={styles.outerRing} />
      <div className={styles.midRing} />
      <div className={styles.innerRing} />
      <div className={styles.arcA} />
      <div className={styles.arcB} />
      <div className={styles.alignmentHorizontal} />
      <div className={styles.alignmentVertical} />
      <div className={styles.cornerA} />
      <div className={styles.cornerB} />
      <div className={styles.cornerC} />
      <div className={styles.cornerD} />

      <div className={styles.waveform}>
        {bars.map((height, index) => (
          <i
            key={`${height}-${index}`}
            style={
              {
                "--bar-height": `${height}%`,
                "--bar-index": index
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className={styles.markers}>
        {markerPositions.map((marker) => (
          <i
            key={marker.label}
            style={
              {
                "--marker-x": `${marker.x}%`,
                "--marker-y": `${marker.y}%`
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className={styles.particles}>
        {particlePositions.map(([x, y], index) => (
          <i
            key={`${x}-${y}`}
            style={
              {
                "--particle-x": `${x}%`,
                "--particle-y": `${y}%`,
                "--particle-index": index
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className={styles.scanSweep} />
      <div className={styles.stateNode} />
    </div>
  );
}
