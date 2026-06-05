---
name: openai-characters
description: This skill should be used when the user asks to "design a game character", "create character sprites", "build a character series", "design character variations", "maintain character consistency across poses", "generate a character pose chain", or otherwise needs a full character-design workflow (style bible → base pose → variations) for game development. Covers cross-session consistency, palette locking, and pose chains.
version: 0.4.0
---

# OpenAI Game Character Generator

Full workflow for creating consistent game characters across multiple poses, sessions, and quality settings. Combines sprite workflow, pixel art rules, and prompt structures.

## Model choice comes first

- **Isolated sprites / transparent assets** → `model: "gpt-image-1.5"` + `background: "transparent"`.
  The default model (gpt-image-2) REJECTS transparent backgrounds — switch models before generating.
- **Full scenes, references, max quality** → default `gpt-image-2`.

---

## Step 1: Define the Style Bible

Before generating anything, establish these rules. Paste as a prefix in every prompt for this character.

```
Resolution: [32x32 sprites, 16x16 tiles]
Palette: [PICO-8 / 16 colors]
Outlines: [1px black]
Shading: [2-tone cel, cool-shifted shadows, warm highlights]
Proportions: [2.5 heads tall]
Background: [transparent / white]
```

Name every visual detail of the character: colors, armor pieces, markings, accessories, distinctive features. If it's important, name it — the model won't invent consistent details.

---

## Step 2: Start a Session

```
start_creative_session({
  model: "gpt-image-1.5",          // use gpt-image-1.5 if transparent background needed
  aspectRatio: "1:1",
  description: "[Character name] sprites",
  outputDirectory: "/path/to/project/assets/characters/[name]"
})
```

Use a fixed `outputDirectory` inside your project — this is your style anchor folder across sessions.

---

## Step 3: Generate the Canonical Base Image

Use `send_creative_message` with a fully detailed first prompt:

```
[Style bible prefix] [character type] in idle stance, front-facing,
[every visual detail: colors, armor, markings, accessories],
[background], [technical: pixel size, palette, outline, shading, proportions]
```

Example:
`2D pixel art, 32x32 sprite, PICO-8 16-color palette, 1px black outline, 2-tone cel shading, cool-shifted shadows, transparent background — knight in idle stance, front-facing, blue tabard with gold lion emblem, silver plate armor with horizontal visor slats, blue feathered plume on helmet, brown leather boots, 2.5 heads tall`

**Do NOT pass `images` for this first generation.**

Visually verify with Read tool. This image becomes the **canonical style anchor** for the entire character.

---

## Step 4: Generate Additional Poses

For every pose after the first, pass the **previous image** as reference:

```
send_creative_message({
  prompt: "Same [character], [pose] — maintain identical colors, armor design, and proportions",
  images: ["/path/to/previous-pose.png"]
})
```

Suggested pose order for chaining (each references the previous):
`Idle → Walk → Run → Attack → Jump → Hurt → Death`

- Keep prompts short after pose 1 — visual details propagate via the image reference
- Verify each pose with Read tool before moving on
- If a pose is wrong, fix it with `continue_editing` before generating the next

(validated on GPT Image 2026-06-05: single-ref and two-ref chains produced production-level consistency on gpt-image-2 — see [[finding-gpt-image-workflows]])

---

## Cross-Session Consistency (Returning Later)

Sessions expire after 30 minutes. When resuming in a new Claude session:

1. **Pass the canonical base image** (idle pose) as `images[]` in your first call
2. **Paste the style bible** text alongside it for maximum fidelity
3. The MCP has no memory between restarts — the canonical image IS the continuity

```
send_creative_message({
  prompt: "[Style bible] Same knight as reference, now in [new pose]",
  images: ["/path/to/project/assets/characters/knight/canonical-idle.png"]
})
```

**Save the canonical image path** — write it in the project CLAUDE.md or README so it's always findable.

---

## Resolution Guide

| Size | Use Case | Detail Level |
|------|----------|-------------|
| 16×16 | Lo-fi, mobile, game jam | Silhouette only |
| **32×32** | **Sweet spot for most games** | Facial expressions, armor, weapons |
| 64×64 | Detailed indie games | Fabric folds, individual fingers |

Generate in 32×32 first. Scale to other sizes by passing the base image:
```
send_creative_message({
  prompt: "[Style bible at 16x16] Same character, same pose, scaled to 16x16 — simplify to silhouette and key colors",
  images: ["/path/to/32x32-idle.png"]
})
```

---

## Color Palette Reference

| Palette | Colors | Best For |
|---------|--------|----------|
| **PICO-8** | 16 | Retro platformers, game jams — the default |
| **Sweetie 16** | 16 | Mobile games, friendly/soft aesthetic |
| **Endesga 32** | 32 | Fantasy RPGs with varied environments |
| **Apollo** | 16 | Sci-fi shooters, cool/tech aesthetic |
| **Zughy 32** | 32 | Horror, dungeon crawlers |
| **GameBoy** | 4 | Demakes, nostalgia, maximum constraint |

**Hue shifting:** Don't darken with black — shift shadows toward blue/purple. Don't lighten with white — shift highlights toward yellow/orange.

---

## Model Choice

- **GPT Image 2** (`gpt-image-2`) — default for full scenes, references, and max quality. **Preferred for consistency-critical sprite series.** No transparent backgrounds. Arbitrary sizes up to 3840px (ratio ≤ 3:1), always high-fidelity. Up to 16 input refs.
- **GPT Image 1.5** (`gpt-image-1.5`) — use when transparent backgrounds are required (isolated sprites). Preset sizes only (auto, 1024×1024, 1536×1024, 1024×1536). Supports `inputFidelity` param. **Caution: showed proportion drift on single-ref character edit in 2026-06-05 validation (chibi shift B2 vs B1) — not recommended as the primary model for pose-consistency chains.**

(validated on GPT Image 2026-06-05: gpt-image-2 produced production-level cross-pose consistency; gpt-image-1.5 showed proportion drift on ref-edit — see [[finding-gpt-image-workflows]])

---

## Post-Processing (Industry Standard)

AI generates the base → manual refinement → final export:

1. Generate 3–5 variations of the base pose
2. Pick best silhouette/geometry
3. Open in **Aseprite** (paid) or **Piskel** (free)
4. Apply palette normalization (replace colors with locked palette)
5. Fix outlines, pixel noise
6. Export as PNG sprite sheet or individual frames
