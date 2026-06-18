"use client";

import type { HologramAgentState } from "./types";

export function DebugControls({
  state,
  reflectionMode,
  brightnessBoost,
  highContrast,
  onStateChange,
  onReflectionChange,
  onBrightnessChange,
  onHighContrastChange
}: {
  state: HologramAgentState;
  reflectionMode: boolean;
  brightnessBoost: boolean;
  highContrast: boolean;
  onStateChange: (state: HologramAgentState) => void;
  onReflectionChange: (enabled: boolean) => void;
  onBrightnessChange: (enabled: boolean) => void;
  onHighContrastChange: (enabled: boolean) => void;
}) {
  const states: HologramAgentState[] = ["idle", "listening", "confirm", "running", "approval", "result"];

  return (
    <aside className="debug-controls" aria-label="Hologram visual debug controls">
      <div>
        <span>Preview state</span>
        <select value={state} onChange={(event) => onStateChange(event.target.value as HologramAgentState)}>
          {states.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <label>
        <input
          checked={reflectionMode}
          onChange={(event) => onReflectionChange(event.target.checked)}
          type="checkbox"
        />
        Reflection mode
      </label>
      <label>
        <input
          checked={brightnessBoost}
          onChange={(event) => onBrightnessChange(event.target.checked)}
          type="checkbox"
        />
        Brightness boost
      </label>
      <label>
        <input
          checked={highContrast}
          onChange={(event) => onHighContrastChange(event.target.checked)}
          type="checkbox"
        />
        High contrast
      </label>
    </aside>
  );
}
