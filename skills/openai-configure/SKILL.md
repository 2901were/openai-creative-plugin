---
name: openai-configure
description: This skill should be used when the user asks to "configure the OpenAI API key", "set up OPENAI_API_KEY", "troubleshoot OpenAI authentication", "fix MCP not configured errors", "check OpenAI API key status", "the API key isn't working", or otherwise needs API-key setup or auth troubleshooting specifically for the openai-creative-plugin. Covers the three configuration methods (env var, config file, configure_openai_token tool), priority order, and diagnostic checks via get_configuration_status.
version: 0.4.0
---

# OpenAI MCP Configuration Guide

Set up the OpenAI Creative Plugin from scratch or troubleshoot configuration issues.

## Step 1: Check Current Status

Always start here:
```
get_configuration_status()
```

Returns one of:
- `✅ Configured via environment variable` — best option, nothing to do
- `✅ Configured via config file` — working, but less secure
- `❌ Not configured` — follow setup below

---

## Configuration Methods (Priority Order)

The server checks these in order — highest priority wins:

### 1. Environment Variable (Recommended)

Most secure. Set once, works across all projects.

```bash
# Add to ~/.zshrc or ~/.bashrc
export OPENAI_API_KEY="your-key-here"

# Reload shell
source ~/.zshrc
```

Then restart Claude Code / the MCP server.

### 2. Config File (Persistent, less secure)

Saved to `.openai-creative-config.json` in the MCP directory. Good for project-specific keys.

```
configure_openai_token({ apiKey: "your-key-here" })
```

Note: This file should be in `.gitignore` — never commit API keys.

### 3. Manual (Session only)

Use the same `configure_openai_token` tool. Configuration is lost when the MCP server restarts. Only use for temporary testing.

---

## Getting an API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign in with your OpenAI account
3. Click **Create new secret key**
4. Copy the key — store it securely (it will not be shown again)

**Pricing:** Check [current pricing](https://platform.openai.com/docs/pricing) — GPT Image models are billed per image.

---

## Troubleshooting

**"API key not configured"**
→ Run `get_configuration_status()` to confirm the issue, then use one of the 3 methods above.

**"No previous image found"**
→ `continue_editing` and `get_last_image_info` require at least one image generated in the current server session. Generate one first with `generate_image`.

**Images not appearing / generation failing**
→ Check that `OPENAI_API_KEY` is set in the environment Claude Code was launched from (not just your terminal). Restart Claude Code after setting the env var.

**403 error mentioning "Organization Verification"**
→ GPT Image models (gpt-image-2, gpt-image-1.5) require your OpenAI organization to be verified. Go to [platform.openai.com](https://platform.openai.com) → Settings → Organization → complete the verification process. This is a one-time requirement per organization.

**"Maximum sessions (5) reached"**
→ Run `get_session_info()` to list active sessions, then `end_creative_session({ sessionId: "sess_xxx" })` to free slots.

**Wrong output directory**
→ Images default to `~/openai-creative-images/` (macOS/Linux) or `~/Documents/openai-creative-images/` (Windows). Use `outputDirectory` in `start_creative_session` to redirect to a project folder.

**Session expired mid-project**
→ Sessions auto-expire after 30 minutes of inactivity. Start a new session and resume — previous images are still on disk.

---

## Auto-Session Behavior

Calling `generate_image`, `edit_image`, or `continue_editing` without an active session automatically creates a temporary session (`isTemporary: true`). This session:
- Is reused by subsequent standalone tool calls
- Is replaced if you manually start a session with `start_creative_session`
- Counts toward the 5-session limit
- Shows in `get_session_info()` with its origin noted
