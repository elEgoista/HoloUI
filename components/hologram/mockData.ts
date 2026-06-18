import type { HologramRuntimeState } from "./types";

const baseConnection: HologramRuntimeState["connection"] = {
  bridge: "connected",
  codex: "ready",
  project: "active"
};

export const defaultTranscript =
  "Create the hologram debug page and add all assistant states.";

export const hologramStates: HologramRuntimeState[] = [
  {
    agentState: "idle",
    projectName: "HoloCodex Deck",
    branchName: "feature/hologram-ui",
    voice: { mic: "idle", wakeWord: "Codex", voiceControl: "active" },
    availableVoiceCommands: [
      { id: "wake", phrase: "Codex", description: "wake up", tone: "primary" }
    ],
    connection: baseConnection
  },
  {
    agentState: "listening",
    projectName: "HoloCodex Deck",
    branchName: "feature/hologram-ui",
    voice: { mic: "listening", wakeWord: "Codex", voiceControl: "active" },
    availableVoiceCommands: [
      { id: "cancel", phrase: "cancel", description: "stop listening" }
    ],
    connection: baseConnection
  },
  {
    agentState: "confirm",
    projectName: "HoloCodex Deck",
    branchName: "feature/hologram-ui",
    transcript: defaultTranscript,
    voice: {
      mic: "processing",
      lastHeard: defaultTranscript,
      confidence: 0.92,
      voiceControl: "active"
    },
    availableVoiceCommands: [
      { id: "send", phrase: "Send to Codex", tone: "primary" },
      { id: "edit", phrase: "Edit command" },
      { id: "cancel", phrase: "Cancel", tone: "warning" }
    ],
    connection: baseConnection
  },
  {
    agentState: "running",
    projectName: "HoloCodex Deck",
    branchName: "feature/hologram-ui",
    currentTask: defaultTranscript,
    voice: { mic: "processing", voiceControl: "active" },
    progressSteps: [
      { label: "Reading project...", status: "done" },
      { label: "Analyzing files...", status: "done" },
      { label: "Editing components...", status: "active" },
      { label: "Running tests...", status: "pending" },
      { label: "Waiting review...", status: "pending" }
    ],
    availableVoiceCommands: [
      { id: "details", phrase: "Show details", tone: "primary" },
      { id: "cancel", phrase: "Cancel task" }
    ],
    connection: { ...baseConnection, codex: "busy" }
  },
  {
    agentState: "approval",
    projectName: "HoloCodex Deck",
    branchName: "feature/hologram-ui",
    currentTask: defaultTranscript,
    voice: { mic: "processing", voiceControl: "active" },
    approval: {
      command: "npm test",
      risk: "This command may take several minutes."
    },
    availableVoiceCommands: [
      { id: "once", phrase: "Approve once", tone: "warning" },
      { id: "session", phrase: "Approve session", tone: "warning" },
      { id: "decline", phrase: "Decline", tone: "error" },
      { id: "risk", phrase: "Explain risk" }
    ],
    connection: { ...baseConnection, codex: "busy" }
  },
  {
    agentState: "result",
    resultStatus: "success",
    projectName: "HoloCodex Deck",
    branchName: "feature/hologram-ui",
    currentTask: defaultTranscript,
    voice: { mic: "idle", voiceControl: "active" },
    result: {
      changedFiles: 8,
      testsPassed: 43,
      testsFailed: 0,
      summary: "Hologram prototype is ready for integration."
    },
    availableVoiceCommands: [
      { id: "commit", phrase: "Commit summary", tone: "primary" },
      { id: "new", phrase: "Start new task" }
    ],
    connection: baseConnection
  }
];

export const defaultHologramState = hologramStates[0];
