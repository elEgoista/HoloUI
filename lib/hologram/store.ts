import type { AgentTask } from "./types";

class TaskStore {
  private tasks = new Map<string, AgentTask>();

  upsert(task: AgentTask) {
    this.tasks.set(task.id, task);
    return task;
  }

  get(taskId: string) {
    return this.tasks.get(taskId) ?? null;
  }

  list(projectId?: string) {
    const tasks = Array.from(this.tasks.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );

    return projectId ? tasks.filter((task) => task.projectId === projectId) : tasks;
  }

  reset() {
    this.tasks.clear();
  }
}

const globalForStore = globalThis as unknown as {
  hologramTaskStore?: TaskStore;
};

// Cockpit state is intentionally in-memory for the MVP. TODO: persist this to a
// local database without treating it as the source of truth for Codex history.
export const taskStore = globalForStore.hologramTaskStore ?? new TaskStore();
globalForStore.hologramTaskStore = taskStore;
