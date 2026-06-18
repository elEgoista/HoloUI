import assert from "node:assert/strict";
import test from "node:test";
import { classifyVoiceIntent, normalizeVoiceTranscript } from "../lib/hologram/voiceFlow";

test("voice flow normalizes wake phrase without confirming automatically", () => {
  assert.equal(normalizeVoiceTranscript("Codex, refactor parser"), "refactor parser");
  assert.equal(classifyVoiceIntent("Codex, refactor parser"), "task");
});

test("voice flow classifies explicit confirmation commands only", () => {
  assert.equal(classifyVoiceIntent("confirm"), "confirm");
  assert.equal(classifyVoiceIntent("подтвердить"), "confirm");
  assert.equal(classifyVoiceIntent("cancel"), "cancel");
  assert.equal(classifyVoiceIntent("редактировать"), "edit");
});
