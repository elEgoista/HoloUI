export type HologramAgentState =
  | "idle"
  | "listening"
  | "confirm"
  | "running"
  | "approval"
  | "result";

export type HologramResultStatus = "success" | "review" | "failed";

export type VoiceRuntimeState = {
  mic: "idle" | "listening" | "processing" | "muted" | "error";
  wakeWord?: string;
  lastHeard?: string;
  confidence?: number;
  voiceControl: "active" | "inactive";
};

export type VoiceOption = {
  id: string;
  phrase: string;
  description?: string;
  tone?: "default" | "primary" | "warning" | "error";
};

export type ProgressStep = {
  label: string;
  status: "pending" | "active" | "done" | "failed";
};

export type HologramRuntimeState = {
  agentState: HologramAgentState;
  resultStatus?: HologramResultStatus;
  projectName: string;
  branchName?: string;
  currentTask?: string;
  transcript?: string;
  voice: VoiceRuntimeState;
  availableVoiceCommands: VoiceOption[];
  progressSteps?: ProgressStep[];
  approval?: {
    command: string;
    risk?: string;
  };
  result?: {
    changedFiles?: number;
    testsPassed?: number;
    testsFailed?: number;
    summary?: string;
    reason?: string;
  };
  connection: {
    bridge: "connected" | "reconnecting" | "offline";
    codex: "ready" | "busy" | "offline" | "error";
    project: "active" | "missing" | "unknown";
  };
};
