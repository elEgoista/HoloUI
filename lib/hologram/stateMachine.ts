import type { AgentStatus } from "./types";

const allowedTransitions: Record<AgentStatus, AgentStatus[]> = {
  idle: ["listening", "transcribed", "awaiting_confirmation", "running", "failed"],
  listening: ["transcribed", "idle", "failed"],
  transcribed: ["awaiting_confirmation", "listening", "idle"],
  awaiting_confirmation: ["running", "transcribed", "idle", "failed"],
  running: ["needs_approval", "review", "completed", "failed"],
  needs_approval: ["running", "review", "failed"],
  review: ["running", "completed", "failed"],
  completed: ["running", "idle"],
  failed: ["running", "idle"]
};

export function canTransition(from: AgentStatus, to: AgentStatus) {
  return allowedTransitions[from].includes(to);
}

export function assertTransition(from: AgentStatus, to: AgentStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid agent status transition: ${from} -> ${to}`);
  }
}
