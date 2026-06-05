---
name: openai-game-assets
description: This skill should be used when the user asks to "generate game assets", "create pixel art", "make a sprite", "design a tileset", "generate a tier evolution atlas", "create a merge-game asset pack", "design game items", or otherwise needs to produce pixel art / game art via the openai-creative-plugin. Covers the Identity Guide pattern (with pixel-art-specific alternative), tier-atlas generation, isolated-subject extraction patterns, and guide overreach workarounds. Palette/resolution tables and sprite/tileset workflows live in references/.
version: 0.4.0
---

# OpenAI Game Asset Generator

Generate consistent pixel art game assets — sprites, tilesets, environments, and UI. Works best with a defined style anchor before generating anything.

## Model choice comes first

- **Isolated sprites / transparent assets** → `model: "gpt-image-1.5"` + `background: "transparent"`.
  The default model (gpt-image-2) REJECTS transparent backgrounds — switch models before generating.
- **Full scenes, references, max quality** → default `gpt-image-2`.

## Step 0: Define your style anchor first (choose one format)

Before generating a single image, establish a style anchor — a block of text you'll pin **byte-identical** at the top of every prompt in the series. Two validated formats; pick the one that fits your project.

### Format A: Identity Guide (5-line, validated 2026-05-12)

```
Identity: [IP name, what the world is, who plays]
Form: [3D/2D, geometry style, surface character, proportions]
Camera: [angle, lens, key/fill lighting setup]
Palette: [Name #HEX, Name #HEX, ...]
Materials: [textures, finishes, special-state effects]
```

**The Identity line is the load-bearing anchor.** Give it a specific fictional project name ("Hollowfest Manor," "Crystal Caverns," whatever yours is) — the IP name activates the model's prior for fictional-world cohesion. Empirically faster convergence than abstract category descriptors ("a Halloween merge-2 game") alone. See `openai-prompts` skill § "The Identity Guide Pattern" for the full rationale.

Use this for projects that mix asset types (3D items + UI screens), or when one guide needs to anchor cross-modality output. Validated across a 27-image A/B/C experiment + 6-deliverable production pass.

### Format B: Traditional Pixel-Art Style Bible (6-rule)

```
Resolution: [32x32 characters, 16x16 tiles]
Palette: [PICO-8 / 16 colors]
Outlines: [1px black / colored / none]
Shading: [flat / 2-tone cel / gradient + dithering]
Animation: [80ms base, walk 6f, jump 4f, attack 5f]
Proportions: [2.5 heads tall, hero 3x tile height]
```

Use this when the project is pure pixel-art / sprite-based and animation timing / outline rules matter at the prompt level — the per-pixel constraints don't fit cleanly into the 5-line Identity Guide. This pixel-art bible is the standalone style prefix for sprites that aren't part of an evolution chain or unified-IP series.

**Rule for either format:** every asset must look like it was made by the same person on the same day. The guide enforces this without visual references — **but only if the guide text is byte-identical across calls**. Re-describing in different words causes drift (validated by Mode-B paraphrase control: "Lighthouse" came out as a tavern).

> ⚠️ Provisional: paraphrase-drift validation was run on gemini-creative; re-validation on GPT Image pending.

For resolution tables, named palettes, and quick-start style prefixes, see `references/palette-and-resolution.md`; for character, tileset, and UI step-by-step workflows, see `references/sprite-workflows.md`.

---

## Tier Evolution Chain Atlases (merge-game pattern, validated 2026-05-12)

For merge-2 / progression games, generate a multi-tier evolution chain as a **single horizontal atlas** in one call instead of N separate generations:

```
[GUIDE BLOCK — pasted verbatim]

Compose a horizontal evolution-chain atlas: [N] [item] merge-tier items
arranged left-to-right in a single row on a neutral cream-white background
with subtle vertical divider lines between each tier. Same camera angle,
same lighting, same proportions on every tier — the items must read as the
same item family at progressing power levels.

Tier 1 — [Name]: [short description]
Tier 2 — [Name]: [short description]
Tier 3 — [Name]: [short description]
... (etc)

Do not render color swatches, hex codes, or palette legends anywhere in the image.
```

**Critical:** atlas-shaped variants (dense labels + multi-tier composition) historically trigger a **palette-legend rendering bug** where the model renders the guide's Palette line as visible swatches inside the image. The negative-instruction suffix above is the validated mitigation — 5/6 (production pass) + 2/2 (#14b A/B) ≈ 88% suppression on gemini-creative. Append it verbatim.

> ⚠️ Provisional: palette-legend suppression rate inherited from gemini-creative validation; re-validation on GPT Image pending.

**Aspect ratio matters.** Pick one that natively fits a 1×N row:
- N ≈ 5–6: **16:9** (wide landscape)
- N ≈ 7–8: **21:9** (ultrawide)
- Extreme ratios beyond 3:1 (e.g. 8:1) are not supported by GPT Image — use 21:9 as the widest option.

Portrait aspects (9:16, 4:5) will silently reshape into a 2-row grid.

**Known failure mode (low-prevalence):** the model occasionally renders TWO rows of N tiles instead of the requested single row, with mildly garbled labels (observed in #14b treatment trial). Re-roll if this happens — no prompt-level fix has been validated.

---

## Single-Isolated-Subject Extraction Pattern (validated 2026-05-12)

For generating individual sprites destined for chroma-key extraction → transparent PNG pipeline:

```
[GUIDE BLOCK — pasted verbatim]

[Variant description — one focused subject only, no atlas/multi-element framing]

Hard rules — must be followed exactly:
- Single object centered in frame, fully visible with breathing room from edges
- Pure white #FFFFFF uniform background, no gradient or vignette
- NO cast shadow, NO drop shadow, NO ground shadow — the item floats on the flat background
- NO color swatches, NO hex codes, NO palette legends, NO color charts anywhere
- NO UI elements, NO text, NO labels, NO decorations beyond what is described
```

Production-validated across 33 generations in a single asset pack: ~100% shadow compliance, ~95% swatch suppression. The output is directly consumable by a chroma-key-on-white extraction pipeline for most subjects. For **white-ish or pale subjects** (ghosts, white skulls, cobweb) chroma-key won't work — fall back to semantic segmentation (rembg) per asset. Default chroma-key, opt-in rembg per-asset.

> ⚠️ Provisional: extraction-pipeline validation rates inherited from gemini-creative; re-validation on GPT Image pending.

**Alternative for transparency:** with `gpt-image-1.5` you can request `background: "transparent"` directly instead of post-processing chroma-key. Use gpt-image-1.5 + transparent background for any isolated subject that needs a true alpha channel.

---

## Caveat: Identity Guide Overreach

Once a Identity Guide is established, the model can over-apply its visual motifs to items that shouldn't inherit them. Observed in the 2026-05-12 Hollowfest Manor pack:
- T1 "plain pumpkin" came back with **felt-stitched outlines** (the guide's `Materials: hand-stitched felt`)
- A baseline white skull had **bat-wing patches** grafted on (the Halloween IP overreaching)

**Workaround:** for baseline items that shouldn't carry the decorative motifs, add explicit negation in the variant: `"just the plain [item] form, no extra decorations, no felt patches, no [theme-specific] embellishments."` Single-shot observation in one production pass; flag if you see it in your own work so we can refine the workaround.

---

## Additional Resources

- [references/palette-and-resolution.md](references/palette-and-resolution.md) — resolution tables, palette reference, quick-start prefixes
- [references/sprite-workflows.md](references/sprite-workflows.md) — character, isometric, tileset, UI workflows; consistency strategy; post-processing
