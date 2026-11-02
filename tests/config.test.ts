import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getActiveModel } from "../src/server/index";
import { DEFAULT_DEEPSEEK_MODEL } from "../src/server/config";

describe("Model Configuration", () => {
  const originalEnvModel = process.env.DEEPSEEK_MODEL;

  beforeEach(() => {
    delete process.env.DEEPSEEK_MODEL;
  });

  afterEach(() => {
    if (originalEnvModel !== undefined) {
      process.env.DEEPSEEK_MODEL = originalEnvModel;
    } else {
      delete process.env.DEEPSEEK_MODEL;
    }
  });

  it("defaults to DeepSeek-V4.1-Flash-1017 when no env var is provided", () => {
    expect(DEFAULT_DEEPSEEK_MODEL).toBe("deepseek-ai/DeepSeek-V4.1-Flash-1017");
    const model = getActiveModel({});
    expect(model).toBe("deepseek-ai/DeepSeek-V4.1-Flash-1017");
  });

  it("prefers DEEPSEEK_MODEL from Cloudflare Worker env bindings", () => {
    const model = getActiveModel({ DEEPSEEK_MODEL: "custom-provider/custom-model" });
    expect(model).toBe("custom-provider/custom-model");
  });

  it("resolves process.env.DEEPSEEK_MODEL when binding is omitted", () => {
    process.env.DEEPSEEK_MODEL = "env-provider/env-model";
    const model = getActiveModel({});
    expect(model).toBe("env-provider/env-model");
  });
});
