"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "../../components/ui/Button";
import { Container } from "../../components/ui/Container";
import GlobalLoading from "@/app/loading";
import { useToast } from "@/app/context/ToastContext";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    title: "",
    bio: "",
    qualification: "",
    occupation: "",
    location: "",
    image: "",
  });
  const [initialData, setInitialData] = useState({
    name: "",
    title: "",
    bio: "",
    qualification: "",
    occupation: "",
    location: "",
    image: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user) {
      const init = {
        name: session.user.name || "",
        title: (session.user as any).title || "",
        bio: (session.user as any).bio || "",
        qualification: "",
        occupation: "",
        location: "",
        image: session.user.image || "",
      };

      fetch("/api/user/profile/me")
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((data) => {
          if (data) {
            const fetchedInit = {
              name: data.name || "",
              title: data.title || "",
              bio: data.bio || "",
              qualification: data.qualification || "",
              occupation: data.occupation || "",
              location: data.location || "",
              image: data.image || "",
            };
            setFormData(fetchedInit);
            setInitialData(fetchedInit);
          } else {
            setFormData(init);
            setInitialData(init);
          }
          setLoading(false);
        })
        .catch(() => {
          setFormData(init);
          setInitialData(init);
          setLoading(false);
        });
    }
  }, [session, status, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const isDirty =
    JSON.stringify(formData) !== JSON.stringify(initialData) ||
    selectedImage !== null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setSelectedImage(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;

    setLoading(true);
    try {
      let imageUrl = formData.image;

      if (selectedImage) {
        setUploading(true);
        const uploadData = new FormData();
        uploadData.append("file", selectedImage);
        uploadData.append("folder", "avatars");
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });
        const uploadJson = await uploadRes.json();

        if (uploadJson.url) {
          imageUrl = uploadJson.url;
          setUploading(false);
        } else {
          throw new Error("Image upload failed");
        }
      }

      const updatedData = { ...formData, image: imageUrl };

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        showToast("Profile updated successfully", "success");
        setFormData(updatedData);
        setInitialData(updatedData);
        setSelectedImage(null);
        setImagePreview(null);
        await update({ image: imageUrl, name: updatedData.name });
        router.refresh();
      } else {
        showToast("Failed to update profile", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Something went wrong", "error");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showToast("Please fill in current and new passwords", "error");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        showToast("Password updated successfully", "success");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        showToast(json.error || "Failed to update password", "error");
      }
    } catch (err) {
      showToast("Something went wrong", "error");
    } finally {
      setPassLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (
      !confirm(
        "Are you ABSOLUTELY sure? This action cannot be undone. All your data will be permanently lost.",
      )
    )
      return;

    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        showToast("Account deleted. Goodbye.", "success");
        signOut({ callbackUrl: "/" });
      } else {
        showToast("Failed to delete account", "error");
      }
    } catch (err) {
      showToast("Something went wrong", "error");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optimistic preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setUploading(true);

    const data = new FormData();
    data.append("file", file);
    data.append("folder", "avatars");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      if (json.url) {
        await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: json.url }),
        });

        // Update session
        await update({ image: json.url });
        setImagePreview(null); // Clear preview as session should now have it, or keep it to be safe
      }
    } catch (err) {
      showToast("Upload failed", "error");
      setImagePreview(null); // Revert on failure
    } finally {
      setUploading(false);
    }
  };

  if (status === "loading") {
    return <GlobalLoading />;
  }

  if (!session) return null;

  return (
    <Container className="py-20">
      <div className="mb-12 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Profile Settings
          </h1>
          <p className="text-zinc-400 max-w-2xl">
            Manage your personal information, security preferences, and account
            settings.
          </p>
        </div>
        <button
          onClick={() => {
            if (session?.user && (session.user as any).id) {
              router.push(`/profile/${(session.user as any).id}`);
            } else {
              router.back();
            }
          }}
          className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-white/5 rounded-xl p-8 text-center bg-[#0D0D0D]">
            <div className="relative inline-block mb-6">
              <div className="h-32 w-32 rounded-full bg-zinc-800 border-4 border-[#121212] flex items-center justify-center text-4xl font-bold text-white overflow-hidden text-clip relative group cursor-pointer shadow-xl mx-auto transition-transform hover:scale-105 duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {imagePreview || formData.image || session?.user?.image ? (
                  <img
                    src={
                      imagePreview ||
                      formData.image ||
                      session?.user?.image ||
                      ""
                    }
                    alt={session?.user?.name || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{session?.user?.name?.charAt(0)}</span>
                )}

                <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                  {uploading ? (
                    <span className="text-xs text-white">...</span>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8 text-white"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                      />
                    </svg>
                  )}
                </label>
              </div>
              <div
                className="absolute bottom-2 right-1/2 translate-x-10 h-6 w-6 rounded-full bg-green-500 border-4 border-[#121212]"
                title="Online"
              ></div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              {session.user?.name}
            </h2>

            {/* Dynamic Badge */}
            <div className="mb-4">
              {(session.user as any).role === "super_admin" ? (
                <span className="inline-block px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-500 text-xs font-bold uppercase tracking-wider">
                  Super Admin
                </span>
              ) : (session.user as any).role === "admin" ? (
                <span className="inline-block px-3 py-1 rounded-full bg-accent/20 border border-accent/50 text-accent text-xs font-bold uppercase tracking-wider">
                  Administrator
                </span>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/10 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                  Reader
                </span>
              )}
            </div>

            <p className="text-sm text-zinc-400 mb-6">{session.user?.email}</p>

            <div className="flex justify-center gap-2 mb-4">
              <span className="text-xs px-3 py-1 bg-white/5 rounded-full border border-white/10 text-zinc-400">
                {formData.location || "Location not set"}
              </span>
            </div>

            <div className="border-t border-white/10 pt-6 mt-6 space-y-3">
              <Button
                variant="outline"
                className="w-full cursor-pointer hover:bg-white/5"
                onClick={() =>
                  router.push(`/profile/${(session.user as any).id}`)
                }
              >
                View Public Profile
              </Button>

              {((session.user as any).role === "admin" ||
                (session.user as any).role === "super_admin") && (
                <Button
                  variant="primary"
                  className="w-full cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => router.push("/admin/dashboard")}
                >
                  Enter Admin Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Edit Forms */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-white/5 rounded-xl p-6 bg-[#0D0D0D]">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">
              Personal Details
            </h3>
            <form className="space-y-4" onSubmit={handleUpdateProfile}>
              {/* ... (inside form) ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">
                    Full Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">
                    Job Title / Role
                  </label>
                  <input
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Senior Editor"
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                  />
                </div>
              </div>

              {/* New Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">
                    Highest Qualification
                  </label>
                  <input
                    name="qualification"
                    type="text"
                    value={formData.qualification}
                    onChange={handleChange}
                    placeholder="e.g. PhD in Physics"
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">
                    Current Occupation
                  </label>
                  <input
                    name="occupation"
                    type="text"
                    value={formData.occupation}
                    onChange={handleChange}
                    placeholder="e.g. Freelance Writer"
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">
                  Location
                </label>
                <input
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. London, UK"
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">
                  Email Address
                </label>
                <input
                  type="email"
                  defaultValue={session.user?.email || ""}
                  readOnly
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-zinc-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Bio</label>
                <textarea
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50 text-sm"
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>
              <div className="pt-4 flex justify-end">
                <Button
                  variant="primary"
                  disabled={!isDirty || loading}
                  type="submit"
                  className={
                    !isDirty || loading
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-card border border-white/5 rounded-xl p-6 bg-[#0D0D0D]">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">
              Security
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">
                  Current Password
                </label>
                <input
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePassChange}
                  placeholder="••••••••"
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">
                    New Password
                  </label>
                  <input
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePassChange}
                    placeholder="New password"
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">
                    Confirm Password
                  </label>
                  <input
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePassChange}
                    placeholder="Confirm password"
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleDeactivateAccount}
                  className="text-xs text-red-500 hover:text-red-400 font-medium cursor-pointer hover:underline transition-all"
                >
                  Deactivate Account
                </button>
                <Button
                  variant="outline"
                  onClick={handlePasswordUpdate}
                  disabled={passLoading}
                  className="cursor-pointer"
                >
                  {passLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
