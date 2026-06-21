import type { HologramAgentState } from "./types";

export type HologramDebugRoute = {
  state: HologramAgentState;
  slug: string;
  label: string;
};

export const hologramDebugRoutes: readonly HologramDebugRoute[] = [
  { state: "wakeup", slug: "wakeup", label: "Wakeup" },
  { state: "projectChatPicker", slug: "project-chat-picker", label: "Project chat picker" },
  { state: "chatContext", slug: "chat-context", label: "Chat context" },
  { state: "listening", slug: "listening", label: "Listening" },
  { state: "confirm", slug: "confirm", label: "Confirm" },
  { state: "running", slug: "running", label: "Running" },
  { state: "approval", slug: "approval", label: "Approval" },
  { state: "result", slug: "result", label: "Result" }
];

export function getHologramDebugRoute(slug: string) {
  return hologramDebugRoutes.find((route) => route.slug === slug);
}
