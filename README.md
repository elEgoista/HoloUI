# HoloCodex Deck

HoloCodex Deck is a local Next.js hologram interface for monitoring and controlling a Codex-style agent workflow from a phone placed in a Pepper's Ghost box.

The MVP is voice-first: `/hologram` is a status surface, not a touchscreen dashboard. It displays what the assistant is doing, what it understood, and what the user can say next.

## Status

Implemented:

- `/hologram` fullscreen holographic assistant surface.
- `/hologram/debug` 3x2 visual state preview with dev-only controls.
- `/dashboard` technical debug dashboard.
- Server-sent events for live task updates.
- Mock runner with approval, review, follow-up, and result states.
- Codex CLI runner v1 with streamed logs, controlled CLI diagnostics, git/test summary collection, and safe config-only project execution.
- Web Speech API voice capture on `/hologram` with confirmation-before-send and manual text fallback.
- Config-driven git status and test command execution.
- Optional local token security.
- Real avatar image assets for the assistant character.
- CSS hologram environment for HUD rings, glow, particles, scan lines, waveform, and state accents.

Not implemented:

- Codex SDK / App Server execution.
- Persistent task database.
- Production authentication or pairing.
- Real hardware tuning inside a physical hologram box.

## Install

```bash
cd /Users/Hello/Desktop/codex/holocodex-deck
npm install
cp config.example.json config.local.json
```

Edit `config.local.json` before using real projects.

## Run

Local-only:

```bash
NEXT_IGNORE_INCORRECT_LOCKFILE=1 npm run dev -- --hostname 127.0.0.1 --port 8787
```

LAN testing:

```bash
HOCODEX_LOCAL_TOKEN='choose-a-local-token' \
NEXT_IGNORE_INCORRECT_LOCKFILE=1 \
ALLOW_LAN=true \
npm run dev -- --hostname 0.0.0.0 --port 8787
```

Security note: do not expose this app to the public internet. If binding to `0.0.0.0`, set `HOCODEX_LOCAL_TOKEN` or `HOLODEX_LOCAL_TOKEN`. The UI can store that token in `localStorage` from `/dashboard` or `/hologram/debug`.

## Open On Phone

1. Find the laptop IP, for example `ipconfig getifaddr en0`.
2. Open `http://LOCAL_IP:8787/hologram`.
3. If a token is configured, first open `http://LOCAL_IP:8787/hologram/debug` or `/dashboard` and save the token.
4. Put the phone horizontally in the hologram box.
5. Increase brightness, use a dark room, and disable auto-lock if Wake Lock is unavailable.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Redirects to `/hologram`. |
| `/hologram` | Voice-only fullscreen hologram state surface. |
| `/hologram/debug` | 3x2 state preview, reflection/brightness/high-contrast controls, token entry. |
| `/dashboard` | Technical debug dashboard for tasks, git, tests, logs, approvals. |
| `/api/health` | Health response with version, runner mode, project count, SSE availability. |
| `/api/config` | Public config without project paths or test commands. |
| `/api/projects` | Public project summaries. |
| `/api/projects/:id/git` | Branch, status, and diff stat. |
| `/api/projects/:id/tests` | Runs configured `testCommand`. |
| `/api/tasks` | List/create/reset in-memory tasks. |
| `/api/tasks/:id` | Read one task. |
| `/api/tasks/:id/follow-up` | Mock follow-up prompt. |
| `/api/tasks/:id/approval` | Mock approval decision. |
| `/api/events` | SSE stream. |

## Hologram UX

- `/hologram` renders one active state fullscreen.
- `/hologram/debug` renders all six MVP states: idle, listening, confirm, running, approval, result.
- Actions in `/hologram` are non-clickable voice command hints.
- Mirror/reflection classes are implemented in CSS:
  - `.reflection-mode`
  - `.brightness-boost`
  - `.high-contrast-mode`
- The assistant avatar uses real image assets for the character expression and CSS for the live hologram environment.

## Avatar Assets

Character images live in `public/avatar/`.

Expected files:

```text
public/avatar/avatar-base-neutral.jpeg
public/avatar/avatar-soft-smile.jpeg
public/avatar/avatar-eyes-closed.jpeg
public/avatar/avatar-talk-1.jpeg
public/avatar/avatar-talk-2.jpeg
public/avatar/avatar-talk-3.jpeg
public/avatar/avatar-smile-eyes-closed.jpeg
public/avatar/avatar-thinking-neutral.jpeg
```

Required:

- `avatar-base-neutral.jpeg`

Optional with fallbacks:

- `avatar-soft-smile.jpeg` falls back to neutral.
- `avatar-eyes-closed.jpeg` falls back to neutral.
- `avatar-smile-eyes-closed.jpeg` falls back to soft smile or eyes closed.
- `avatar-talk-1.jpeg`, `avatar-talk-2.jpeg`, `avatar-talk-3.jpeg` fall back to neutral plus waveform.
- `avatar-thinking-neutral.jpeg` falls back to neutral.

Expression behavior:

- Blink uses `avatar-eyes-closed.jpeg` every 3-7 seconds for roughly 120-180 ms.
- Idle soft smile uses `avatar-soft-smile.jpeg` every 20-45 seconds for roughly 1.2-2.5 seconds.
- `result-success` uses soft smile as the primary visual.
- `speaking=true` cycles `avatar-talk-1.jpeg -> avatar-talk-2.jpeg -> avatar-talk-3.jpeg -> avatar-talk-2.jpeg -> avatar-talk-1.jpeg` at about 150 ms per frame.
- CSS remains responsible for HUD rings, glow, particles, scan lines, waveform, mirror mode, and state color accents.

## Avatar Backplate

The avatar background is code-generated, not a bitmap. It lives in:

- `components/avatar/AvatarBackplate.tsx`
- `components/avatar/AvatarBackplate.module.css`
- `components/avatar/avatarBackplateData.ts`

The backplate renders:

- segmented HUD rings and arcs;
- vertical audio waveform bars behind the character;
- target markers and alignment lines;
- subtle particles;
- running-state scan sweep;
- amber, green, or red state accents for approval/results.

Waveform bars, marker positions, and particle positions are deterministic arrays in `avatarBackplateData.ts`, so the layout is stable across renders. Character expression images remain separate from the backplate.

## Config

```json
{
  "projects": [
    {
      "id": "default",
      "name": "Marketplace Agent",
      "path": "/Users/YOUR_USER/projects/marketplace-agent",
      "testCommand": "npm test",
      "defaultBranch": "main"
    }
  ],
  "server": {
    "port": 8787,
    "host": "0.0.0.0"
  },
  "runner": {
    "mode": "mock"
  },
  "codexCli": {
    "skipGitRepoCheck": false
  }
}
```

`path` and `testCommand` stay server-side. The browser receives only public project summaries.

Set `runner.mode` to `codex-cli` to use the local Codex CLI adapter. The adapter checks `codex --version` and `codex exec --help`, then runs:

```bash
codex --ask-for-approval never exec --json --cd <configured project path> --sandbox workspace-write <prompt>
```

The prompt comes from the task body, but project path and test command always come from server-side config. If the CLI is missing or does not support `exec --json`, the task fails in a controlled way and `/api/health` reports the diagnostic.

For development smoke tests outside a Git repository, set:

```json
{
  "codexCli": {
    "skipGitRepoCheck": true
  }
}
```

This makes the adapter add `--skip-git-repo-check`, marks the task with `gitSafety:
"disabled-dev-only"`, and logs a warning. Keep it visible in `/api/health`; real coding
tasks should use a Git repository with `skipGitRepoCheck: false`.

When `runner.mode` is `codex-cli` and `skipGitRepoCheck` is false, HoloCodex refuses
to start a real task for non-Git project paths:

```text
This project is not a Git repository. HoloCodex requires Git for real agent runs so changes can be reviewed and rolled back. Initialize Git or enable codexCli.skipGitRepoCheck for development-only smoke tests.
```

## Voice Confirmation Flow

`/hologram` uses browser speech recognition when available:

- language: `ru-RU`;
- first pass captures a Codex task;
- final transcript is shown in confirm state;
- task creation happens only after Confirm / “confirm” / “подтвердить”;
- Cancel clears the transcript;
- unsupported browsers show a manual text fallback.

Intermediate transcripts are never submitted automatically.

## Diagnostics

`/api/health` reports runner mode, Codex CLI availability/version/source, `skipGitRepoCheck`,
token state, project count, per-project Git repo/status metadata, Git safety warnings,
active tasks count, and last task status. `/dashboard` displays the same diagnostics plus
client-side voice support.

## What Is Mock

- Codex task execution when `runner.mode` is `mock`.
- File changes.
- Test results shown in runner output.
- Approval request content.
- Follow-up action handling.

## What Is Real

- Next.js app and routes.
- SSE event stream.
- In-memory task store.
- Config loading.
- Codex CLI detection and non-interactive `codex exec --json` execution when `runner.mode` is `codex-cli`.
- Git safety checks for real Codex CLI runs.
- Browser voice capture where Web Speech API is available.
- Git branch/status/diff stat using fixed git commands.
- Configured test command execution.
- Optional token enforcement for API requests.

## Styling Decision

The original stack mentioned Tailwind CSS. This MVP intentionally uses CSS-only styling in `styles/hologram.css` and `app/globals.css` because the hologram UI depends on custom visual effects, reflection classes, and specialized responsive behavior. Tailwind is not required for the current MVP and is not listed as a dependency.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Known Limitations

- Codex CLI adapter v1 depends on the local `codex` binary and authenticated CLI state.
- Codex SDK and App Server adapters are placeholders.
- No persistent storage.
- Token security is minimal LAN protection, not production auth.
- `testCommand` uses shell execution, but only from local config.
- Web Speech API availability varies by browser and device; iOS/Safari may require manual fallback.
- Physical Pepper's Ghost readability still needs hardware QA.
