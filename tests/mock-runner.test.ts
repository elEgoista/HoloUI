import assert from "node:assert/strict";
import test from "node:test";
import { MockRunnerAdapter } from "../lib/hologram/runner/MockRunnerAdapter";

test("mock runner creates and lists a running task", async () => {
  const runner = new MockRunnerAdapter();
  await runner.reset();

  const task = await runner.startTask({
    projectId: "default",
    prompt: "Refactor parser",
    transcript: "Refactor parser"
  });

  assert.equal(task.status, "running");
  assert.equal(task.prompt, "Refactor parser");
  assert.equal(task.adapter, "mock");
  assert.equal(task.source, "mock");
  assert.equal(task.logs.length, 1);

  const tasks = await runner.listTasks("default");
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].id, task.id);

  await runner.reset();
});

test("mock runner uses needs_approval before review and decline fails", async () => {
  const runner = new MockRunnerAdapter();
  await runner.reset();

  const task = await runner.startTask({
    projectId: "default",
    prompt: "Run tests"
  });

  await new Promise((resolve) => setTimeout(resolve, 4300));
  const approvalTask = await runner.getTask(task.id);
  assert.equal(approvalTask?.status, "needs_approval");
  assert.equal(Boolean(approvalTask?.approvalRequest), true);

  const declined = await runner.approve(task.id, "mock-approval", "decline");
  assert.equal(declined.status, "failed");
  assert.equal(declined.approvalRequest, undefined);

  await runner.reset();
});
