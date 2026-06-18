"use client";

import { HologramShell } from "@/components/hologram/HologramShell";
import { defaultHologramState } from "@/components/hologram/mockData";
import type { HologramRuntimeState, ProgressStep, VoiceOption } from "@/components/hologram/types";
import { fetchJson, getStoredLocalToken } from "@/lib/hologram/client";
import type { ConfigResponse, TaskResponse } from "@/lib/hologram/client";
import type { AgentTask, RunnerEvent } from "@/lib/hologram/types";
import { classifyVoiceIntent, normalizeVoiceTranscript } from "@/lib/hologram/voiceFlow";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string; confidence?: number };
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type VoicePhase = "idle" | "listening_task" | "confirming" | "listening_confirm" | "unsupported" | "error";

function mapTaskToHologramState(
  task: AgentTask | null,
  projectName: string,
  branchName?: string
): HologramRuntimeState {
  if (!task) {
    return {
      ...defaultHologramState,
      projectName,
      branchName
    };
  }

  const connection = {
    bridge: "connected",
    codex: task.status === "running" || task.status === "needs_approval" ? "busy" : "ready",
    project: "active"
  } as const;

  if (task.status === "running") {
    const progressSteps: ProgressStep[] = [
      { label: "Reading project...", status: "done" },
      { label: "Analyzing files...", status: "done" },
      { label: "Editing components...", status: "active" },
      { label: "Running tests...", status: "pending" },
      { label: "Waiting review...", status: "pending" }
    ];

    return {
      agentState: "running",
      projectName,
      branchName,
      currentTask: task.prompt,
      voice: { mic: "processing", voiceControl: "active" },
      progressSteps,
      availableVoiceCommands: [
        { id: "details", phrase: "Show details", tone: "primary" },
        { id: "cancel", phrase: "Cancel task" }
      ],
      connection
    };
  }

  if (task.status === "needs_approval" && task.approvalRequest) {
    return {
      agentState: "approval",
      projectName,
      branchName,
      currentTask: task.prompt,
      voice: { mic: "processing", voiceControl: "active" },
      approval: {
        command: task.approvalRequest.command ?? "configured command",
        risk: task.approvalRequest.description
      },
      availableVoiceCommands: [
        { id: "once", phrase: "Approve once", tone: "warning" },
        { id: "session", phrase: "Approve session", tone: "warning" },
        { id: "decline", phrase: "Decline", tone: "error" },
        { id: "risk", phrase: "Explain risk" }
      ],
      connection
    };
  }

  if (task.status === "failed") {
    return {
      agentState: "result",
      resultStatus: "failed",
      projectName,
      branchName,
      currentTask: task.prompt,
      voice: { mic: "idle", voiceControl: "active" },
      result: {
        changedFiles: task.changedFiles?.length ?? 0,
        testsPassed: task.tests?.passed ?? 0,
        testsFailed: task.tests?.failed ?? 1,
        reason: task.summary ?? "Task failed or approval was declined."
      },
      availableVoiceCommands: [
        { id: "details", phrase: "Show details" },
        { id: "new", phrase: "Start new task", tone: "primary" }
      ],
      connection: { ...connection, codex: "error" }
    };
  }

  if (task.status === "review" || task.status === "completed") {
    const voiceCommands: VoiceOption[] =
      task.nextActions?.map((action) => ({
        id: action.id,
        phrase: action.label,
        tone: action.kind === "ask_to_fix" ? "warning" : "primary"
      })) ?? [
        { id: "commit", phrase: "Commit summary", tone: "primary" },
        { id: "new", phrase: "Start new task" }
      ];

    return {
      agentState: "result",
      resultStatus: task.status === "completed" ? "success" : "review",
      projectName,
      branchName,
      currentTask: task.prompt,
      voice: { mic: "idle", voiceControl: "active" },
      result: {
        changedFiles: task.changedFiles?.length ?? 0,
        testsPassed: task.tests?.passed ?? 0,
        testsFailed: task.tests?.failed ?? 0,
        summary: task.summary
      },
      availableVoiceCommands: voiceCommands,
      connection
    };
  }

  return {
    ...defaultHologramState,
    projectName,
    branchName,
    transcript: task.transcript ?? task.prompt
  };
}

export default function HologramPage() {
  const [task, setTask] = useState<AgentTask | null>(null);
  const [projectName, setProjectName] = useState("Marketplace Agent");
  const [branchName, setBranchName] = useState("feature/hologram-ui");
  const [authBlocked, setAuthBlocked] = useState(false);
  const [voicePhase, setVoicePhase] = useState<VoicePhase>("idle");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const [draftTranscript, setDraftTranscript] = useState("");
  const [manualPrompt, setManualPrompt] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recognitionModeRef = useRef<"task" | "confirm">("task");
  const draftTranscriptRef = useRef("");
  const manualPromptRef = useRef("");

  useEffect(() => {
    void fetchJson<ConfigResponse>("/api/config")
      .then((config) => {
        const project = config.projects[0];
        setProjectName(project?.name ?? "Marketplace Agent");
        setBranchName(project?.defaultBranch ?? "feature/hologram-ui");
      })
      .catch((error) => {
        if ((error as Error & { tokenRequired?: boolean }).tokenRequired) {
          setAuthBlocked(true);
        }
      });
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setVoiceSupported(Boolean(SpeechRecognition));
    if (!SpeechRecognition) {
      setVoicePhase("unsupported");
      setVoiceMessage("Speech recognition unavailable. Use manual command mode.");
    }
  }, []);

  useEffect(() => {
    draftTranscriptRef.current = draftTranscript;
  }, [draftTranscript]);

  useEffect(() => {
    manualPromptRef.current = manualPrompt;
  }, [manualPrompt]);

  useEffect(() => {
    const token = getStoredLocalToken();
    const source = new EventSource(
      token ? `/api/events?token=${encodeURIComponent(token)}` : "/api/events"
    );

    for (const eventName of ["task_created", "task_updated", "state_reset"]) {
      source.addEventListener(eventName, (event) => {
        const payload = JSON.parse((event as MessageEvent).data) as RunnerEvent;

        if (payload.type === "task_created" || payload.type === "task_updated") {
          setTask(payload.task);
        }

        if (payload.type === "state_reset") {
          setTask(null);
        }
      });
    }

    source.onerror = () => {
      if (!getStoredLocalToken()) {
        setAuthBlocked(true);
      }
    };

    return () => source.close();
  }, []);

  const state = useMemo<HologramRuntimeState>(
    () => {
      if (task) {
        return mapTaskToHologramState(task, projectName, branchName);
      }

      const cleanTranscript = normalizeVoiceTranscript(draftTranscript);
      const base = mapTaskToHologramState(null, projectName, branchName);

      if (voicePhase === "listening_task") {
        return {
          ...base,
          agentState: "listening" as const,
          transcript: cleanTranscript || undefined,
          voice: {
            mic: "listening" as const,
            wakeWord: "Codex",
            lastHeard: cleanTranscript || undefined,
            voiceControl: "active" as const
          },
          availableVoiceCommands: [
            { id: "cancel", phrase: "Cancel", tone: "error" as const },
            { id: "finish", phrase: "Finish command", tone: "primary" as const }
          ]
        };
      }

      if (voicePhase === "confirming" || voicePhase === "listening_confirm") {
        return {
          ...base,
          agentState: "confirm" as const,
          transcript: cleanTranscript || manualPrompt,
          voice: {
            mic: voicePhase === "listening_confirm" ? "listening" : "idle",
            wakeWord: "Confirm",
            lastHeard: cleanTranscript || manualPrompt,
            voiceControl: "active" as const
          },
          availableVoiceCommands: [
            { id: "confirm", phrase: "Confirm", tone: "primary" as const },
            { id: "cancel", phrase: "Cancel", tone: "error" as const },
            { id: "edit", phrase: "Edit", tone: "warning" as const }
          ]
        };
      }

      if (voicePhase === "unsupported" || voicePhase === "error") {
        return {
          ...base,
          voice: {
            mic: voicePhase === "error" ? "error" : "muted",
            wakeWord: "Codex",
            voiceControl: "inactive" as const
          }
        };
      }

      return base;
    },
    [branchName, draftTranscript, manualPrompt, projectName, task, voicePhase]
  );

  const cancelVoiceFlow = useCallback(() => {
    recognitionRef.current?.abort();
    setDraftTranscript("");
    setManualPrompt("");
    setVoicePhase(voiceSupported ? "idle" : "unsupported");
    setVoiceMessage(voiceSupported ? "Voice command cancelled." : "Manual command cancelled.");
  }, [voiceSupported]);

  const submitVoiceTask = useCallback(async () => {
    const prompt = normalizeVoiceTranscript(manualPromptRef.current || draftTranscriptRef.current);

    if (!prompt) {
      setVoiceMessage("No command to send.");
      return;
    }

    setVoiceMessage("Sending confirmed command to Codex...");
    try {
      const response = await fetchJson<TaskResponse>("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "default",
          prompt,
          transcript: draftTranscriptRef.current || prompt,
          source: "voice"
        })
      });
      setTask(response.task);
      setDraftTranscript("");
      setManualPrompt("");
      setVoicePhase("idle");
    } catch (error) {
      setVoicePhase("error");
      setVoiceMessage(error instanceof Error ? error.message : "Task submission failed.");
    }
  }, []);

  const startRecognition = useCallback((mode: "task" | "confirm") => {
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoicePhase("unsupported");
      setVoiceMessage("Speech recognition unavailable. Use manual command mode.");
      return;
    }

    recognitionRef.current?.abort();
    recognitionModeRef.current = mode;

    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => {
      setVoicePhase(mode === "task" ? "listening_task" : "listening_confirm");
      setVoiceMessage(mode === "task" ? "Listening in ru-RU..." : "Say confirm, cancel, or edit.");
      if (mode === "task") {
        setDraftTranscript("");
      }
    };
    recognition.onerror = (event) => {
      setVoicePhase("error");
      setVoiceMessage(`Speech recognition error: ${event.error ?? "unknown"}`);
    };
    recognition.onend = () => {
      setVoicePhase((current) => {
        if (current === "listening_task" && draftTranscriptRef.current.trim()) return "confirming";
        if (current === "listening_confirm") return "confirming";
        return current === "listening_task" ? "idle" : current;
      });
    };
    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      const heard = normalizeVoiceTranscript(finalText || interim);
      if (heard) {
        setDraftTranscript(heard);
      }

      if (!finalText) return;

      if (recognitionModeRef.current === "confirm") {
        const intent = classifyVoiceIntent(finalText);

        if (intent === "confirm") {
          void submitVoiceTask();
        } else if (intent === "cancel") {
          cancelVoiceFlow();
        } else if (intent === "edit") {
          setManualPrompt(normalizeVoiceTranscript(draftTranscriptRef.current));
          setVoicePhase("unsupported");
          setVoiceMessage("Edit the command manually, then confirm.");
        }
      } else {
        const normalized = normalizeVoiceTranscript(finalText);
        if (classifyVoiceIntent(normalized) === "cancel") {
          cancelVoiceFlow();
          return;
        }
        setDraftTranscript(normalized);
        setManualPrompt(normalized);
        setVoicePhase("confirming");
        setVoiceMessage("Command recognized. Confirm before sending.");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [cancelVoiceFlow, submitVoiceTask]);

  const voiceControls = (
    <div className="voice-confirmation-dock">
      <div className="voice-control-actions">
        {voicePhase === "confirming" || voicePhase === "listening_confirm" ? (
          <>
            <button className="voice-control-primary" type="button" onClick={() => void submitVoiceTask()}>
              Confirm
            </button>
            <button type="button" onClick={() => startRecognition("confirm")} disabled={!voiceSupported}>
              Listen confirm
            </button>
            <button type="button" onClick={cancelVoiceFlow}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              className="voice-control-primary"
              type="button"
              onClick={() => startRecognition("task")}
              disabled={Boolean(task)}
            >
              Start voice
            </button>
            <button type="button" onClick={() => setVoicePhase("unsupported")}>
              Manual
            </button>
          </>
        )}
      </div>
      {voicePhase === "unsupported" || voicePhase === "error" ? (
        <div className="voice-manual-entry">
          <textarea
            value={manualPrompt}
            onChange={(event) => {
              setManualPrompt(event.target.value);
              setDraftTranscript(event.target.value);
            }}
            placeholder="Type a Codex task, then confirm."
          />
          <div className="voice-control-actions">
            <button className="voice-control-primary" type="button" onClick={() => setVoicePhase("confirming")}>
              Prepare confirm
            </button>
            <button type="button" onClick={cancelVoiceFlow}>
              Clear
            </button>
          </div>
        </div>
      ) : null}
      {voiceMessage ? <p className="voice-control-message">{voiceMessage}</p> : null}
      <small>{voiceSupported ? "Web Speech API ru-RU" : "Fallback text mode"}</small>
    </div>
  );

  return (
    <main className="hologram-root hologram-live-page">
      <div className="hologram-fullscreen">
        <header className="hologram-titlebar">
          <div>
            <h1>HoloCodex Deck</h1>
            <p>Holographic assistant interface</p>
            <p>Voice-first • hologram mode</p>
          </div>
          <div className="holo-legend">
            <span className="legend-voice"><i /> Voice</span>
            <span className="legend-warning"><i /> Warning</span>
            <span className="legend-error"><i /> Error</span>
            <span className="legend-success"><i /> Success</span>
          </div>
        </header>

        {authBlocked ? (
          <div className="hologram-auth-message">
            Local token required. Open /hologram/debug or /dashboard on this device to save the token.
          </div>
        ) : null}

        <HologramShell
          state={state}
          reflectionMode={false}
          showReflectionStatus={false}
          brightnessBoost
          layout="landscape"
          voiceControls={voiceControls}
        />

        <footer className="debug-footer-preview">
          <div>
            <strong>Voice control active</strong>
            <span>All actions are voice commands. The screen is for status only.</span>
          </div>
          <div className="footer-wave" aria-hidden="true" />
        </footer>
      </div>
    </main>
  );
}
