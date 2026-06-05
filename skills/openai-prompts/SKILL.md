---
name: openai-prompts
description: This skill should be used when the user asks to "write a prompt for image generation", "design a generation prompt", "create a sprite prompt", "compose an OpenAI prompt", "structure a prompt for game art", or otherwise needs to construct prompts for the openai-creative-plugin. Covers the Identity Guide 5-line pattern, isolation suffix template for asset extraction, narrative-vs-keyword rules, and Do/Avoid prompting rules. Domain-specific prompt structures (sprites, environments, UI, icons, web) live in references/domain-structures.md.
version: 0.4.0
---

# OpenAI Prompting Guide

Write effective prompts for GPT Image generation. The core principle: **describe the scene narratively, don't just list keywords.**

## Universal Prompt Structure

```
[Subject] + [Composition] + [Action/State] + [Location/Context] + [Style] + [Technical specs]
```

**Bad:** `knight pixel art game`
**Good:** `2D pixel art knight character in idle stance, front-facing, blue tabard with gold lion emblem, silver plate armor, white background, 16x16 pixel grid, game sprite sheet style`

For per-domain prompt structures (sprites, environments, characters, UI, icons, web sections), see `references/domain-structures.md`.

---

## The Identity Guide Pattern (validated 2026-05-12)

For series work — sprite sets, evolution-chain atlases, mockup screens, item packs — pin a byte-identical identity guide block at the top of every call in the series. The variant prompt then describes only what differs.

**Five-line structure:**

```
Identity: [IP name, what the world is, who plays]
Form: [3D/2D, geometry style, surface character, proportions]
Camera: [angle, lens, key/fill lighting setup]
Palette: [Name #HEX, Name #HEX, ...]
Materials: [textures, finishes, special-state effects]
```

**Why it works:** the model treats the guide as canonical context for *what world this is in*. The variant prompt only has to answer "what specific item this time?". Cross-call consistency comes from the guide being **literally the same text** every time, not from passing image references.

**The Identity line is load-bearing.** Give it a specific fictional project name — "Hollowfest Manor," "Crystal Caverns," "Tideglass Cove," whatever yours is. Real or invented; both work. Don't settle for category descriptors ("a Halloween merge-2 game") when an IP name is available. The model's prior for fictional-IP-cohesion activates when there's a name to anchor on — empirically a stronger consistency anchor than abstract world descriptors alone. Adapted from Dori Adar's original framing of the pattern.

**When to use:**
- Multiple thematic asset variants in the same world (3D items, evolution chains, UI screens with shared brand)
- Cross-modality projects where the same IP needs to render across 3D items AND flat-vector UI

**When NOT to use:**
- Single-subject repetition across poses → use the Hybrid Workflow with image refs instead (see `openai-workflows` skill)
- Unrelated one-off images → the guide is overhead with no payoff

Validated across a 27-image A/B/C experiment + 6-deliverable production pass.

> ⚠️ Provisional: Identity Guide validation was run on gemini-creative; re-validation on GPT Image pending.

---

## Prompting Rules

**Do:**
- Use narrative descriptions ("a cozy coffee shop with warm amber lighting" not "coffee shop warm")
- Name every distinctive visual detail to preserve across iterations
- Specify style explicitly (photorealistic, watercolor, pixel art, flat vector, 3D render)
- Describe lighting and mood ("dramatic rim lighting", "soft diffused daylight")
- Use positive framing ("clean white background" not "no clutter")
- For series work: pin a byte-identical Identity Guide block at the top of every call (see above)
- For dense-label or atlas-shaped prompts: append the negative-instruction suffix verbatim — `"Do not render color swatches, hex codes, or palette legends anywhere in the image."` Validated at 5/6 (production pass) + 2/2 (#14b A/B) ≈ 88% suppression.

**Avoid:**
- Pure keyword lists ("cat space neon cyberpunk")
- Vague quality requests ("make it better", "improve the details")
- Assuming the model will maintain details that weren't described — if it's important, name it
- Re-describing the same style with different words across calls in a series — empirically causes consistency drift. Pin the guide verbatim instead.
- "For game asset extraction" / "for reference" framings inside the prompt — observed correlating with the palette-legend rendering bug; phrase in product terms instead ("for a Halloween merge-2 game", not "for asset extraction")

---

## Isolation Suffix for Asset Extraction

When generating individual items destined to be cut out and used as standalone sprites/icons, append this hard-rules block verbatim:

```
Hard rules — must be followed exactly:
- Single object centered in frame, fully visible with breathing room from edges
- Pure white #FFFFFF uniform background, no gradient or vignette
- NO cast shadow, NO drop shadow, NO ground shadow — the item floats on the flat background
- NO color swatches, NO hex codes, NO palette legends, NO color charts anywhere
- NO UI elements, NO text, NO labels, NO decorations beyond what is described
```

Production-validated across 33 generations: ~100% shadow compliance, ~95% swatch suppression. The output is directly consumable by a chroma-key extraction pipeline. For white-ish subjects (ghosts, white skulls), fall back to semantic segmentation (rembg). See the `openai-game-assets` skill § Single-Isolated-Subject Extraction Pattern.

> ⚠️ Provisional: extraction validation rates inherited from gemini-creative; re-validation on GPT Image pending.

---

## Iteration Strategy

1. **First pass:** Generate with a full detailed prompt
2. **If detail is wrong:** Use `continue_editing` with a targeted correction ("change the helmet visor to horizontal slats")
3. **If overall composition is wrong:** Start fresh with `generate_image` — editing rarely fixes fundamental composition issues
4. **If style drifted:** Pass the original image + style description, not just the correction

---

## Text in Images

GPT Image handles text in images but requires precision:
- State the exact text: `text reads "PLAY" in bold white letters`
- Specify font style and placement: `centered at bottom, sans-serif, all caps`
- Keep it short — long text strings have higher error rates
- Verify with Read tool — text errors are common (e.g., "SWIM" → "SVIM")

---

## Additional Resources

### Reference Files

- **`references/domain-structures.md`** — Per-domain prompt structures: game sprites, game environments, character concepts, UI/mobile mockups, icon sets, web sections.
