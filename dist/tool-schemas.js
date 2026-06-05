const ASPECT_RATIO_ENUM = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
const MODEL_ENUM = ["gpt-image-2", "gpt-image-1.5"];
const MODEL_PROP = {
    type: "string",
    enum: [...MODEL_ENUM],
    description: "GPT Image model (default: gpt-image-2). " +
        "gpt-image-2: best quality, arbitrary sizes up to 3840px, NO transparent background. " +
        "gpt-image-1.5: supports background:'transparent' (alpha-cut sprites), preset sizes only.",
};
const MODEL_PROP_SESSION = {
    type: "string",
    enum: [...MODEL_ENUM],
    description: "GPT Image model to use for this session (default: gpt-image-2). " +
        "gpt-image-2: best quality, arbitrary sizes up to 3840px, NO transparent background. " +
        "gpt-image-1.5: supports background:'transparent' (alpha-cut sprites), preset sizes only.",
};
const QUALITY_PROP = {
    type: "string",
    enum: ["low", "medium", "high", "auto"],
    description: "Rendering quality. Default 'auto' (model decides). " +
        "'low' is fastest/cheapest for drafts; 'high' for finals.",
};
const QUALITY_PROP_SESSION = {
    type: "string",
    enum: ["low", "medium", "high", "auto"],
    description: "Session default rendering quality. Default 'auto' (model decides). " +
        "'low' is fastest/cheapest for drafts; 'high' for finals.",
};
const BACKGROUND_PROP = {
    type: "string",
    enum: ["transparent", "opaque", "auto"],
    description: "Background mode. 'transparent' produces PNG with alpha — " +
        "REQUIRES model gpt-image-1.5; gpt-image-2 rejects it. " +
        "Ideal for game sprites (no post-cut needed). Default 'auto'.",
};
const BACKGROUND_PROP_SESSION = {
    type: "string",
    enum: ["transparent", "opaque", "auto"],
    description: "Session default background mode. 'transparent' produces PNG with alpha — " +
        "REQUIRES model gpt-image-1.5; gpt-image-2 rejects it. " +
        "Ideal for game sprites (no post-cut needed). Default 'auto'.",
};
const SIZE_PROP = {
    type: "string",
    description: "Explicit output size, overrides aspectRatio. " +
        "Presets: 'auto', '1024x1024', '1536x1024', '1024x1536'. " +
        "gpt-image-2 additionally accepts any WIDTHxHEIGHT (both divisible by 16, ratio ≤3:1, max edge 3840px), " +
        "e.g. '1920x1080'.",
};
const SIZE_PROP_SESSION = {
    type: "string",
    description: "Session default explicit output size, overrides aspectRatio. " +
        "Presets: 'auto', '1024x1024', '1536x1024', '1024x1536'. " +
        "gpt-image-2 additionally accepts any WIDTHxHEIGHT (both divisible by 16, ratio ≤3:1, max edge 3840px), " +
        "e.g. '1920x1080'.",
};
const ASPECT_RATIO_PROP = {
    type: "string",
    enum: [...ASPECT_RATIO_ENUM],
    description: "Aspect ratio for the generated image. " +
        "Options: 1:1 (square), 2:3 (portrait), 3:2 (landscape), 3:4 (portrait), 4:3 (landscape), " +
        "4:5 (portrait), 5:4 (landscape), 9:16 (vertical/mobile), 16:9 (widescreen), 21:9 (ultrawide). " +
        "Extreme ratios beyond 3:1 are not supported by GPT Image models. Default: 1:1",
};
const ASPECT_RATIO_PROP_EDIT = {
    type: "string",
    enum: [...ASPECT_RATIO_ENUM],
    description: "Aspect ratio for the edited image. " +
        "Options: 1:1 (square), 2:3 (portrait), 3:2 (landscape), 3:4 (portrait), 4:3 (landscape), " +
        "4:5 (portrait), 5:4 (landscape), 9:16 (vertical/mobile), 16:9 (widescreen), 21:9 (ultrawide). " +
        "Extreme ratios beyond 3:1 are not supported by GPT Image models. Default: maintains original aspect ratio",
};
const ASPECT_RATIO_PROP_SESSION = {
    type: "string",
    enum: [...ASPECT_RATIO_ENUM],
    description: "Session default aspect ratio for images. " +
        "Options: 1:1 (square), 2:3 (portrait), 3:2 (landscape), 3:4 (portrait), 4:3 (landscape), " +
        "4:5 (portrait), 5:4 (landscape), 9:16 (vertical/mobile), 16:9 (widescreen), 21:9 (ultrawide). " +
        "Extreme ratios beyond 3:1 are not supported by GPT Image models.",
};
export const TOOL_SCHEMAS = [
    {
        name: "configure_openai_token",
        annotations: {
            idempotentHint: true,
        },
        description: `Configure your OpenAI API token for image generation.

WHEN TO USE:
- First time setup of the MCP
- When you get an error about missing API token
- To change API keys
- Note: GPT Image models may require Organization Verification on your OpenAI account

HOW TO USE:
- Get your API key from https://platform.openai.com/api-keys
- Call this tool with the apiKey parameter

EXAMPLE:
configure_openai_token({ apiKey: "your-key-here" })

WHAT HAPPENS:
- API key is saved locally for future use
- You'll be able to use all image generation features`,
        inputSchema: {
            type: "object",
            properties: {
                apiKey: {
                    type: "string",
                    description: "Your OpenAI API key from the OpenAI platform (https://platform.openai.com/api-keys)",
                },
            },
            required: ["apiKey"],
        },
    },
    {
        name: "generate_image",
        description: `Generate a new image from a text description. Returns the file path of the saved image.`,
        annotations: {
            openWorldHint: true,
        },
        inputSchema: {
            type: "object",
            properties: {
                prompt: {
                    type: "string",
                    description: "Detailed text description of the NEW image to create from scratch",
                },
                aspectRatio: ASPECT_RATIO_PROP,
                model: MODEL_PROP,
                quality: QUALITY_PROP,
                background: BACKGROUND_PROP,
                size: SIZE_PROP,
                outputDirectory: {
                    type: "string",
                    description: "Optional custom absolute path for saving this image (e.g., '/Users/dev/my-project/assets'). Must not be a system directory. Overrides the active session's outputDirectory for this call only.",
                },
            },
            required: ["prompt"],
        },
    },
    {
        name: "edit_image",
        description: `Edit an existing image by file path with text instructions. Supports up to 16 input images (main + references) for style transfer or composition. Invalid reference images are skipped with a warning rather than failing. Returns the new file path (original is preserved).`,
        annotations: {
            openWorldHint: true,
        },
        inputSchema: {
            type: "object",
            properties: {
                imagePath: {
                    type: "string",
                    description: "EXACT full file path to the main image file to edit. Example on macOS: /Users/USERNAME/openai-creative-images/generated-2025-10-29T08-12-06-abc123.png",
                },
                prompt: {
                    type: "string",
                    description: "Text describing the modifications to make to the existing image",
                },
                referenceImages: {
                    type: "array",
                    items: {
                        type: "string"
                    },
                    description: "Optional array of EXACT file paths to additional reference images to use during editing (e.g., for style transfer, adding elements, etc.)",
                },
                aspectRatio: ASPECT_RATIO_PROP_EDIT,
                model: MODEL_PROP,
                quality: QUALITY_PROP,
                background: BACKGROUND_PROP,
                size: SIZE_PROP,
                inputFidelity: {
                    type: "string",
                    enum: ["high", "low"],
                    description: "Fidelity to input images. gpt-image-1.5 only — gpt-image-2 is always high-fidelity and rejects this param.",
                },
                outputDirectory: {
                    type: "string",
                    description: "Optional custom absolute path for saving the edited image (e.g., '/Users/dev/my-project/assets'). Must not be a system directory. Overrides the active session's outputDirectory for this call only.",
                },
            },
            required: ["imagePath", "prompt"],
        },
    },
    {
        name: "get_configuration_status",
        annotations: {
            readOnlyHint: true,
        },
        description: `Check if the OpenAI API is configured and ready to use.

WHEN TO USE:
- Before starting any image generation work
- When debugging connection issues
- To verify API key is loaded

PARAMETERS: None

WHAT YOU GET BACK:
- Configuration status (✅ configured or ❌ not configured)
- Source of API key (environment variable, config file, or manual)
- Instructions on how to configure if not set up

EXAMPLE USAGE:
get_configuration_status()

CONFIGURATION PRIORITY (checked in this order):
1. Environment variable: OPENAI_API_KEY (most secure, recommended)
2. Config file: .openai-creative-config.json (local storage)
3. Manual: configure_openai_token tool (one-time setup)`,
        inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
        },
    },
    {
        name: "continue_editing",
        description: `Edit the most recently generated or edited image without specifying a path. Convenience wrapper around edit_image using the internally tracked lastImagePath. Each edit creates a new file; originals are preserved.`,
        annotations: {
            openWorldHint: true,
        },
        inputSchema: {
            type: "object",
            properties: {
                prompt: {
                    type: "string",
                    description: "Text describing the modifications/changes/improvements to make to the last image (e.g., 'change the hat color to red', 'remove the background', 'add flowers')",
                },
                referenceImages: {
                    type: "array",
                    items: {
                        type: "string"
                    },
                    description: "Optional array of EXACT file paths to additional reference images to use during editing (e.g., for style transfer, adding elements from other images, etc.)",
                },
                outputDirectory: {
                    type: "string",
                    description: "Optional custom absolute path for saving the edited image (e.g., '/Users/dev/my-project/assets'). Must not be a system directory. Overrides the active session's outputDirectory for this call only.",
                },
            },
            required: ["prompt"],
        },
    },
    {
        name: "get_last_image_info",
        annotations: {
            readOnlyHint: true,
        },
        description: `Get the file path, size, and timestamp of the most recently generated or edited image. Returns an error if no image has been generated yet in this server session.`,
        inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
        },
    },
    {
        name: "start_creative_session",
        description: `Initialize a creative session with default configuration for multi-image workflows. Session defaults (model, aspectRatio, quality, background, size, outputDirectory) apply to all send_creative_message calls. Max 5 concurrent sessions; auto-expires after 30 minutes of inactivity. Returns session ID.`,
        inputSchema: {
            type: "object",
            properties: {
                model: MODEL_PROP_SESSION,
                aspectRatio: ASPECT_RATIO_PROP_SESSION,
                quality: QUALITY_PROP_SESSION,
                background: BACKGROUND_PROP_SESSION,
                size: SIZE_PROP_SESSION,
                description: {
                    type: "string",
                    description: "Optional human-readable description of the session purpose (e.g., 'Cat sprites for platformer game')",
                },
                outputDirectory: {
                    type: "string",
                    description: "Optional custom absolute path for saving all images in this session (e.g., '/Users/dev/my-project/assets'). Must not be a system directory.",
                },
            },
        },
    },
    {
        name: "send_creative_message",
        annotations: {
            openWorldHint: true,
        },
        description: `Generate an image within an active session using its default configuration. Passing images[] with previous image paths routes the call to the OpenAI image-edits endpoint and maintains visual consistency across poses or screens (critical for character/UI series work). Defaults to current session; use sessionId to target a specific one.`,
        inputSchema: {
            type: "object",
            properties: {
                prompt: {
                    type: "string",
                    description: "Text description for image generation or editing",
                },
                images: {
                    type: "array",
                    items: {
                        type: "string",
                    },
                    description: "Optional array of file paths to input images for editing or composition",
                },
                sessionId: {
                    type: "string",
                    description: "Optional session ID (defaults to current session)",
                },
            },
            required: ["prompt"],
        },
    },
    {
        name: "end_creative_session",
        description: `Terminate a session and return final statistics (duration, message count, images generated). Image files persist on disk. Frees the session slot (max 5 limit). Defaults to current session.`,
        inputSchema: {
            type: "object",
            properties: {
                sessionId: {
                    type: "string",
                    description: "Optional session ID to end (defaults to current session)",
                },
            },
        },
    },
    {
        name: "get_session_info",
        annotations: {
            readOnlyHint: true,
        },
        description: `List all active sessions (current marked with ▶), or get detailed info for a specific session including config, image count, and expiration countdown. Expired sessions are auto-cleaned before returning.`,
        inputSchema: {
            type: "object",
            properties: {
                sessionId: {
                    type: "string",
                    description: "Optional session ID for detailed info (omit to list all sessions)",
                },
            },
        },
    },
    {
        name: "get_prompt_template",
        annotations: {
            readOnlyHint: true,
        },
        description: `Get a structured prompt template with placeholders and recommended settings for a specific image generation use case. Available types: sprite_character, game_environment, game_asset, character_concept, character_variations, character_portrait, mobile_mockup, icon_set, ui_component, web_section.`,
        inputSchema: {
            type: "object",
            properties: {
                templateType: {
                    type: "string",
                    enum: [
                        "sprite_character",
                        "game_environment",
                        "game_asset",
                        "character_concept",
                        "character_variations",
                        "character_portrait",
                        "mobile_mockup",
                        "icon_set",
                        "ui_component",
                        "web_section"
                    ],
                    description: "The type of prompt template to retrieve",
                },
            },
            required: ["templateType"],
        },
    },
];
//# sourceMappingURL=tool-schemas.js.map