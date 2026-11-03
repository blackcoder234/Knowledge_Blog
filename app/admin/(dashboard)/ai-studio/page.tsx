"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import {
  TrendingUp,
  Rss,
  FileText,
  ShieldCheck,
  Settings as SettingsIcon,
  History,
  MessageSquare,
} from "lucide-react";
import StudioHeader from "./components/StudioHeader";
import OpportunitiesTab from "./components/OpportunitiesTab";
import ResearchTab from "./components/ResearchTab";
import DraftsTab from "./components/DraftsTab";
import QualityGateTab from "./components/QualityGateTab";
import CopilotChatTab from "./components/CopilotChatTab";
import SettingsTab from "./components/SettingsTab";
import AuditLogTab from "./components/AuditLogTab";

export const AVAILABLE_MODELS = [
  { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash", tag: "Google Flagship" },
  { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash", tag: "Deep Reasoning & High Precision" },
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", tag: "High Speed & Resilient Fallback" },
  { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite", tag: "Ultra Low Latency" },
  { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", tag: "Alternative Flash" },
];

export default function AIStudioPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isSuperAdmin = user?.role === "super_admin";

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "opportunities" | "research" | "drafts" | "reviews" | "chat" | "settings" | "audit"
  >("opportunities");

  const [overview, setOverview] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [aiDrafts, setAiDrafts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [selectedModel, setSelectedModel] = useState("gemini-3.8-flash");
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [selectedReviewPost, setSelectedReviewPost] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [regeneratingImageId, setRegeneratingImageId] = useState<string | null>(null);

  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [conversionSuccess, setConversionSuccess] = useState<any>(null);

  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [chatLoading, setChatLoading] = useState(false);

  const loadData = async () => {
    try {
      const [ovRes, oppRes, srcRes, setRes, logRes, draftRes] = await Promise.all([
        fetch("/api/admin/ai-studio/overview"),
        fetch("/api/admin/ai-studio/opportunities"),
        fetch("/api/admin/ai-studio/research/sources"),
        fetch("/api/admin/ai-studio/settings"),
        fetch("/api/admin/ai-studio/audit-logs"),
        fetch("/api/admin/ai-studio/drafts"),
      ]);

      if (ovRes.ok) {
        const d = await ovRes.json();
        setOverview(d);
        if (d.modelName) setSelectedModel(d.modelName);
      }
      if (oppRes.ok) {
        const d = await oppRes.json();
        setOpportunities(d.opportunities || []);
      }
      if (srcRes.ok) {
        const d = await srcRes.json();
        setSources(d.sources || []);
      }
      if (setRes.ok) {
        const d = await setRes.json();
        setSettings(d.settings || {});
        if (d.settings?.modelName) setSelectedModel(d.settings.modelName);
      }
      if (logRes.ok) {
        const d = await logRes.json();
        setAuditLogs(d.logs || []);
      }
      if (draftRes.ok) {
        const d = await draftRes.json();
        setAiDrafts(d.drafts || []);
      }
    } catch (e) {
      console.error("Failed to load AI Studio data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  // Synthesize Opportunities
  const handleSynthesizeOpportunities = async () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/ai-studio/opportunities", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          setOpportunities((prev) => [...data.opportunities, ...prev]);
        } else {
          alert(data.error || "Failed to synthesize opportunities");
        }
      } catch (e: any) {
        alert(e.message);
      }
    });
  };

  // Convert Opportunity into Draft
  const handleConvertOpportunity = async (oppId: string) => {
    setConvertingId(oppId);
    setConversionSuccess(null);
    try {
      const res = await fetch(`/api/admin/ai-studio/opportunities/${oppId}/convert`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setConversionSuccess(data);
        setOpportunities((prev) =>
          prev.map((o) => (o._id === oppId ? { ...o, status: "converted" } : o))
        );
        loadData();
      } else {
        alert(data.error || "Failed to generate draft");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setConvertingId(null);
    }
  };

  // Sync Research Feeds
  const handleSyncFeeds = async () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/ai-studio/research/fetch", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          alert(`Successfully synced feeds. Added ${data.totalNewItems} new research items.`);
          loadData();
        } else {
          alert(data.error || "Failed to sync feeds");
        }
      } catch (e: any) {
        alert(e.message);
      }
    });
  };

  // Seed Default Research Sources
  const handleSeedDefaultSources = async () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/ai-studio/research/sources/seed", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          alert(`Top research feeds configured successfully! (${data.count} feeds)`);
          loadData();
        } else {
          alert(data.error || "Failed to seed sources");
        }
      } catch (e: any) {
        alert(e.message);
      }
    });
  };

  // Add Custom Source
  const handleAddSource = async (src: { name: string; url: string; publisher: string }) => {
    const res = await fetch("/api/admin/ai-studio/research/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(src),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to add source");
    }
    loadData();
  };

  // Inspect Quality Review
  const handleInspectReview = async (postId: string) => {
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/admin/ai-studio/reviews/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedReview(data.review);
        setSelectedReviewPost(data.post || null);
        setActiveTab("reviews");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReviewLoading(false);
    }
  };

  // Re-audit Draft
  const handleReaudit = async (postId: string) => {
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/admin/ai-studio/reviews/${postId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSelectedReview(data.review);
        setSelectedReviewPost(data.post || selectedReviewPost);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReviewLoading(false);
    }
  };

  // Publish Post Live
  const handlePublishPost = async (postId: string) => {
    if (!confirm("Are you sure you want to publish this post live immediately?")) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      if (res.ok) {
        alert("Post successfully published live!");
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to publish post");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Regenerate Cover Image
  const handleRegenerateImage = async (postId: string, title?: string) => {
    setRegeneratingImageId(postId);
    try {
      const res = await fetch("/api/admin/ai-studio/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, title }),
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setAiDrafts((prev) =>
          prev.map((d) => (d._id === postId ? { ...d, image: data.imageUrl } : d))
        );
        if (selectedReviewPost && selectedReviewPost._id === postId) {
          setSelectedReviewPost((prev: any) => ({ ...prev, image: data.imageUrl }));
        }
      } else {
        alert(data.error || "Failed to generate image");
      }
    } catch (e: any) {
      alert("Error generating image: " + e.message);
    } finally {
      setRegeneratingImageId(null);
    }
  };

  // AI Copilot Send Message
  const handleSendMessage = async (userPrompt: string) => {
    const updatedMessages = [...chatMessages, { role: "user" as const, content: userPrompt }];
    setChatMessages(updatedMessages);
    setChatLoading(true);
    try {
      const res = await fetch("/api/admin/ai-studio/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          modelOverride: selectedModel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        alert(data.error || "Copilot generation error");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setChatLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (updatedSettings: any) => {
    try {
      const res = await fetch("/api/admin/ai-studio/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        alert("AI Studio settings updated successfully.");
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save settings");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="p-8 text-center text-zinc-500 text-xs flex items-center justify-center min-h-[400px]">
        Loading AI Editorial Studio...
      </div>
    );
  }

  const tabs = [
    { id: "opportunities", label: "Opportunities", icon: TrendingUp, count: opportunities.length },
    { id: "research", label: "Research Feeds", icon: Rss, count: sources.length },
    { id: "drafts", label: "Drafts", icon: FileText, count: aiDrafts.length },
    { id: "reviews", label: "Quality Gate", icon: ShieldCheck },
    { id: "chat", label: "AI Copilot", icon: MessageSquare },
    { id: "audit", label: "Activity Log", icon: History },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6 pb-12">
      <StudioHeader
        overview={overview}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-white/10 overflow-x-auto scrollbar-none pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer shrink-0 border-b-2 ${
                isActive
                  ? "border-accent text-accent bg-accent/5 font-bold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "opportunities" && (
          <OpportunitiesTab
            opportunities={opportunities}
            onSynthesize={handleSynthesizeOpportunities}
            onConvert={handleConvertOpportunity}
            isPending={isPending}
            convertingId={convertingId}
            conversionSuccess={conversionSuccess}
          />
        )}

        {activeTab === "research" && (
          <ResearchTab
            sources={sources}
            onSyncFeeds={handleSyncFeeds}
            onSeedSources={handleSeedDefaultSources}
            onAddSource={handleAddSource}
            isPending={isPending}
          />
        )}

        {activeTab === "drafts" && (
          <DraftsTab
            drafts={aiDrafts}
            onInspectReview={handleInspectReview}
            onRegenerateImage={handleRegenerateImage}
            regeneratingImageId={regeneratingImageId}
          />
        )}

        {activeTab === "reviews" && (
          <QualityGateTab
            selectedReview={selectedReview}
            selectedReviewPost={selectedReviewPost}
            onReaudit={handleReaudit}
            onPublish={handlePublishPost}
            onRegenerateImage={handleRegenerateImage}
            onNavigateToDrafts={() => setActiveTab("drafts")}
            reviewLoading={reviewLoading}
            regeneratingImageId={regeneratingImageId}
          />
        )}

        {activeTab === "chat" && (
          <CopilotChatTab
            chatMessages={chatMessages}
            onSendMessage={handleSendMessage}
            chatLoading={chatLoading}
            selectedModel={selectedModel}
          />
        )}

        {activeTab === "audit" && <AuditLogTab logs={auditLogs} />}

        {activeTab === "settings" && (
          <SettingsTab
            settings={settings}
            onSave={handleSaveSettings}
            isSuperAdmin={isSuperAdmin}
          />
        )}
      </div>
    </div>
  );
}
