import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ChatMessage, { Message } from "../src/client/components/ChatMessage";

describe("ChatMessage", () => {
  it("renders a user message properly", () => {
    const message: Message = {
      id: "1",
      role: "user",
      content: "What fuse should I use for a 2000W inverter?",
    };

    render(<ChatMessage message={message} />);

    expect(screen.getByTestId("chat-message-user")).toBeDefined();
    expect(screen.getByText("What fuse should I use for a 2000W inverter?")).toBeDefined();
    expect(screen.getByText("You")).toBeDefined();
  });

  it("renders an assistant message with markdown and tables", () => {
    const markdownContent = `
### Wire Sizing Specs

| Parameter | Value |
| :--- | :--- |
| **AWG** | **1/0 AWG** |
| **Fuse** | **225A** |

* Install fuse within 7 inches of battery positive terminal.
`;

    const message: Message = {
      id: "2",
      role: "assistant",
      content: markdownContent,
    };

    render(<ChatMessage message={message} />);

    expect(screen.getByTestId("chat-message-assistant")).toBeDefined();
    expect(screen.getByText("Campervan Copilot")).toBeDefined();
    expect(screen.getByText("Wire Sizing Specs")).toBeDefined();
    expect(screen.getByText("1/0 AWG")).toBeDefined();
    expect(screen.getByText("225A")).toBeDefined();
  });

  it("renders ToolCallBadge when toolName is provided", () => {
    const message: Message = {
      id: "3",
      role: "assistant",
      content: "Calculation complete using ABYC standards.",
      toolName: "calculate_dc_wire_and_fuse",
    };

    render(<ChatMessage message={message} />);

    const badge = screen.getByTestId("tool-call-badge");
    expect(badge).toBeDefined();
    expect(badge.textContent).toContain("calculate_dc_wire_and_fuse");
    expect(badge.textContent).toContain("ABYC E-11 DC Sizing Engine");
  });

  it("renders OEM BEMM badge when search_van_manuals tool is used", () => {
    const message: Message = {
      id: "4",
      role: "assistant",
      content: "Found Transit CCP specifications.",
      toolName: "search_van_manuals",
    };

    render(<ChatMessage message={message} />);

    const badge = screen.getByTestId("tool-call-badge");
    expect(badge).toBeDefined();
    expect(badge.textContent).toContain("Verified with: OEM Van Manuals (BEMM)");
  });

  it("renders embedded manual schematic images with caption", () => {
    const schematicContent = `
Here are the official Transit ground point schematics:

![Figure E185976 - Ford Transit Grounding Locations](https://pub-655d7d799988450194dfe2dc6d5b1741.r2.dev/transit-ground.png)
`;

    const message: Message = {
      id: "5",
      role: "assistant",
      content: schematicContent,
    };

    render(<ChatMessage message={message} />);

    const img = screen.getByRole("img");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe("https://pub-655d7d799988450194dfe2dc6d5b1741.r2.dev/transit-ground.png");
    expect(img.getAttribute("alt")).toBe("Figure E185976 - Ford Transit Grounding Locations");
    expect(screen.getByText("Figure E185976 - Ford Transit Grounding Locations")).toBeDefined();
  });
});
