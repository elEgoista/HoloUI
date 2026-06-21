import type { VoiceOption } from "./types";

export function VoiceOptions({
  options,
  showLabel = true
}: {
  options: VoiceOption[];
  showLabel?: boolean;
}) {
  if (!options.length) return null;

  return (
    <div className="voice-options" aria-label="Available voice commands">
      {showLabel ? <span>Say one command:</span> : null}
      <div className="voice-option-row">
        {options.map((option) => (
          <div key={option.id} className={`holo-command-hint hint-${option.tone ?? "default"}`}>
            <i className="hint-wave" aria-hidden="true" />
            <small>Say</small>
            <strong>&ldquo;{option.phrase}&rdquo;</strong>
            {option.description ? <em>{option.description}</em> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
