import type { HoloAvatarAssetKey } from "./types";

export type AvatarAsset = {
  key: HoloAvatarAssetKey;
  src: string;
  required?: boolean;
};

export const avatarAssets = {
  neutral: {
    key: "neutral",
    src: "/avatar/avatar-base-neutral.png",
    required: true
  },
  thinking: {
    key: "thinking",
    src: "/avatar/avatar-thinking-neutral.png"
  },
  softSmile: {
    key: "softSmile",
    src: "/avatar/avatar-soft-smile.png"
  },
  eyesClosed: {
    key: "eyesClosed",
    src: "/avatar/avatar-eyes-closed.png"
  },
  smileEyesClosed: {
    key: "smileEyesClosed",
    src: "/avatar/avatar-smile-eyes-closed.png"
  },
  talk: [
    {
      key: "talk-1",
      src: "/avatar/avatar-talk-1.png"
    },
    {
      key: "talk-2",
      src: "/avatar/avatar-talk-2.png"
    },
    {
      key: "talk-3",
      src: "/avatar/avatar-talk-3.png"
    }
  ]
} satisfies {
  neutral: AvatarAsset;
  thinking: AvatarAsset;
  softSmile: AvatarAsset;
  eyesClosed: AvatarAsset;
  smileEyesClosed: AvatarAsset;
  talk: [AvatarAsset, AvatarAsset, AvatarAsset];
};

export const avatarAssetList: AvatarAsset[] = [
  avatarAssets.neutral,
  avatarAssets.thinking,
  avatarAssets.softSmile,
  avatarAssets.eyesClosed,
  avatarAssets.smileEyesClosed,
  ...avatarAssets.talk
];
