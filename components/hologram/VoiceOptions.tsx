import type { VoiceOption } from "./types";

export function VoiceOptions({ options }: { options: VoiceOption[] }) {
  if (!options.length) return null;

  return (
    <div className="voice-options" aria-label="Available voice commands">
      <span>Say one command:</span>
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
