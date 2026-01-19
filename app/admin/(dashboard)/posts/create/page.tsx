"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PostEditor from "../../../components/PostEditor";
import GlobalLoading from "@/app/loading";

function CreatePostContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [loading, setLoading] = useState(!!id);
  const [initialData, setInitialData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (!res.ok) throw new Error("Failed to fetch post");
        const data = await res.json();
        setInitialData(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load post for editing");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) return <GlobalLoading />;

  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return <PostEditor initialData={initialData} isEdit={!!id} />;
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <CreatePostContent />
    </Suspense>
  );
}
