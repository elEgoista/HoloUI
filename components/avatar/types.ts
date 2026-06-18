export type HoloAvatarState =
  | "idle"
  | "listening"
  | "confirm"
  | "running"
  | "approval"
  | "result-success"
  | "result-warning"
  | "result-error";

export interface HoloAvatarProps {
  state: HoloAvatarState;
  mirrored?: boolean;
  speaking?: boolean;
  animate?: boolean;
  className?: string;
  forceBlink?: boolean;
  forceSmile?: boolean;
  forceBlinkNonce?: number;
  forceSmileNonce?: number;
  onActiveAssetChange?: (asset: HoloAvatarAssetKey) => void;
}

export type HoloAvatarAssetKey =
  | "neutral"
  | "thinking"
  | "softSmile"
  | "eyesClosed"
  | "smileEyesClosed"
  | "talk-1"
  | "talk-2"
  | "talk-3"
  | "cssFallback";
