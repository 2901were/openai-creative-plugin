---
name: openai-ui-mockups
description: This skill should be used when the user asks to "design UI mockups", "create app screen mockups", "generate a UI screen series", "design phone mockups", "create app design variations", "design app screens", or otherwise needs multi-screen UI mockup generation. Covers the Hybrid Workflow with image references (compounding refs across screens), reference-image hygiene caveat, aspect-ratio + grid guidance, and external composition (Figma/Photoshop) for final phone-frame layout.
version: 0.4.0
---

# OpenAI UI Mockup Series Generator

Generate a consistent set of UI mockup screens with a unified style using the Hybrid Workflow.

## Model choice comes first

- **Isolated sprites / transparent assets** → `model: "gpt-image-1.5"` + `background: "transparent"`.
  The default model (gpt-image-2) REJECTS transparent backgrounds — switch models before generating.
- **Full scenes, references, max quality** → default `gpt-image-2`.

## Key Rules

- Generate individual screens separately (do NOT ask GPT Image to compose phone frames + labels — it introduces text errors like "SWIM" → "SVIM")
- **Text accuracy in UI:** Put literal strings (button labels, app names, tab text) **in quotes** or ALL CAPS; demand "verbatim, no extra characters". For product names or invented words, spell them out **letter-by-letter** in the prompt. Use `quality: "medium"` or higher for screens with dense text panels — `"low"` quality garbles UI labels. (Source: OpenAI cookbook)
- Use **9:16** aspect ratio for individual mobile screens (constrains canvas = authentic pixel density for pixel art styles)
- Use **compounding references**: Screen 3 references Screen 1 + Screen 2 for maximum consistency
- Final mockup composition (adding phone frames, labels, layout) should be done externally in Figma/Photoshop/Sketch
- For UI series sharing a brand with 3D items or other assets in the same IP, pin the **Identity Guide** at the top of every prompt (see the `openai-prompts` skill § "The Identity Guide Pattern"). Cross-modality observation (2026-05-12): same `Identity:` + same `Palette:` produces visible family resemblance between 3D items and flat-vector UI screens — the `Identity:` line is the load-bearing anchor

> ⚠️ Provisional: cross-modality Identity Guide observation was validated on gemini-creative; re-validation on GPT Image pending.

## Steps

1. **Gather requirements** — Ask the user:
   - App name and purpose
   - Which screens to generate (home, detail, profile, settings, etc.)
   - Visual style preference (photorealistic UI, flat design, pixel art, glassmorphism, etc.)
   - Color palette or brand colors (if any)
   - Target platform (iOS / Android / Web)

2. **Generate 3 style variations of Screen 1** using `generate_image` (no session needed for style selection):
   - Prompt: "[Screen 1 purpose] for [app name], [style] design, [colors], [platform] UI"
   - Visually inspect all 3 with Read tool
   - Ask the user which style they prefer before continuing

3. **Start a session** once style is confirmed:
   ```
   model: "gpt-image-2"
   aspectRatio: "9:16"
   description: "[App name] UI screens"
   outputDirectory: [user's project directory if specified]
   ```

4. **Regenerate Screen 1** at full quality within the session using `send_creative_message`:
   - Use the style description from the chosen variation
   - Save the returned path as `screen1_path`
   - Visually verify with Read tool

5. **Generate each subsequent screen** using `send_creative_message`:
   - Screen 2: `images: [screen1_path]`
   - Screen 3: `images: [screen1_path, screen2_path]` (compounding references)
   - Screen 4: `images: [screen1_path, screen2_path, screen3_path]` — up to 16 refs supported
   - Prompt: "Same [app name] UI style: [Screen N description], maintain identical color palette, typography, button styles, and icon design"
   - Visually verify each with Read tool

6. **End session** and provide user with all file paths + advice to use Figma/Sketch for final composition.

## Prompting Tips

- Be explicit about UI elements: "bottom tab bar with 4 icons", "floating action button", "card-based list"
- Specify typography style: "bold sans-serif headings, regular body text"
- Include negative space guidance: "clean, minimal, lots of whitespace"
- For pixel art UI: "8x8 pixel grid, limited 16-color palette, chunky button outlines"

---

## Hybrid Mode Caveat: Reference Image Hygiene

When passing image references via `images[]`, GPT Image treats the **entire** image as canonical visual content. Anything visible in the ref — including accidents like palette legends, debug overlays, watermarks, or unintended UI elements — propagates into the output.

**Documented failure (2026-05-12 on gemini-creative, production-pass D6):** a three-phone composed-mockup generation passed prior validation-experiment screens as refs. Those refs had palette legends rendered into them. All three generated phones came back with the palette legend bled through into each phone screen.

> ⚠️ Provisional: reference-bleed failure documented on gemini-creative; same mechanism applies to GPT Image but re-validation pending.

**Mitigation (preference order):**
1. **Compose clean refs first.** Crop debug overlays, watermarks, palette legends, or unintended UI out of the reference images before passing them as `images[]`. Most reliable.
2. **Explicit crop-out instructions.** If you can't re-export clean refs: `"Do not include the side palette legend visible in the reference images. Render only the phone screens themselves."` Worked on retry for D6 but adds prompt friction.

Compose-with-refs is not a same-mind operation. The model treats everything visible in the ref as part of the spec.

---

## Aspect Ratio + Grid Dimensions

When the prompt requests a specific grid layout (e.g., `"4×6 grid of inventory slots"`), GPT Image fits the grid to the available canvas regardless of explicit dimension counts. **Pick the aspect ratio that natively fits the requested grid**, not the platform's display aspect.

| Requested grid | Native aspect | What happens on 9:16 portrait | What happens on 16:9 landscape |
|---|---|---|---|
| 7×5 horizontal | ~7:5 landscape | Reshapes to ~5×6–5×7 (portrait fit) | Mostly preserved |
| 5×6 vertical | ~5:6 portrait | Mostly preserved | Reshapes to ~5×5 (height clipped) |
| 5×5 square | 1:1 | Light stretch | Light stretch |

**Production observations (2026-05-12, gemini-creative):**
- D2 board requested 7×5, rendered 5×6 on 9:16 (a 2-row deformation)
- D6 center-phone embedded grid requested 5×6, rendered ~5×5 on 16:9 (height-clipped by the phone frame)

> ⚠️ Provisional: grid-deformation observations from gemini-creative; same canvas-fitting behavior expected from GPT Image but re-validation pending.

**Rule:** the grid wins, not the platform aspect. Generate at the aspect that fits the grid — even if the final use case is a 9:16 phone screen, crop or letterbox in Figma later. Generating wrong-aspect + relying on the model to preserve grid dimensions doesn't work.
