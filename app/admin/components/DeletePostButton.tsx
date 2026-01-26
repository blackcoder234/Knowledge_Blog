"use client";

import { useState } from "react";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";

export function DeletePostButton({
  id,
  disabled,
}: {
  id: string;
  disabled?: boolean;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setShowConfirm(false);

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Post deleted successfully", "success");
        router.refresh();
      } else {
        showToast("Failed to delete post", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Error deleting post", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          if (!disabled) setShowConfirm(true);
        }}
        disabled={isDeleting || disabled}
        className={`p-2 transition-colors ${disabled ? "text-zinc-700 cursor-not-allowed" : "hover:text-red-500 disabled:opacity-50"}`}
        title="Delete Post"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        variant="danger"
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </>
  );
}
