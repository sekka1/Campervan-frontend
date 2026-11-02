import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchMcpTools, executeMcpTool, checkMcpHealth } from "../src/server/mcpClient";

describe("mcpClient", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("fetchMcpTools", () => {
    it("fetches tools successfully via JSON-RPC tools/list", async () => {
      const mockTools = [
        {
          name: "calculate_dc_wire_and_fuse",
          description: "Calculates wire gauge and fuse size",
          inputSchema: { type: "object", properties: {} },
        },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: { tools: mockTools },
        }),
      } as any);

      const tools = await fetchMcpTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe("calculate_dc_wire_and_fuse");
    });

    it("falls back to default tool definitions if network request fails", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network connection failed"));

      const tools = await fetchMcpTools();
      expect(tools.length).toBeGreaterThanOrEqual(2);
      expect(tools.some((t) => t.name === "calculate_dc_wire_and_fuse")).toBe(true);
      expect(tools.some((t) => t.name === "search_van_manuals")).toBe(true);
    });
  });

  describe("executeMcpTool", () => {
    it("executes MCP tool and parses stringified JSON content", async () => {
      const mockResult = {
        recommended_awg: "1/0",
        recommended_fuse_amps: 225,
        exact_voltage_drop_percent: 2.72,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: "2.0",
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(mockResult),
              },
            ],
          },
        }),
      } as any);

      const result = await executeMcpTool("calculate_dc_wire_and_fuse", {
        system_voltage: 12,
        amperage: 166.7,
        one_way_distance_feet: 10,
      });

      expect(result.recommended_awg).toBe("1/0");
      expect(result.recommended_fuse_amps).toBe(225);
    });

    it("throws an error when HTTP status is not ok", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as any);

      await expect(
        executeMcpTool("calculate_dc_wire_and_fuse", { system_voltage: 12 })
      ).rejects.toThrow("MCP Tool call failed with HTTP 500");
    });
    it("throws an error when result.isError is true", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: "2.0",
          result: {
            isError: true,
            content: [{ type: "text", text: "Wire distance exceeds maximum calculation limits" }],
          },
        }),
      } as any);

      await expect(
        executeMcpTool("calculate_dc_wire_and_fuse", { system_voltage: 12, amperage: 500 })
      ).rejects.toThrow("Wire distance exceeds maximum calculation limits");
    });
  });

  describe("checkMcpHealth", () => {
    it("reports connected status when tools are returned", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: { tools: [{ name: "t1" }, { name: "t2" }, { name: "t3" }] },
        }),
      } as any);

      const health = await checkMcpHealth();
      expect(health.status).toBe("connected");
      expect(health.toolCount).toBe(3);
    });

    it("reports disconnected status when fetch rejects", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network unreachable"));

      const health = await checkMcpHealth();
      expect(health.status).toBe("disconnected");
      expect(health.toolCount).toBe(0);
    });
  });
});
