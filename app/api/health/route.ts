import { requireLocalAuth } from "@/lib/hologram/auth";
import { getHologramConfig, getPublicProjectsWithGit } from "@/lib/hologram/config";
import { getRunner } from "@/lib/hologram/runner";
import { getCodexCliDiagnostics } from "@/lib/hologram/runner/codexCliDiagnostics";
import packageJson from "@/package.json";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = requireLocalAuth(request);
  if (authError) return authError;

  const config = getHologramConfig();
  const codexCli = await getCodexCliDiagnostics();
  const projects = await getPublicProjectsWithGit();
  const gitSafetyWarnings = projects
    .filter((project) => !project.git?.isGitRepo || !project.git.gitStatusAvailable)
    .map((project) =>
      `Project ${project.id} is not Git-safe: ${
        project.git?.gitError ?? "Git status is unavailable."
      }`
    );

  if (codexCli.skipGitRepoCheck) {
    gitSafetyWarnings.unshift("codexCli.skipGitRepoCheck is enabled; real agent runs bypass Git safety.");
  }
  const tasks = await getRunner().listTasks();
  const lastTask = tasks[0];

  return NextResponse.json({
    ok: true,
    version: packageJson.version,
    runnerMode: config.runner.mode,
    projectsCount: config.projects.length,
    projects,
    gitSafetyWarnings,
    sse: "available",
    codexCliAvailable: codexCli.available,
    codexCliVersion: codexCli.version ?? null,
    codexCliCommand: codexCli.command,
    codexCliSource: codexCli.source,
    codexCliExecJsonSupported: codexCli.execJsonSupported ?? false,
    codexCliSkipGitRepoCheck: codexCli.skipGitRepoCheck,
    codexCliError: codexCli.error ?? null,
    currentProject: config.projects[0]?.name ?? null,
    localTokenEnabled: Boolean(
      process.env.HOCODEX_LOCAL_TOKEN ||
        process.env.HOLODEX_LOCAL_TOKEN ||
        process.env.HOLOCODEX_LOCAL_TOKEN
    ),
    activeTasksCount: tasks.filter((task) =>
      ["running", "needs_approval", "review"].includes(task.status)
    ).length,
    lastTaskStatus: lastTask?.status ?? null
  });
}
