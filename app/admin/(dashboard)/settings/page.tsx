"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  Power,
  Save,
  Hammer,
  Zap,
  RefreshCw,
  Twitter,
  Github,
  Linkedin,
  Facebook,
  Instagram,
  Mail,
  Type,
  Clock,
  User,
} from "lucide-react";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import GlobalLoading from "@/app/loading";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState("");
  // State for Community Controls
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [autoCloseDays, setAutoCloseDays] = useState("0");
  const [registrationEnabled, setRegistrationEnabled] = useState(false);

  // State for Technical & SEO
  const [publicIndexing, setPublicIndexing] = useState(true);
  const [gaId, setGaId] = useState("");

  // Identity System
  const [siteTitle, setSiteTitle] = useState("");
  const [siteTagline, setSiteTagline] = useState("");

  // Social Links
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialGithub, setSocialGithub] = useState("");
  const [socialLinkedin, setSocialLinkedin] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");

  // Contact & Newsletter
  const [adminEmail, setAdminEmail] = useState("");
  const [newsletterSubject, setNewsletterSubject] = useState("");

  // Homepage Settings
  const [homeQuoteText, setHomeQuoteText] = useState("");
  const [homeQuoteAuthor, setHomeQuoteAuthor] = useState("");
  const [homeQuoteLink, setHomeQuoteLink] = useState("");

  // Global Notification
  const [notificationActive, setNotificationActive] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<
    "info" | "warning" | "success" | "error"
  >("info");

  const [settingsMetadata, setSettingsMetadata] = useState<any>({});

  const isSuperAdmin = (session?.user as any)?.role === "super_admin";

  useEffect(() => {
    if (status === "loading") return;

    const role = (session?.user as any)?.role;
    if (role !== "admin" && role !== "super_admin") {
      router.replace("/admin/dashboard");
      return;
    }

    fetchSettings();
  }, [session, status, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettingsMetadata(data);

        setMaintenanceMode(!!data.maintenance_mode?.value);
        setAnnouncementActive(!!data.announcement_active?.value);
        setAnnouncementMessage(data.announcement_message?.value || "");
        setCommentsEnabled(
          data.comments_enabled?.value !== undefined
            ? data.comments_enabled.value
            : true,
        );
        setAutoCloseDays(data.auto_close_days?.value || "0");
        setRegistrationEnabled(!!data.registration_enabled?.value);
        setPublicIndexing(
          data.public_indexing?.value !== undefined
            ? data.public_indexing.value
            : true,
        );
        setGaId(data.ga_measurement_id?.value || "");
        setSiteTitle(data.site_title?.value || "KnowledgeLog");
        setSiteTagline(data.site_tagline?.value || "");
        setSocialTwitter(data.social_twitter?.value || "");
        setSocialGithub(data.social_github?.value || "");
        setSocialLinkedin(data.social_linkedin?.value || "");
        setSocialFacebook(data.social_facebook?.value || "");
        setSocialInstagram(data.social_instagram?.value || "");
        setAdminEmail(data.admin_email?.value || "");
        setNewsletterSubject(data.newsletter_subject?.value || "");

        // Home Quote
        setHomeQuoteText(
          data.home_quote_text?.value ||
            "When information is everywhere, understanding becomes rare. KnowledgeLog slows the pace, inviting readers to think, question, and connect ideas across science, history, and culture — not to follow trends, but to build perspective.",
        );
        setHomeQuoteAuthor(
          data.home_quote_author?.value || "KnowledgeLog Editorial",
        );
        setHomeQuoteLink(data.home_quote_link?.value || "/blog");

        // Notifications
        setNotificationActive(!!data.general_notification_active?.value);
        setNotificationMessage(data.general_notification?.value || "");
        setNotificationType(data.general_notification_type?.value || "info");
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      if (res.ok) {
        const updatedSetting = await res.json();
        setSettingsMetadata((prev: any) => ({
          ...prev,
          [key]: {
            value: updatedSetting.value,
            updatedBy: updatedSetting.updatedBy,
            updatedAt: updatedSetting.updatedAt,
          },
        }));
        showToast("Settings updated successfully", "success");
        return true;
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      showToast("Failed to update settings", "error");
      return false;
    } finally {
      setUpdating(false);
      router.refresh();
    }
  };

  const toggleMaintenance = async () => {
    const newValue = !maintenanceMode;
    const success = await updateSetting("maintenance_mode", newValue);
    if (success) setMaintenanceMode(newValue);
  };

  const toggleAnnouncement = async () => {
    const newValue = !announcementActive;
    const success = await updateSetting("announcement_active", newValue);
    if (success) setAnnouncementActive(newValue);
  };

  const saveAnnouncementMessage = async () => {
    await updateSetting("announcement_message", announcementMessage);
  };

  const toggleComments = async () => {
    const newValue = !commentsEnabled;
    const success = await updateSetting("comments_enabled", newValue);
    if (success) setCommentsEnabled(newValue);
  };

  const saveAutoCloseDays = async () => {
    await updateSetting("auto_close_days", autoCloseDays);
  };

  const toggleRegistration = async () => {
    const newValue = !registrationEnabled;
    const success = await updateSetting("registration_enabled", newValue);
    if (success) setRegistrationEnabled(newValue);
  };

  const toggleIndexing = async () => {
    const newValue = !publicIndexing;
    const success = await updateSetting("public_indexing", newValue);
    if (success) setPublicIndexing(newValue);
  };

  const saveGaId = async () => {
    await updateSetting("ga_measurement_id", gaId);
  };

  const saveSiteTitle = async () => {
    await updateSetting("site_title", siteTitle);
  };

  const saveSiteTagline = async () => {
    await updateSetting("site_tagline", siteTagline);
  };

  const saveSocialLink = async (key: string, value: string) => {
    await updateSetting(key, value);
  };

  const saveContactSetting = async (key: string, value: string) => {
    await updateSetting(key, value);
  };

  const toggleNotification = async () => {
    const newValue = !notificationActive;
    await updateSetting("general_notification_active", newValue);
    // When activating, also update ID to force re-show for everyone
    if (newValue) {
      await updateSetting("general_notification_id", Date.now().toString());
    }
    setNotificationActive(newValue);
  };

  const saveNotificationMessage = async () => {
    await updateSetting("general_notification", notificationMessage);
  };

  const saveNotificationType = async (type: string) => {
    await updateSetting("general_notification_type", type);
    setNotificationType(type as any); // Optimistic update
  };

  const AuditTrail = ({ keys }: { keys: string[] }) => {
    const relevantSettings = keys
      .map((k) => settingsMetadata[k])
      .filter((s) => s && s.updatedAt)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

    if (relevantSettings.length === 0) return null;

    const latest = relevantSettings[0];
    const date = new Date(latest.updatedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center gap-4 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-zinc-600" />
          <span>Last updated {date}</span>
        </div>
        {latest.updatedBy && (
          <div className="flex items-center gap-1.5 ml-auto">
            <User size={12} className="text-zinc-600" />
            <span>By {latest.updatedBy}</span>
          </div>
        )}
      </div>
    );
  };

  const handlePurgeCache = () => {
    setShowPurgeConfirm(true);
  };

  const confirmPurgeCache = async () => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/system/revalidate", {
        method: "POST",
      });
      if (res.ok) {
        showToast("Global cache purged successfully", "success");
      } else {
        showToast("Failed to purge cache", "error");
      }
    } catch (error) {
      showToast("Something went wrong", "error");
    } finally {
      setUpdating(false);
      setShowPurgeConfirm(false);
      router.refresh();
    }
  };

  if (loading) {
    return <GlobalLoading />;
  }

  return (
    <div className="p-6 w-full space-y-8 animate-fade-in font-sans min-h-screen max-w-4xl mx-auto">
      <div className="flex flex-col gap-2 border-b border-zinc-800 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            System Settings
          </span>
        </h1>
        <p className="text-zinc-400 text-sm">
          Manage global application configuration.
        </p>
      </div>

      <div className="grid gap-6">
        {/* --- 0. Branding & Contact --- */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-yellow-500">🏷️</span>
              Branding & Identity
            </h3>
            <p className="text-zinc-400 text-sm">
              Global branding and administrative contact information.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Site Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                    placeholder="e.g. KnowledgeLog"
                    className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-bold"
                  />
                  <button
                    onClick={saveSiteTitle}
                    disabled={updating}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Site Tagline
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={siteTagline}
                    onChange={(e) => setSiteTagline(e.target.value)}
                    placeholder="e.g. Science, Tech & Future Insights"
                    className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                  />
                  <button
                    onClick={saveSiteTagline}
                    disabled={updating}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800/50">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Admin Contact Email
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@knowledgelog.blog"
                      className="w-full bg-black/50 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                    />
                  </div>
                  <button
                    onClick={() =>
                      saveContactSetting("admin_email", adminEmail)
                    }
                    disabled={updating}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Newsletter Subject Line
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Type
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      type="text"
                      value={newsletterSubject}
                      onChange={(e) => setNewsletterSubject(e.target.value)}
                      placeholder="KnowledgeLog Weekly: [Headline]"
                      className="w-full bg-black/50 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                    />
                  </div>
                  <button
                    onClick={() =>
                      saveContactSetting(
                        "newsletter_subject",
                        newsletterSubject,
                      )
                    }
                    disabled={updating}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <AuditTrail
            keys={[
              "site_title",
              "site_tagline",
              "admin_email",
              "newsletter_subject",
            ]}
          />
        </div>

        {/* --- 1. Social Presence --- */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-amber-500">🌐</span>
              Social Presence
            </h3>
            <p className="text-zinc-400 text-sm">
              Connect your brand to social media platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
            {/* Twitter */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                <Twitter size={12} /> Twitter / X
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={socialTwitter}
                  onChange={(e) => setSocialTwitter(e.target.value)}
                  placeholder="https://twitter.com/..."
                  className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                />
                <button
                  onClick={() =>
                    saveSocialLink("social_twitter", socialTwitter)
                  }
                  disabled={updating}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                >
                  <Save size={16} />
                </button>
              </div>
            </div>

            {/* GitHub */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                <Github size={12} /> GitHub
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={socialGithub}
                  onChange={(e) => setSocialGithub(e.target.value)}
                  placeholder="https://github.com/..."
                  className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                />
                <button
                  onClick={() => saveSocialLink("social_github", socialGithub)}
                  disabled={updating}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                >
                  <Save size={16} />
                </button>
              </div>
            </div>

            {/* LinkedIn */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                <Linkedin size={12} /> LinkedIn
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={socialLinkedin}
                  onChange={(e) => setSocialLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                />
                <button
                  onClick={() =>
                    saveSocialLink("social_linkedin", socialLinkedin)
                  }
                  disabled={updating}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                >
                  <Save size={16} />
                </button>
              </div>
            </div>

            {/* Instagram */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                <Instagram size={12} /> Instagram
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                />
                <button
                  onClick={() =>
                    saveSocialLink("social_instagram", socialInstagram)
                  }
                  disabled={updating}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                >
                  <Save size={16} />
                </button>
              </div>
            </div>
          </div>
          <AuditTrail
            keys={[
              "social_twitter",
              "social_github",
              "social_linkedin",
              "social_facebook",
              "social_instagram",
            ]}
          />
        </div>

        {/* --- 2. Real-time Notification Banner --- */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-blue-500">🔔</span>
                Live Notification Bar
              </h3>
              <p className="text-zinc-400 text-sm max-w-lg">
                Instantly push a banner URL/alert to all active users without
                them reloading.
              </p>
            </div>
            <button
              onClick={toggleNotification}
              disabled={updating}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${
                notificationActive ? "bg-blue-500" : "bg-zinc-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="space-y-4">
            {/* Type Selector */}
            <div className="flex gap-2">
              {(["info", "warning", "success", "error"] as const).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => saveNotificationType(type)}
                    className={`px-3 py-1 text-xs font-bold uppercase rounded-md border ${
                      notificationType === type
                        ? "bg-zinc-100 text-black border-white"
                        : "bg-zinc-900 text-zinc-500 border-zinc-700 hover:border-zinc-500"
                    }`}
                  >
                    {type}
                  </button>
                ),
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Notification Message
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="e.g. New Feature Released: Check out the dashboard!"
                  className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                />
                <button
                  onClick={saveNotificationMessage}
                  disabled={updating}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                  title="Save Message"
                >
                  <Save size={16} />
                </button>
              </div>
            </div>
          </div>
          <AuditTrail
            keys={[
              "general_notification_active",
              "general_notification",
              "general_notification_type",
            ]}
          />
        </div>

        {/* --- 2.5 Homepage Interactions (Featured Quote) --- */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-purple-500">✨</span>
              Homepage Interactions
            </h3>
            <p className="text-zinc-400 text-sm">
              Customize the "Featured Quote" section on the homepage.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Quote Text
                </label>
                <span
                  className={`text-xs ${
                    homeQuoteText.split(/\s+/).filter((w) => w.length > 0)
                      .length > 70
                      ? "text-red-500 font-bold"
                      : "text-zinc-500"
                  }`}
                >
                  {
                    homeQuoteText.split(/\s+/).filter((w) => w.length > 0)
                      .length
                  }{" "}
                  / 70 words
                </span>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={homeQuoteText}
                  onChange={(e) => setHomeQuoteText(e.target.value)}
                  placeholder="Type a meaningful quote..."
                  rows={4}
                  className={`flex-1 bg-black/50 border rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 transition-all resize-none ${
                    homeQuoteText.split(/\s+/).filter((w) => w.length > 0)
                      .length > 70
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-zinc-700 focus:border-purple-500/50 focus:ring-purple-500/50"
                  }`}
                />
                <button
                  onClick={() =>
                    updateSetting("home_quote_text", homeQuoteText)
                  }
                  disabled={
                    updating ||
                    homeQuoteText.split(/\s+/).filter((w) => w.length > 0)
                      .length > 70
                  }
                  className="h-10 p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-400 rounded-lg transition-colors"
                >
                  <Save size={16} />
                </button>
              </div>
              {homeQuoteText.split(/\s+/).filter((w) => w.length > 0).length >
                70 && (
                <p className="text-xs text-red-500 mt-1">
                  Text is too long. Please keep it under 70 words to maintain
                  homepage design integrity.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Quote Author
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={homeQuoteAuthor}
                    onChange={(e) => setHomeQuoteAuthor(e.target.value)}
                    placeholder="e.g. KnowledgeLog Editorial"
                    className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                  />
                  <button
                    onClick={() =>
                      updateSetting("home_quote_author", homeQuoteAuthor)
                    }
                    disabled={updating}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Link (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={homeQuoteLink}
                    onChange={(e) => setHomeQuoteLink(e.target.value)}
                    placeholder="/blog/my-post"
                    className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                  />
                  <button
                    onClick={() =>
                      updateSetting("home_quote_link", homeQuoteLink)
                    }
                    disabled={updating}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <AuditTrail
            keys={["home_quote_text", "home_quote_author", "home_quote_link"]}
          />
        </div>

        {/* --- 3. Communication Hub (Announcement) --- */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-yellow-500">📢</span>
                Global Announcement (Static)
              </h3>
              <p className="text-zinc-400 text-sm max-w-lg">
                Display a banner message at the top of every page. Useful for
                important updates or downtime notices.
              </p>
            </div>
            <button
              onClick={toggleAnnouncement}
              disabled={updating}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${
                announcementActive ? "bg-yellow-500" : "bg-zinc-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  announcementActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Banner Message
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="e.g. 🛠️ Scheduled maintenance on Friday at 10 PM EST."
                  className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                />
                <button
                  onClick={saveAnnouncementMessage}
                  disabled={updating}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                  title="Save Message"
                >
                  <Save size={16} />
                </button>
              </div>
            </div>
            {announcementActive && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3">
                <span className="text-xs font-mono text-yellow-500 font-bold px-2 py-0.5 bg-yellow-500/10 rounded border border-yellow-500/20">
                  PREVIEW
                </span>
                <span className="text-sm text-yellow-100/90 truncate">
                  {announcementMessage || "(No message set)"}
                </span>
              </div>
            )}
          </div>
          <AuditTrail keys={["announcement_active", "announcement_message"]} />
        </div>

        {/* --- 4. Community Controls --- */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-yellow-500">👥</span>
              Community Controls
            </h3>
            <p className="text-zinc-400 text-sm">
              Manage how users interact with your content.
            </p>
          </div>

          <div className="space-y-6">
            {/* Global Comments Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-zinc-200 uppercase tracking-wide">
                  Global Comments
                </label>
                <p className="text-xs text-zinc-500">
                  Enable or disable comments across the entire site.
                </p>
              </div>
              <button
                onClick={toggleComments}
                disabled={updating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${
                  commentsEnabled ? "bg-yellow-500" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    commentsEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Auto-Close Comments */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-zinc-200 uppercase tracking-wide">
                  Auto-Close Comments
                </label>
                <p className="text-xs text-zinc-500">
                  Close comments on posts older than X days. Set to 0 to keep
                  forever.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={autoCloseDays}
                  onChange={(e) => setAutoCloseDays(e.target.value)}
                  className="w-20 bg-black/50 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-mono"
                />
                <button
                  onClick={saveAutoCloseDays}
                  disabled={updating}
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                >
                  <Save size={14} />
                </button>
              </div>
            </div>

            {/* User Registration Toggle */}
            {isSuperAdmin && (
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-zinc-200 uppercase tracking-wide">
                    User Registration
                  </label>
                  <p className="text-xs text-zinc-500">
                    Allow new users to create accounts on the platform.
                  </p>
                </div>
                <button
                  onClick={toggleRegistration}
                  disabled={updating}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${
                    registrationEnabled ? "bg-amber-500" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      registrationEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
          <AuditTrail
            keys={[
              "comments_enabled",
              "auto_close_days",
              "registration_enabled",
            ]}
          />
        </div>

        {/* --- 5. Technical & SEO --- */}
        {isSuperAdmin && (
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-yellow-500">🚀</span>
                Search & Analytics
              </h3>
              <p className="text-zinc-400 text-sm">
                Control search engine visibility and tracking IDs.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-zinc-200 uppercase tracking-wide">
                    Search Engine Visibility
                  </label>
                  <p className="text-xs text-zinc-500">
                    Discourage search engines from indexing this site.
                  </p>
                </div>
                <button
                  onClick={toggleIndexing}
                  disabled={updating}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${
                    publicIndexing ? "bg-yellow-500" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      publicIndexing ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-1.5 pt-4 border-t border-zinc-800/50">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Google Analytics ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gaId}
                    onChange={(e) => setGaId(e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                    className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-mono"
                  />
                  <button
                    onClick={saveGaId}
                    disabled={updating}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>
            </div>
            <AuditTrail keys={["public_indexing", "ga_measurement_id"]} />
          </div>
        )}

        {/* --- 6. Infrastructure --- */}
        {isSuperAdmin && (
          <div className="p-6 rounded-2xl border border-red-900/30 bg-red-900/5">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-red-500">⚙️</span>
                Infrastructure
              </h3>
              <p className="text-zinc-400 text-sm">
                Critical system operations and cache management.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
                <div className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      Site-wide Revalidation
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Purge all cached pages.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handlePurgeCache}
                  disabled={updating}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw
                    size={14}
                    className={updating ? "animate-spin" : ""}
                  />
                  Purge Cache
                </button>
              </div>

              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
                <div className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                    <Power size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Maintenance Mode</h4>
                    <p className="text-xs text-zinc-500">
                      Take the site offline.
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleMaintenance}
                  disabled={updating}
                  className={`w-full py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    maintenanceMode
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  }`}
                >
                  <Hammer size={14} />
                  {maintenanceMode
                    ? "Disable Maintenance"
                    : "Enable Maintenance"}
                </button>
              </div>
            </div>
            <AuditTrail keys={["maintenance_mode", "last_cache_purge"]} />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showPurgeConfirm}
        onClose={() => setShowPurgeConfirm(false)}
        onConfirm={confirmPurgeCache}
        title="Purge Global Cache?"
        description="This will clear the entire server cache (ISR). The next visitor to any page will trigger a regeneration. This might temporarily increase server load."
        confirmText="Yes, Purge Everything"
        variant="warning"
      />
    </div>
  );
}
