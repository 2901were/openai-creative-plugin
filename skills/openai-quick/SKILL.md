---
name: openai-quick
description: This skill should be used when the user asks to "generate one image", "make a single image", "create a quick image", "generate an image quickly", "just need one image", or otherwise needs a single-shot image generation without session setup. Covers the minimal generate_image flow and when to skip the session machinery.
version: 0.4.0
---

# OpenAI Quick Image Generator

Generate a single image fast, without session overhead. Best for one-off images, prototypes, or exploration.

## When to Use This

- Creating a single image with no plans to iterate
- Generating a single new image anchored to an existing reference (without starting a session)
- Exploring different concepts (generate several variations)
- When you don't need organized file management
- Quick reference images or placeholders

## When NOT to Use This

- If you'll want a **series** of consistent variations → use the `openai-sprite-series` skill instead (sessions + `images` param)
- If you're building a multi-screen project → use the `openai-ui-mockups` skill instead
- If you want to iterate and refine → use `continue_editing` after the first generation

## Steps

1. **Ask the user** what they want to generate (if not already described).

2. **Check API status** with `get_configuration_status`. If not configured, guide through setup:
   - Set `OPENAI_API_KEY` env variable (recommended), or
   - Run `configure_openai_token` with their key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

3. **Choose parameters** based on the request:
   - `aspectRatio`: 1:1 (square/social), 16:9 (wide/presentation), 9:16 (mobile/story), 3:2 (photo), 21:9 (cinematic)
   - `model`: `gpt-image-2` (default, best quality) — switch to `gpt-image-1.5` only if transparent background or `inputFidelity` control is needed
   - `quality`: `low` for quick exploration, `medium` for normal work, `high` for production output

4. **Generate** with `generate_image`. Write a descriptive prompt:
   - Include: subject, style, lighting, mood, composition, color palette
   - Avoid vague keywords — "a cozy coffee shop with warm amber lighting, steam rising from cups, watercolor style" not "coffee shop"

5. **If anchoring to an existing reference** — add `referenceImages: ["/absolute/path/to/ref.png"]` (up to 16 refs, all paths must be valid — any invalid path is rejected before the request is sent):
   - `gpt-image-2` (default): always high-fidelity, suitable for style anchoring; does NOT support `inputFidelity` param — omit it
   - `gpt-image-1.5`: add `inputFidelity: "high"` when identity preservation matters (exact subject likeness); supports `background: "transparent"` if needed
   - **SERIES with refs** → skip this pattern and use sessions + `send_creative_message` instead (see `openai-sprite-series` or `openai-workflows`)

6. **Visually verify** with Read tool. If the result needs tweaking, use `continue_editing` with a correction prompt.

7. **Report back** with the image path and any notable details about what was generated.

## Prompt Quality Guide

| Vague ❌ | Descriptive ✅ |
|----------|--------------|
| "a cat" | "A ginger tabby cat sitting in a sunlit window, watercolor illustration, warm tones" |
| "a logo" | "Minimalist tech startup logo, letter 'G', geometric, dark blue on white, vector style" |
| "space scene" | "Deep space nebula, purple and gold clouds, distant stars, photorealistic, cinematic lighting" |

## Universal Prompt Formula

```
[Subject] + [Composition] + [Action/State] + [Location] + [Style] + [Technical specs]
```

Example: `2D pixel art wizard character [subject], centered, front-facing [composition], casting a fireball [action], plain white background [location], clean outlines, limited 16-color palette [style], 32x32 pixel grid [technical]`

## Iteration Strategy

- **Wrong detail** → `continue_editing("change X to Y")` — targeted correction
- **Wrong composition** → start fresh with `generate_image` — editing rarely fixes fundamental layout
- **Style drifted** → pass the original image as a reference in `continue_editing`
- **Text errors** (e.g. "SWIM" → "SVIM") → always verify text with Read tool, then correct with `continue_editing`

## Speed Levers

When turnaround time matters more than final polish:

- Use `quality: "low"` first for draft exploration — escalate to `"medium"` or `"high"` only for finals
- `jpeg` renders faster than `png` when you don't need transparency — use `png` only when an alpha channel is required
- Square (1024×1024, the default) is the fastest shape — non-square sizes add a small latency overhead

(Source: OpenAI cookbook)

See the `openai-prompts` skill for domain-specific prompt structures (sprites, UI, icons, characters).
