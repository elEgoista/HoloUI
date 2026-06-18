# AGENTS.md

Instructions for Codex agents working in `/Users/Hello/Desktop/codex/holocodex-deck`.

## Project Scope

This directory is the standalone HoloCodex Deck project. It is separate from the workspace root CapCut Metadata Cleaner and from sibling projects such as `hh/`, `video-analyzer/`, `youtube-bulk-downloader/`, and `уникализатор/`.

Do not edit sibling projects for HoloCodex work unless the user explicitly asks for a cross-project change.

## App Summary

HoloCodex Deck is a local Next.js App Router UI for controlling a future Codex workflow from a phone in a hologram box.

Current state:

- Real UI and API shell exist.
- Mock runner simulates agent progress.
- Real Codex CLI execution is wired through `CodexCliRunnerAdapter` when `runner.mode` is `codex-cli`.
- Task state is in memory and resets with the dev server.

## Main Files

- `app/hologram/page.tsx` - phone-first hologram UI.
- `app/dashboard/page.tsx` - local debug dashboard.
- `app/api/**` - config, task, event, git, and test endpoints.
- `lib/hologram/types.ts` - shared data model.
- `lib/hologram/config.ts` - config loading from `config.local.json`.
- `lib/hologram/events.ts` - server-sent event bus.
- `lib/hologram/store.ts` - in-memory task store.
- `lib/hologram/localCommands.ts` - fixed local git and test helpers.
- `lib/hologram/runner/**` - mock and future Codex runner adapters.
- `config.example.json` - example project config.

## Commands

```bash
cd /Users/Hello/Desktop/codex/holocodex-deck
npm install
npm run typecheck
NEXT_IGNORE_INCORRECT_LOCKFILE=1 ALLOW_LAN=true npm run dev -- --hostname 0.0.0.0 --port 8787
```

Avoid running `next build` while a dev server is active.

## Configuration

Use `config.local.json` for machine-local project paths and commands. Do not commit secrets, tokens, private paths, or credentials.

Runner modes currently listed in types:

- `mock` - implemented.
- `codex-cli` - implemented for non-interactive `codex exec --json`.
- `codex-sdk` - placeholder.
- `codex-app-server` - placeholder.

## Safety Boundaries

- Treat this as a trusted-local-network tool only.
- Do not add arbitrary shell execution from the client.
- Keep project operations server-side and config-driven.
- Real `codex-cli` project runs should be Git-backed. Non-Git runs are blocked unless
  local config explicitly sets `codexCli.skipGitRepoCheck: true` for development smoke tests.
- If adding commands, prefer fixed argument arrays with `execFile` over shell strings.
- The current `testCommand` path uses shell execution because it is explicitly configured locally; keep this visible in docs and UI.
- Do not add public internet exposure, auth bypasses, or credential storage without explicit design work.

## UI Guidance

- `/hologram` is optimized for a landscape phone in a Pepper's Ghost box.
- Keep the hologram view dark, high contrast, and readable under reflection.
- Keep text short and large enough for phone viewing.
- Preserve mirror mode, fullscreen, wake lock, voice fallback, and typed fallback behavior.
- `/dashboard` can be denser and more technical.

## When Extending Real Codex Integration

Use the adapter boundary in `lib/hologram/runner/RunnerAdapter.ts`.

Map any real integration into the shared `AgentTask` and `RunnerEvent` model before changing the UI. The UI should not know whether events come from mock mode, CLI, SDK, or an app server.
