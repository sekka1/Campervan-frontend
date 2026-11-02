/**
 * Centralized LLM & Server Configuration
 * Allows easy switching of models via environment variables (DEEPSEEK_MODEL)
 * or by updating the DEFAULT_DEEPSEEK_MODEL constant here.
 */

export const DEFAULT_DEEPSEEK_MODEL = "deepseek-ai/DeepSeek-V4.1-Flash-1017";

export const DEEPINFRA_CHAT_URL = "https://api.deepinfra.com/v1/openai/chat/completions";

export const MCP_SERVER_URL = "https://campervan-mcp-server.garlandk.workers.dev";
