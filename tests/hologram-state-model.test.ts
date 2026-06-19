import assert from "node:assert/strict";
import test from "node:test";
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
