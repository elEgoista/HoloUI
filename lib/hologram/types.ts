export type AgentStatus =
  | "idle"
  | "listening"
  | "transcribed"
  | "awaiting_confirmation"
  | "running"
  | "needs_approval"
  | "review"
  | "completed"
  | "failed";

export type ChangedFile = {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  additions?: number;
  deletions?: number;
};

export type GitSafety = "enabled" | "disabled-dev-only";

export type TestSummary = {
  passed: number;
  failed: number;
  skipped?: number;
  rawOutput?: string;
};

export type TaskSource = "voice" | "text" | "mock" | "api";

export type RunnerMode = "mock" | "codex-cli" | "codex-sdk" | "codex-app-server" | "claude" | "cursor" | "github";

export type AgentLog = {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
};

export type NextAction = {
  id: string;
  label: string;
  kind:
    | "explain_failure"
    | "ask_to_fix"
    | "show_diff"
    | "generate_commit_summary"
    | "run_tests_again"
    | "approve"
    | "decline";
};

export type ApprovalRequest = {
  id: string;
  title: string;
  description: string;
  command?: string;
  riskLevel: "low" | "medium" | "high";
};

export type ApprovalHistoryEntry = {
  id: string;
  approvalId: string;
  decision: ApprovalDecision;
  timestamp: string;
};

export type AgentTask = {
  id: string;
  projectId: string;
  prompt: string;
  status: AgentStatus;
  createdAt: string;
  updatedAt: string;
  source?: TaskSource;
  adapter?: RunnerMode;
  transcript?: string;
  normalizedPrompt?: string;
  externalSessionId?: string;
  externalRunId?: string;
  summary?: string;
  resultSummary?: string;
  diffSummary?: string;
  testSummary?: string;
  gitSafety?: GitSafety;
  workingTreeCleanBefore?: boolean;
  workingTreeDirtyAfter?: boolean;
  changedFiles?: ChangedFile[];
  tests?: TestSummary;
  logs: AgentLog[];
  eventLog?: AgentLog[];
  approvalHistory?: ApprovalHistoryEntry[];
  nextActions?: NextAction[];
  approvalRequest?: ApprovalRequest;
};

export type ProjectConfig = {
  id: string;
  name: string;
  path: string;
  testCommand: string;
  defaultBranch: string;
};

export type HologramConfig = {
  projects: ProjectConfig[];
  server: {
    port: number;
    host: string;
  };
  runner: {
    mode: Extract<RunnerMode, "mock" | "codex-cli" | "codex-sdk" | "codex-app-server">;
  };
  codexCli?: {
    command?: string;
    skipGitRepoCheck?: boolean;
  };
};

export type PublicProject = Omit<ProjectConfig, "path" | "testCommand"> & {
  testCommandConfigured: boolean;
  git?: ProjectGitInfo;
};

export type StartTaskInput = {
  projectId: string;
  prompt: string;
  transcript?: string;
  source?: TaskSource;
};

export type ApprovalDecision = "approve_once" | "approve_session" | "decline";

export type RunnerEvent =
  | { type: "task_created"; task: AgentTask }
  | { type: "task_updated"; task: AgentTask }
  | { type: "log"; taskId: string; log: AgentLog }
  | { type: "state_reset" };

export type GitSummary = {
  branch: string;
  status: string;
  diffStat: string;
  isGitRepo?: boolean;
  gitRoot?: string;
  gitStatusAvailable?: boolean;
  error?: string;
};

export type ProjectGitInfo = {
  isGitRepo: boolean;
  gitRoot?: string;
  gitStatusAvailable: boolean;
  gitError?: string;
};

export type TestCommandResult = {
  ok: boolean;
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  error?: string;
};
