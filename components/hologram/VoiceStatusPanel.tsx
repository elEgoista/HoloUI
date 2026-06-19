import type { ReactNode } from "react";
import type { HologramRuntimeState } from "./types";
import { VoiceOptions } from "./VoiceOptions";

const titles: Record<HologramRuntimeState["agentState"], string> = {
  wakeup: "Hello",
  projectChatPicker: "Your projects & chats",
  chatContext: "Chat context",
  idle: "Ready",
  listening: "Listening...",
  confirm: "Command recognized",
  running: "Running task",
  approval: "Approval required",
  result: "Task completed"
};

const subtitles: Record<HologramRuntimeState["agentState"], string> = {
  wakeup: "Voice control active",
  projectChatPicker: "",
  chatContext: "",
  idle: "Say a Codex task",
  listening: "Speak your Codex task",
  confirm: "",
  running: "",
  approval: "Codex wants to run:",
  result: ""
};

export function VoiceStatusPanel({
  state,
  controls
}: {
  state: HologramRuntimeState;
  controls?: ReactNode;
}) {
  return (
    <section className={`voice-status voice-${state.agentState} result-${state.resultStatus ?? "none"}`}>
      <h2>{titles[state.agentState]}</h2>
      {subtitles[state.agentState] ? <p>{subtitles[state.agentState]}</p> : null}

      {state.agentState === "wakeup" || state.agentState === "idle" ? (
        <div className="voice-active">
          <i className="mic-icon" />
          <div>
            <strong>Voice control active</strong>
            <span>Say &ldquo;{state.agentState === "wakeup" ? "wake up" : state.voice.wakeWord ?? "Codex"}&rdquo;</span>
          </div>
        </div>
      ) : null}

      {state.agentState === "projectChatPicker" ? (
        <div className="project-chat-list">
          {(state.projectChats ?? []).slice(0, 4).map((item) => (
            <div key={item.id} className="project-chat-row">
              <i aria-hidden="true" />
              <div>
                <strong>{item.name}</strong>
                <span>{item.source} / {item.detail}</span>
              </div>
              <em>{item.recent}</em>
              <b aria-hidden="true">›</b>
            </div>
          ))}
          <div className="project-chat-actions">
            <span>Start New &ldquo;New Chat&rdquo;</span>
            <span>Start New &ldquo;New Project&rdquo;</span>
          </div>
        </div>
      ) : null}

      {state.agentState === "chatContext" ? (
        <div className="chat-context-panel">
          <dl>
            <div>
              <dt>Project</dt>
              <dd>{state.projectName}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{state.sourceName ?? `Codex / ${state.branchName ?? "main"}`}</dd>
            </div>
          </dl>
          <div className="last-message-card">
            <span>Last message</span>
            <blockquote>&ldquo;{state.lastMessage ?? state.currentTask ?? "No recent message."}&rdquo;</blockquote>
            {state.lastMessageTime ? <em>{state.lastMessageTime}</em> : null}
          </div>
        </div>
      ) : null}

      {state.agentState === "listening" ? (
        <p className="voice-secondary">Say &ldquo;cancel&rdquo; to stop</p>
      ) : null}

      {state.agentState === "confirm" && state.transcript ? (
        <>
          <blockquote>&ldquo;{state.transcript}&rdquo;</blockquote>
          <p className="target-row">Target: Codex / {state.projectName}</p>
        </>
      ) : null}

      {state.agentState === "running" && state.progressSteps?.length ? (
        <div className="running-layout">
          <div className="progress-list">
            {state.progressSteps.map((step) => (
              <div key={step.label} className={`progress-step step-${step.status}`}>
                <i />
                <span>{step.label}</span>
                <b />
              </div>
            ))}
          </div>
          {state.backgroundEvents?.length ? (
            <div className="background-events">
              {state.backgroundEvents.slice(0, 2).map((event) => (
                <div key={event.id} className={`background-event event-${event.tone}`}>
                  <strong>{event.title}</strong>
                  <span>{event.message}</span>
                  {event.voiceCommands[0] ? <em>Say &ldquo;{event.voiceCommands[0].phrase}&rdquo;</em> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {state.agentState === "approval" && state.approval ? (
        <div className="approval-box">
          <span>Codex wants to run:</span>
          <strong>{state.approval.command}</strong>
          {state.approval.risk ? <p>{state.approval.risk}</p> : null}
        </div>
      ) : null}

      {state.agentState === "result" && state.result ? (
        <div className="result-box">
          {state.runningTasksCount ? <em className="running-badge">{state.runningTasksCount} tasks still running</em> : null}
          <div>
            <span>Changed files</span>
            <strong>{state.result.changedFiles ?? 0}</strong>
          </div>
          <div>
            <span>Tests</span>
            <strong>
              {state.result.testsPassed ?? 0} passed / {state.result.testsFailed ?? 0} failed
            </strong>
          </div>
          <p>Summary: {state.result.summary ?? state.result.reason ?? "No summary."}</p>
        </div>
      ) : null}

      <VoiceOptions options={state.availableVoiceCommands} />
      {controls}
    </section>
  );
}
