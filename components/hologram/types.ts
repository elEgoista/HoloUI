export type HologramAgentState =
  | "wakeup"
  | "projectChatPicker"
  | "chatContext"
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

export type HologramBackgroundEventType =
  | "taskCompleted"
  | "approvalNeeded"
  | "taskFailed"
  | "taskProgress";

export type HologramBackgroundEvent = {
  id: string;
  source: "codex" | "holocode" | "local";
  projectId: string;
  chatId?: string;
  title: string;
  type: HologramBackgroundEventType;
  message: string;
  tone: "default" | "success" | "warning" | "error";
  voiceCommands: Array<{
    id: string;
    phrase: string;
  }>;
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
  sourceName?: string;
  chatName?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  projectChats?: Array<{
    id: string;
    name: string;
    source: string;
    detail: string;
    recent: string;
  }>;
  backgroundEvents?: HologramBackgroundEvent[];
  runningTasksCount?: number;
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
    project: "active" | "missing" | "unknown" | "none";
    railStatus?: "approval needed" | "ready" | "off" | "on";
  };
};
