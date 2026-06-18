import type { ReactNode } from "react";
import type { HologramRuntimeState } from "./types";
import { VoiceOptions } from "./VoiceOptions";

const titles: Record<HologramRuntimeState["agentState"], string> = {
  idle: "Ready",
  listening: "Listening...",
  confirm: "Command recognized",
  running: "Running task",
  approval: "Approval required",
  result: "Task completed"
};

const subtitles: Record<HologramRuntimeState["agentState"], string> = {
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

      {state.agentState === "idle" ? (
        <div className="voice-active">
          <i className="mic-icon" />
          <div>
            <strong>Voice control active</strong>
            <span>Say &ldquo;{state.voice.wakeWord ?? "Codex"}&rdquo; to wake up</span>
          </div>
        </div>
      ) : null}

      {state.agentState === "listening" ? (
        <p className="voice-secondary">Say &ldquo;cancel&rdquo; to stop</p>
      ) : null}

      {state.agentState === "confirm" && state.transcript ? (
        <blockquote>&ldquo;{state.transcript}&rdquo;</blockquote>
      ) : null}

      {state.agentState === "running" && state.progressSteps?.length ? (
        <div className="progress-list">
          {state.progressSteps.map((step) => (
            <div key={step.label} className={`progress-step step-${step.status}`}>
              <i />
              <span>{step.label}</span>
              <b />
            </div>
          ))}
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
