![HoloUI voice-first holographic cockpit running in a HoloBox](docs/assets/hero-holoui.png)

# HoloUI

**A voice-first holographic cockpit for coding agents.**

HoloUI turns your phone into a small holographic control surface for supervising local Codex-style agent workflows.

Place the phone horizontally inside a Pepper’s Ghost / HoloBox device, say a task, confirm it, and watch the agent move through project context, listening, confirmation, running, approval, and result states.

---

## What it is

HoloUI is a local-first interface for controlling and monitoring coding agents from a phone-based holographic UI.

It is not an IDE.
It is not a model.
It is not a replacement for Codex.
It is not a generic dashboard.

It is a **voice/avatar control layer** for local coding-agent work.

The current real runner is **Codex CLI**. Future adapters may include Claude Code or other local agent CLIs.

---

## Why it exists

Coding agents are powerful, but once they start working in the background, the user often loses situational awareness.

You need to know:

* which project or chat is active;
* what task is running;
* whether the agent needs approval;
* whether tests passed or failed;
* what changed;
* what to say next;
* how to continue without staying glued to the IDE.

HoloUI explores a different control surface:

> A small always-visible holographic companion for coding-agent supervision.

---

## Who it is for

HoloUI is for:

* developers using Codex CLI or local coding agents;
* AI-native builders running background agent tasks;
* makers experimenting with physical AI interfaces;
* people building multi-agent or parallel task workflows;
* developers who want a lightweight agent cockpit away from the main screen;
* teams exploring approval, review, and supervision flows for coding agents.

---

## What it does now

Current working capabilities:

* phone-oriented `/hologram` interface;
* 8-state voice/avatar HoloBox UX;
* `/hologram/debug` preview for all hologram states;
* local `/dashboard` for technical diagnostics;
* Web Speech API voice capture;
* manual text fallback;
* explicit confirmation before sending a task to the agent;
* real Codex CLI runner integration;
* streamed task logs/events;
* Git safety checks for real Codex runs;
* configured test command execution;
* optional local token for LAN testing;
* avatar/backplate/holographic visual system;
* local-first Next.js app.

---

## Core HoloBox experience

The HoloBox interface is built around 8 compact states:

1. **WakeUp / Hello UI**
   The assistant is idle and ready. The user says “wake up”.

2. **Project / Chat Picker**
   The user chooses an existing project/chat, starts a new chat, starts a new project, or continues the last context.

3. **Chat Context**
   The interface shows the selected source, project/chat context, last message, and available voice actions.

4. **Listening**
   The assistant listens for a task. The user can say “cancel” to stop without creating a task.

5. **Confirm**
   The recognized command is shown before anything is sent to Codex.

6. **Running**
   The agent is working. The interface shows compact progress and subtle background notifications.

7. **Approval**
   The agent needs confirmation for a command or action.

8. **Result**
   The task is complete. HoloUI shows changed files, test status, summary, and next actions.

---

## How it works

Typical local flow:

1. Run HoloUI on your Mac.
2. Open `/hologram` on your phone.
3. Place the phone horizontally inside a holographic / Pepper’s Ghost box.
4. Say “wake up”.
5. Choose a project or continue the last context.
6. Dictate a task.
7. Confirm before it reaches Codex.
8. Codex runs locally.
9. HoloUI shows running, approval, and result states.
10. Use the Mac dashboard for deeper review if needed.

---

## HoloBox vs Dashboard

HoloUI has two different surfaces:

| Surface           | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| `/hologram`       | Voice-first HoloBox UI for phone reflection        |
| `/hologram/debug` | Preview all hologram states during development     |
| `/dashboard`      | Technical diagnostics, logs, health, runner status |

The hologram UI is intentionally compact.

It should not become a dense desktop dashboard.
It should show only what the user needs to understand the current agent state.

---

## Features

### Hologram UX

* avatar-first interface;
* dark high-contrast HoloBox style;
* compact 8-state flow;
* landscape phone layout;
* project/chat context before voice input;
* confirmation before task submission;
* running, approval, and result states;
* compact bottom status rail;
* debug preview for all states.

### Voice flow

* Web Speech API support;
* `ru-RU` voice recognition mode;
* manual input fallback;
* explicit confirmation before `/api/tasks`;
* cancel flow during listening;
* no automatic task submission from raw transcript.

### Codex runner

* local Codex CLI runner v1;
* supports real task execution;
* streams logs/events;
* stores Codex thread/run metadata in task state;
* runs configured test command after task completion.

### Git safety

* checks whether the project is a Git repository;
* blocks real Codex runs in non-Git projects by default;
* supports development-only skip mode;
* captures working tree state before/after runs;
* summarizes changed files.

### Debug tools

* `/api/health`;
* `/hologram/debug`;
* `/dashboard`;
* runner mode visibility;
* task status visibility;
* project configuration visibility.

---

## Quickstart

### 1. Install

```bash
npm install
```

### 2. Configure

Create or update your local config file according to the project’s existing config format.

Typical local config should define:

* project name;
* project path;
* runner mode;
* Codex CLI command;
* test command;
* optional LAN token.

Local config files should not be committed.

### 3. Run locally

```bash
npm run dev
```

Default local URL depends on your config and dev server port.

Example:

```text
http://localhost:8787
```

### 4. Open the hologram UI

On the Mac:

```text
http://localhost:8787/hologram
```

On a phone in the same local network:

```text
http://<your-mac-lan-ip>:8787/hologram
```

Example:

```text
http://192.168.1.60:8787/hologram
```

### 5. Open debug mode

```text
http://localhost:8787/hologram/debug
```

Or from phone:

```text
http://<your-mac-lan-ip>:8787/hologram/debug
```

### 6. Check health

```text
http://localhost:8787/api/health
```

---

## Recommended phone setup

For the current browser-based prototype:

1. Open `/hologram` on the phone.
2. Rotate the phone to landscape.
3. Place it horizontally inside the holographic box.
4. Keep brightness high.
5. Use `/hologram/debug` to check all states.
6. Use the Mac dashboard only for deeper diagnostics.

A native iOS companion or PWA wrapper is future work.

---

## Routes

| Route             | Purpose                              |
| ----------------- | ------------------------------------ |
| `/hologram`       | Main phone/HoloBox interface         |
| `/hologram/debug` | Development preview for all 8 states |
| `/dashboard`      | Technical dashboard and diagnostics  |
| `/api/health`     | Runtime health endpoint              |
| `/api/tasks`      | Task creation / task status API      |

---

## Current runner model

HoloUI currently targets a local Codex CLI workflow.

The product does not bundle a model.
It does not replace Codex.
It acts as a control layer around local agent execution.

Current real runner:

```text
Codex CLI
```

Future adapter directions:

```text
Claude Code
Codex App Server / SDK
Other local CLI agents
```

Future adapters are not current production-ready capabilities unless explicitly implemented.

---

## What is real vs what is mock

### Real now

* local Next.js app;
* `/hologram` 8-state UI;
* `/hologram/debug`;
* `/dashboard`;
* Web Speech confirmation flow;
* manual input fallback;
* real Codex CLI runner v1;
* Git safety checks;
* configured test command execution;
* streamed task events/logs;
* local health endpoint.

### Partial / demo / development-layer

* project/chat picker still depends on configured project and demo/in-memory context;
* background notifications have model/render support but are not full production orchestration yet;
* task/session persistence is not production-ready yet;
* hardware readability still needs real HoloBox testing;
* voice command navigation is not yet a complete natural-language command system.

### Not implemented yet

* persistent task/session database;
* production auth and pairing;
* production-grade LAN security;
* real multi-agent orchestration;
* native iOS app;
* App Store distribution;
* Claude Code adapter;
* Codex App Server adapter;
* cloud deployment.

---

## Security

HoloUI is intended for local development.

Do not expose it directly to the public internet.

The app can trigger local agent actions in your project directory. Treat it as a local developer tool with access to your codebase.

Recommendations:

* use it only on trusted local networks;
* keep local tokens enabled when testing over LAN;
* do not publish the server publicly;
* do not point it at sensitive repositories without understanding the runner behavior;
* review Git changes before committing.

---

## Development checks

Run before pushing changes:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected current baseline:

```text
typecheck: pass
lint: pass
tests: pass
build: pass
```

---

## Media assets

Current product photo:

```text
docs/assets/hero-holoui.png
```

Recommended future README assets:

```text
docs/assets/holoui-demo.gif
docs/assets/holoui-8-states.png
docs/assets/holobox-setup.jpg
```

Suggested placements:

* hero screenshot near the top;
* short GIF after “How it works”;
* 8-state flow image near “Core HoloBox experience”;
* physical setup photo near “Recommended phone setup”.

Do not reference these files in README until they exist, otherwise GitHub will show broken images.

---

## Roadmap

Near-term:

* real HoloBox / iPhone visual QA;
* polish reflection readability;
* persistent task/session storage;
* real project/chat history;
* better voice command navigation;
* real background task notification routing.

Mid-term:

* production pairing/auth for phone ↔ Mac;
* PWA or iOS companion exploration;
* richer approval flow;
* better diff/result handoff;
* Codex App Server / SDK adapter exploration;
* Claude Code adapter exploration.

Longer-term:

* multi-agent supervision;
* team/project profiles;
* local-first agent cockpit;
* hardware-friendly HoloBox mode;
* demo media and public landing page.

---

## Project status

HoloUI is an experimental local-first MVP.

It is already useful as a prototype for:

* voice-first agent control;
* phone-based holographic UI;
* Codex CLI task execution;
* Git-safe local agent runs;
* HoloBox state design.

It is not yet a production-ready mobile app, hosted service, or secure team deployment.

---

## Naming

**HoloUI** — project/product name.
**HoloBox** — a small holographic / Pepper’s Ghost box for a phone.
**Hologram UI** — the phone interface reflected inside the HoloBox.
**Codex CLI** — the current real coding-agent runner.
**Dashboard** — the technical diagnostics surface, separate from the HoloBox UI.

---

## License

License TBD.
