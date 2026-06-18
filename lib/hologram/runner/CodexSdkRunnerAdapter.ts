import type { AgentTask, ApprovalDecision, StartTaskInput } from "../types";
import type { RunnerAdapter } from "./RunnerAdapter";

export class CodexSdkRunnerAdapter implements RunnerAdapter {
  async startTask(_input: StartTaskInput): Promise<AgentTask> {
    throw new Error(
      "CodexSdkRunnerAdapter is a placeholder. Connect SDK task creation and event streaming here."
    );
  }

  async sendFollowUp(_taskId: string, _prompt: string): Promise<AgentTask> {
    throw new Error("Codex SDK follow-up is not implemented yet.");
  }

  async approve(
    _taskId: string,
    _approvalId: string,
    _decision: ApprovalDecision
  ): Promise<AgentTask> {
    throw new Error("Codex SDK approvals are not implemented yet.");
  }

  async getTask(_taskId: string): Promise<AgentTask | null> {
    return null;
  }

  async listTasks(): Promise<AgentTask[]> {
    return [];
  }
}
