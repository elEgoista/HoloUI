"use client";

import { HoloAvatar } from "@/components/avatar/HoloAvatar";
import type { HoloAvatarAssetKey, HoloAvatarState } from "@/components/avatar/types";
import { fetchJson, getStoredLocalToken, storeLocalToken } from "@/lib/hologram/client";
import type {
  ConfigResponse,
  GitResponse,
  HealthResponse,
  TaskResponse,
  TasksResponse,
  TestResponse
} from "@/lib/hologram/client";
import type { AgentTask, ApprovalDecision, PublicProject, RunnerEvent } from "@/lib/hologram/types";
import { useCallback, useEffect, useMemo, useState } from "react";

const avatarPreviewStates: HoloAvatarState[] = [
  "idle",
  "listening",
  "confirm",
  "running",
  "approval",
  "result-success",
  "result-warning",
  "result-error"
];

export default function DashboardPage() {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("default");
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [git, setGit] = useState<GitResponse | null>(null);
  const [testResult, setTestResult] = useState<TestResponse | null>(null);
  const [prompt, setPrompt] = useState("Refactor parser into a separate module and run tests.");
  const [runnerLog, setRunnerLog] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localToken, setLocalToken] = useState("");
  const [tokenRequired, setTokenRequired] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [avatarPreviewState, setAvatarPreviewState] = useState<HoloAvatarState>("idle");
  const [avatarPreviewSpeaking, setAvatarPreviewSpeaking] = useState(false);
  const [avatarPreviewMirrored, setAvatarPreviewMirrored] = useState(false);
  const [avatarPreviewAnimate, setAvatarPreviewAnimate] = useState(true);
  const [avatarForceBlinkNonce, setAvatarForceBlinkNonce] = useState(0);
  const [avatarForceSmileNonce, setAvatarForceSmileNonce] = useState(0);
  const [avatarActiveAsset, setAvatarActiveAsset] = useState<HoloAvatarAssetKey>("neutral");

  const activeTask = tasks[0] ?? null;
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId]
  );
  const selectedProjectGit = selectedProject?.git;

  async function loadConfig() {
    try {
      const config = await fetchJson<ConfigResponse>("/api/config");
      setProjects(config.projects);
      setSelectedProjectId(config.projects[0]?.id ?? "default");
      setTokenRequired(config.tokenRequired);
      setError(null);
      return true;
    } catch (configError) {
      if ((configError as Error & { tokenRequired?: boolean }).tokenRequired) {
        setTokenRequired(true);
        setError("Local token required.");
        return false;
      }
      throw configError;
    }
  }

  async function refreshHealth() {
    try {
      setHealth(await fetchJson<HealthResponse>("/api/health"));
    } catch (healthError) {
      setRunnerLog((current) => [
        `health: ${healthError instanceof Error ? healthError.message : "failed"}`,
        ...current
      ]);
    }
  }

  const refreshTasks = useCallback(async (projectId = selectedProjectId) => {
    const data = await fetchJson<TasksResponse>(`/api/tasks?projectId=${projectId}`);
    setTasks(data.tasks);
  }, [selectedProjectId]);

  const refreshGit = useCallback(async (projectId = selectedProjectId) => {
    setBusy("git");
    try {
      setGit(await fetchJson<GitResponse>(`/api/projects/${projectId}/git`));
    } finally {
      setBusy(null);
    }
  }, [selectedProjectId]);

  async function createTask(taskPrompt = prompt) {
    setBusy("task");
    setError(null);
    try {
      const data = await fetchJson<TaskResponse>("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId, prompt: taskPrompt })
      });
      setTasks((current) => [data.task, ...current.filter((task) => task.id !== data.task.id)]);
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : "Task failed.");
    } finally {
      setBusy(null);
    }
  }

  async function runTests() {
    setBusy("tests");
    setError(null);
    try {
      setTestResult(
        await fetchJson<TestResponse>(`/api/projects/${selectedProjectId}/tests`, {
          method: "POST"
        })
      );
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "Tests failed.");
    } finally {
      setBusy(null);
    }
  }

  async function resetState() {
    setBusy("reset");
    await fetchJson<{ ok: boolean }>("/api/tasks", { method: "DELETE" });
    setTasks([]);
    setRunnerLog([]);
    setBusy(null);
  }

  async function sendFollowUp(task: AgentTask, label: string) {
    setBusy("follow-up");
    setError(null);
    try {
      const data = await fetchJson<TaskResponse>(`/api/tasks/${task.id}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: label })
      });
      setTasks((current) => [data.task, ...current.filter((item) => item.id !== data.task.id)]);
    } catch (followUpError) {
      setError(followUpError instanceof Error ? followUpError.message : "Follow-up failed.");
    } finally {
      setBusy(null);
    }
  }

  async function sendApproval(task: AgentTask, decision: ApprovalDecision) {
    if (!task.approvalRequest) return;
    setBusy("approval");
    setError(null);
    try {
      const data = await fetchJson<TaskResponse>(`/api/tasks/${task.id}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId: task.approvalRequest.id, decision })
      });
      setTasks((current) => [data.task, ...current.filter((item) => item.id !== data.task.id)]);
    } catch (approvalError) {
      setError(approvalError instanceof Error ? approvalError.message : "Approval failed.");
    } finally {
      setBusy(null);
    }
  }

  function pulseAvatarPreview(kind: "blink" | "smile") {
    if (kind === "blink") {
      setAvatarForceBlinkNonce((current) => current + 1);
      return;
    }

    setAvatarForceSmileNonce((current) => current + 1);
  }

  useEffect(() => {
    setVoiceSupported(Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition));
    setLocalToken(getStoredLocalToken());
    void loadConfig().then((loaded) => {
      if (!loaded) return;
      void refreshTasks("default");
      void refreshGit("default");
      void refreshHealth();
    });
  }, [refreshGit, refreshTasks]);

  useEffect(() => {
    void refreshTasks(selectedProjectId);
    void refreshGit(selectedProjectId);
  }, [refreshGit, refreshTasks, selectedProjectId]);

  useEffect(() => {
    const token = getStoredLocalToken();
    const source = new EventSource(
      token ? `/api/events?token=${encodeURIComponent(token)}` : "/api/events"
    );

    source.onmessage = (event) => {
      setRunnerLog((current) => [`message ${event.data}`, ...current].slice(0, 50));
    };

    for (const eventName of ["task_created", "task_updated", "log", "state_reset"]) {
      source.addEventListener(eventName, (event) => {
        const payload = JSON.parse((event as MessageEvent).data) as RunnerEvent;
        setRunnerLog((current) => [`${eventName}: ${new Date().toLocaleTimeString()}`, ...current].slice(0, 50));

        if (payload.type === "task_created" || payload.type === "task_updated") {
          setTasks((current) => [
            payload.task,
            ...current.filter((task) => task.id !== payload.task.id)
          ]);
        }

        if (payload.type === "state_reset") {
          setTasks([]);
        }
      });
    }

    return () => source.close();
  }, []);

  return (
    <main className="deck-dashboard">
      <section className="deck-dashboard-head">
        <div>
          <span className="deck-kicker">HoloCodex Deck</span>
          <h1>Agent Bridge Dashboard</h1>
          <p>Local debug panel for project state, mock runner events, and safe configured commands.</p>
        </div>
        <a className="deck-link" href="/hologram">
          Open hologram
        </a>
      </section>

      {error ? <div className="deck-error">{error}</div> : null}
      {tokenRequired ? (
        <section className="deck-panel deck-token">
          <label>
            Local token
            <input
              value={localToken}
              onChange={(event) => setLocalToken(event.target.value)}
              placeholder="Paste HOCODEX_LOCAL_TOKEN"
              type="password"
            />
          </label>
          <button
            onClick={() => {
              storeLocalToken(localToken);
              window.location.reload();
            }}
          >
            Save token
          </button>
        </section>
      ) : null}

      <section className="deck-grid">
        <div className="deck-panel deck-span-2">
          <div className="deck-row">
            <label>
              Project
              <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={() => void refreshGit()} disabled={busy === "git"}>
              Refresh git status
            </button>
          </div>
          <div className="deck-metrics">
            <div>
              <span>Project name</span>
              <strong>{selectedProject?.name ?? "Unknown"}</strong>
            </div>
            <div>
              <span>Current branch</span>
              <strong>{git?.branch ?? "..."}</strong>
            </div>
            <div>
              <span>Git status</span>
              <strong>{git?.status === "clean" ? "clean" : "changes"}</strong>
            </div>
          </div>
          <pre className="deck-pre">{git?.diffStat ?? "No git data loaded."}</pre>
          {git?.error ? <p className="deck-warning">{git.error}</p> : null}
        </div>

        <div className="deck-panel">
          <h2>Create task</h2>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          <button className="deck-primary" onClick={() => void createTask()} disabled={busy === "task"}>
            Create task
          </button>
          <button onClick={() => void createTask("Mock task: inspect the project and prepare a review summary.")}>
            Run mock task
          </button>
        </div>

        <div className="deck-panel">
          <div className="deck-row">
            <h2>Diagnostics</h2>
            <button onClick={() => void refreshHealth()}>Refresh</button>
          </div>
          <div className="deck-metrics deck-metrics-compact">
            <div>
              <span>Runner</span>
              <strong>{health?.runnerMode ?? "..."}</strong>
            </div>
            <div>
              <span>Codex CLI</span>
              <strong>{health ? (health.codexCliAvailable ? "available" : "missing") : "..."}</strong>
            </div>
            <div>
              <span>Voice API</span>
              <strong>{voiceSupported ? "supported" : "fallback"}</strong>
            </div>
          </div>
          {health ? (
            <pre className="deck-pre">
              {[
                `version: ${health.version}`,
                `codexCliVersion: ${health.codexCliVersion ?? "unknown"}`,
                `codexCliCommand: ${health.codexCliCommand}`,
                `codexCliSource: ${health.codexCliSource}`,
                `execJson: ${health.codexCliExecJsonSupported}`,
                `skipGitRepoCheck: ${health.codexCliSkipGitRepoCheck}`,
                `project: ${health.currentProject ?? "unknown"}`,
                `gitRepo: ${selectedProjectGit?.isGitRepo ?? "unknown"}`,
                `gitRoot: ${selectedProjectGit?.gitRoot ?? "none"}`,
                `gitStatusAvailable: ${selectedProjectGit?.gitStatusAvailable ?? false}`,
                selectedProjectGit?.gitError ? `gitError: ${selectedProjectGit.gitError}` : "",
                health.gitSafetyWarnings.length
                  ? `gitSafetyWarnings:\n${health.gitSafetyWarnings.map((warning) => `- ${warning}`).join("\n")}`
                  : "",
                `localToken: ${health.localTokenEnabled ? "enabled" : "disabled"}`,
                `activeTasks: ${health.activeTasksCount}`,
                `lastTaskStatus: ${health.lastTaskStatus ?? "none"}`,
                health.codexCliError ? `codexCliError: ${health.codexCliError}` : ""
              ]
                .filter(Boolean)
                .join("\n")}
            </pre>
          ) : null}
        </div>

        <div className="deck-panel">
          <h2>Configured tests</h2>
          <p>Runs only the local testCommand from config for the selected project.</p>
          <button className="deck-primary" onClick={() => void runTests()} disabled={busy === "tests"}>
            Run tests
          </button>
          {testResult ? (
            <pre className="deck-pre">
              {[
                `ok: ${testResult.ok}`,
                `exit: ${testResult.exitCode}`,
                `duration: ${testResult.durationMs}ms`,
                testResult.stdout,
                testResult.stderr
              ].join("\n")}
            </pre>
          ) : null}
        </div>

        <div className="deck-panel deck-avatar-panel">
          <div className="deck-row">
            <h2>Avatar Preview</h2>
            <label>
              State
              <select
                value={avatarPreviewState}
                onChange={(event) => setAvatarPreviewState(event.target.value as HoloAvatarState)}
              >
                {avatarPreviewStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="deck-avatar-preview">
            <HoloAvatar
              state={avatarPreviewState}
              speaking={avatarPreviewSpeaking}
              mirrored={avatarPreviewMirrored}
              animate={avatarPreviewAnimate}
              forceBlinkNonce={avatarForceBlinkNonce}
              forceSmileNonce={avatarForceSmileNonce}
              onActiveAssetChange={setAvatarActiveAsset}
            />
          </div>
          <p className="deck-avatar-asset">Active asset: {avatarActiveAsset}</p>
          <p className="deck-avatar-asset">Backplate: code-generated HUD + waveform</p>
          <div className="deck-avatar-toggles">
            <label>
              <input
                checked={avatarPreviewSpeaking}
                onChange={(event) => setAvatarPreviewSpeaking(event.target.checked)}
                type="checkbox"
              />
              Speaking
            </label>
            <label>
              <input
                checked={avatarPreviewMirrored}
                onChange={(event) => setAvatarPreviewMirrored(event.target.checked)}
                type="checkbox"
              />
              Mirrored
            </label>
            <label>
              <input
                checked={avatarPreviewAnimate}
                onChange={(event) => setAvatarPreviewAnimate(event.target.checked)}
                type="checkbox"
              />
              Animate
            </label>
            <button type="button" onClick={() => pulseAvatarPreview("blink")}>
              Force blink
            </button>
            <button type="button" onClick={() => pulseAvatarPreview("smile")}>
              Force smile
            </button>
          </div>
        </div>

        <div className="deck-panel">
          <h2>Active task</h2>
          {activeTask ? (
            <TaskDetails
              task={activeTask}
              onFollowUp={sendFollowUp}
              onApproval={sendApproval}
              busy={busy}
            />
          ) : (
            <p>No active task.</p>
          )}
        </div>

        <div className="deck-panel">
          <h2>Task history</h2>
          <div className="deck-list">
            {tasks.map((task) => (
              <button key={task.id} onClick={() => setTasks([task, ...tasks.filter((item) => item.id !== task.id)])}>
                <strong>{task.status}</strong>
                <span>{task.prompt}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="deck-panel deck-span-2">
          <div className="deck-row">
            <h2>Runner logs</h2>
            <button onClick={() => void resetState()} disabled={busy === "reset"}>
              Reset state
            </button>
          </div>
          <pre className="deck-pre">{runnerLog.join("\n") || "Waiting for events..."}</pre>
        </div>
      </section>
    </main>
  );
}

function TaskDetails({
  task,
  onFollowUp,
  onApproval,
  busy
}: {
  task: AgentTask;
  onFollowUp: (task: AgentTask, label: string) => Promise<void>;
  onApproval: (task: AgentTask, decision: ApprovalDecision) => Promise<void>;
  busy: string | null;
}) {
  return (
    <div className="deck-task">
      <span className={`deck-status deck-status-${task.status}`}>{task.status}</span>
      <p>{task.prompt}</p>
      {task.externalSessionId ? (
        <p>
          Codex thread: <code>{task.externalSessionId}</code>
        </p>
      ) : null}
      {task.externalRunId ? (
        <p>
          Holo run: <code>{task.externalRunId}</code>
        </p>
      ) : null}
      {task.gitSafety ? (
        <p>
          Git safety: <code>{task.gitSafety}</code>
          {typeof task.workingTreeCleanBefore === "boolean"
            ? `, clean before: ${task.workingTreeCleanBefore}`
            : ""}
          {typeof task.workingTreeDirtyAfter === "boolean"
            ? `, dirty after: ${task.workingTreeDirtyAfter}`
            : ""}
        </p>
      ) : null}
      {task.summary ? <strong>{task.summary}</strong> : null}
      {task.diffSummary ? <pre className="deck-pre">{task.diffSummary}</pre> : null}
      {task.changedFiles?.length ? (
        <ul>
          {task.changedFiles.map((file) => (
            <li key={file.path}>
              {file.status} {file.path} +{file.additions ?? 0}/-{file.deletions ?? 0}
            </li>
          ))}
        </ul>
      ) : null}
      {task.tests ? <p>Tests: {task.tests.passed} passed / {task.tests.failed} failed</p> : null}
      {task.nextActions?.length ? (
        <div className="deck-actions">
          {task.nextActions.map((action) => (
            <button key={action.id} onClick={() => void onFollowUp(task, action.label)} disabled={busy === "follow-up"}>
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
      {task.approvalRequest ? (
        <div className="deck-approval">
          <span>{task.approvalRequest.riskLevel} approval</span>
          <strong>{task.approvalRequest.title}</strong>
          <p>{task.approvalRequest.description}</p>
          {task.approvalRequest.command ? <code>{task.approvalRequest.command}</code> : null}
          <div className="deck-actions">
            <button onClick={() => void onApproval(task, "approve_once")} disabled={busy === "approval"}>
              Approve once
            </button>
            <button onClick={() => void onApproval(task, "approve_session")} disabled={busy === "approval"}>
              Approve session
            </button>
            <button onClick={() => void onApproval(task, "decline")} disabled={busy === "approval"}>
              Decline
            </button>
          </div>
        </div>
      ) : null}
      {task.logs.length ? (
        <pre className="deck-pre">
          {task.logs
            .slice()
            .reverse()
            .map((log) => `${log.timestamp} ${log.level}: ${log.message}`)
            .join("\n")}
        </pre>
      ) : null}
    </div>
  );
}
