import type { HologramRuntimeState } from "./types";

function statusTone(value: string) {
  if (value === "busy" || value === "reconnecting") return "warning";
  if (value === "offline" || value === "error" || value === "missing") return "error";
  return "success";
}

export function ConnectionStatus({
  connection,
  reflection = true,
  showReflection = true
}: {
  connection: HologramRuntimeState["connection"];
  reflection?: boolean;
  showReflection?: boolean;
}) {
  const items = [
    ["Bridge", connection.bridge],
    ["Codex", connection.codex],
    ["Project", connection.project]
  ] as const;

  return (
    <div className="connection-strip">
      {items.map(([label, value]) => (
        <div key={label} className={`connection-item tone-${statusTone(value)}`}>
          <span>{label}</span>
          <strong>{value}</strong>
          <i />
        </div>
      ))}
      {showReflection ? (
        <div className={`connection-item reflection-item ${connection.railStatus === "approval needed" ? "tone-warning" : "tone-voice"}`}>
          <span>{connection.railStatus === "approval needed" ? "Approval" : "Reflection"}</span>
          <strong>{connection.railStatus === "approval needed" ? "NEEDED" : reflection ? "ON" : "OFF"}</strong>
        </div>
      ) : null}
    </div>
  );
}
