"use client";

import { Sparkles, ShieldAlert, Cpu } from "lucide-react";
import { AVAILABLE_MODELS } from "../page";

interface StudioHeaderProps {
  overview: any;
  selectedModel: string;
  onModelChange: (model: string) => void;
  isSuperAdmin: boolean;
}

export default function StudioHeader({
  overview,
  selectedModel,
  onModelChange,
}: StudioHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Kill Switch Banner */}
      {overview?.killSwitch && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="flex-1">
            <strong className="font-bold">Emergency Kill-Switch is ACTIVE.</strong> All autonomous
            synthesis, research sync, and external AI completions are paused.
          </div>
        </div>
      )}

      {/* Main Studio Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              AI Editorial Studio
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-white/5">
              Draft-First
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Autonomous audience-interest discovery, compliant research synthesis, draft generation,
            and multi-gate editorial quality audits.
          </p>
        </div>

        {/* Model Switcher */}
        <div className="flex items-center gap-2 bg-[#0A0A0A] p-1.5 rounded-xl border border-white/10">
          <Cpu className="w-4 h-4 text-zinc-400 ml-2" />
          <div className="text-[11px] text-zinc-400 hidden sm:block">Model:</div>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="bg-zinc-900 border border-white/10 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent cursor-pointer"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.tag})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

