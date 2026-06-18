import assert from "node:assert/strict";
import test from "node:test";
import { getCodexCliDiagnostics } from "../lib/hologram/runner/codexCliDiagnostics";

test("codex cli diagnostics returns controlled unavailable result", async () => {
  const previous = process.env.HOLOCODEX_CODEX_CLI;
  process.env.HOLOCODEX_CODEX_CLI = "holocodex-missing-codex-command";

  try {
    const diagnostics = await getCodexCliDiagnostics();
    assert.equal(diagnostics.available, false);
    assert.equal(diagnostics.command, "holocodex-missing-codex-command");
    assert.equal(typeof diagnostics.error, "string");
  } finally {
    if (previous === undefined) {
      delete process.env.HOLOCODEX_CODEX_CLI;
    } else {
      process.env.HOLOCODEX_CODEX_CLI = previous;
    }
  }
});
