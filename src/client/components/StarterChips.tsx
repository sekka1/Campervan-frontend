import React from "react";
import { Zap, BookOpen, Compass, ShieldAlert } from "lucide-react";

interface StarterChipsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export const STARTER_PROMPTS = [
  {
    title: "12V 2000W Inverter Wire & Fuse (10ft run)",
    description: "ABYC E-11 conductor AWG, fuse size & 3% voltage drop",
    icon: Zap,
    tag: "ABYC E-11",
    tagColor: "bg-amber-500/20 text-amber-300",
  },
  {
    title: "Ford Transit CCP1 & CCP2 Specs",
    description: "60A/175A customer connection point ratings & BEMM constraints",
    icon: BookOpen,
    tag: "Transit BEMM",
    tagColor: "bg-blue-500/20 text-blue-300",
  },
  {
    title: "Sprinter 907 Roof Vent Cutout Limits",
    description: "MaxxFan placement, structural roof bow limits & torque",
    icon: Compass,
    tag: "Sprinter BEMM",
    tagColor: "bg-emerald-500/20 text-emerald-300",
  },
  {
    title: "Auxiliary Grounding & BMS Rules",
    description: "Single-point chassis ground, shunt wiring & battery safety",
    icon: ShieldAlert,
    tag: "Safety Standard",
    tagColor: "bg-purple-500/20 text-purple-300",
  },
];

export const StarterChips: React.FC<StarterChipsProps> = ({ onSelectPrompt, disabled }) => {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Grounding, Sizing & OEM BEMM Engineering</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
          What can I help you size or verify?
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-lg mx-auto">
          Connected to official OEM body-builder manuals and ABYC E-11 electrical sizing rules.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STARTER_PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPrompt(item.title)}
              className="group flex flex-col text-left p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-slate-700/60 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${item.tagColor}`}>
                    {item.tag}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-200 group-hover:text-sky-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StarterChips;
