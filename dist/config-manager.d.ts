import OpenAI from "openai";
import { CallToolRequest, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { Config } from "./types.js";
export declare class ConfigManager {
    config: Config | null;
    openai: OpenAI | null;
    configSource: 'environment' | 'config_file' | 'not_configured';
    ensureConfigured(): boolean;
    saveConfig(): Promise<void>;
    loadConfig(): Promise<void>;
}
export declare function handleConfigureOpenAIToken(request: CallToolRequest, configMgr: ConfigManager): Promise<CallToolResult>;
export declare function handleGetConfigurationStatus(configMgr: ConfigManager): Promise<CallToolResult>;
//# sourceMappingURL=config-manager.d.ts.map