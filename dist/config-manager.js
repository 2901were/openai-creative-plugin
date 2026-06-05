import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { z } from "zod";
import { ErrorCode, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { ConfigSchema } from "./types.js";
export class ConfigManager {
    config = null;
    openai = null;
    configSource = 'not_configured';
    ensureConfigured() {
        return this.config !== null && this.openai !== null;
    }
    async saveConfig() {
        if (this.config) {
            const configPath = path.join(process.cwd(), '.openai-creative-config.json');
            await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
        }
    }
    async loadConfig() {
        const envApiKey = process.env.OPENAI_API_KEY;
        if (envApiKey) {
            try {
                this.config = ConfigSchema.parse({ openaiApiKey: envApiKey });
                this.openai = new OpenAI({ apiKey: this.config.openaiApiKey });
                this.configSource = 'environment';
                return;
            }
            catch {
            }
        }
        try {
            const configPath = path.join(process.cwd(), '.openai-creative-config.json');
            const configData = await fs.readFile(configPath, 'utf-8');
            const parsedConfig = JSON.parse(configData);
            this.config = ConfigSchema.parse(parsedConfig);
            this.openai = new OpenAI({ apiKey: this.config.openaiApiKey });
            this.configSource = 'config_file';
        }
        catch {
            this.configSource = 'not_configured';
        }
    }
}
export async function handleConfigureOpenAIToken(request, configMgr) {
    const { apiKey } = request.params.arguments;
    try {
        ConfigSchema.parse({ openaiApiKey: apiKey });
        configMgr.config = { openaiApiKey: apiKey };
        configMgr.openai = new OpenAI({ apiKey });
        configMgr.configSource = 'config_file';
        await configMgr.saveConfig();
        return {
            content: [
                {
                    type: "text",
                    text: "✅ OpenAI API token configured successfully! You can now use the OpenAI Creative Plugin's image generation features.",
                },
            ],
        };
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            throw new McpError(ErrorCode.InvalidParams, `Invalid API key: ${error.errors[0]?.message}`);
        }
        throw error;
    }
}
export async function handleGetConfigurationStatus(configMgr) {
    const isConfigured = configMgr.config !== null && configMgr.openai !== null;
    let statusText;
    let sourceInfo = "";
    if (isConfigured) {
        statusText = "✅ OpenAI API token is configured and ready to use";
        switch (configMgr.configSource) {
            case 'environment':
                sourceInfo = "\n📍 Source: Environment variable (OPENAI_API_KEY)\n💡 This is the most secure configuration method.";
                break;
            case 'config_file':
                sourceInfo = "\n📍 Source: Local configuration file (.openai-creative-config.json)\n💡 Consider using environment variables for better security.";
                break;
        }
    }
    else {
        statusText = "❌ OpenAI API token is not configured";
        sourceInfo = `

📚 Configuration options (in priority order):
1. 🥇 MCP client environment variables (Recommended)
2. 🥈 System environment variable: OPENAI_API_KEY
3. 🥉 Use configure_openai_token tool

💡 For the most secure setup, add this to your MCP configuration:
"env": { "OPENAI_API_KEY": "your-api-key-here" }

⚠️ GPT Image models may additionally require Organization Verification (platform.openai.com → Settings → Organization).`;
    }
    return {
        content: [
            {
                type: "text",
                text: statusText + sourceInfo,
            },
        ],
    };
}
//# sourceMappingURL=config-manager.js.map