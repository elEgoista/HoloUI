"use client";

import { motion, type Transition } from "framer-motion";
import Image from "next/image";
import type { SyntheticEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { AvatarBackplate } from "./AvatarBackplate";
import { avatarAssetList, avatarAssets } from "./avatarAssets";
import styles from "./HoloAvatar.module.css";
import type { HoloAvatarAssetKey, HoloAvatarProps, HoloAvatarState } from "./types";
import { useBlink } from "./useBlink";
import { useSoftSmile } from "./useSoftSmile";
import { useSpeakingMouth } from "./useSpeakingMouth";

const stateLabels: Record<HoloAvatarState, string> = {
  idle: "Ready",
  listening: "Listening",
  confirm: "Command recognized",
  running: "Running task",
  approval: "Approval required",
  "result-success": "Task completed",
  "result-warning": "Review needed",
  "result-error": "Task failed"
};

const loopTransition: Transition = {
  duration: 4.8,
  ease: "easeInOut",
  repeat: Infinity,
  repeatType: "mirror"
};

const warnedMissingAssets = new Set<HoloAvatarAssetKey>();

function shouldAllowAmbientSmile(state: HoloAvatarState) {
  return state === "idle";
}

function getBaseAsset(state: HoloAvatarState): HoloAvatarAssetKey {
  if (state === "result-success") return "softSmile";
  if (state === "running") return "thinking";
  return "neutral";
}

function getFallbackAsset(
  requestedAsset: HoloAvatarAssetKey,
  missingAssets: Partial<Record<HoloAvatarAssetKey, true>>
): HoloAvatarAssetKey {
  if (!missingAssets[requestedAsset]) return requestedAsset;
  if (requestedAsset === "softSmile" && !missingAssets.neutral) return "neutral";
  if (requestedAsset === "smileEyesClosed" && !missingAssets.softSmile) return "softSmile";
  if (requestedAsset === "smileEyesClosed" && !missingAssets.eyesClosed) return "eyesClosed";
  if (requestedAsset === "eyesClosed" && !missingAssets.neutral) return "neutral";
  if (requestedAsset.startsWith("talk-") && !missingAssets.neutral) return "neutral";
  if (requestedAsset === "thinking" && !missingAssets.neutral) return "neutral";
  return missingAssets.neutral ? "cssFallback" : "neutral";
}

export function HoloAvatar({
  state,
  mirrored = false,
  speaking = false,
  animate = true,
  className,
  forceBlink = false,
  forceSmile = false,
  forceBlinkNonce = 0,
  forceSmileNonce = 0,
  onActiveAssetChange
}: HoloAvatarProps) {
  const isBlinking = useBlink(animate);
  const isSmiling = useSoftSmile(animate && shouldAllowAmbientSmile(state));
  const talkFrameIndex = useSpeakingMouth(animate && speaking);
  const [missingAssets, setMissingAssets] = useState<Partial<Record<HoloAvatarAssetKey, true>>>({});
  const [forcedBlink, setForcedBlink] = useState(false);
  const [forcedSmile, setForcedSmile] = useState(false);

  const activeAsset = useMemo(() => {
    const baseAsset = getBaseAsset(state);
    const wantsSmile = forceSmile || forcedSmile || isSmiling || state === "result-success";
    const wantsBlink = forceBlink || forcedBlink || isBlinking;
    const requestedAsset = (() => {
      if (speaking) return avatarAssets.talk[talkFrameIndex]?.key ?? "neutral";
      if (wantsBlink && wantsSmile) return "smileEyesClosed";
      if (wantsBlink) return "eyesClosed";
      if (wantsSmile) return "softSmile";
      return baseAsset;
    })();

    return getFallbackAsset(requestedAsset, missingAssets);
  }, [forceBlink, forceSmile, forcedBlink, forcedSmile, isBlinking, isSmiling, missingAssets, speaking, state, talkFrameIndex]);

  const rootClassName = [styles.root, mirrored ? styles.mirrored : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  const floatAnimation = animate
    ? {
        y: [0, -8, 0],
        scale: [1, 1.015, 1]
      }
    : undefined;

  useEffect(() => {
    onActiveAssetChange?.(activeAsset);
  }, [activeAsset, onActiveAssetChange]);

  useEffect(() => {
    if (!forceBlinkNonce) return undefined;
    setForcedBlink(true);
    const timeout = window.setTimeout(() => setForcedBlink(false), 650);
    return () => window.clearTimeout(timeout);
  }, [forceBlinkNonce]);

  useEffect(() => {
    if (!forceSmileNonce) return undefined;
    setForcedSmile(true);
    const timeout = window.setTimeout(() => setForcedSmile(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [forceSmileNonce]);

  function handleAssetError(assetKey: HoloAvatarAssetKey, event: SyntheticEvent<HTMLImageElement>) {
    event.currentTarget.hidden = true;
    setMissingAssets((current) => ({ ...current, [assetKey]: true }));

    if (process.env.NODE_ENV !== "production" && !warnedMissingAssets.has(assetKey)) {
      warnedMissingAssets.add(assetKey);
      console.warn(`[HoloAvatar] Missing avatar asset: ${assetKey}`);
    }
  }

  return (
    <div
      className={rootClassName}
      data-state={state}
      data-speaking={speaking ? "true" : "false"}
      data-active-asset={activeAsset}
      aria-label={`Holographic assistant avatar: ${stateLabels[state]}`}
      role="img"
    >
      <motion.div
        className={styles.stage}
        animate={floatAnimation}
        initial={animate ? { opacity: 0.82, scale: 0.985 } : false}
        transition={loopTransition}
      >
        <AvatarBackplate
          state={state}
          listening={state === "listening"}
          speaking={speaking}
          animate={animate}
        />

        <div className={styles.characterStack}>
          {avatarAssetList.map((asset) => (
            <Image
              key={asset.key}
              alt=""
              aria-hidden="true"
              className={[
                styles.characterFrame,
                activeAsset === asset.key ? styles.characterFrameActive : ""
              ].join(" ")}
              draggable={false}
              fill
              onError={(event) => handleAssetError(asset.key, event)}
              priority
              sizes="(max-width: 760px) 90vw, 620px"
              src={asset.src}
              unoptimized
            />
          ))}
        </div>

        <div
          className={[
            styles.portrait,
            activeAsset === "cssFallback" ? styles.portraitVisible : styles.portraitHidden
          ].join(" ")}
          aria-hidden="true"
        >
          <div className={styles.hairBack} />
          <div className={styles.neck} />
          <div className={styles.shoulders} />
          <div className={styles.face}>
            <div className={styles.fringe} />
            <div className={styles.eyeLeft}>
              <span className={isBlinking ? styles.blink : ""} />
            </div>
            <div className={styles.eyeRight}>
              <span className={isBlinking ? styles.blink : ""} />
            </div>
            <div className={styles.nose} />
            <div className={styles.mouth} />
          </div>
          <div className={styles.collar} />
          <div className={styles.coreLight} />
        </div>

        <div className={styles.statusGlyph} />
      </motion.div>
    </div>
  );
}
