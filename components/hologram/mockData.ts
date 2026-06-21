import type { HologramRuntimeState } from "./types";

const baseConnection: HologramRuntimeState["connection"] = {
  bridge: "connected",
  codex: "ready",
  project: "active"
};

const noProjectConnection: HologramRuntimeState["connection"] = {
  ...baseConnection,
  project: "none"
};

export const defaultTranscript =
  "Create the hologram debug page and add all assistant states.";

export const hologramStates: HologramRuntimeState[] = [
  {
    agentState: "wakeup",
    projectName: "HoloCodex Deck",
    branchName: "feature/hologram-ui",
    voice: { mic: "idle", wakeWord: "Codex", voiceControl: "active" },
    availableVoiceCommands: [],
    connection: noProjectConnection
  },
  {
    agentState: "projectChatPicker",
    projectName: "none",
    branchName: "main",
    projectChats: [
      { id: "holocodex", name: "HoloCodex Deck", source: "Codex", detail: "work/holocodex-v1", recent: "2m ago" },
      { id: "marketplace", name: "Marketplace Agent", source: "HoloCodex", detail: "main", recent: "15m ago" },
      { id: "visa", name: "VisaDays", source: "HoloCodex", detail: "dev/ops", recent: "1h ago" },
      { id: "parser", name: "Parser Service", source: "Order", detail: "v2/parser-stream", recent: "3h ago" }
    ],
    voice: { mic: "idle", wakeWord: "Codex", voiceControl: "active" },
    availableVoiceCommands: [
      { id: "first", phrase: "HoloCodex Deck", tone: "primary" },
      { id: "marketplace", phrase: "marketplace agent" },
      { id: "filter", phrase: "filter Codex" },
      { id: "new-chat", phrase: "new chat" },
      { id: "new-project", phrase: "new project" }
    ],
    connection: noProjectConnection
  },
  {
    agentState: "chatContext",
    projectName: "HoloCodex Deck",
    branchName: "features/hologram-ui",
    sourceName: "Codex / features/hologram-ui",
    lastMessage: "Implement /hologram/debug with all assistant states.",
    lastMessageTime: "2m ago",
    voice: { mic: "idle", wakeWord: "Codex", voiceControl: "active" },
    availableVoiceCommands: [
      { id: "continue", phrase: "continue this task", tone: "primary" },
      { id: "new-task", phrase: "new task" },
      { id: "recent", phrase: "show recent" },
      { id: "project", phrase: "go to project" }
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
      { label: "Finalizing", status: "pending" }
    ],
    backgroundEvents: [
      {
        id: "marketplace-complete",
        source: "codex",
        projectId: "marketplace",
        title: "Marketplace Agent completed",
        type: "taskCompleted",
        message: "Say marketplace agent to switch",
        tone: "success",
        voiceCommands: [{ id: "marketplace", phrase: "marketplace agent" }]
      },
      {
        id: "visa-approval",
        source: "holocode",
        projectId: "visa",
        title: "VisaDays needs approval",
        type: "approvalNeeded",
        message: "Say visa days to switch",
        tone: "warning",
        voiceCommands: [{ id: "visa", phrase: "visa days" }]
      }
    ],
    availableVoiceCommands: [
      { id: "progress", phrase: "show progress", tone: "primary" },
      { id: "task-list", phrase: "switch task" },
      { id: "errors", phrase: "show errors" },
      { id: "last-file", phrase: "open last file", tone: "warning" }
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
      { id: "details", phrase: "View details" },
      { id: "skip", phrase: "Decline", tone: "error" }
    ],
    connection: { ...baseConnection, codex: "busy", railStatus: "approval needed" }
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
      { id: "commit", phrase: "commit summary", tone: "primary" },
      { id: "diff", phrase: "open diff" },
      { id: "new", phrase: "start next task" },
      { id: "project", phrase: "go to project" }
    ],
    connection: baseConnection
  }
];

export const defaultHologramState = hologramStates[0];
