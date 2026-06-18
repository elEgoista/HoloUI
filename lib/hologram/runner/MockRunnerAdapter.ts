import { runnerEvents } from "../events";
import { assertTransition } from "../stateMachine";
import { taskStore } from "../store";
import type {
  AgentLog,
  AgentTask,
  ApprovalDecision,
  StartTaskInput
} from "../types";
import type { RunnerAdapter } from "./RunnerAdapter";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function now() {
  return new Date().toISOString();
}

function makeLog(message: string, level: AgentLog["level"] = "info"): AgentLog {
  return {
    id: crypto.randomUUID(),
    timestamp: now(),
    level,
    message
  };
}

export class MockRunnerAdapter implements RunnerAdapter {
  async startTask(input: StartTaskInput): Promise<AgentTask> {
    const task: AgentTask = {
      id: crypto.randomUUID(),
      projectId: input.projectId,
      prompt: input.prompt,
      status: "running",
      createdAt: now(),
      updatedAt: now(),
      source: input.source ?? "mock",
      adapter: "mock",
      transcript: input.transcript ?? input.prompt,
      normalizedPrompt: input.prompt.trim(),
      logs: [makeLog("Task accepted by local mock runner.")]
    };
    task.eventLog = task.logs;

    taskStore.upsert(task);
    runnerEvents.publish({ type: "task_created", task });
    void this.simulateWorkflow(task.id);
    return task;
  }

  async sendFollowUp(taskId: string, prompt: string): Promise<AgentTask> {
    const task = this.requireTask(taskId);
    const updated = this.patchTask(task, {
      status: "running",
      logs: [...task.logs, makeLog(`Follow-up queued: ${prompt}`)],
      nextActions: undefined,
      approvalRequest: undefined
    });

    void this.simulateWorkflow(updated.id, "follow-up");
    return updated;
  }

  async approve(
    taskId: string,
    approvalId: string,
    decision: ApprovalDecision
  ): Promise<AgentTask> {
    const task = this.requireTask(taskId);
    const approved = decision !== "decline";
    const updated = this.patchTask(task, {
      status: approved ? "running" : "failed",
      approvalRequest: undefined,
      logs: [
        ...task.logs,
        makeLog(
          `Approval ${approvalId} decision: ${decision}.`,
          approved ? "info" : "warning"
        )
      ],
      approvalHistory: [
        ...(task.approvalHistory ?? []),
        { id: crypto.randomUUID(), approvalId, decision, timestamp: now() }
      ]
    });

    if (approved) {
      void this.simulateWorkflow(updated.id, "approved");
    }

    return updated;
  }

  async getTask(taskId: string) {
    return taskStore.get(taskId);
  }

  async listTasks(projectId?: string) {
    return taskStore.list(projectId);
  }

  async reset() {
    taskStore.reset();
    runnerEvents.publish({ type: "state_reset" });
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

    const updated: AgentTask = {
      ...task,
      ...patch,
      eventLog: patch.logs ?? task.logs,
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

  private async simulateWorkflow(
    taskId: string,
    mode: "initial" | "approved" | "follow-up" = "initial"
  ) {
    try {
      await delay(700);
      this.appendLog(taskId, "Reading project configuration and workspace context.");
      await delay(850);
      this.appendLog(taskId, "Analyzing parser and UI boundaries.");
      await delay(950);
      this.appendLog(taskId, "Preparing mock file edits.");
      await delay(800);
      this.appendLog(taskId, "Running configured checks in mock mode.");
      await delay(700);

      const task = this.requireTask(taskId);
      this.patchTask(task, {
        status: mode === "initial" ? "needs_approval" : mode === "approved" ? "review" : "completed",
        summary:
          mode === "initial"
            ? "Mock Codex workflow paused for approval before review."
            : mode === "approved"
              ? "Mock Codex workflow finished. The implementation plan is ready for review."
              : "Follow-up handled in mock mode. No real files were changed.",
        resultSummary:
          mode === "initial"
            ? "Mock Codex workflow paused for approval before review."
            : mode === "approved"
              ? "Mock Codex workflow finished. The implementation plan is ready for review."
              : "Follow-up handled in mock mode. No real files were changed.",
        diffSummary: "Mock diff summary: 3 files changed.",
        testSummary:
          mode === "initial"
            ? "42 passed, 1 failed. Mock failure: parser preserves legacy whitespace."
            : "43 passed, 0 failed.",
        changedFiles: [
          { path: "src/parser/index.ts", status: "modified", additions: 48, deletions: 17 },
          { path: "src/parser/tokenize.ts", status: "added", additions: 91, deletions: 0 },
          { path: "tests/parser.test.ts", status: "modified", additions: 32, deletions: 4 }
        ],
        tests: {
          passed: mode === "initial" ? 42 : 43,
          failed: mode === "initial" ? 1 : 0,
          skipped: 0,
          rawOutput:
            mode === "initial"
              ? "42 passed, 1 failed. Mock failure: parser preserves legacy whitespace."
              : "43 passed, 0 failed."
        },
        nextActions:
          mode === "initial"
            ? undefined
            : [
                { id: "explain-failure", label: "Explain failure", kind: "explain_failure" },
                { id: "ask-fix", label: "Ask to fix", kind: "ask_to_fix" },
                { id: "show-diff", label: "Show diff", kind: "show_diff" },
                {
                  id: "commit-summary",
                  label: "Generate commit summary",
                  kind: "generate_commit_summary"
                },
                { id: "rerun-tests", label: "Run tests again", kind: "run_tests_again" }
              ],
        approvalRequest:
          mode === "initial"
            ? {
                id: "mock-approval",
                title: "Run project tests",
                description:
                  "Mock runner is asking how a future real adapter should handle local test execution.",
                command: "configured testCommand",
                riskLevel: "low"
              }
            : undefined
      });
    } catch (error) {
      const task = taskStore.get(taskId);
      if (task) {
        this.patchTask(task, {
          status: "failed",
          summary: error instanceof Error ? error.message : "Mock runner failed."
        });
      }
    }
  }
}
