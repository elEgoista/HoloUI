import type { RunnerEvent } from "./types";

type Listener = (event: RunnerEvent) => void;

class RunnerEventBus {
  private listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  publish(event: RunnerEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

const globalForEvents = globalThis as unknown as {
  hologramRunnerEventBus?: RunnerEventBus;
};

export const runnerEvents = globalForEvents.hologramRunnerEventBus ?? new RunnerEventBus();
globalForEvents.hologramRunnerEventBus = runnerEvents;

export function encodeSse(event: RunnerEvent) {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}
