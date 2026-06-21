"use client";

import { DebugControls } from "@/components/hologram/DebugControls";
import { HologramShell } from "@/components/hologram/HologramShell";
import { hologramDebugRoutes } from "@/components/hologram/debugStateRoutes";
import { hologramStates } from "@/components/hologram/mockData";
import type { HologramAgentState } from "@/components/hologram/types";
import { getStoredLocalToken, storeLocalToken } from "@/lib/hologram/client";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function HologramDebugPage() {
  const [activeState, setActiveState] = useState<HologramAgentState>("wakeup");
  const [reflectionMode, setReflectionMode] = useState(false);
  const [brightnessBoost, setBrightnessBoost] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [localToken, setLocalToken] = useState(() =>
    typeof window === "undefined" ? "" : getStoredLocalToken()
  );

  const selected = useMemo(
    () => hologramStates.find((state) => state.agentState === activeState) ?? hologramStates[0],
    [activeState]
  );

  return (
    <main className="hologram-root debug-page">
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

      <nav className="debug-state-links" aria-label="Standalone hologram state pages">
        {hologramDebugRoutes.map((route, index) => (
          <Link key={route.state} href={`/hologram/debug/${route.slug}`}>
            <span>{index + 1}</span>
            {route.label}
          </Link>
        ))}
      </nav>

      <section className="debug-board" aria-label="Eight hologram states">
        {hologramStates.map((state, index) => (
          <HologramShell
            key={state.agentState}
            state={state}
            previewLabel={`${index + 1}. ${state.agentState.replace(/([a-z])([A-Z])/g, "$1 $2")}`}
            reflectionMode={reflectionMode}
            brightnessBoost={brightnessBoost}
            highContrast={highContrast}
            compact
          />
        ))}
      </section>

      <section className="debug-footer-preview">
        <div>
          <strong>Selected preview</strong>
          <span>Mirror applies only to hologram previews. Debug controls stay readable.</span>
        </div>
        <HologramShell
          state={selected}
          previewLabel={selected.agentState}
          reflectionMode={reflectionMode}
          brightnessBoost={brightnessBoost}
          highContrast={highContrast}
          compact
        />
      </section>

      <section className="debug-token-panel">
        <label>
          Local token
          <input
            value={localToken}
            onChange={(event) => setLocalToken(event.target.value)}
            placeholder="Paste HOCODEX_LOCAL_TOKEN"
            type="password"
          />
        </label>
        <button onClick={() => storeLocalToken(localToken)}>Save token</button>
      </section>

      <DebugControls
        state={activeState}
        reflectionMode={reflectionMode}
        brightnessBoost={brightnessBoost}
        highContrast={highContrast}
        onStateChange={setActiveState}
        onReflectionChange={setReflectionMode}
        onBrightnessChange={setBrightnessBoost}
        onHighContrastChange={setHighContrast}
      />
    </main>
  );
}
