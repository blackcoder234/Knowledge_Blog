"use client";

import { useState } from "react";
import { Sliders, Power, ShieldAlert } from "lucide-react";
import { AVAILABLE_MODELS } from "../page";

interface SettingsTabProps {
  settings: any;
  onSave: (updated: any) => Promise<void>;
  isSuperAdmin: boolean;
}

export default function SettingsTab({
  settings,
  onSave,
  isSuperAdmin,
}: SettingsTabProps) {
  const [formData, setFormData] = useState({
    provider: settings?.provider || "gemini",
    modelName: settings?.modelName || "gemini-3.8-flash",
    editorialVoiceInstructions:
      settings?.editorialVoiceInstructions ||
      "KnowledgeLog voice: Clear, thoughtful, intellectually honest, depth over hype, no clickbait, no unsupported certainty.",
    minOverallScore: settings?.qualityThresholds?.minOverallScore ?? 80,
    minSourceFreshnessDays: settings?.qualityThresholds?.minSourceFreshnessDays ?? 30,
    minReadabilityScore: settings?.qualityThresholds?.minReadabilityScore ?? 55,
    maxDuplicateRiskScore: settings?.qualityThresholds?.maxDuplicateRiskScore ?? 30,
    maxDailyDraftGenerations: settings?.dailyLimits?.maxDailyDraftGenerations ?? 10,
    maxDailyResearchFetches: settings?.dailyLimits?.maxDailyResearchFetches ?? 50,
    autoSchedulingEnabled: settings?.autoSchedulingPolicy?.enabled ?? false,
    killSwitch: settings?.killSwitch ?? false,
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        provider: formData.provider,
        modelName: formData.modelName,
        editorialVoiceInstructions: formData.editorialVoiceInstructions,
        qualityThresholds: {
          minOverallScore: Number(formData.minOverallScore),
          minSourceFreshnessDays: Number(formData.minSourceFreshnessDays),
          minReadabilityScore: Number(formData.minReadabilityScore),
          maxDuplicateRiskScore: Number(formData.maxDuplicateRiskScore),
        },
        dailyLimits: {
          maxDailyDraftGenerations: Number(formData.maxDailyDraftGenerations),
          maxDailyResearchFetches: Number(formData.maxDailyResearchFetches),
        },
        autoSchedulingPolicy: {
          ...settings?.autoSchedulingPolicy,
          enabled: formData.autoSchedulingEnabled,
        },
        killSwitch: formData.killSwitch,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-accent" />
          <span>AI Studio Settings &amp; Governance</span>
        </h2>
        <p className="text-xs text-zinc-400">
          Configure model parameters, editorial quality thresholds, and safety controls.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Model & Provider */}
        <div className="p-5 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-4">
          <h3 className="font-bold text-white text-sm">Provider &amp; Model Selection</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">AI Provider</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent"
              >
                <option value="gemini">Google Gemini (Recommended)</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Default Model</label>
              <select
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Editorial Voice Instructions */}
        <div className="p-5 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-3">
          <h3 className="font-bold text-white text-sm">Editorial Voice Prompt</h3>
          <p className="text-[11px] text-zinc-400">
            System prompt appended to all synthesis, brief, and draft generation tasks.
          </p>
          <textarea
            rows={3}
            value={formData.editorialVoiceInstructions}
            onChange={(e) =>
              setFormData({ ...formData, editorialVoiceInstructions: e.target.value })
            }
            className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-accent"
          />
        </div>

        {/* Quality Thresholds */}
        <div className="p-5 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-4">
          <h3 className="font-bold text-white text-sm">Quality Gate Thresholds</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">Min Overall Score (0-100)</label>
              <input
                type="number"
                min={40}
                max={100}
                value={formData.minOverallScore}
                onChange={(e) =>
                  setFormData({ ...formData, minOverallScore: Number(e.target.value) })
                }
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Max Source Age (days)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={formData.minSourceFreshnessDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minSourceFreshnessDays: Number(e.target.value),
                  })
                }
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Min Readability (Flesch)</label>
              <input
                type="number"
                min={20}
                max={90}
                value={formData.minReadabilityScore}
                onChange={(e) =>
                  setFormData({ ...formData, minReadabilityScore: Number(e.target.value) })
                }
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Max Duplicate Risk (%)</label>
              <input
                type="number"
                min={5}
                max={60}
                value={formData.maxDuplicateRiskScore}
                onChange={(e) =>
                  setFormData({ ...formData, maxDuplicateRiskScore: Number(e.target.value) })
                }
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Daily Limits */}
        <div className="p-5 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-4">
          <h3 className="font-bold text-white text-sm">Daily Quotas &amp; Limits</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">Max Daily Draft Generations</label>
              <input
                type="number"
                min={1}
                max={50}
                value={formData.maxDailyDraftGenerations}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxDailyDraftGenerations: Number(e.target.value),
                  })
                }
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Max Daily Research Fetches</label>
              <input
                type="number"
                min={5}
                max={200}
                value={formData.maxDailyResearchFetches}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxDailyResearchFetches: Number(e.target.value),
                  })
                }
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Super Admin Safety & Kill Switch */}
        <div className="p-5 rounded-xl bg-zinc-950 border border-rose-500/30 space-y-4">
          <div className="flex items-center gap-2 text-rose-400">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-sm">Emergency Controls (Super Admin Only)</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/60 border border-white/5 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={formData.killSwitch}
                onChange={(e) => setFormData({ ...formData, killSwitch: e.target.checked })}
                className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500"
              />
              <div>
                <div className="font-semibold text-rose-300">Emergency Kill Switch</div>
                <div className="text-[11px] text-zinc-400">
                  Instantly stops all AI completions, opportunity generation, feed synchronization, and image jobs.
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/60 border border-white/5 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={formData.autoSchedulingEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, autoSchedulingEnabled: e.target.checked })
                }
                className="w-4 h-4 rounded text-accent focus:ring-accent"
              />
              <div>
                <div className="font-semibold text-white">Enable Auto-Scheduling (Experimental)</div>
                <div className="text-[11px] text-zinc-400">
                  Disabled by default. High-risk topics (medical, finance, security) are strictly excluded from auto-scheduling.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !isSuperAdmin}
            className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-black font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving Settings..." : "Save AI Studio Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
