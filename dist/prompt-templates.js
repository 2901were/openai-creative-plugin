import { ErrorCode, McpError, } from "@modelcontextprotocol/sdk/types.js";
export const PROMPT_TEMPLATES = {
    sprite_character: `# 🎮 Sprite Character Template

**Best for:** Character sprites with consistent poses for game development

## 🏆 Recommended Workflow: Hybrid Approach

**CRITICAL: Use sessions + image references for perfect consistency**

\`\`\`typescript
// 1. Start session with defaults
start_creative_session({
  aspectRatio: "1:1",  // Square for sprites
})

// 2. Generate base character
send_creative_message({
  prompt: "[Use template below]"
})
// SAVE the returned image path!

// 3. Generate each pose WITH image reference
send_creative_message({
  prompt: "Show the same [character] in [pose], maintaining all details",
  images: ["/path/to/previous/image.png"]  // ← KEY FOR CONSISTENCY!
})

// 4. Repeat for all poses: idle, walk, run, jump, attack, hurt, death
\`\`\`

## 📝 Prompt Template

\`\`\`
[Character Type] character in [pose]:
- [Physical features: body type, height, proportions]
- [Clothing: detailed description with colors]
- [Distinctive features: hair, accessories, weapons]
- [Style: pixel art / 2D flat / hand-drawn]
- [Technical specs: line weight, shading, color palette]
- [Background: white / transparent for extraction]
- [View: side-view, facing right]
\`\`\`

## 💡 Example (Base Character - Idle Pose)

\`\`\`
2D pixel art knight character in idle stance:
- Medieval knight in full plate armor
- Blue tabard with gold lion emblem
- Closed helmet with distinctive blue plume
- Tall, realistic proportions (not chibi)
- Sword sheathed at side, shield on back
- Clean pixel art style with black outlines
- 16-color palette (blues, grays, golds)
- White background for easy extraction
- Side view, facing right
\`\`\`

## 📝 Follow-up Prompts (With Image References!)

\`\`\`
# Walk pose
"Show the same knight in walking pose, mid-stride, maintaining all details"
images: [idle_pose_path]

# Attack pose
"Show the same knight in attack pose, sword raised overhead, maintaining all details"
images: [walk_pose_path]

# Jump pose
"Show the same knight in jump pose, mid-air with bent knees, maintaining all details"
images: [attack_pose_path]
\`\`\`

## ✅ Best Practices

**DO:**
- ✅ Be hyper-specific in base prompt (helmet details, emblem design, armor style)
- ✅ Use 1:1 aspect ratio for game sprites
- ✅ Request white/transparent backgrounds
- ✅ Specify exact art style (pixel art, 2D flat, hand-drawn)
- ✅ Pass previous image as reference for EVERY variation
- ✅ Save each image path for chaining references

**DON'T:**
- ❌ Use text-only prompts for variations (causes inconsistency)
- ❌ Skip image references (helmet will change, proportions will drift)
- ❌ Change too many variables at once
- ❌ Use vague descriptions

## 🎯 Recommended Settings

- Aspect Ratio: 1:1 (square sprites)
- Quality: medium (balanced speed/detail; use high for final production sprites)
- Reference Chain: idle → walk → attack → jump → hurt → death
- For isolated sprites: model gpt-image-1.5 + background: "transparent" (skips manual background removal).

## ⚠️ Common Pitfalls

**Text-Only Sessions = FAILED Consistency:**
- Helmet designs change
- Proportions become chibi/dwarf
- Colors drift
- NOT production-ready

**Solution:** ALWAYS use \`images\` parameter in send_creative_message!`,
    game_environment: `# 🏞️ Game Environment Template

**Best for:** Parallax backgrounds, tileable textures, game scenery

## 📝 Prompt Template

\`\`\`
[Environment type] for [game genre]:
- [Perspective: side-scrolling / top-down / isometric]
- [Layers: if parallax, specify foreground/mid/background]
- [Art style: pixel art / hand-painted / vector]
- [Color palette: specific colors and mood]
- [Technical: tileable / seamless / dimensions]
- [Details: specific objects, vegetation, structures]
\`\`\`

## 💡 Example: Side-Scrolling Forest

\`\`\`
Fantasy forest background for side-scrolling platformer game:
- Three distinct parallax layers
  Layer 1 (far): Misty mountains and distant trees
  Layer 2 (mid): Dense forest with tall pines
  Layer 3 (near): Ground vegetation and rocks
- Stylized 2D painted style
- Color palette: deep greens, browns, purple sky at dusk
- Soft directional lighting from left
- Tileable horizontally for seamless scrolling
- 16:9 aspect ratio, 1920x1080 resolution ready
\`\`\`

## ✅ Best Practices

- Specify exact layer count for parallax
- Request tileable edges if needed
- Define lighting direction clearly
- Use 16:9 or 21:9 for backgrounds

## 🎯 Recommended Settings

- Aspect Ratio: 16:9 or 21:9 (wide)
- Quality: high (environment detail warrants it)`,
    game_asset: `# 🎲 Game Asset Template

**Best for:** Items, props, UI elements, icons

## 📝 Prompt Template

\`\`\`
[Asset type] for [game genre]:
- [Description: what it is, purpose]
- [Art style: matching game aesthetic]
- [Angle/view: top-down / isometric / side-view]
- [Details: materials, colors, decorations]
- [Background: transparent / solid color]
- [Size/scale: relative to character if applicable]
\`\`\`

## 💡 Example: Health Potion

\`\`\`
Health potion item icon for fantasy RPG:
- Glass bottle with cork stopper
- Glowing red liquid inside with sparkle particles
- Gold decorative label with heart symbol
- Stylized 2D with soft shading
- Slight 3D isometric angle
- White background for easy extraction
- Clean linework, vibrant colors
\`\`\`

## ✅ Best Practices

- Request white background for easy extraction
- Specify if icon needs multiple states (normal/hover/disabled)
- Use 1:1 for square icons
- Be specific about style matching

## 🎯 Recommended Settings

- Aspect Ratio: 1:1 (icons), 16:9 (banners)
- Quality: medium
- For isolated sprites: model gpt-image-1.5 + background: "transparent" (skips manual background removal).`,
    character_concept: `# 👤 Character Concept Template

**Best for:** Initial character establishment with detailed specifications

## 🏆 Recommended Workflow

Start with THIS template for the base character, then use \`character_variations\` template for poses/expressions with image references.

## 📝 Prompt Template

\`\`\`
[Age/type] character concept:
PHYSICAL FEATURES:
- Face: [shape, eyes, nose, mouth, skin tone]
- Hair: [style, length, color, texture]
- Body: [build, height, distinctive features]
- Unique identifiers: [scars, tattoos, birthmarks]

CLOTHING & ACCESSORIES:
- Primary outfit: [detailed description]
- Colors: [specific color palette]
- Accessories: [jewelry, weapons, tools]
- Materials: [fabric types, leather, metal]

PERSONALITY INDICATORS:
- Posture: [confident, slouched, alert]
- Expression: [neutral, stern, friendly]
- Props: [items that reveal character]

ART DIRECTION:
- Style: [anime, realistic, stylized, painterly]
- Lighting: [soft, dramatic, natural]
- Composition: [full body, portrait, action pose]
- Background: [simple, detailed, solid color]
\`\`\`

## 💡 Example: Fantasy Mage

\`\`\`
Young adult elf mage character concept:
PHYSICAL FEATURES:
- Face: Angular with high cheekbones, almond amber eyes, pointed ears
- Hair: Long silver hair in an intricate braid over left shoulder
- Body: Slim build, tall (6'2"), graceful posture
- Unique: Faint arcane runes glowing on forearms

CLOTHING & ACCESSORIES:
- Deep blue velvet robes with gold constellation embroidery
- Wide leather belt with pouch attachments
- Oak staff (6ft tall) with glowing crystal top
- Silver circlet with sapphire centerpiece

PERSONALITY INDICATORS:
- Posture: Confident, staff held casually
- Expression: Intelligent, slightly amused
- Props: Open spellbook floating nearby

ART DIRECTION:
- Cel-shaded illustration style
- Soft rim lighting from behind
- Full body character sheet pose
- Simple gradient background (dark blue to purple)
\`\`\`

## ✅ Best Practices

- ✅ Be HYPER-SPECIFIC about distinctive features
- ✅ Use color codes if exact colors matter
- ✅ Describe accessories in detail
- ✅ Include personality-revealing elements
- ✅ Save this image path for variations!

## 🎯 Recommended Settings

- Aspect Ratio: 2:3 or 3:4 (portrait)
- Quality: high (concept art benefits from detail)
- SAVE PATH: Use for character_variations next!`,
    character_variations: `# 🎭 Character Variations Template

**Best for:** Expressions, poses, outfits while maintaining consistency

## 🏆 CRITICAL: Must Use Hybrid Workflow

**YOU MUST have a base character image first!**

\`\`\`typescript
// 1. Start session
start_creative_session({
  aspectRatio: "2:3",  // Portrait
})

// 2. Use character_concept template to create base
send_creative_message({
  prompt: "[character_concept template]"
})
// SAVE THIS PATH!

// 3. Generate variations WITH image reference
send_creative_message({
  prompt: "The same [character] [variation description]",
  images: ["/path/to/base/character.png"]  // ← REQUIRED!
})
\`\`\`

## 📝 Prompt Template (For Variations)

\`\`\`
The same [character] [variation type]:
- [Specific changes: expression, pose, outfit]
- Maintain: [features that must stay consistent]
- Change: [only what's different]
- [Same art style, lighting, composition style]
\`\`\`

## 💡 Examples (With Image References!)

**Expression Variation:**
\`\`\`
"The same elf mage showing surprised expression with raised eyebrows and
wide eyes, mouth slightly open. Maintain all other details: silver braid,
blue robes, amber eyes, pointed ears, same composition."
images: [base_character_path]
\`\`\`

**Pose Variation:**
\`\`\`
"The same elf mage in dynamic casting pose, staff raised overhead with
both hands, robes flowing, arcane energy swirling around staff crystal.
Maintain: silver hair, blue robes, amber eyes, same face, same style."
images: [previous_variation_path]
\`\`\`

**Outfit Variation:**
\`\`\`
"The same elf mage wearing casual traveling clothes: simple tunic and
pants, still carrying staff. Maintain: silver braided hair, amber eyes,
pointed ears, same face and body proportions, same art style."
images: [previous_variation_path]
\`\`\`

## ✅ Best Practices

- ✅ ALWAYS use \`images\` parameter
- ✅ Reference "the same [character]" explicitly
- ✅ Chain references: base → pose1 → pose2 → pose3
- ✅ List features to maintain
- ✅ Change ONE thing at a time

## 🎯 Recommended Settings

- Aspect Ratio: 2:3 or 3:4 (portraits)
- Quality: high (character consistency detail)
- Reference: Most recent variation

## ⚠️ Without Image References = FAILURE

Text-only will cause:
- Face changes
- Color shifts
- Proportion drift
- Style inconsistency`,
    character_portrait: `# 🖼️ Character Portrait Template

**Best for:** Face/bust shots for avatars, profiles, dialogue boxes

## 📝 Prompt Template

\`\`\`
[Character type] portrait:
FRAMING:
- [Head and shoulders / Face only / Bust]
- [Angle: front-facing / 3/4 view / profile]
- [Eye line: looking at camera / side glance / down]

FACIAL DETAILS:
- [Expression: specific emotion]
- [Eyes: color, shape, emotion]
- [Hair: style, how it frames face]
- [Distinctive features: emphasized]

COMPOSITION:
- [Background: simple / detailed / solid color]
- [Lighting: direction, mood]
- [Focal point: eyes / face]
- [Art style: realistic / anime / painterly]

TECHNICAL:
- [Crop: where frame cuts off]
- [Resolution needs: profile pic / detailed art]
\`\`\`

## 💡 Example: RPG Dialogue Portrait

\`\`\`
Dwarf warrior portrait for RPG dialogue system:
FRAMING:
- Head and shoulders, upper chest visible
- Slight 3/4 angle, looking directly at viewer
- Confident eye contact

FACIAL DETAILS:
- Stern but kind expression, slight smile
- Deep brown eyes with laugh lines
- Long braided red beard with gold rings
- Battle scar across left eyebrow
- Weathered, tanned skin

COMPOSITION:
- Simple gradient background (warm browns)
- Soft lighting from upper left
- Focus on eyes and facial expression
- Hand-painted fantasy art style

TECHNICAL:
- Cropped at mid-chest
- Square format for UI integration
- High detail on face, softer on edges
\`\`\`

## ✅ Best Practices

- Focus on facial expression
- Specify exact crop/framing
- Simple backgrounds for UI use
- 1:1 or 3:4 aspect ratio
- Clear eye direction

## 🎯 Recommended Settings

- Aspect Ratio: 1:1 (square avatars) or 3:4 (portraits)
- Quality: high (portrait detail warrants it)`,
    mobile_mockup: `# 📱 Mobile UI Mockup Template

**Best for:** Four-screen user journey layouts (validated nano-banana technique)

## 📝 Prompt Template

\`\`\`
DEVICE SPECIFICATION:
Modern [iPhone/Android model] with [distinctive features], edge-to-edge display

APP DEFINITION:
[App name and clear purpose]

FOUR KEY SCREENS:
1. [Screen 1 name]: [Purpose and key UI elements]
2. [Screen 2 name]: [Purpose and key UI elements]
3. [Screen 3 name]: [Purpose and key UI elements]
4. [Screen 4 name]: [Purpose and key UI elements]

VISUAL THEME:
- Primary color: [hex code or name]
- Secondary color: [hex code or name]
- Style: [modern/minimal/playful]
- Typography: [font style]

UI/UX REQUIREMENTS:
- Native [iOS/Android] components
- [8pt/4pt] grid system
- Proper typography hierarchy
- High contrast for readability
- [Shadow/depth style]

COMPOSITION:
Four [device] screens arranged horizontally showing complete user journey
from left to right. Each screen labeled underneath. Consistent [color]
palette across all screens. Show realistic content (not placeholder text).
\`\`\`

## 💡 Example: Fitness Tracker App

\`\`\`
DEVICE SPECIFICATION:
Modern iPhone 15 Pro Max with Dynamic Island, edge-to-edge OLED display

APP DEFINITION:
FitTrack - Personal fitness tracking and workout planning app

FOUR KEY SCREENS:
1. Dashboard: Daily activity stats (steps: 8,432/10,000), calorie burn gauge,
   heart rate widget, today's workout preview card
2. Workout Library: 3x2 grid of exercise categories with preview images
   (Cardio, Strength, Yoga, HIIT, Stretching, Custom), search bar at top
3. Progress Charts: Weekly line graph showing workout completion, monthly
   bar chart for calories burned, achievement badges row
4. Activity Log: Scrollable list of recent workouts with timestamps,
   duration, calories, each with thumbnail and stats

VISUAL THEME:
- Primary color: Vibrant orange (#FF6B35)
- Secondary color: Deep charcoal (#1A1A1A)
- Style: Modern, energetic, clean with ample whitespace
- Typography: SF Pro font, bold headers, regular body

UI/UX REQUIREMENTS:
- Native iOS components (cards, SF Symbols icons)
- SwiftUI design language with 8pt grid
- Clear typography hierarchy (32pt headers, 17pt body)
- High contrast white backgrounds with orange accents
- Subtle shadows on cards for depth

COMPOSITION:
Four iPhone 15 Pro Max screens arranged horizontally labeled "Dashboard",
"Workouts", "Progress", "History" underneath. Orange and black color palette
consistent across all. Show actual workout data not placeholders. Clean,
professional presentation.
\`\`\`

## ✅ Best Practices

- ✅ Specify FOUR screens explicitly
- ✅ Use realistic content, not "Lorem ipsum"
- ✅ Request horizontal arrangement
- ✅ Name each screen clearly
- ✅ Specify native platform (iOS/Android)
- ✅ Include specific color codes
- ✅ Describe data/content shown

## 🎯 Recommended Settings

- Aspect Ratio: 16:9 or 21:9 (wide, fits 4 screens)
- Quality: high (mockup detail warrants it)
- Single image output: All 4 screens in one composition`,
    icon_set: `# 🎨 Icon Set Template

**Best for:** Consistent icon families for applications

## 🏆 Recommended Workflow: Hybrid for Consistency

\`\`\`typescript
// 1. Start session
start_creative_session({
  aspectRatio: "1:1",
})

// 2. Generate first icon
send_creative_message({
  prompt: "[Use template for icon 1]"
})

// 3. Generate more icons WITH reference for consistency
send_creative_message({
  prompt: "[Icon 2 description] in the same style as the first icon",
  images: [icon1_path]  // ← Maintains style consistency
})
\`\`\`

## 📝 Prompt Template (First Icon)

\`\`\`
[Icon purpose] icon:
- Style: [line art / filled / gradient / flat]
- Line weight: [thin / medium / bold]
- Shape: [rounded / sharp corners]
- Size: [24x24px / 48x48px grid]
- Color: [monochrome / single color / multicolor]
- Background: [transparent / solid color]
- Details: [simple / moderate / detailed]
- Design language: [iOS / Material / custom]
\`\`\`

## 💡 Example: Navigation Icon Set

**First Icon:**
\`\`\`
Home icon in modern minimalist style:
- Outline style, single-weight lines (2px)
- Rounded corners (2px radius)
- 24x24px grid, centered
- Simple house shape: pitched roof, door, window
- Black (#000000) lines on transparent background
- Clean, recognizable at small sizes
- iOS-inspired design language
\`\`\`

**Subsequent Icons (WITH reference):**
\`\`\`
"Search icon (magnifying glass) in the same style as the home icon:
outline style, 2px lines, rounded corners, 24x24px grid, black on transparent"
images: [home_icon_path]

"Settings icon (gear) in the same style as previous icons"
images: [search_icon_path]

"Profile icon (person silhouette) in the same style"
images: [settings_icon_path]
\`\`\`

## ✅ Best Practices

- ✅ Establish style with first icon clearly
- ✅ Use image references for consistency
- ✅ Keep descriptions concise for icons
- ✅ Specify grid size (24x24, 48x48)
- ✅ Request transparent backgrounds
- ✅ Test at small sizes mentally

## 🎯 Recommended Settings

- Aspect Ratio: 1:1 (square)
- Quality: medium
- Generate one at a time with references
- For isolated sprites: model gpt-image-1.5 + background: "transparent" (skips manual background removal).`,
    ui_component: `# 🧩 UI Component Template

**Best for:** Buttons, cards, form elements with multiple states

## 📝 Prompt Template

\`\`\`
[Component type] for [platform/design system]:
COMPONENT STRUCTURE:
- [Basic shape and layout]
- [Padding and spacing]
- [Typography: font, size, weight]
- [Colors: background, text, border]

STATES TO SHOW:
- Default: [description]
- Hover: [what changes]
- Active/Pressed: [what changes]
- Disabled: [what changes]

COMPOSITION:
- [How to arrange states: horizontal row / vertical stack]
- [Labels underneath each state]
- [Spacing between examples]

TECHNICAL:
- [Platform: iOS / Android / Web]
- [Style: Material / iOS / Custom]
- [Size: dimensions if specific]
\`\`\`

## 💡 Example: Primary CTA Button

\`\`\`
Primary call-to-action button for modern web application:
COMPONENT STRUCTURE:
- Rounded rectangle with 8px corner radius
- 16px vertical padding, 32px horizontal padding
- Typography: 16px semibold, "Get Started" text
- White text (#FFFFFF) on blue background

STATES TO SHOW:
- Default: Bright blue (#0066FF), white text, subtle shadow
- Hover: Darker blue (#0052CC), white text, slightly larger shadow
- Active/Pressed: Even darker blue (#003D99), compressed slightly, less shadow
- Disabled: Light gray (#CCCCCC), gray text (#666666), no shadow

COMPOSITION:
- Four buttons arranged horizontally in a single row
- Labeled underneath: "Default", "Hover", "Active", "Disabled"
- 24px spacing between buttons
- White background with slight padding

TECHNICAL:
- Web design system
- Modern minimalist style
- Actual button size: 160px x 48px
\`\`\`

## ✅ Best Practices

- Show all relevant states
- Label each state clearly
- Use realistic text content
- Specify exact measurements
- Match platform conventions
- Include spacing guidelines

## 🎯 Recommended Settings

- Aspect Ratio: 16:9 (fits multiple states)
- Quality: medium`,
    web_section: `# 🌐 Web Section Template

**Best for:** Landing pages, hero sections, feature showcases

## 📝 Prompt Template

\`\`\`
[Section type] for [product/service] website:
LAYOUT STRUCTURE:
- [Grid/flexbox structure: columns, rows]
- [Content hierarchy: what's prominent]
- [Responsive considerations if applicable]

CONTENT ELEMENTS:
- Heading: [text example, size, position]
- Subheading: [text example, size, position]
- Body text: [key message]
- CTA button: [text, position, style]
- Media: [images, illustrations, where placed]

VISUAL STYLE:
- Background: [color, gradient, image, pattern]
- Color scheme: [primary, secondary, accent]
- Typography: [font style, hierarchy]
- Spacing: [generous / compact]
- Style keywords: [modern, minimal, bold, etc.]

TECHNICAL:
- Viewport: [desktop 1440px / mobile 375px]
- Aspect ratio: [16:9 for desktop view]
- Platform: [web, specific framework if relevant]
\`\`\`

## 💡 Example: SaaS Hero Section

\`\`\`
Hero section for project management SaaS product website:
LAYOUT STRUCTURE:
- Two-column layout: 60% left (content), 40% right (visual)
- Left-aligned content with generous left margin
- Vertically centered content

CONTENT ELEMENTS:
- Heading: "Manage Projects Effortlessly" (48px, bold, dark text)
- Subheading: "Collaborate with your team in real-time, track progress,
  and deliver projects on time." (20px, medium weight, gray text)
- Two CTA buttons: "Start Free Trial" (primary blue), "Watch Demo" (secondary outline)
- Trust badges: "Trusted by 10,000+ teams" with small company logos below

VISUAL STYLE:
- Background: Clean gradient (light blue to white, top to bottom)
- Left side: Content as described
- Right side: Modern dashboard screenshot with slight perspective tilt,
  showing colorful project boards and task cards
- Color scheme: Blue (#2563EB primary), white, light grays
- Typography: Modern sans-serif (Inter-style)
- Generous whitespace throughout (80px top/bottom padding)

TECHNICAL:
- Desktop viewport: 1440px wide
- 16:9 aspect ratio
- Modern web design, circa 2024
- Clean, professional SaaS aesthetic
\`\`\`

## ✅ Best Practices

- Include realistic copy text
- Show actual UI screenshots if relevant
- Specify exact layout structure
- Define spacing clearly
- Modern, current design trends
- Professional polish

## 🎯 Recommended Settings

- Aspect Ratio: 16:9 or 21:9 (desktop), 9:16 (mobile)
- Quality: high (web mockup detail warrants it)
- High detail for mockup realism`,
};
const IDENTITY_PREAMBLE = `## 🎯 Identity Anchor — read this before the template below

Lead every prompt in a series with an **Identity** line that names a specific fictional project or IP. Pin this line byte-identical across every prompt in the series; vary only the per-asset text below it.

\`\`\`
Identity: [project/IP name + world + gameplay context]
\`\`\`

**Examples:**
- \`Identity: Hollowfest Manor — a Halloween-themed merge-2 prototype, witch's autumnal estate\`
- \`Identity: Crystal Caverns — an underground roguelike, player-character class\`
- \`Identity: Tideglass Cove — a coastal-village builder, NPC line\`

**Why it matters:** the IP name is the load-bearing consistency anchor across calls in a series. The model's prior for fictional-IP-cohesion activates when there's a name to lean on — abstract category descriptors ("a Halloween merge-2 game") alone are weaker. Real or invented; both work. Empirically shortens iteration loops: chains that took 4-9 iterations without explicit IP-naming converged in 1-3 iterations after the Identity line was led with a project name.

See the \`openai-prompts\` skill § "The Identity Guide Pattern" for the full 5-line guide structure and rationale.

---

`;
export async function handleGetPromptTemplate(request) {
    const { templateType } = request.params.arguments;
    const template = PROMPT_TEMPLATES[templateType];
    if (!template) {
        throw new McpError(ErrorCode.InvalidParams, `Unknown template type: ${templateType}`);
    }
    return {
        content: [
            {
                type: "text",
                text: IDENTITY_PREAMBLE + template,
            },
        ],
    };
}
//# sourceMappingURL=prompt-templates.js.map