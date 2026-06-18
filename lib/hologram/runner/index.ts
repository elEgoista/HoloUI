import { getHologramConfig } from "../config";
import { CodexAppServerRunnerAdapter } from "./CodexAppServerRunnerAdapter";
import { CodexCliRunnerAdapter } from "./CodexCliRunnerAdapter";
import { CodexSdkRunnerAdapter } from "./CodexSdkRunnerAdapter";
import { MockRunnerAdapter } from "./MockRunnerAdapter";
import type { RunnerAdapter } from "./RunnerAdapter";

const globalForRunner = globalThis as unknown as {
  hologramRunnerAdapter?: RunnerAdapter;
};

function createRunner(): RunnerAdapter {
  const mode = getHologramConfig().runner.mode;

  if (mode === "codex-cli") {
    return new CodexCliRunnerAdapter();
  }

  if (mode === "codex-sdk") {
    return new CodexSdkRunnerAdapter();
  }

  if (mode === "codex-app-server") {
    return new CodexAppServerRunnerAdapter();
  }

  return new MockRunnerAdapter();
}

export function getRunner() {
  globalForRunner.hologramRunnerAdapter ??= createRunner();
  return globalForRunner.hologramRunnerAdapter;
}
