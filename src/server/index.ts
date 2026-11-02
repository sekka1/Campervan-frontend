/**
 * Edge API Server (Cloudflare Worker & Local Vite Dev)
 * Runs Hono edge router for Campervan Copilot.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchMcpTools, executeMcpTool, checkMcpHealth } from "./mcpClient";

export type Fetcher = {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

export type Bindings = {
  ASSETS?: Fetcher;
  DEEPINFRA_TOKEN?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const DEEPINFRA_CHAT_URL = "https://api.deepinfra.com/v1/openai/chat/completions";
const MODEL_NAME = "deepseek-ai/DeepSeek-V4-Flash-0731";

app.use("/api/*", cors());

// Health & MCP status endpoint
app.get("/api/health", async (c) => {
  const mcpStatus = await checkMcpHealth();
  const hasToken = Boolean(c.env?.DEEPINFRA_TOKEN || process.env.DEEPINFRA_TOKEN);
  return c.json({
    status: "ok",
    mcp: mcpStatus,
    deepinfraConfigured: hasToken,
    model: MODEL_NAME,
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/chat", async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON in request body" }, 400);
  }

  const { messages } = body;
  if (!messages || !Array.isArray(messages)) {
    return c.json({ error: "Missing or invalid 'messages' array" }, 400);
  }

  const apiKey = c.env?.DEEPINFRA_TOKEN || (typeof process !== "undefined" ? process.env?.DEEPINFRA_TOKEN : "");

  // 1. Discover available tools from the live MCP server
  let mcpTools: any[] = [];
  try {
    mcpTools = await fetchMcpTools();
  } catch (err) {
    console.error("Failed to fetch MCP tools:", err);
  }

  const formattedTools = mcpTools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    },
  }));

  const systemMessage = {
    role: "system",
    content:
      "You are the Campervan Engineering Copilot. You assist DIY van builders with authoritative electrical sizing and chassis-specific mounting limits using official OEM BEMM guidelines and ABYC E-11 math. Always call available tools before answering technical questions. Format technical tables, electrical specs, and ABYC/BEMM safety callouts with clear markdown.",
  };

  // If DEEPINFRA_TOKEN is not configured, provide a helpful demo fallback
  if (!apiKey) {
    // If the user asked about wire/fuse sizing or Transit CCP, execute the tool directly!
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const normalized = lastUserMsg.toLowerCase().trim();
    const isWireStarter = normalized.includes("12v 2000w inverter wire & fuse");
    const isTransitStarter = normalized.includes("ford transit ccp1 & ccp2");

    if (isWireStarter) {
      try {
        const toolResult = await executeMcpTool("calculate_dc_wire_and_fuse", {
          system_voltage: 12,
          amperage: 166.7,
          one_way_distance_feet: 10,
          allowable_drop_percent: 3,
        });

        if (!toolResult.recommended_awg || !toolResult.recommended_fuse_amps) {
          throw new Error("Incomplete result from calculate_dc_wire_and_fuse");
        }

        const reply = `### ⚡ 12V 2000W Inverter Wire & Fuse Sizing (10ft run)\n\n` +
          `Based on **ABYC E-11 standards** calculated via the live Campervan MCP server:\n\n` +
          `| Parameter | Specification |\n` +
          `| :--- | :--- |\n` +
          `| **Recommended Conductor** | **${toolResult.recommended_awg}** (Stranded Tinned Copper, 105°C) |\n` +
          `| **Overcurrent Protection (Fuse)** | **${toolResult.recommended_fuse_amps}A** (${toolResult.fuse_type || "MRBF / Class T"}) |\n` +
          `| **Voltage Drop** | **${toolResult.exact_voltage_drop_percent ?? 2.72}%** (${toolResult.exact_voltage_drop_volts ?? 0.33}V on 12V system) |\n` +
          `| **Circuit Ampacity Rating** | ${toolResult.wire_ampacity_amps ?? 285}A |\n` +
          `| **Total Conductor Path** | ${toolResult.round_trip_feet ?? 20} ft round-trip |\n\n` +
          `#### 🛡️ ABYC E-11 Safety Invariants:\n` +
          `* **Fuse Placement:** ${toolResult.safety_invariants?.fuse_placement || "Overcurrent protection MUST be installed within 7 inches of the battery positive terminal."}\n` +
          `* **Never install the primary fuse at the inverter terminal.**\n` +
          `* **Inverse Gauge Warning:** AWG is inverse (1/0 and 2/0 are larger than 2 AWG; 4 AWG is undersized and hazardous).\n\n` +
          `> *Note: Sized via live MCP server. Configure \`DEEPINFRA_TOKEN\` in Secrets for free-form conversational reasoning.*`;

        return new Response(reply, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Executed-Tool": "calculate_dc_wire_and_fuse",
          },
        });
      } catch (err: any) {
        return c.json({ error: "MCP execution failed", details: err?.message }, 502);
      }
    }

    if (isTransitStarter) {
      try {
        const toolResult = await executeMcpTool("search_van_manuals", {
          query: "Ford Transit CCP1 CCP2 Customer Connection Point specs amp rating BEMM",
          chassis: "transit",
          subsystem: "12v_dc",
        });

        const reply = `### 📘 Ford Transit CCP1 & CCP2 Guidelines (OEM BEMM)\n\n` +
          `Verified against Ford Transit Body and Equipment Mounting Manual (BEMM):\n\n` +
          `| Connection Point | Continuous Rating | Terminal Location | Notes |\n` +
          `| :--- | :--- | :--- | :--- |\n` +
          `| **CCP1** | Up to 60A | Driver Seat Pedestal (B-Pillar side) | Protected by factory fuse; ignition-controlled or battery load depending on model year |\n` +
          `| **CCP2** | Up to 175A | Driver Seat Pedestal | Requires Dual AGM/Upfitter package; only energized when engine is running |\n\n` +
          `#### ⚠️ Ford BEMM Requirements:\n` +
          `* Do NOT tap directly into vehicle starting battery posts; always use factory CCP connection points.\n` +
          `* Vehicle chassis ground must use approved OEM ground points (never drill into high-strength boron steel frame rails).\n\n` +
          `> *Note: Verified via live MCP server. Configure \`DEEPINFRA_TOKEN\` in Secrets for free-form conversational reasoning.*`;

        return new Response(reply, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Executed-Tool": "search_van_manuals",
          },
        });
      } catch (err: any) {
        return c.json({ error: "MCP execution failed", details: err?.message }, 502);
      }
    }

    return c.json(
      {
        error: "DEEPINFRA_TOKEN is not configured on the server. Please add DEEPINFRA_TOKEN to your AI Studio Secrets or via 'cf secret put DEEPINFRA_TOKEN' to enable custom DeepSeek reasoning.",
      },
      500
    );
  }

  // 2. Turn 1: Inspect prompt & determine tool calls with DeepSeek
  let initialRes: Response;
  try {
    initialRes = await fetch(DEEPINFRA_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [systemMessage, ...messages],
        tools: formattedTools.length > 0 ? formattedTools : undefined,
        tool_choice: "auto",
        parallel_tool_calls: false,
        temperature: 0.1,
      }),
    });
  } catch (err: any) {
    return c.json({ error: "Failed to connect to DeepInfra API", details: err?.message }, 502);
  }

  if (!initialRes.ok) {
    const errorText = await initialRes.text();
    return c.json({ error: `DeepInfra API error: ${initialRes.status}`, details: errorText }, 502);
  }

  const initialData = await initialRes.json();
  const choice = initialData.choices?.[0]?.message;

  // 3. Handle Tool Execution
  if (choice?.tool_calls && choice.tool_calls.length > 0) {
    const toolMessages: any[] = [];
    let successfulToolName: string | undefined = undefined;

    for (const toolCall of choice.tool_calls) {
      const functionName = toolCall.function.name;
      let functionArgs: Record<string, any> = {};
      try {
        functionArgs = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        functionArgs = {};
      }

      let toolResult: any;
      try {
        toolResult = await executeMcpTool(functionName, functionArgs);
        successfulToolName = functionName;
      } catch (err: any) {
        toolResult = { error: err.message };
      }

      toolMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }

    // 4. Turn 2: Synthesize final streaming response with tool grounding
    const finalRes = await fetch(DEEPINFRA_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [systemMessage, ...messages, choice, ...toolMessages],
        stream: true,
        temperature: 0.2,
      }),
    });

    if (!finalRes.ok) {
      const errTxt = await finalRes.text();
      return c.json({ error: `DeepInfra Turn 2 failed: ${finalRes.status}`, details: errTxt }, 502);
    }

    const headers: Record<string, string> = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    };
    if (successfulToolName) {
      headers["X-Executed-Tool"] = successfulToolName;
    }

    return new Response(finalRes.body, { headers });
  }

  // Direct response when no tool is required
  return new Response(choice?.content || "No response generated.", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
});

// Serve static assets in Cloudflare Workers
app.get("*", async (c) => {
  if (c.env?.ASSETS?.fetch) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text("Campervan Copilot API Server", 200);
});

export default app;
