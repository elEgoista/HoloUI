import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { getPublicProjectsWithGit } from "../lib/hologram/config";
import { getGitDiffStat, getProjectGitInfo } from "../lib/hologram/localCommands";
import {
  getCodexCliGitSafety,
  nonGitSafetyError
} from "../lib/hologram/runner/codexCliGitSafety";
import type { ProjectConfig } from "../lib/hologram/types";

function makeTempDir(name: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `holocodex-${name}-`));
}

function cleanup(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function projectFor(dir: string): ProjectConfig {
  return {
    id: "temp",
    name: "Temp Project",
    path: dir,
    testCommand: "npm test",
    defaultBranch: "main"
  };
}

test("git detection reports non-git projects with controlled metadata", async () => {
  const dir = makeTempDir("non-git");

  try {
    const info = await getProjectGitInfo(dir);
    assert.equal(info.isGitRepo, false);
    assert.equal(info.gitStatusAvailable, false);
    assert.equal(typeof info.gitError, "string");
  } finally {
    cleanup(dir);
  }
});

test("git detection reports initialized git repositories", async () => {
  const dir = makeTempDir("git");

  try {
    execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });

    const info = await getProjectGitInfo(dir);
    assert.equal(info.isGitRepo, true);
    assert.equal(info.gitStatusAvailable, true);
    assert.equal(info.gitRoot, fs.realpathSync(dir));
  } finally {
    cleanup(dir);
  }
});

test("git diff stat includes untracked files", async () => {
  const dir = makeTempDir("git-untracked");

  try {
    execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
    fs.writeFileSync(path.join(dir, "new-file.md"), "# New file\n");

    const diffStat = await getGitDiffStat(dir);
    assert.match(diffStat, /new-file\.md \| untracked/);
  } finally {
    cleanup(dir);
  }
});

test("codex-cli git safety blocks non-git projects by default", async () => {
  const dir = makeTempDir("blocked");

  try {
    const safety = await getCodexCliGitSafety(projectFor(dir), false);
    assert.equal(safety.allowed, false);
    assert.equal(safety.gitSafety, "enabled");
    assert.equal(safety.error, nonGitSafetyError);
  } finally {
    cleanup(dir);
  }
});

test("codex-cli git safety allows development skip with warning metadata", async () => {
  const dir = makeTempDir("skip");

  try {
    const safety = await getCodexCliGitSafety(projectFor(dir), true);
    assert.equal(safety.allowed, true);
    assert.equal(safety.gitSafety, "disabled-dev-only");
    assert.match(safety.warning ?? "", /development-only/);
  } finally {
    cleanup(dir);
  }
});

test("public project config includes git repo status for health and projects APIs", async () => {
  const previousCwd = process.cwd();
  const dir = makeTempDir("public-project");

  try {
    execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
    fs.writeFileSync(
      path.join(dir, "config.local.json"),
      JSON.stringify({
        projects: [projectFor(dir)],
        server: { port: 8788, host: "0.0.0.0" },
        runner: { mode: "codex-cli" },
        codexCli: { skipGitRepoCheck: false }
      })
    );

    process.chdir(dir);
    const projects = await getPublicProjectsWithGit();
    assert.equal(projects.length, 1);
    assert.equal(projects[0].git?.isGitRepo, true);
    assert.equal(projects[0].git?.gitStatusAvailable, true);
    assert.equal(projects[0].git?.gitRoot, fs.realpathSync(dir));
  } finally {
    process.chdir(previousCwd);
    cleanup(dir);
  }
});
