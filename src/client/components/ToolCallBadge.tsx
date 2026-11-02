import React from "react";
import { Zap, BookOpen, Wrench, ShieldCheck } from "lucide-react";

interface ToolCallBadgeProps {
  toolName: string;
}

export const ToolCallBadge: React.FC<ToolCallBadgeProps> = ({ toolName }) => {
  if (!toolName) return null;

  const getToolDetails = (name: string) => {
    switch (name) {
      case "calculate_dc_wire_and_fuse":
        return {
          label: "⚡ Tool Executed: calculate_dc_wire_and_fuse",
          sublabel: "ABYC E-11 DC Sizing Engine",
          icon: Zap,
          badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          iconColor: "text-amber-400",
        };
      case "search_van_manuals":
        return {
          label: "📘 Verified with: OEM Van Manuals (BEMM)",
          sublabel: "Chassis & Upfitter Guide",
          icon: BookOpen,
          badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
          iconColor: "text-blue-400",
        };
      case "calculate_solar_mppt_string":
        return {
          label: "☀️ Tool Executed: calculate_solar_mppt_string",
          sublabel: "PV Voc & Cold-Weather Safety",
          icon: Zap,
          badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          iconColor: "text-emerald-400",
        };
      case "calculate_battery_runtime":
        return {
          label: "🔋 Tool Executed: calculate_battery_runtime",
          sublabel: "LiFePO4 Wh & Peukert Estimator",
          icon: ShieldCheck,
          badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
          iconColor: "text-purple-400",
        };
      default:
        return {
          label: `🛠️ Tool Executed: ${name}`,
          sublabel: "Campervan MCP Server",
          icon: Wrench,
          badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
          iconColor: "text-cyan-400",
        };
    }
  };

  const { label, sublabel, icon: Icon, badgeColor, iconColor } = getToolDetails(toolName);

  return (
    <div
      data-testid="tool-call-badge"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium shadow-sm transition-all mb-3 ${badgeColor}`}
    >
      <Icon className={`w-3.5 h-3.5 ${iconColor} shrink-0 animate-pulse`} />
      <span className="font-semibold">{label}</span>
      <span className="hidden sm:inline-block opacity-60 text-[10px] uppercase tracking-wider pl-1 border-l border-current">
        {sublabel}
      </span>
    </div>
  );
};

export default ToolCallBadge;
