# OpenAI Prompting Essentials (GPT Image)

Distilled from OpenAI's official cookbook prompting guides (gpt-image-2 + gpt-image-1.5, fetched 2026-06-05) and the image-generation API guide. Provider-verified practices — no provisional markers needed.

## 1. Prompt anatomy

Order: **background/scene → subject → key details → constraints.** Use short labeled segments or line breaks for complex requests — a skimmable template beats clever syntax. State the intended use ("game sprite", "UI mock", "ad banner") to set the polish level.

In this plugin, the **Identity line comes first** (see the openai-prompts skill), then the anatomy:

    Identity: <IP/project name> — <asset family>
    Scene: <background/context, or 'plain white background'>
    Subject: <the thing, pose/state>
    Details: <materials, palette, lighting>
    Constraints: <what must NOT appear / must stay fixed>

## 2. Preserve-list discipline (the textual half of consistency)

- Phrase edits as **"change only X; keep everything else the same."**
- **Restate the preserve list on EVERY chain iteration** — drift compounds when you rely on "same as before".
- Explicit exclusions work: "no watermark", "no extra text", "no logos", "preserve identity/geometry/layout".
- Synergy with this plugin's chain methodology: the Identity Anchor names what stays constant; the preserve list re-asserts it at each step. Use both — anchor line first, preserve list in every chain-step prompt.

## 3. Reference indexing (multi-image calls)

Address each input image by index and role, then describe the interaction:

    Image 1: the character (identity reference)
    Image 2: style reference (palette + brushwork)
    Apply Image 2's style to Image 1. Keep Image 1's pose and proportions.

For composites: say what to transplant, where it goes, and "match lighting, perspective, scale, and shadows".

## 4. Text-in-image accuracy

- Put literal text **in quotes** or ALL CAPS; demand "verbatim, no extra characters".
- Specify typography as constraints: font style, size, color, placement.
- Tricky words (brand names, invented words): **spell them out letter-by-letter.**
- Small or dense text needs `quality: "medium"` or `"high"` — low quality garbles it.

## 5. Photorealism mode

- Include the literal word **"photorealistic"** to engage the model's photo mode; alternatives: "real photograph", "taken on a real camera".
- Use camera/lens language: "35mm film photograph, 50mm lens, eye level, shallow depth of field, subtle film grain".
- Add texture cues (pores, wrinkles, worn materials) and authenticity cues ("candid, unposed, honest").
- Avoid "studio polish" phrasing — it triggers over-smoothing.

## 6. Quality / size / format strategy

- Start `quality: "low"` for drafts and high-volume; escalate to medium/high for text density, identity edits, finals.
- This plugin defaults generation to **1024x1024**; square is the fastest shape.
- **2560x1440 is the practical upper reliability boundary** — sizes above 2K are experimental (more variance), even though the API accepts up to 3840px.
- `jpeg` renders faster than `png` when latency matters — but transparent output requires `png` (gpt-image-1.5 only).

## 7. Iteration strategy

- Clean base prompt, then **small single-change follow-ups** ("make lighting warmer") — easier to debug than one overloaded prompt.
- "Same style as before" leverages chain context, but **re-specify critical details the moment they drift.**
- Wrong composition → regenerate fresh; wrong detail → edit.

## 8. Transparent extraction phrasing (gpt-image-1.5)

Request: "transparent background (RGBA PNG), crisp silhouette, no halos or fringing." Optionally: "subtle, realistic contact shadow in the alpha (no hard cut line)." For extractions from scenes: "remove the background only — do not restyle the subject."
