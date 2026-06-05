---
name: openai-session
description: This skill should be used when the user asks to "start a creative session", "manage OpenAI sessions", "switch between sessions", "check session status", "end a session", or otherwise needs the session-management tools of the openai-creative-plugin (start_creative_session, send_creative_message, end_creative_session, get_session_info). Covers session lifecycle, model selection (GPT Image 2 vs 1.5), multi-session management, auto-session behavior, and concurrency caveats for parallel-subagent dispatch.
version: 0.4.0
---

# OpenAI Creative Session Manager

Set up, manage, and switch between creative sessions for organized multi-image projects.

## Session Concepts

- **Max 5 concurrent sessions** — each session tracks its own model, aspect ratio, output directory, and image history
- **Current session** — most tools operate on the "current" session automatically; use `sessionId` param to override
- **Auto-expiry** — sessions expire after 30 minutes of inactivity
- **Auto-sessions** — standalone tools (`generate_image`, `edit_image`, `continue_editing`) auto-create a temporary session if none exists

## Starting a Session

Run `start_creative_session` with these parameters:

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `model` | Which GPT Image model to use | `"gpt-image-2"` |
| `aspectRatio` | Default for all images in session | `"1:1"`, `"9:16"`, `"16:9"` |
| `quality` | Output quality | `"low"`, `"medium"`, `"high"`, `"auto"` |
| `background` | Background transparency | `"opaque"`, `"transparent"`, `"auto"` |
| `description` | Human-readable label for this session | `"Knight sprites for game"` |
| `outputDirectory` | Where to save images (absolute path) | `"/Users/dev/my-game/assets"` |

## Model Selection Guide

| Model | Name | Max Refs | Sizes | Transparent BG | inputFidelity |
|-------|------|----------|-------|----------------|---------------|
| `gpt-image-2` | GPT Image 2 ⭐ DEFAULT | 16 | Arbitrary ≤3840px (ratio ≤ 3:1) | ❌ | ❌ |
| `gpt-image-1.5` | GPT Image 1.5 | 16 | auto, 1024×1024, 1536×1024, 1024×1536 | ✅ | ✅ high/low |

**When to use each model:**

- **GPT Image 2 (default)** — use for everything requiring max quality, arbitrary aspect ratios, or scene/reference-heavy work. Always high-fidelity. No transparent backgrounds.
- **GPT Image 1.5** — use specifically when you need transparent backgrounds (isolated sprites, assets for alpha compositing). Also supports `inputFidelity` for controlling how closely edits follow the source image.

**Practical rule:** Start with GPT Image 2. Switch to GPT Image 1.5 only if you need transparency.

**Size defaults and ceiling:**
- Generation defaults to **1024×1024**; edits default to **auto** (model picks best fit for the source).
- **2560×1440 is the practical upper reliability boundary** — sizes above 2K are experimental (expect more variance), even though the API accepts up to 3840px. Stay at or below 2K for consistent output. (Source: OpenAI cookbook)

## Managing Multiple Sessions

1. Check active sessions: `get_session_info()` — current session marked with ▶
2. Switch context: use `sessionId` param in any tool call to temporarily target another session
3. End a session: `end_creative_session()` or `end_creative_session({ sessionId: "sess_xxx" })`

## Common Workflows

**Starting fresh project:**
```
start_creative_session({
  model: "gpt-image-2",
  aspectRatio: "1:1",
  quality: "medium",
  description: "My project name",
  outputDirectory: "/path/to/project/assets"
})
```

**Temporarily working on a different session:**
```
send_creative_message({
  prompt: "Fix the cat image",
  sessionId: "sess_other123"  // ← overrides current session just for this call
})
// Current session is still the original one after this
```

**Checking remaining session time:**
```
get_session_info({ sessionId: "sess_abc123" })
// Returns: expiresIn: "25 minutes"
```

## Auto-Session Behavior

Calling `generate_image`, `edit_image`, or `continue_editing` without an active session automatically creates a **temporary session** (`isTemporary: true`). Key behaviors:
- Subsequent standalone calls **reuse** the same auto-session (not create a new one)
- Manual `start_creative_session` takes over as current — auto-session remains but is no longer current
- Auto-sessions count toward the 5-session limit
- Visible in `get_session_info()` with origin noted

**Sessions are stateless** — each `send_creative_message` call is a fresh API request. Sessions track metadata and config, but the model has no memory of previous messages. Visual continuity comes entirely from passing `images[]`, not from session context.

## Concurrency Caveats (validated 2026-05-12)

The MCP's "current session" is a single shared pointer — when **parallel subagents** run against the MCP, that pointer becomes a race. Each subagent's `start_creative_session` mutates the same singleton; whichever runs its first `send_creative_message` *latest* wins the routing. Earlier subagents' calls may end up writing to a sibling's output directory.

**Observed on gemini-creative:** during a 3-way parallel-subagent dispatch (2026-05-12 Adar validation experiment), 2 of 3 subagents had their first `send_creative_message` misrouted to the third's session. Outputs landed in the wrong directory before the subagents recovered by passing explicit `sessionId` on retry.

> ⚠️ Provisional: concurrency race condition observed on gemini-creative; same MCP session-pointer architecture applies here, so the same mitigation is recommended — but re-validation on GPT Image pending.

**Always pass explicit `sessionId`** when:
- Multiple subagents are running in parallel against this MCP
- An automated batch is iterating through many calls back-to-back
- A session was just started and another might have been started in the same dispatch wave

For single-agent serial workflows, the forgiving default (omit `sessionId`, use current session) is safe — the race only fires under concurrency.

Same caveat applies to `continue_editing` and `edit_image`: under concurrent dispatch, route to a specific session explicitly.

---

## Troubleshooting

- **"Maximum sessions reached"** → Run `get_session_info()`, then `end_creative_session` on an old one
- **"No active session"** → Run `start_creative_session` first, or just call any standalone tool (auto-session will be created)
- **Session expired** → Sessions auto-clean up; just start a new one
- **Images not where expected** → Check `outputDirectory` in `get_session_info({ sessionId: "..." })`
- **Files landed in a sibling subagent's directory under parallel dispatch** → see "Concurrency Caveats" above; pass explicit `sessionId` on retry
