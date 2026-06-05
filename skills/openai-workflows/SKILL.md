---
name: openai-workflows
description: This skill should be used when the user asks "which workflow should I use", "how should I structure this generation task", "should I use a session", "is text-only enough", "Hybrid vs Identity Guide", or otherwise needs to choose between the four main generation patterns (Hybrid Workflow, Identity Guide Workflow, continue_editing, text-only sessions). Covers the decision tree, validated trade-off comparison, and special case for multi-screen UI composition.
version: 0.4.0
---

# OpenAI Workflow Selection Guide

Choose the right workflow before starting. Wrong choice = wasted API calls.

## Model choice comes first

- **Isolated sprites / transparent assets** → `model: "gpt-image-1.5"` + `background: "transparent"`.
  The default model (gpt-image-2) REJECTS transparent backgrounds — switch models before generating.
- **Full scenes, references, max quality** → default `gpt-image-2`.

## Decision Tree

```
Do you need visual consistency across multiple images?
│
├── YES — fixed subject (same character/object across poses, same UI across screens)?
│   └── Hybrid Workflow (sessions + images param)  ← unmatched for subject-level repetition
│
├── YES — thematic asset pack in one world (different items, shared IP/style)?
│   └── Identity Guide Workflow (verbatim 5-line guide + variant deltas)
│       ← NEW (validated 2026-05-12): simpler, lower token cost, no image-ref chaining
│
├── YES — UI screen series with shared layout?
│   └── Hybrid Workflow (image refs lock in exact repeated header/banner/grid layouts)
│
└── NO — unrelated batches?
    ├── One image → generate_image
    └── Many unrelated images → text-only session or repeated generate_image
```

---

## Workflow 1: Hybrid (Recommended for consistency)

**Use for:** Sprite series, character variations, UI screens, product shots, any multi-image project requiring visual coherence.

**How it works:**
```
start_creative_session(model, aspectRatio, outputDirectory)
  → send_creative_message(prompt)                    # base image, no images param
  → send_creative_message(prompt, images=[img1])     # pass previous as reference
  → send_creative_message(prompt, images=[img2])     # chain forward
  → end_creative_session()
```

**Why the `images` param is critical:** When `send_creative_message` receives `images[]`, it passes the actual pixel data to GPT Image as visual input — functionally identical to `edit_image`. Without it, the model reconstructs from text alone, causing proportion drift, color changes, and detail inconsistencies.

**Validated results (October 2025, gemini-creative + 2026-06-05 GPT Image re-validation):**
- ✅ Perfect helmet/armor consistency across poses (validated on gpt-image-2, 1- and 2-ref chains)
- ✅ Correct proportions (no dwarf/chibi effect on gpt-image-2; note gpt-image-1.5 showed proportion drift — see caveat below)
- ✅ Production-ready for game development
- ✅ All files prefixed with session ID for easy organization

(validated on GPT Image 2026-06-05 — see [[finding-gpt-image-workflows]])

---

## Workflow 2: Identity Guide (Asset pack, validated 2026-05-12)

**Use for:** Multi-item asset packs in a single world — evolution-chain atlases, themed item sets, UI screens sharing the same brand. The opposite use case to Hybrid: Hybrid locks one subject across calls; Identity Guide locks one *world* across calls and lets each call render a different subject.

**How it works:**
```
For each call in the series:
  generate_image(prompt = GUIDE_BLOCK + "\n\n" + VARIANT_DELTA)
```

Where `GUIDE_BLOCK` is the byte-identical 5-line identity guide (Identity / Form / Camera / Palette / Materials) and `VARIANT_DELTA` describes only what's different about *this* item.

See the `openai-prompts` skill § "The Identity Guide Pattern" for the guide structure and the `openai-game-assets` skill § "Tier Evolution Chain Atlases" for the merge-game-specific atlas pattern.

**Why it works:** the guide gives the model byte-identical canonical context for the world. Variance comes from the variant delta only — the model isn't forced to reconcile changing style descriptions across calls.

**Validated results (2026-05-12, gemini-creative):**
- ✅ 27-image A/B/C experiment: verbatim text-only guide (Mode A) matched hybrid-with-refs (Mode C) on the Tideglass buildings theme
- ✅ Production pass: 3/6 deliverables flawless on first single-call attempt; 2/6 acceptable with minor quirks
- ⚠️ Atlas-shaped variants (dense labels + multi-tier layouts) require appending the negative-instruction suffix verbatim to suppress palette-legend rendering

> ⚠️ Provisional: Identity Guide validation results inherited from gemini-creative; re-validation on GPT Image pending.

**Trade-offs vs Hybrid:**
- ✅ Lower token cost (text-only, no image refs to chain)
- ✅ Simpler API (one call, no path tracking)
- ⚠️ Weaker for subject-level repetition (use Hybrid if you need the exact same character across 10 poses)

---

## Workflow 3: continue_editing (Quick iteration)

**Use for:** Rapid prototyping, small corrections, single-subject refinement.

```
generate_image(prompt)
  → continue_editing("change X to Y")
  → continue_editing("add Z")
  → continue_editing("remove W")
```

**Pros:** Simplest API — no path tracking needed, automatic image chaining.
**Cons:** No file organization, no statistics, only tracks one image at a time, no session context.

---

## Workflow 4: Text-only Sessions (Use with an identity guide, or for unrelated batches)

**Use for:** Either (a) Identity Guide Workflow (Workflow 2 above) which is technically a text-only session with a verbatim guide, or (b) generating unrelated batches with shared defaults (aspect ratio, output directory).

**Updated guidance (2026-05-12, gemini-creative):** the earlier "text-only fails consistency" verdict was undertested. The reality is more nuanced:

- ✅ Text-only with a **byte-identical identity guide** pinned at the top of every call (Identity Guide Workflow) **works** for thematic asset packs — validated 27 images + 6 deliverables on gemini-creative (GPT Image identity-guide validation pending).
- ❌ Text-only with **paraphrased or freely-described style across calls** fails — empirically causes drift. Validated on gemini-creative (Mode-B paraphrase control); re-confirmed on GPT Image 2026-06-05: text-only walking knight prompt produced composition drift vs base image (shield/sword appeared, proportions shifted).

The "text-only fails for subject repetition" half of this claim is validated on GPT Image 2026-06-05 — see [[finding-gpt-image-workflows]]. The identity-guide-text-only claim remains provisional (GPT Image identity-guide re-validation pending).

**Don't use text-only sessions for** subject-level repetition (same character across many poses) — that's what Hybrid Workflow is for.

---

## Workflow Comparison

| Feature | Hybrid | Identity Guide | continue_editing | Text-only (no guide) |
|---------|--------|---------------|-----------------|-----------|
| Consistency — same subject across poses | ✅ Perfect | ⚠️ Weaker | ✅ Perfect | ❌ Poor |
| Consistency — different items, same IP | ⚠️ Overkill | ✅ Strong | ❌ N/A | ❌ Poor |
| Token cost per call | High (refs) | Low (text only) | High (refs) | Low |
| API complexity | ⚠️ Moderate | ✅ Simple | ✅ Simple | ✅ Simple |
| File organization | ✅ Session prefix | ⚠️ Depends | ❌ Generic | ✅ Session prefix |
| Production ready | ✅ Yes | ✅ Yes (asset packs) | ✅ Yes | ❌ No (without bible) |

---

## Special Case: Multi-Screen UI Composition

**Do NOT** ask GPT Image to compose the final mockup (phone frames + labels + layout). It introduces text rendering errors and layout distortions.

**Correct approach:**
1. Generate individual screens (Hybrid workflow, `9:16` aspect ratio)
2. Export file paths
3. Compose in Figma / Photoshop / Sketch externally

**Why 9:16 for individual screens:** Constrains the canvas to a single phone frame, preserving pixel density. Wide ratios (21:9) dilute pixel art quality.
