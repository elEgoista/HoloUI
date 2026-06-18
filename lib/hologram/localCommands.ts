import { exec, execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import type { GitSummary, ProjectConfig, ProjectGitInfo, TestCommandResult } from "./types";

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);
const maxBuffer = 1024 * 1024;

function assertUsableProjectPath(projectPath: string) {
  const resolved = path.resolve(projectPath);
  const stat = fs.statSync(resolved);

  if (!stat.isDirectory()) {
    throw new Error("Configured project path is not a directory.");
  }

  return resolved;
}

function cleanError(error: unknown) {
  if (error instanceof Error) {
    return error.message.split("\n").slice(0, 3).join("\n");
  }

  return "Unknown command error.";
}

export async function getCurrentBranch(projectPath: string) {
  const cwd = assertUsableProjectPath(projectPath);
  const { stdout } = await execFileAsync("git", ["branch", "--show-current"], {
    cwd,
    timeout: 5000,
    maxBuffer
  });

  return stdout.trim() || "detached";
}

export async function getProjectGitInfo(projectPath: string): Promise<ProjectGitInfo> {
  const cwd = assertUsableProjectPath(projectPath);

  try {
    const { stdout: insideStdout } = await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd,
      timeout: 5000,
      maxBuffer
    });

    if (insideStdout.trim() !== "true") {
      return {
        isGitRepo: false,
        gitStatusAvailable: false,
        gitError: "Configured project path is not inside a Git work tree."
      };
    }

    const { stdout: rootStdout } = await execFileAsync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      timeout: 5000,
      maxBuffer
    });

    await execFileAsync("git", ["status", "--short"], {
      cwd,
      timeout: 5000,
      maxBuffer
    });

    return {
      isGitRepo: true,
      gitRoot: rootStdout.trim() || cwd,
      gitStatusAvailable: true
    };
  } catch (error) {
    return {
      isGitRepo: false,
      gitStatusAvailable: false,
      gitError: cleanError(error)
    };
  }
}

export async function getGitStatus(projectPath: string) {
  const cwd = assertUsableProjectPath(projectPath);
  const { stdout } = await execFileAsync("git", ["status", "--short"], {
    cwd,
    timeout: 5000,
    maxBuffer
  });

  return stdout.trim() || "clean";
}

export async function getGitDiffStat(projectPath: string) {
  const cwd = assertUsableProjectPath(projectPath);
  const [{ stdout: diffStdout }, { stdout: statusStdout }] = await Promise.all([
    execFileAsync("git", ["diff", "--stat"], {
      cwd,
      timeout: 5000,
      maxBuffer
    }),
    execFileAsync("git", ["status", "--short"], {
      cwd,
      timeout: 5000,
      maxBuffer
    })
  ]);
  const untrackedFiles = statusStdout
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.startsWith("?? "))
    .map((line) => `${line.slice(3).trim()} | untracked`);
  const sections = [diffStdout.trim(), ...untrackedFiles].filter(Boolean);

  return sections.length ? sections.join("\n") : "No working tree diff.";
}

export async function getGitSummary(project: ProjectConfig): Promise<GitSummary> {
  try {
    const git = await getProjectGitInfo(project.path);
    if (!git.isGitRepo || !git.gitStatusAvailable) {
      return {
        branch: "unknown",
        status: "unavailable",
        diffStat: "unavailable",
        isGitRepo: git.isGitRepo,
        gitRoot: git.gitRoot,
        gitStatusAvailable: git.gitStatusAvailable,
        error: git.gitError
      };
    }

    const [branch, status, diffStat] = await Promise.all([
      getCurrentBranch(project.path),
      getGitStatus(project.path),
      getGitDiffStat(project.path)
    ]);

    return {
      branch,
      status,
      diffStat,
      isGitRepo: true,
      gitRoot: git.gitRoot,
      gitStatusAvailable: true
    };
  } catch (error) {
    return {
      branch: "unknown",
      status: "unavailable",
      diffStat: "unavailable",
      isGitRepo: false,
      gitStatusAvailable: false,
      error: cleanError(error)
    };
  }
}

export async function runTestCommand(
  projectPath: string,
  testCommand: string,
  timeoutMs = 30000
): Promise<TestCommandResult> {
  const cwd = assertUsableProjectPath(projectPath);
  const startedAt = Date.now();

  try {
    const { stdout, stderr } = await execAsync(testCommand, {
      cwd,
      timeout: timeoutMs,
      maxBuffer,
      windowsHide: true
    });

    return {
      ok: true,
      command: testCommand,
      exitCode: 0,
      stdout,
      stderr,
      durationMs: Date.now() - startedAt,
      timedOut: false
    };
  } catch (error) {
    const commandError = error as Error & {
      code?: number | null;
      stdout?: string;
      stderr?: string;
      killed?: boolean;
      signal?: string;
    };

    return {
      ok: false,
      command: testCommand,
      exitCode: typeof commandError.code === "number" ? commandError.code : null,
      stdout: commandError.stdout ?? "",
      stderr: commandError.stderr ?? "",
      durationMs: Date.now() - startedAt,
      timedOut: Boolean(commandError.killed || commandError.signal === "SIGTERM"),
      error: cleanError(error)
    };
  }
}
