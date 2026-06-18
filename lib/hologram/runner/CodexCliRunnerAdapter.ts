import { spawn, type ChildProcess } from "node:child_process";
import { getHologramConfig, getProjectConfig } from "../config";
import { runnerEvents } from "../events";
import { getGitDiffStat, getGitStatus, runTestCommand } from "../localCommands";
import { redactAndTrim } from "../redact";
import { assertTransition } from "../stateMachine";
import { taskStore } from "../store";
import type {
  AgentLog,
  AgentTask,
  ApprovalDecision,
  ChangedFile,
  NextAction,
  StartTaskInput,
  TestSummary
} from "../types";
import { getCodexCliGitSafety } from "./codexCliGitSafety";
import { getCodexCliCommand, getCodexCliDiagnostics } from "./codexCliDiagnostics";
import type { RunnerAdapter } from "./RunnerAdapter";

const cliTimeoutMs = Number(process.env.HOLOCODEX_CODEX_CLI_TIMEOUT_MS ?? 10 * 60 * 1000);

function now() {
  return new Date().toISOString();
}

function makeLog(message: string, level: AgentLog["level"] = "info"): AgentLog {
  return {
    id: crypto.randomUUID(),
    timestamp: now(),
    level,
    message: redactAndTrim(message)
  };
}

function parseGitStatus(status: string): ChangedFile[] {
  if (
    !status ||
    status === "clean" ||
    status === "unavailable" ||
    status.startsWith("unavailable:") ||
    status.includes("not a git repository")
  ) {
    return [];
  }

  return status
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const code = line.slice(0, 2);
      const filePath = line.slice(3).trim() || line.trim();
      const statusCode = code.includes("A")
        ? "added"
        : code.includes("D")
          ? "deleted"
          : code.includes("R")
            ? "renamed"
            : "modified";

      return {
        path: filePath,
        status: statusCode
      };
    });
}

function parseTestSummary(result: Awaited<ReturnType<typeof runTestCommand>>): TestSummary {
  const combined = `${result.stdout}\n${result.stderr}`;
  const passed = Number(combined.match(/(\d+)\s+passed/i)?.[1] ?? (result.ok ? 1 : 0));
  const failed = Number(combined.match(/(\d+)\s+failed/i)?.[1] ?? (result.ok ? 0 : 1));
  const skipped = Number(combined.match(/(\d+)\s+skipped/i)?.[1] ?? 0);

  return {
    passed,
    failed,
    skipped,
    rawOutput: redactAndTrim(combined, 5000)
  };
}

function buildNextActions(diffExists: boolean, testsFailed: boolean): NextAction[] {
  if (testsFailed) {
    return [{ id: "ask-fix-tests", label: "Ask agent to fix failing tests", kind: "ask_to_fix" }];
  }

  if (diffExists) {
    return [
      { id: "show-diff", label: "Review diff", kind: "show_diff" },
      { id: "commit-summary", label: "Generate commit summary", kind: "generate_commit_summary" }
    ];
  }

  return [{ id: "clarify-retry", label: "Clarify task or retry", kind: "ask_to_fix" }];
}

function codexSummary(exitCode: number | null, stdout: string, stderr: string) {
  const output = redactAndTrim([stdout, stderr].filter(Boolean).join("\n").trim(), 1200);

  if (exitCode === 0) {
    return output || "Codex CLI completed without additional output.";
  }

  if (/auth|login|credential|not authenticated/i.test(output)) {
    return "Codex CLI is installed but not ready/authenticated. Run `codex login` locally and retry.";
  }

  return output || `Codex CLI exited with code ${exitCode ?? "unknown"}.`;
}

export class CodexCliRunnerAdapter implements RunnerAdapter {
  private activeProcesses = new Map<string, ChildProcess>();

  async startTask(input: StartTaskInput): Promise<AgentTask> {
    const project = getProjectConfig(input.projectId);
    const codexCliConfig = getHologramConfig().codexCli;
    const gitSafety = await getCodexCliGitSafety(project, Boolean(codexCliConfig?.skipGitRepoCheck));

    if (!gitSafety.allowed) {
      throw new Error(gitSafety.error);
    }

    const logs = [makeLog("Task accepted by Codex CLI runner.")];
    if (gitSafety.warning) {
      logs.push(makeLog(gitSafety.warning, "warning"));
    }

    const task: AgentTask = {
      id: crypto.randomUUID(),
      projectId: input.projectId,
      prompt: input.prompt,
      status: "running",
      createdAt: now(),
      updatedAt: now(),
      source: input.source ?? "api",
      adapter: "codex-cli",
      gitSafety: gitSafety.gitSafety,
      workingTreeCleanBefore: gitSafety.git.isGitRepo ? (await getGitStatus(project.path)) === "clean" : undefined,
      transcript: input.transcript ?? input.prompt,
      normalizedPrompt: input.prompt.trim(),
      externalRunId: crypto.randomUUID(),
      logs
    };

    task.eventLog = task.logs;
    taskStore.upsert(task);
    runnerEvents.publish({ type: "task_created", task });
    void this.runCodex(task.id, input.prompt);
    return task;
  }

  async sendFollowUp(taskId: string, prompt: string): Promise<AgentTask> {
    const task = this.requireTask(taskId);
    const updated = this.patchTask(task, {
      status: "running",
      prompt: task.prompt,
      normalizedPrompt: prompt.trim(),
      logs: [...task.logs, makeLog(`Follow-up queued for Codex CLI: ${prompt}`)],
      nextActions: undefined,
      approvalRequest: undefined
    });

    void this.runCodex(updated.id, `Follow-up for the existing HoloCodex task:\n\n${prompt}`);
    return updated;
  }

  async approve(
    taskId: string,
    approvalId: string,
    decision: ApprovalDecision
  ): Promise<AgentTask> {
    const task = this.requireTask(taskId);

    return this.patchTask(task, {
      status: decision === "decline" ? "failed" : "running",
      approvalRequest: undefined,
      approvalHistory: [
        ...(task.approvalHistory ?? []),
        { id: crypto.randomUUID(), approvalId, decision, timestamp: now() }
      ],
      logs: [
        ...task.logs,
        makeLog(
          `Approval ${approvalId} decision recorded for Codex CLI: ${decision}. No pending CLI approval was executed automatically.`,
          decision === "decline" ? "warning" : "info"
        )
      ]
    });
  }

  async cancel(taskId: string): Promise<AgentTask> {
    const task = this.requireTask(taskId);
    this.activeProcesses.get(taskId)?.kill("SIGTERM");
    this.activeProcesses.delete(taskId);

    return this.patchTask(task, {
      status: "failed",
      summary: "Codex CLI task was cancelled.",
      resultSummary: "Codex CLI task was cancelled.",
      logs: [...task.logs, makeLog("Codex CLI process cancelled.", "warning")]
    });
  }

  async getTask(taskId: string) {
    return taskStore.get(taskId);
  }

  async listTasks(projectId?: string) {
    return taskStore.list(projectId);
  }

  async reset() {
    for (const process of this.activeProcesses.values()) {
      process.kill("SIGTERM");
    }
    this.activeProcesses.clear();
    taskStore.reset();
    runnerEvents.publish({ type: "state_reset" });
  }

  private async runCodex(taskId: string, prompt: string) {
    const diagnostics = await getCodexCliDiagnostics();
    const task = this.requireTask(taskId);
    const project = getProjectConfig(task.projectId);
    const codexCliConfig = getHologramConfig().codexCli;

    if (!diagnostics.available) {
      this.patchTask(task, {
        status: "failed",
        summary: `Codex CLI is not available: ${diagnostics.error ?? diagnostics.command}`,
        resultSummary: `Codex CLI is not available: ${diagnostics.error ?? diagnostics.command}`,
        logs: [
          ...task.logs,
          makeLog(`Codex CLI is not available. Command: ${diagnostics.command}.`, "error")
        ]
      });
      return;
    }

    if (!diagnostics.execJsonSupported) {
      this.patchTask(task, {
        status: "failed",
        summary: "Codex CLI is installed, but `codex exec --json` is not supported by this version.",
        resultSummary: "Codex CLI non-interactive JSON mode is not supported.",
        logs: [...task.logs, makeLog("Codex CLI lacks `exec --json` support.", "error")]
      });
      return;
    }

    const command = getCodexCliCommand();
    const args = [
      "--ask-for-approval",
      "never",
      "exec",
      "--json",
      "--cd",
      project.path,
      "--sandbox",
      "workspace-write",
      ...(codexCliConfig?.skipGitRepoCheck ? ["--skip-git-repo-check"] : []),
      prompt
    ];
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];
    let settled = false;

    this.appendLog(taskId, `Starting Codex CLI ${diagnostics.version ?? ""} in configured project.`);

    const child = spawn(command, args, {
      cwd: project.path,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    this.activeProcesses.set(taskId, child);

    const timeout = setTimeout(() => {
      if (!settled) {
        this.appendLog(taskId, `Codex CLI timeout after ${cliTimeoutMs}ms.`, "error");
        child.kill("SIGTERM");
      }
    }, cliTimeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stdoutChunks.push(text);
      for (const line of text.split(/\r?\n/).filter(Boolean)) {
        this.appendLog(taskId, this.formatCodexEvent(taskId, line), "info");
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderrChunks.push(text);
      for (const line of text.split(/\r?\n/).filter(Boolean)) {
        this.appendLog(taskId, line, "warning");
      }
    });

    child.on("error", (error) => {
      stderrChunks.push(error.message);
      this.appendLog(taskId, error.message, "error");
    });

    child.on("close", (exitCode) => {
      settled = true;
      clearTimeout(timeout);
      this.activeProcesses.delete(taskId);
      void this.finalizeTask(taskId, exitCode, stdoutChunks.join(""), stderrChunks.join(""));
    });
  }

  private formatCodexEvent(taskId: string, line: string) {
    try {
      const event = JSON.parse(line) as {
        type?: string;
        message?: string;
        thread_id?: string;
        item?: { type?: string; text?: string };
      };

      if (event.type === "thread.started" && event.thread_id) {
        const task = this.requireTask(taskId);
        if (!task.externalSessionId) {
          this.patchTask(task, {
            externalSessionId: event.thread_id,
            logs: [...task.logs, makeLog(`Codex thread id: ${event.thread_id}`)]
          });
        }
      }

      return event.message ?? event.item?.text ?? `Codex event: ${event.type ?? "unknown"}`;
    } catch {
      return line;
    }
  }

  private async finalizeTask(taskId: string, exitCode: number | null, stdout: string, stderr: string) {
    const task = this.requireTask(taskId);
    const project = getProjectConfig(task.projectId);
    const [gitStatus, diffStat, testResult] = await Promise.all([
      getGitStatus(project.path).catch((error) => `unavailable: ${error instanceof Error ? error.message : error}`),
      getGitDiffStat(project.path).catch((error) => `unavailable: ${error instanceof Error ? error.message : error}`),
      project.testCommand
        ? runTestCommand(project.path, project.testCommand)
        : Promise.resolve(null)
    ]);
    const tests = testResult ? parseTestSummary(testResult) : undefined;
    const diffExists = Boolean(diffStat && diffStat !== "No unstaged diff." && !diffStat.startsWith("unavailable"));
    const testsFailed = Boolean(tests?.failed);
    const success = exitCode === 0 && !testsFailed;
    const summary = codexSummary(exitCode, stdout, stderr);
    const workingTreeDirtyAfter = gitStatus !== "clean" && !gitStatus.startsWith("unavailable:");

    this.patchTask(task, {
      status: success ? "completed" : "failed",
      summary,
      resultSummary: summary,
      diffSummary: diffStat,
      testSummary: tests?.rawOutput,
      workingTreeDirtyAfter,
      changedFiles: parseGitStatus(gitStatus),
      tests,
      nextActions: buildNextActions(diffExists, testsFailed),
      logs: [
        ...task.logs,
        makeLog(`Codex CLI exited with code ${exitCode ?? "unknown"}.`, success ? "info" : "error"),
        makeLog(`Diff summary: ${diffStat}`),
        ...(testResult ? [makeLog(`Configured tests completed: ok=${testResult.ok}.`)] : [])
      ]
    });
  }

  private requireTask(taskId: string) {
    const task = taskStore.get(taskId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return task;
  }

  private patchTask(task: AgentTask, patch: Partial<AgentTask>) {
    if (patch.status && patch.status !== task.status) {
      assertTransition(task.status, patch.status);
    }

    const updatedLogs = patch.logs ?? task.logs;
    const updated: AgentTask = {
      ...task,
      ...patch,
      logs: updatedLogs,
      eventLog: updatedLogs,
      updatedAt: now()
    };

    taskStore.upsert(updated);
    runnerEvents.publish({ type: "task_updated", task: updated });
    return updated;
  }

  private appendLog(taskId: string, message: string, level: AgentLog["level"] = "info") {
    const task = this.requireTask(taskId);
    const log = makeLog(message, level);
    const updated = this.patchTask(task, {
      logs: [...task.logs, log]
    });
    runnerEvents.publish({ type: "log", taskId, log });
    return updated;
  }
}
