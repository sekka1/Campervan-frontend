import { describe, it, expect } from "vitest";
import { getActiveModel } from "../src/server/index";
import { DEFAULT_DEEPSEEK_MODEL } from "../src/server/config";

describe("Model Configuration", () => {
  it("defaults to DeepSeek-V4.1-Flash-1017 when no env var is provided", () => {
    expect(DEFAULT_DEEPSEEK_MODEL).toBe("deepseek-ai/DeepSeek-V4.1-Flash-1017");
    const model = getActiveModel({});
    expect(model).toBe("deepseek-ai/DeepSeek-V4.1-Flash-1017");
  });

  it("prefers DEEPSEEK_MODEL from Cloudflare Worker env bindings", () => {
    const model = getActiveModel({ DEEPSEEK_MODEL: "custom-provider/custom-model" });
    expect(model).toBe("custom-provider/custom-model");
  });
});
