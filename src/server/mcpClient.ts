/**
 * Campervan MCP Server Client
 * Connects to live Cloudflare Worker MCP server:
 * https://campervan-mcp-server.garlandk.workers.dev
 */

const MCP_ENDPOINT = "https://campervan-mcp-server.garlandk.workers.dev";

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export async function fetchMcpTools(): Promise<McpTool[]> {
  try {
    const response = await fetch(`${MCP_ENDPOINT}/tools/list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "User-Agent": "CampervanCopilot/1.0",
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.result?.tools && Array.isArray(data.result.tools)) {
        return data.result.tools;
      }
    }

    // Fallback: If JSON-RPC route differs, request GET /tools
    const fallback = await fetch(`${MCP_ENDPOINT}/tools`, {
      headers: {
        "Accept": "application/json, text/event-stream",
        "User-Agent": "CampervanCopilot/1.0",
      },
    });
    if (fallback.ok) {
      const fallbackData = await fallback.json();
      if (fallbackData.tools && Array.isArray(fallbackData.tools)) {
        return fallbackData.tools;
      }
    }
  } catch (err) {
    console.warn("fetchMcpTools encountered error, using fallback schemas:", err);
  }

  // Fallback default tool schemas if network is unavailable
  return [
    {
      name: "calculate_dc_wire_and_fuse",
      description: "Calculates recommended DC wire gauge (AWG), fuse ampacity, and voltage drop for campervan electrical installations using ABYC E-11 standards.",
      inputSchema: {
        type: "object",
        properties: {
          system_voltage: { type: "number", enum: [12, 24, 48], description: "Nominal DC system voltage in volts" },
          amperage: { type: "number", description: "Circuit design current or continuous load in amps" },
          one_way_distance_feet: { type: "number", description: "One-way cable run distance in feet from source to load" },
          allowable_drop_percent: { type: "number", enum: [3, 10], default: 3, description: "Maximum allowable voltage drop percentage (default 3%)" },
          is_engine_compartment: { type: "boolean", default: false, description: "Whether cable run passes through engine compartment" },
        },
        required: ["system_voltage", "amperage", "one_way_distance_feet"],
      },
    },
    {
      name: "search_van_manuals",
      description: "Searches indexed technical documentation, OEM body builder manuals (BEMM for Ford Transit, Sprinter, ProMaster), and component guides.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Natural language search query" },
          chassis: { type: "string", description: "Optional chassis filter (transit, sprinter, promaster)" },
          subsystem: { type: "string", enum: ["12v_dc", "48v_dc", "120v_ac", "plumbing", "heating_cooling", "structural", "chassis_interface"] },
        },
        required: ["query"],
      },
    },
  ];
}

export async function executeMcpTool(name: string, args: Record<string, any>): Promise<any> {
  const response = await fetch(`${MCP_ENDPOINT}/tools/call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "User-Agent": "CampervanCopilot/1.0",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name, arguments: args },
      id: Date.now(),
    }),
  });

  if (!response.ok) {
    throw new Error(`MCP Tool call failed with HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || `MCP Error ${data.error.code}`);
  }

  const contentText = data.result?.content?.[0]?.text;
  if (contentText) {
    try {
      return JSON.parse(contentText);
    } catch {
      return { text: contentText };
    }
  }

  return data.result || {};
}

export async function checkMcpHealth(): Promise<{ status: "connected" | "degraded" | "disconnected"; toolCount: number; message: string }> {
  try {
    const tools = await fetchMcpTools();
    if (tools.length > 0) {
      return { status: "connected", toolCount: tools.length, message: "MCP Server Connected" };
    }
    return { status: "degraded", toolCount: 0, message: "MCP Server Degraded" };
  } catch (err: any) {
    return { status: "disconnected", toolCount: 0, message: err?.message || "MCP Connection Failed" };
  }
}
