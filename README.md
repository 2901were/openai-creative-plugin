# OpenAI Creative Plugin

A Model Context Protocol (MCP) server for AI image generation and editing using OpenAI GPT Image models. Designed for LLM/AI agents using Claude Code.

**Version:** v0.1.0 | **Default Model:** `gpt-image-2`

---

## Features

- **Text-to-Image Generation** — Create images from detailed text prompts
- **Image Editing** — Modify existing images with text instructions and reference images
- **Iterative Refinement** — Continue editing the last image without path tracking
- **Multi-Image Composition** — Up to 16 reference images for style transfer and consistency
- **Transparent Backgrounds** — Native alpha-channel output via `gpt-image-1.5` (no post-cut needed — the key gamedev win)
- **Session Management** — Organized multi-turn workflows with defaults, file organization, and stats
- **Multi-Model Support** — Two GPT Image models with capability-based feature gating
- **Prompt Templates** — Built-in templates for sprites, UI, characters, and more
- **Claude Code Skills** — 9 slash commands encoding workflow knowledge for AI agents

---

## Models

| Model ID | Max Refs | Sizes | Transparent BG | inputFidelity |
|---|---|---|---|---|
| `gpt-image-2` ⭐ DEFAULT | 16 | presets + arbitrary WxH (÷16, ≤3:1, ≤3840px) | ❌ | ❌ always high |
| `gpt-image-1.5` | 16 | auto, 1024x1024, 1536x1024, 1024x1536 | ✅ | ✅ high/low |

**Key distinction:** `gpt-image-2` produces the highest quality but cannot output transparent PNGs. For game sprites requiring alpha channel, use `gpt-image-1.5`.

---

## Installation

### As a Claude Code plugin (recommended)

Two slash commands inside Claude Code:

```
/plugin marketplace add https://github.com/2901were/openai-creative-plugin
/plugin install openai-creative-plugin@openai-creative-marketplace
```

The first registers this repo as a Claude Code plugin marketplace (reading the `marketplace.json` at the repo root). The second installs the plugin from that marketplace — auto-registering the MCP server and the 9 auto-activating skills.

Then set your `OPENAI_API_KEY`:

```bash
export OPENAI_API_KEY="your-key-from-https://platform.openai.com/api-keys"
```

That's it.

> **Organization Verification note:** GPT Image models require Organization Verification on your OpenAI account before the API will accept image requests. Visit `platform.openai.com → Settings → Organization → Verification` if you get a 403 error.

### From source (development only)

```bash
git clone https://github.com/2901were/openai-creative-plugin
cd openai-creative-plugin
npm install
npm run build
```

The compiled output at `dist/index.js` is what the plugin uses.

---

## Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- An OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Organization Verification on your OpenAI account (required for GPT Image models)

### Configuration

Three methods, checked in priority order:

**1. Environment variable (recommended)**
```bash
export OPENAI_API_KEY="your-api-key-here"
```

**2. MCP client config**
```json
{
  "mcpServers": {
    "openai-creative": {
      "command": "node",
      "args": ["/path/to/openai-creative-plugin/dist/index.js"],
      "env": { "OPENAI_API_KEY": "your-api-key-here" }
    }
  }
}
```

**3. Runtime tool**
```
configure_openai_token({ apiKey: "your-api-key-here" })
```

### Example: Transparent sprite (the differentiator)

```typescript
// Start a session configured for transparent sprite output
start_creative_session({
  model: "gpt-image-1.5",
  background: "transparent",
  aspectRatio: "1:1",
  description: "Knight sprites for platformer game"
})

// Generate base sprite — returned PNG has alpha channel, no post-cut needed
send_creative_message({
  prompt: "2D pixel art knight character, idle pose, blue tabard with gold lion crest, 1px black outline, PICO-8 palette, isolated subject"
})

// Generate walking pose maintaining visual consistency
send_creative_message({
  prompt: "Same knight in walking pose",
  images: ["/path/to/idle.png"]   // routes to /images/edits for visual grounding
})
```

---

## Tools (11 total)

### Basic Tools

#### `get_configuration_status`
Check if the API is configured and ready. No parameters.

#### `configure_openai_token`
Set your OpenAI API key at runtime. Saves to `.openai-creative-config.json`.
- `apiKey` (required): Your key from `platform.openai.com/api-keys`

#### `generate_image`
Generate a new image from a text description.
- `prompt` (required): Detailed text description
- `aspectRatio` (optional): `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` — Default: `1:1`
- `model` (optional): `gpt-image-2` (default) or `gpt-image-1.5`
- `quality` (optional): `low`, `medium`, `high`, `auto` — Default: `auto`
- `background` (optional): `transparent`, `opaque`, `auto` — `transparent` requires `gpt-image-1.5`
- `size` (optional): Explicit size (e.g., `1920x1080` on gpt-image-2, or preset on gpt-image-1.5)
- `outputDirectory` (optional): Absolute path to save this image

#### `edit_image`
Modify an existing image by file path. Up to 16 total input images (main + references).
- `imagePath` (required): Full path to image (`.jpg`, `.jpeg`, `.png`, `.webp`)
- `prompt` (required): Modification instructions
- `referenceImages` (optional): Array of additional image paths for style transfer
- `aspectRatio`, `model`, `quality`, `background`, `size`, `outputDirectory` — same as above
- `inputFidelity` (optional): `high` or `low` — gpt-image-1.5 only

#### `continue_editing`
Edit the most recently generated/edited image without specifying a path.
- `prompt` (required): Modification instructions
- `referenceImages` (optional): Additional reference images
- `outputDirectory` (optional): Override save location

#### `get_last_image_info`
Get file path, size, and timestamp of the last generated image. No parameters.

### Session Tools

#### `start_creative_session`
Initialize a session with shared defaults for multi-image workflows.
- `model`, `aspectRatio`, `quality`, `background`, `size` (optional): Session-wide defaults
- `description` (optional): Human-readable label (e.g., `"Knight sprites for game"`)
- `outputDirectory` (optional): Absolute path to save all session images

#### `send_creative_message`
Generate an image within the active session using its defaults.
- `prompt` (required): Text description
- `images` (optional): Array of image paths — routes to `/images/edits` when provided; **required for visual consistency across poses**
- `sessionId` (optional): Target a specific session (defaults to current)

#### `end_creative_session`
Terminate a session and return stats. Images remain on disk.
- `sessionId` (optional): Specific session to end (defaults to current)

#### `get_session_info`
List all active sessions or get details for a specific one.
- `sessionId` (optional): Omit to list all; provide to get detailed info + expiration countdown

#### `get_prompt_template`
Get a structured prompt template for a specific use case.
- `templateType` (required): `sprite_character`, `game_environment`, `game_asset`, `character_concept`, `character_variations`, `character_portrait`, `mobile_mockup`, `icon_set`, `ui_component`, `web_section`

---

## Session Behavior

- **Max 5 concurrent sessions** — end old ones to free slots
- **Auto-expires after 30 min** of inactivity
- **Auto-session creation** — standalone tools (`generate_image`, `edit_image`, `continue_editing`) auto-create a temporary session if none is active
- **Stateless by design** — each call issues a fresh API request; visual continuity requires passing `images[]`
- **Custom output directories** — images saved directly to your project folder

---

## Claude Code Skills

9 auto-activating skills in `skills/` for AI agents using this MCP (installed automatically via the plugin):

| Skill | Purpose |
|---|---|
| `openai-quick` | Single image, fast |
| `openai-sprite-series` | Consistent character sprite set (hybrid workflow) |
| `openai-ui-mockups` | Multi-screen UI with style selection |
| `openai-session` | Session setup, model selection, troubleshooting |
| `openai-workflows` | Workflow decision tree and comparison |
| `openai-prompts` | Domain-specific prompt structures |
| `openai-game-assets` | Pixel art guide: sizes, palettes, transparent sprites |
| `openai-characters` | Full game character workflow |
| `openai-configure` | API key setup and Organization Verification troubleshooting |

---

## Best Practices

### For transparent sprites (the GPT Image differentiator)
Use `gpt-image-1.5` + `background:"transparent"`. The returned PNG carries an alpha channel — no background-removal post-processing needed.

### For visual consistency across multiple images
Pass the previous image via the `images[]` parameter in `send_creative_message`. Without it, the model reconstructs from text alone — causing proportion drift, color changes, and detail inconsistencies.

### Prompt structure
```
[Style] [Subject] in [pose/state], [composition], [distinctive details], [background], [technical specs]
```

### Pixel art style prefix
```
2D pixel art, 32x32 sprite, PICO-8 16-color palette, 1px black outline, 2-tone cel shading, transparent background —
```

---

## Development

```bash
npm run dev        # Auto-reload with tsx watch
npm run build      # Compile TypeScript to dist/
npm run type-check # Type check without emitting
npm run clean      # Remove dist/
```

## Testing

```bash
npm run test:unit         # Unit tests, no API key needed
npm run test:integration  # Full API pipeline tests (requires OPENAI_API_KEY + org verification)
npm run test:coverage     # Unit tests with coverage report
npm run pre-deploy        # Full pre-deployment gate: type-check → unit → build → integration
```

Unit tests cover: `image-utils`, `session-manager`, `config-manager`, `types`, `prompt-templates`.

Integration tests require `OPENAI_API_KEY` and Organization Verification. They are automatically skipped if the key is not set.

A Claude Code PostToolUse hook runs `npm run test:unit` automatically after every source edit.

---

## Project Structure

```
openai-creative-plugin-dev/   (private dev repo)
├── src/                      # TypeScript source
├── dist/                     # Compiled JavaScript
├── skills/                   # 9 Claude Code skills
├── docs/
│   ├── API_REFERENCE.md
│   └── CLAUDE_MD_GUIDELINES.md
├── scripts/
│   ├── pre-deploy.sh
│   └── release-to-public.sh  # Ships dist/ + skills/ to 2901were/openai-creative-plugin
├── plugin.json
└── README.md
```

Public installable repo: `https://github.com/2901were/openai-creative-plugin`

---

## Troubleshooting

**"OpenAI API key rejected (401)"** → Run `get_configuration_status()`, then set `OPENAI_API_KEY` env variable and restart.

**"Organization Verification required (403)"** → Visit `platform.openai.com → Settings → Organization → Verification` and complete verification before GPT Image API calls will succeed.

**"No previous image found"** → `continue_editing` requires at least one image generated in the current server session.

**"Maximum sessions (5) reached"** → Run `get_session_info()` and end an old session.

**"This model rejected the background parameter"** → You passed `background:"transparent"` to `gpt-image-2`. Switch to `gpt-image-1.5`.

**Images generating inconsistently** → Pass `images: [previousImagePath]` in `send_creative_message` for every image after the first.

---

## Links

- [OpenAI Images API Documentation](https://platform.openai.com/docs/api-reference/images)
- [GPT Image Models](https://platform.openai.com/docs/models)
- [Get API Key](https://platform.openai.com/api-keys)
- [MCP Documentation](https://modelcontextprotocol.io/)
