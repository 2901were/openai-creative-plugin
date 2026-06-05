# Palette and Resolution Reference

This reference covers pixel art resolution guidelines, named color palettes with best-use notes, hue-shifting principles, and copy-paste style prefixes for the four most common pixel-art sub-styles. Use these when setting up a style bible or writing generation prompts. See [SKILL.md](../SKILL.md) for the full game-assets workflow.

---

## Resolution Guide

| Size | Use Case | Detail Level |
|------|----------|-------------|
| 8×8 / 16×16 | Lo-fi, mobile, game jam | Minimal — silhouette only |
| **32×32** | **Sweet spot for most games** | Facial expressions, distinct armor, visible weapons |
| 64×64 | Detailed indie games | Fabric folds, individual fingers — requires ~4x more work |
| 128×128 | Portraits and splash art only | Not practical for gameplay sprites |

For tilesets, always use half the character resolution: 32×32 characters → 16×16 tiles.

---

## Color Palette Guide

Specify palettes by name in every prompt for maximum consistency.

| Palette | Colors | Best For |
|---------|--------|----------|
| **PICO-8** | 16 | Retro platformers, game jams — the go-to default |
| **Sweetie 16** | 16 | Mobile games, friendly/soft aesthetic |
| **Endesga 32** | 32 | Fantasy RPGs with varied environments |
| **Resurrect 64** | 64 | Larger projects, multiple biomes |
| **Apollo** | 16 | Sci-fi shooters, cool/tech aesthetic |
| **Zughy 32** | 32 | Horror, dungeon crawlers, dark atmosphere |
| **GameBoy** | 4 | Demakes, nostalgia, maximum constraint |
| **NES** | ~54 | Historical accuracy, retro authenticity |

**Hue shifting (critical):** Don't darken with black — shift shadows toward blue/purple. Don't lighten with white — shift highlights toward yellow/orange. This creates living, light-reactive sprites.

**AI prompting:** `"pixel art knight, PICO-8 color palette, limited 16 colors, cool-shifted shadows, warm highlights"`

---

## Quick Prompt Prefixes by Style

Copy-paste these at the start of any prompt to establish style instantly:

**PICO-8 Platformer:**
`2D pixel art, 32x32 sprite, PICO-8 16-color palette, 1px black outline, 2-tone cel shading, cool-shifted shadows, transparent background —`

**Game Boy Demake:**
`Game Boy pixel art, 16x16 sprite, 4-color green palette, no outline, flat shading, transparent background —`

**Modern Hi-bit Indie:**
`Hi-bit pixel art, 64x64 sprite, Endesga 32 palette, colored outline, 3-tone shading with dithering, transparent background —`

**Isometric RPG:**
`Isometric pixel art, 2:1 perspective, 64x32 tile, PICO-8 palette, top-left lighting, 1px black outline, game asset —`

---

Sources: [OpenAI Image Generation Guide](https://platform.openai.com/docs/guides/image-generation) · [Sprite-AI Style Guide](https://www.sprite-ai.art/blog/2d-pixel-art-style-guide) · [Isometric Pixel Art Guide](https://www.sprite-ai.art/guides/isometric-pixel-art) · [Pixel Art Palettes](https://www.sprite-ai.art/guides/pixel-art-color-palettes)
