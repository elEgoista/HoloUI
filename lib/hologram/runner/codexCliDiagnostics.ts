import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { getHologramConfig } from "../config";
import { redactAndTrim } from "../redact";

const execFileAsync = promisify(execFile);
const codexAppBundledPath = "/Applications/Codex.app/Contents/Resources/codex";

export type CodexCliSource = "codex-app-bundled" | "path" | "custom";

export type CodexCliDiagnostics = {
  available: boolean;
  command: string;
  source: CodexCliSource;
  version?: string;
  execJsonSupported?: boolean;
  skipGitRepoCheck: boolean;
  error?: string;
};

function getConfiguredCommand() {
  return getHologramConfig().codexCli?.command?.trim();
}

export function getCodexCliCommand() {
  return getConfiguredCommand() || process.env.HOLOCODEX_CODEX_CLI || process.env.CODEX_CLI || "codex";
}

async function resolveCommand(command: string) {
  if (command.includes(path.sep)) {
    return command;
  }

  try {
    const { stdout } = await execFileAsync("which", [command], {
      timeout: 5000,
      maxBuffer: 128 * 1024
    });
    return stdout.trim().split("\n")[0] || command;
  } catch {
    return command;
  }
}

function getCliSource(resolvedCommand: string): CodexCliSource {
  if (getConfiguredCommand()) {
    return "custom";
  }

  if (resolvedCommand === codexAppBundledPath) {
    return "codex-app-bundled";
  }

  return "path";
}

export async function getCodexCliDiagnostics(): Promise<CodexCliDiagnostics> {
  const command = getCodexCliCommand();
  const resolvedCommand = await resolveCommand(command);
  const source = getCliSource(resolvedCommand);
  const skipGitRepoCheck = Boolean(getHologramConfig().codexCli?.skipGitRepoCheck);

  try {
    const [{ stdout: versionStdout, stderr: versionStderr }, { stdout: helpStdout }] =
      await Promise.all([
        execFileAsync(command, ["--version"], { timeout: 5000, maxBuffer: 256 * 1024 }),
        execFileAsync(command, ["exec", "--help"], { timeout: 5000, maxBuffer: 512 * 1024 })
      ]);

    const version = `${versionStdout}${versionStderr}`.trim().split("\n").at(-1)?.trim();

    return {
      available: true,
      command: resolvedCommand,
      source,
      version: version || "unknown",
      execJsonSupported: helpStdout.includes("--json"),
      skipGitRepoCheck
    };
  } catch (error) {
    return {
      available: false,
      command: resolvedCommand,
      source,
      skipGitRepoCheck,
      error: redactAndTrim(error instanceof Error ? error.message : "Codex CLI check failed.", 500)
    };
  }
}
