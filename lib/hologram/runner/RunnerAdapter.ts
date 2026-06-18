import type { AgentTask, ApprovalDecision, StartTaskInput } from "../types";

export interface RunnerAdapter {
  startTask(input: StartTaskInput): Promise<AgentTask>;
  sendFollowUp(taskId: string, prompt: string): Promise<AgentTask>;
  approve(taskId: string, approvalId: string, decision: ApprovalDecision): Promise<AgentTask>;
  cancel?(taskId: string): Promise<AgentTask>;
  getTask(taskId: string): Promise<AgentTask | null>;
  listTasks(projectId?: string): Promise<AgentTask[]>;
  reset?(): Promise<void>;
}
