import fs from "node:fs";
import path from "node:path";
import { getProjectGitInfo } from "./localCommands";
import type { HologramConfig, ProjectConfig, PublicProject } from "./types";

const fallbackProjectPath = process.cwd();

const fallbackConfig: HologramConfig = {
  projects: [
    {
      id: "default",
      name: "Marketplace Agent",
      path: fallbackProjectPath,
      testCommand: "npm test",
      defaultBranch: "main"
    }
  ],
  server: {
    port: 8787,
    host: "0.0.0.0"
  },
  runner: {
    mode: "mock"
  },
  codexCli: {
    skipGitRepoCheck: false
  }
};

function parseConfigFile(filePath: string): HologramConfig | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as HologramConfig;
}

export function getHologramConfig(): HologramConfig {
  const localPath = path.join(process.cwd(), "config.local.json");
  const config = parseConfigFile(localPath) ?? fallbackConfig;

  return {
    ...fallbackConfig,
    ...config,
    projects: config.projects?.length ? config.projects : fallbackConfig.projects,
    server: {
      ...fallbackConfig.server,
      ...config.server
    },
    runner: {
      ...fallbackConfig.runner,
      ...config.runner
    },
    codexCli: {
      ...fallbackConfig.codexCli,
      ...config.codexCli
    }
  };
}

export function getProjectConfig(projectId: string): ProjectConfig {
  const project = getHologramConfig().projects.find((candidate) => candidate.id === projectId);

  if (!project) {
    throw new Error(`Unknown project id: ${projectId}`);
  }

  return project;
}

export function getPublicProjects(): PublicProject[] {
  return getHologramConfig().projects.map((project) => ({
    id: project.id,
    name: project.name,
    defaultBranch: project.defaultBranch,
    testCommandConfigured: Boolean(project.testCommand)
  }));
}

export async function getPublicProjectsWithGit(): Promise<PublicProject[]> {
  return Promise.all(
    getHologramConfig().projects.map(async (project) => ({
      id: project.id,
      name: project.name,
      defaultBranch: project.defaultBranch,
      testCommandConfigured: Boolean(project.testCommand),
      git: await getProjectGitInfo(project.path)
    }))
  );
}
