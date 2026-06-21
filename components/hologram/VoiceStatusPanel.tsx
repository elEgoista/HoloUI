import type { ReactNode } from "react";
import type { HologramRuntimeState, VoiceOption } from "./types";
import { VoiceOptions } from "./VoiceOptions";

const titles: Record<HologramRuntimeState["agentState"], string> = {
  wakeup: "Hello",
  projectChatPicker: "Your projects & chats",
  chatContext: "Chat context",
  idle: "Ready",
  listening: "Listening...",
  confirm: "Command ready",
  running: "Running task",
  approval: "Approval required",
  result: "Completed"
};

const subtitles: Record<HologramRuntimeState["agentState"], string> = {
  wakeup: "",
  projectChatPicker: "",
  chatContext: "",
  idle: "Say a Codex task",
  listening: "Speak your Codex task",
  confirm: "",
  running: "",
  approval: "",
  result: ""
};

const preferredCommandIds: Partial<Record<HologramRuntimeState["agentState"], string[]>> = {
  projectChatPicker: ["first", "new-chat", "new-project"],
  chatContext: ["continue", "new-task"],
  listening: ["cancel"],
  confirm: ["confirm", "send", "edit", "cancel"],
  running: ["progress", "task-list"],
  approval: ["once", "skip", "details"],
  result: ["diff", "new"]
};

function visibleVoiceCommands(state: HologramRuntimeState): VoiceOption[] {
  if (state.agentState === "wakeup") return [];

  const preferredIds = preferredCommandIds[state.agentState];
  if (!preferredIds) return state.availableVoiceCommands.slice(0, 2);

  const preferred = preferredIds
    .map((id) => state.availableVoiceCommands.find((option) => option.id === id))
    .filter((option): option is VoiceOption => Boolean(option));

  const limit = state.agentState === "projectChatPicker" ||
    state.agentState === "confirm" || state.agentState === "approval" ? 3 : 2;

  return (preferred.length ? preferred : state.availableVoiceCommands).slice(0, limit);
}

function compactProgressSteps(state: HologramRuntimeState) {
  const steps = state.progressSteps ?? [];
  const preferred = ["read", "edit", "test"]
    .map((term) => steps.find((step) => step.label.toLowerCase().includes(term)))
    .filter((step): step is NonNullable<HologramRuntimeState["progressSteps"]>[number] => Boolean(step));

  return preferred.length === 3 ? preferred : steps.slice(0, 3);
}

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
          {(state.projectChats ?? []).slice(0, 3).map((item) => (
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
        </div>
      ) : null}

      {state.agentState === "chatContext" ? (
        <div className="chat-context-panel">
          <dl>
            <div>
              <dt>Source</dt>
              <dd>{state.sourceName?.split(" / ")[0] ?? "Codex"}</dd>
            </div>
            <div>
              <dt>Branch</dt>
              <dd>{state.branchName ?? "main"}</dd>
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
            {compactProgressSteps(state).map((step) => (
              <div key={step.label} className={`progress-step step-${step.status}`}>
                <i />
                <span>{step.label}</span>
                <b />
              </div>
            ))}
          </div>
          {state.backgroundEvents?.length ? (
            <div className="background-events">
              {[state.backgroundEvents.find((event) => event.tone === "error" || event.tone === "warning") ?? state.backgroundEvents[0]].map((event) => (
                <div key={event.id} className={`background-event event-${event.tone}`}>
                  <strong>{event.title}</strong>
                  <span>
                    {event.voiceCommands[0]
                      ? <>Say &ldquo;{event.voiceCommands[0].phrase}&rdquo; to switch</>
                      : event.message}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {state.agentState === "approval" && state.approval ? (
        <div className="approval-box">
          <div><span>Command</span><strong>{state.approval.command}</strong></div>
          {state.approval.risk ? <p><span>Risk</span>{state.approval.risk}</p> : null}
        </div>
      ) : null}

      {state.agentState === "result" && state.result ? (
        <div className="result-box">
          {state.runningTasksCount ? <em className="running-badge">{state.runningTasksCount} tasks still running</em> : null}
          <div className="result-metric">
            <span>Files</span>
            <strong>{state.result.changedFiles ?? 0}</strong>
          </div>
          <div className="result-metric">
            <span>Tests</span>
            <strong>
              {state.result.testsPassed ?? 0}/{state.result.testsFailed ?? 0}
            </strong>
          </div>
          <p>Summary: {state.result.summary ?? state.result.reason ?? "No summary."}</p>
        </div>
      ) : null}

      <VoiceOptions
        options={visibleVoiceCommands(state)}
        showLabel={state.agentState === "projectChatPicker"}
      />
      {controls}
    </section>
  );
}
