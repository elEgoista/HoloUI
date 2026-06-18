import { getProjectGitInfo } from "../localCommands";
import type { GitSafety, ProjectConfig, ProjectGitInfo } from "../types";

export const nonGitSafetyError =
  "This project is not a Git repository. HoloCodex requires Git for real agent runs so changes can be reviewed and rolled back. Initialize Git or enable codexCli.skipGitRepoCheck for development-only smoke tests.";

export type CodexCliGitSafetyResult = {
  allowed: boolean;
  git: ProjectGitInfo;
  gitSafety: GitSafety;
  warning?: string;
  error?: string;
};

export async function getCodexCliGitSafety(
  project: ProjectConfig,
  skipGitRepoCheck = false
): Promise<CodexCliGitSafetyResult> {
  const git = await getProjectGitInfo(project.path);

  if (git.isGitRepo && git.gitStatusAvailable) {
    return {
      allowed: true,
      git,
      gitSafety: "enabled"
    };
  }

  if (skipGitRepoCheck) {
    return {
      allowed: true,
      git,
      gitSafety: "disabled-dev-only",
      warning:
        "Git safety is disabled for this development-only run because codexCli.skipGitRepoCheck is true."
    };
  }

  return {
    allowed: false,
    git,
    gitSafety: "enabled",
    error: nonGitSafetyError
  };
}
