import type { AgentTask, GitSummary, PublicProject, TestCommandResult } from "./types";

const tokenStorageKey = "holocodex.localToken";
const tokenHeader = "x-holocodex-token";

export function getStoredLocalToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(tokenStorageKey) ?? "";
}

export function storeLocalToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  const cleanToken = token.trim();

  if (cleanToken) {
    window.localStorage.setItem(tokenStorageKey, cleanToken);
  } else {
    window.localStorage.removeItem(tokenStorageKey);
  }
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const token = getStoredLocalToken();

  if (token && !headers.has(tokenHeader)) {
    headers.set(tokenHeader, token);
  }

  const response = await fetch(input, {
    ...init,
    headers
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error ?? "Request failed.") as Error & {
      status?: number;
      tokenRequired?: boolean;
    };
    error.status = response.status;
    error.tokenRequired = Boolean(data.tokenRequired);
    throw error;
  }

  return data as T;
}

export type ConfigResponse = {
  projects: PublicProject[];
  runner: { mode: string };
  server: { port: number; host: string };
  allowLan: boolean;
  tokenRequired: boolean;
};

export type TasksResponse = { tasks: AgentTask[] };
export type TaskResponse = { task: AgentTask };
export type GitResponse = GitSummary;
export type TestResponse = TestCommandResult;
export type HealthResponse = {
  ok: boolean;
  version: string;
  runnerMode: string;
  projectsCount: number;
  projects: PublicProject[];
  gitSafetyWarnings: string[];
  sse: "available";
  codexCliAvailable: boolean;
  codexCliVersion: string | null;
  codexCliCommand: string;
  codexCliSource: "codex-app-bundled" | "path" | "custom";
  codexCliExecJsonSupported: boolean;
  codexCliSkipGitRepoCheck: boolean;
  codexCliError: string | null;
  currentProject: string | null;
  localTokenEnabled: boolean;
  activeTasksCount: number;
  lastTaskStatus: string | null;
};
