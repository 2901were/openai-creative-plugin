# Domain-Specific Prompt Structures

Per-domain prompt scaffolds. Pair with the universal structure and Identity Guide pattern from `SKILL.md`.

## Game Sprites

```
[Art style] [character/creature] in [pose/action], [front/side/top]-facing,
[distinctive visual traits: colors, markings, equipment],
[background: transparent/solid color],
[identity guide: resolution, palette name, outline, shading, proportions]
```

**Style guide prefix (copy-paste before every sprite prompt):**
`2D pixel art, 32x32 sprite, PICO-8 16-color palette, 1px black outline, 2-tone cel shading, transparent background —`

Named palettes to specify: `PICO-8` (16 colors, retro), `Sweetie 16` (16, friendly), `Endesga 32` (32, fantasy RPG), `Apollo` (16, sci-fi), `Zughy 32` (32, horror), `GameBoy` (4, demake).

**Consistency rule:** Every distinctive detail must be named explicitly in the first image. Subsequent poses pass the previous image visually — details propagate automatically via the `images` parameter. See the `openai-game-assets` skill for the full resolution guide, palette table, and isometric rules.

## Game Environments

```
[Perspective: side-scrolling/top-down/isometric] [biome/setting],
[time of day and lighting], [key elements: foreground, midground, background layers],
[atmosphere/mood], [art style], [tileable: yes/no]
```

## Character Concepts

```
[Character role/archetype], [physical description: build, age, features],
[outfit/equipment: every piece named], [color palette: primary/accent/shadow],
[expression/personality], [style reference: realistic/stylized/pixel],
[pose: neutral/dynamic], [background: plain for reference use]
```

For character consistency across variations, the first "concept" image is the visual anchor. Pass it as a reference for all subsequent variations.

## UI / Mobile Mockups

```
[App screen name] for [app name] ([app purpose]),
[key UI elements: navigation, main content area, CTAs],
[style: flat/glassmorphism/neumorphic/material],
[color scheme], [typography style: bold/minimal/playful],
[platform: iOS/Android]
```

## Icon Sets

```
[Icon subject] icon, [style: flat/outlined/filled/duotone],
[stroke weight], [corner radius: sharp/rounded/pill],
[color: single/dual/gradient], [background: none/solid/subtle],
consistent with [describe other icons in set]
```

Pass 2-3 existing icons from the set as reference images when generating new ones.

## Web Sections

```
[Section type: hero/feature/pricing/testimonial] for [product/company],
[headline placeholder], [subtext style], [CTA button design],
[layout: centered/split/grid], [illustration or photo style],
[color palette], [whitespace: dense/airy]
```
