# Sprite Workflows Reference

This reference covers step-by-step generation workflows for the four main pixel-art asset types (Characters, Isometric Sprites, Tilesets, Game UI Elements), plus the Consistency Strategy and Post-Processing Workflow. See [SKILL.md](../SKILL.md) for style-bible setup, tier-atlas patterns, and extraction patterns before running these workflows.

---

## Sprite Generation Workflow

### 1. Characters (Side-scrolling / Platformer)

```
[Art style] [character type] in [pose], [facing direction],
[distinctive visual details: colors, armor, markings],
[background: transparent or flat color],
[style bible: resolution, palette, outline, shading, proportions]
```

Example:
`2D pixel art warrior in idle stance, front-facing, red tunic with leather belt, short brown hair, brown boots, transparent background, 32x32 sprite, PICO-8 palette, 1px black outline, 2-tone cel shading, 2.5 heads tall`

**For animations:** Generate each frame separately, passing the previous frame as `images[]` reference:
- Idle (4-6 frames) → Walk (6-8 frames) → Attack (4-5 frames) → Jump (3-4 frames)
- Note: 4-frame walk with good timing > 8 frames with flat timing

### 2. Isometric Sprites

Always include: `isometric`, `2:1 perspective`, `game asset`

```
isometric pixel art [object/character], game asset, 2:1 perspective,
[size: 64x64], [style bible: palette, outline, shading],
[lighting: top-left light source]
```

**Tile size standard:** 64×32 recommended (width = 2× height always).
**Character on tile:** 32×32 characters on 64×32 tiles; 48×48 for more detail.

**Common mistake:** Without "isometric" keyword, generators default to side-view output.

### 3. Tilesets

Minimum viable tileset:
- **Ground:** 3-5 variants (grass, dirt, water, stone) + transition tiles
- **Edges:** Cliffs, water borders, wall bases
- **Decoration:** 2-3 tree variants, rocks, structures

For seamless tiling, generate each tile individually with consistent style bible prefix. Manual pixel editing is usually required to fix seam edges — AI rarely achieves pixel-perfect seam alignment.

```
[Art style] [biome] ground tile, seamless, top-down view,
[16x16 / 32x32], [style bible], no characters, flat perspective
```

### 4. Game UI Elements

```
[Art style] [UI element: button/icon/health bar/inventory slot],
[style: flat pixel / skeuomorphic / minimal],
[color: matches game palette], [state: default/hover/pressed if needed],
[size: Nx N pixels], transparent background
```

For icon sets: pass 2-3 existing icons as `images[]` to maintain visual consistency.

---

## Consistency Strategy

**Within a session:** Use `start_creative_session` with the style bible as part of the session description. Pass each generated asset as `images[]` for subsequent assets.

**Across multiple sessions:** Create a "style anchor" — generate one character, one tile, and one item. If all three look like they belong together, lock that prompt prefix as your project standard.

**Palette normalization pass:** After generating a batch, manually replace all AI-generated colors with your locked palette in Aseprite or Piskel. This single step does more for visual consistency than any amount of prompt engineering.

---

## Post-Processing Workflow (Industry Standard 2026)

AI generates the base → manual refinement in pixel editor → final export:

1. Generate 3-5 variations of each asset
2. Pick the best geometry/silhouette
3. Open in **Aseprite** (paid) or **Piskel** (free) or **LibreSprite** (free)
4. Apply palette normalization (replace colors with locked palette)
5. Fix outlines, pixel noise, seam edges
6. Export as PNG sprite sheet or individual frames

This converts hours of manual work to minutes while maintaining full artistic control.
