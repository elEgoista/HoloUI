import type { AgentTask, ApprovalDecision, StartTaskInput } from "../types";
import type { RunnerAdapter } from "./RunnerAdapter";

export class CodexAppServerRunnerAdapter implements RunnerAdapter {
  async startTask(_input: StartTaskInput): Promise<AgentTask> {
    throw new Error(
      "CodexAppServerRunnerAdapter is a placeholder. Map JSON-RPC app-server events to RunnerEvent here."
    );
  }

  async sendFollowUp(_taskId: string, _prompt: string): Promise<AgentTask> {
    throw new Error("Codex App Server follow-up is not implemented yet.");
  }

  async approve(
    _taskId: string,
    _approvalId: string,
    _decision: ApprovalDecision
  ): Promise<AgentTask> {
    throw new Error("Codex App Server approvals are not implemented yet.");
  }

  async getTask(_taskId: string): Promise<AgentTask | null> {
    return null;
  }

  async listTasks(): Promise<AgentTask[]> {
    return [];
  }
}
