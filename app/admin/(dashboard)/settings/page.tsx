"use client";

import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/Button";
import { useToast } from "../../../context/ToastContext"; // Adjust path if needed

interface SettingsData {
  siteName: string;
  tagline: string;
  maintenanceMode: boolean;
  postsPerPage: number;
  seoDescription: string;
  seoKeywords: string[];
  socialLinks: {
    twitter: string;
    facebook: string;
    instagram: string;
    linkedin: string;
    github: string;
  };
}

const DEFAULT_SETTINGS: SettingsData = {
  siteName: "",
  tagline: "",
  maintenanceMode: false,
  postsPerPage: 10,
  seoDescription: "",
  seoKeywords: [],
  socialLinks: {
    twitter: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    github: "",
  },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Use toast safely - if context is missing, we fallback to console/alert
  // Assuming useToast returns { showToast: (msg, type) => void }
  const { showToast } = useToast() || { showToast: console.log };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          ...DEFAULT_SETTINGS, // safety defaults
          ...data,
          socialLinks: { ...DEFAULT_SETTINGS.socialLinks, ...data.socialLinks },
        });
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SettingsData | string, value: any) => {
    // Handle nested updates for socialLinks
    if (field.startsWith("socialLinks.")) {
      const key = field.split(".")[1];
      setSettings((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [key]: value,
        },
      }));
    } else {
      setSettings((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        showToast("Settings updated successfully", "success");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-zinc-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl animate-fade-in font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-zinc-400">
          Configure global site settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="flex flex-col space-y-1 sticky top-8">
            {["General", "SEO & Meta", "Social Links"].map((tab) => {
              const id = tab
                .toLowerCase()
                .replace(/ & /g, "-")
                .replace(/ /g, "-");
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === id
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* General Settings */}
          <div
            className={`space-y-6 ${activeTab === "general" ? "block" : "hidden"}`}
          >
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white mb-6 border-b border-zinc-800 pb-4">
                General Information
              </h2>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Site Title
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => handleChange("siteName", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => handleChange("tagline", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white mb-6 border-b border-zinc-800 pb-4">
                Content & Display
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-950/30">
                  <div>
                    <div className="text-sm font-medium text-white">
                      Maintenance Mode
                    </div>
                    <div className="text-xs text-zinc-500">
                      Disable access for non-admin users
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleChange("maintenanceMode", !settings.maintenanceMode)
                    }
                    className={`h-6 w-11 rounded-full relative transition-colors ${settings.maintenanceMode ? "bg-cyan-500" : "bg-zinc-700"}`}
                  >
                    <div
                      className={`absolute top-1 h-4 w-4 bg-white rounded-full transition-transform ${settings.maintenanceMode ? "left-6" : "left-1"}`}
                    ></div>
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Posts Per Page
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={settings.postsPerPage}
                      onChange={(e) =>
                        handleChange("postsPerPage", parseInt(e.target.value))
                      }
                      className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                    <span className="text-xs text-zinc-500">
                      Default pagination limit for blog archives.
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-6 flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save General Settings"}
                </Button>
              </div>
            </div>
          </div>

          {/* SEO Settings */}
          <div
            className={`space-y-6 ${activeTab === "seo-meta" ? "block" : "hidden"}`}
          >
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white mb-6 border-b border-zinc-800 pb-4">
                Global SEO
              </h2>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Meta Description (Default)
                  </label>
                  <textarea
                    rows={3}
                    value={settings.seoDescription}
                    onChange={(e) =>
                      handleChange("seoDescription", e.target.value)
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-colors text-sm leading-relaxed"
                  ></textarea>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Keywords (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={settings.seoKeywords.join(", ")}
                    onChange={(e) =>
                      handleChange(
                        "seoKeywords",
                        e.target.value.split(",").map((s) => s.trim()),
                      )
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="pt-6 flex justify-end">
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save SEO Settings"}
              </Button>
            </div>
          </div>

          {/* Social Links Settings */}
          <div
            className={`space-y-6 ${activeTab === "social-links" ? "block" : "hidden"}`}
          >
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white mb-6 border-b border-zinc-800 pb-4">
                Social Media Connections
              </h2>
              <div className="space-y-4">
                {["Twitter", "Facebook", "Instagram", "LinkedIn", "GitHub"].map(
                  (platform) => (
                    <div key={platform} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium text-zinc-400">
                        {platform}
                      </div>
                      <input
                        type="text"
                        value={
                          settings.socialLinks[
                            platform.toLowerCase() as keyof typeof settings.socialLinks
                          ] || ""
                        }
                        onChange={(e) =>
                          handleChange(
                            `socialLinks.${platform.toLowerCase()}`,
                            e.target.value,
                          )
                        }
                        placeholder={`https://${platform.toLowerCase()}.com/...`}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                      />
                    </div>
                  ),
                )}
              </div>
              <div className="pt-6 flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Social Links"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
