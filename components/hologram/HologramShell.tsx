import { AssistantAvatar } from "./AssistantAvatar";
import { ConnectionStatus } from "./ConnectionStatus";
import type { ReactNode } from "react";
import type { HologramRuntimeState } from "./types";
import { VoiceStatusPanel } from "./VoiceStatusPanel";

export function HologramShell({
  state,
  previewLabel,
  reflectionMode = false,
  brightnessBoost = false,
  highContrast = false,
  compact = false,
  layout = "default",
  showReflectionStatus = true,
  voiceControls
}: {
  state: HologramRuntimeState;
  previewLabel?: string;
  reflectionMode?: boolean;
  brightnessBoost?: boolean;
  highContrast?: boolean;
  compact?: boolean;
  layout?: "default" | "landscape";
  showReflectionStatus?: boolean;
  voiceControls?: ReactNode;
}) {
  return (
    <article
      className={[
        "hologram-preview",
        layout === "landscape" ? "hologram-landscape" : "",
        `state-${state.agentState}`,
        `result-${state.resultStatus ?? "none"}`,
        reflectionMode ? "reflection-mode" : "",
        brightnessBoost ? "brightness-boost" : "",
        highContrast ? "high-contrast-mode" : "",
        compact ? "hologram-compact" : ""
      ].join(" ")}
    >
      <div className="preview-grid" />
      <header className="preview-meta">
        <div className="project-identity">
          {previewLabel ? <b>{previewLabel}</b> : null}
          <span>Project</span>
          <strong>{state.projectName}</strong>
          <span>Branch</span>
          <em>{state.branchName ?? "feature/hologram-ui"}</em>
        </div>
        {showReflectionStatus ? (
          <div className={`reflection-badge ${reflectionMode ? "reflection-on" : "reflection-off"}`}>
            <i />
            <span>Reflection<br />mode<br />{reflectionMode ? "active" : "off"}</span>
          </div>
        ) : null}
      </header>
      <AssistantAvatar state={state.agentState} resultStatus={state.resultStatus} />
      <VoiceStatusPanel state={state} controls={voiceControls} />
      <ConnectionStatus
        connection={state.connection}
        reflection={reflectionMode}
        showReflection={showReflectionStatus}
      />
    </article>
  );
}
