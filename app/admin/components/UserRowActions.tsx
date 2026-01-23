"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useToast } from "@/app/context/ToastContext";

interface UserRowActionsProps {
  userId: string;
  currentRole: string;
  userName: string;
}

export function UserRowActions({
  userId,
  currentRole,
  userName,
}: UserRowActionsProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const currentUser = session?.user as any;
  const isSuperAdmin = currentUser?.role === "super_admin";
  const isAdmin = currentUser?.role === "admin";
  const isSelf = currentUser?.id === userId;

  // Derive permissions
  const targetIsSuper = currentRole === "super_admin";
  const targetIsAdmin = currentRole === "admin";

  // Can Edit: Super Admin can edit anyone. Admin can edit User/Editor.
  const canEdit = isSuperAdmin || (isAdmin && !targetIsAdmin && !targetIsSuper);

  // Can Delete: Same as Edit, but usually self-deletion is restricted or requires special handling.
  const canDelete =
    isSuperAdmin || (isAdmin && !targetIsAdmin && !targetIsSuper);

  const handleRoleChange = async (newRole: string) => {
    if (
      !confirm(
        `Are you sure you want to change ${userName}'s role to ${newRole}?`,
      )
    )
      return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        showToast("Role updated successfully", "success");
        router.refresh(); // Refresh server data
      } else {
        showToast("Failed to update role", "error");
      }
    } catch (error) {
      showToast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      )
    )
      return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("User deleted successfully", "success");
        router.refresh();
      } else {
        showToast("Failed to delete user", "error");
      }
    } catch (error) {
      showToast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit && !canDelete) {
    return <span className="text-xs text-zinc-600 italic px-2">Protected</span>;
  }

  return (
    <div className="flex justify-end gap-3 items-center">
      {isSuperAdmin && (
        <a
          href={`/profile/${userId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 hover:bg-yellow-500/10 rounded-lg text-zinc-500 hover:text-yellow-400 transition-colors"
          title="View Public Profile"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
        </a>
      )}
      {canEdit && !isSelf && (
        <div className="relative group">
          <select
            value={currentRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={loading}
            className="appearance-none bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg pl-3 pr-8 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all cursor-pointer disabled:opacity-50"
          >
            <option value="user" className="bg-[#09090b]">
              User
            </option>
            <option value="editor" className="bg-[#09090b]">
              Editor
            </option>
            {isSuperAdmin && (
              <option value="admin" className="bg-[#09090b]">
                Admin
              </option>
            )}
            {isSuperAdmin && (
              <option value="super_admin" className="bg-[#09090b]">
                Super Admin
              </option>
            )}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}

      {canDelete && !isSelf && (
        <button
          onClick={handleDelete}
          disabled={loading}
          className="p-1.5 hover:bg-rose-500/10 rounded-lg text-zinc-500 hover:text-rose-500 transition-colors disabled:opacity-50"
          title="Delete User"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
