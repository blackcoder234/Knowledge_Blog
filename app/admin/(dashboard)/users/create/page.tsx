"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/context/ToastContext";
import Link from "next/link";

export default function CreateUserPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    title: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name || !formData.email || !formData.password) {
      showToast("Please fill in required fields", "error");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("User created successfully", "success");
        router.push("/admin/users");
        router.refresh();
      } else {
        showToast(data.error || "Failed to create user", "error");
      }
    } catch (error) {
      showToast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  // Permission UI Check
  const currentUserRole = (session?.user as any)?.role;
  const isSuperAdmin = currentUserRole === "super_admin";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Create User</h1>
          <p className="text-zinc-400">Add a new member to the platform.</p>
        </div>
        <Link href="/admin/users">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <div className="bg-card border border-white/5 rounded-xl p-8 bg-[#0D0D0D]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                required
              />
              <p className="text-xs text-zinc-500">
                Must be at least 6 characters.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Role</label>
              <div className="relative">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50 appearance-none cursor-pointer"
                >
                  <option value="user">User</option>
                  <option value="editor">Editor</option>
                  {isSuperAdmin && <option value="admin">Admin</option>}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 mt-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Detailed Profile (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Job Title
                </label>
                <input
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Senior Tech Writer"
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Bio</label>
              <textarea
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                placeholder="A short biography..."
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent/50 resize-y"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link href="/admin/users">
              <Button variant="ghost" type="button">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
