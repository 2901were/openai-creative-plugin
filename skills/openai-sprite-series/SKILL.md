---
name: openai-sprite-series
description: This skill should be used when the user asks to "generate a sprite series", "create consistent sprite poses", "make a walk cycle", "generate an animation frame set", "create idle/walk/attack sprites", or otherwise needs to produce multiple consistent character/object sprites across poses or animation frames. Covers chain references via images[], pose progression patterns, and animation frame timing.
version: 0.4.0
---

# OpenAI Sprite Series Generator

Generate a consistent character sprite series using the validated Hybrid Workflow (sessions + image references).

## Model choice comes first

- **Isolated sprites / transparent assets** → `model: "gpt-image-1.5"` + `background: "transparent"`.
  The default model (gpt-image-2) REJECTS transparent backgrounds — switch models before generating.
- **Full scenes, references, max quality** → default `gpt-image-2`.

## Why This Workflow

The hybrid approach is the ONLY production-ready method for visual consistency across multiple poses. Text-only sessions produce inconsistent helmets, drifting colors, and proportion issues. Always pass the previous image as a reference for each new pose.

(validated on GPT Image 2026-06-05: text-only walking-knight prompt drifted from base — shield/sword appeared, proportions shifted vs A1 anchor — see [[finding-gpt-image-workflows]])

## Steps

1. **Gather requirements** — Ask the user:
   - Character description (style, colors, armor, distinctive features, pixel art vs illustrated, etc.)
   - Which poses they need (e.g. idle, walk, attack, jump, hurt, death)
   - Output directory (optional — default: `~/openai-creative-images/`)

2. **Start a session** using `start_creative_session`:
   ```
   model: "gpt-image-1.5"    // use gpt-image-1.5 if transparent background needed; otherwise gpt-image-2
   aspectRatio: "1:1"
   description: "[character name] sprites"
   outputDirectory: [user's directory if specified]
   ```

3. **Generate the base pose** (idle/standing) using `send_creative_message`:
   - Write a highly detailed prompt: pixel art style, pixel size, colors, every armor piece, background (transparent or solid)
   - Do NOT pass `images` for the first generation
   - Save the returned image path

4. **Visually verify the base** — use the Read tool to inspect the image before proceeding. Only continue if quality is acceptable.

5. **Generate each subsequent pose** using `send_creative_message`:
   - Pass the PREVIOUS image as `images: [previousImagePath]`
   - Keep prompts focused on the pose change: "Same [character], now in [pose] pose — maintain identical colors, armor design, and proportions"
   - Save each returned image path for the next iteration
   - Visually inspect each result with Read tool

6. **End the session** with `end_creative_session` and report final stats (images generated, session duration, file paths).

## Pose Order (for chaining)

Idle → Walk → Attack → Jump → Hurt → Death

Each step references the previous image to propagate visual details forward.

## Critical Rules

- NEVER skip the `images` parameter on poses 2+. Without it, consistency fails immediately.
- ALWAYS visually verify with Read tool — do not assume quality without seeing the image.
- If a pose looks wrong, use `continue_editing` to fix it before moving to the next pose.
- Use the most descriptive prompt for the first image — subsequent prompts can be shorter since the image carries the visual context.

## Sprite Prompt Structure

```
[Art style] [character type] in [pose], [facing direction],
[every visual detail: colors, armor pieces, markings, accessories],
[background: transparent or solid color],
[technical: pixel size, grid, sprite style]
```

**First image prompt must name every distinctive detail** — helmet design, color palette, emblem, proportions. Subsequent poses carry these visually via `images[]`, so only describe the pose change.

Example first prompt:
`2D pixel art knight in idle stance, front-facing, blue tabard with gold lion emblem, silver plate armor with horizontal visor slats, blue feathered plume on helmet, white background, 32x32 pixel grid, clean black outlines, limited 16-color palette`

Example subsequent prompts:
`Same knight in walking pose, same armor and colors` — visual details handled by image reference.

## Cross-Session Consistency (Returning to a Character Later)

Sessions expire after 30 minutes of inactivity. When returning to a character in a new Claude session, the MCP has no memory of previous work. Consistency must be re-established manually.

**The style anchor pattern:**

1. **Designate one image as the canonical reference** — typically the base idle pose. Note its file path somewhere (project README, CLAUDE.md, or a `assets/characters/canonical/` folder).

2. **At the start of every new session**, pass the canonical image as the first reference:
   ```
   start_creative_session({ description: "Knight sprites - session 2" })
   send_creative_message({
     prompt: "Same knight as reference, now in [new pose]",
     images: ["/path/to/canonical/knight-idle.png"]  // ← the anchor
   })
   ```

3. **Build a style bible for the character** — a short text description of every distinctive detail (written during the first session):
   ```
   Knight style bible:
   - 32x32 pixel art, PICO-8 palette
   - Blue tabard with gold lion emblem
   - Silver plate armor, horizontal visor slats
   - Blue feathered plume on helmet
   - Brown leather boots
   - White background
   ```
   Paste this bible into the prompt alongside the canonical image reference for maximum consistency.

4. **Use `outputDirectory`** pointing to a fixed project folder so all generated images stay in one place and are easy to find across sessions.

**What NOT to do:**
- Do not rely on session memory — it does not persist across restarts
- Do not use text-only prompts to "re-describe" a character — always pass the canonical image
- Do not use the last generated image as anchor if you are unsatisfied with it — always trace back to the canonical base

## Model Choice

- **`gpt-image-2`** (GPT Image 2) — default: up to 16 refs, arbitrary sizes up to 3840px (ratio ≤ 3:1), always high-fidelity. No transparent backgrounds.
- **`gpt-image-1.5`** (GPT Image 1.5) — use when transparent backgrounds are required. Preset sizes only (auto, 1024×1024, 1536×1024, 1024×1536). Supports `inputFidelity` param.
