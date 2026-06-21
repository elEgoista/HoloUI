import assert from "node:assert/strict";
import test from "node:test";
import { hologramDebugRoutes } from "../components/hologram/debugStateRoutes";
import { hologramStates } from "../components/hologram/mockData";

test("hologram mock model exposes the eight approved UX states", () => {
  const states = hologramStates.map((state) => state.agentState);

  assert.deepEqual(states, [
    "wakeup",
    "projectChatPicker",
    "chatContext",
    "listening",
    "confirm",
    "running",
    "approval",
    "result"
  ]);
});

test("running hologram state can carry subtle background events", () => {
  const running = hologramStates.find((state) => state.agentState === "running");

  assert.ok(running);
  assert.equal(running.backgroundEvents?.length, 2);
  assert.equal(running.backgroundEvents?.[0].type, "taskCompleted");
  assert.equal(running.backgroundEvents?.[1].type, "approvalNeeded");
});

test("every approved hologram state has a unique standalone debug route", () => {
  assert.deepEqual(
    hologramDebugRoutes.map((route) => route.state),
    hologramStates.map((state) => state.agentState)
  );
  assert.equal(new Set(hologramDebugRoutes.map((route) => route.slug)).size, 8);
});

test("hologram copy model keeps wakeup quiet and picker commands explicit", () => {
  const wakeup = hologramStates.find((state) => state.agentState === "wakeup");
  const picker = hologramStates.find((state) => state.agentState === "projectChatPicker");

  assert.deepEqual(wakeup?.availableVoiceCommands, []);
  assert.deepEqual(
    picker?.availableVoiceCommands.map((command) => command.phrase),
    ["HoloCodex Deck", "marketplace agent", "filter Codex", "new chat", "new project"]
  );
});
