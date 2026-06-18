import assert from "node:assert/strict";
import test from "node:test";
import { assertTransition, canTransition } from "../lib/hologram/stateMachine";

test("allows expected voice-to-task transitions", () => {
  assert.equal(canTransition("idle", "listening"), true);
  assert.equal(canTransition("listening", "transcribed"), true);
  assert.equal(canTransition("transcribed", "awaiting_confirmation"), true);
  assert.equal(canTransition("awaiting_confirmation", "running"), true);
  assert.equal(canTransition("running", "review"), true);
});

test("rejects unsafe skipped transitions", () => {
  assert.equal(canTransition("idle", "completed"), false);
  assert.throws(
    () => assertTransition("transcribed", "completed"),
    /Invalid agent status transition/
  );
});
