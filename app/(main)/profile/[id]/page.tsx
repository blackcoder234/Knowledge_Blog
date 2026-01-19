"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/app/components/ui/Button";
import { Container } from "@/app/components/ui/Container";
import GlobalLoading from "@/app/loading";
import { useToast } from "@/app/context/ToastContext";
import { BlogCard } from "@/app/components/BlogCard";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Logic to determine if this is "my" profile
  const isMyProfile = session?.user && (session.user as any).id === id;

  useEffect(() => {
    // If it's my profile, redirect to the main /profile edit page?
    // OR we can share this page for both view/edit.
    // The user requested /profile/name or id.
    // Let's implement a View logic here.

    // Fetch user data
    const fetchUser = async () => {
      try {
        // Add an API endpoint to fetch public user profile
        const res = await fetch(`/api/users/${id}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          // If not found, maybe 404
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

  if (loading) {
    return <GlobalLoading />;
  }

  if (!user) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold text-white">User not found</h1>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/")}
        >
          Go Home
        </Button>
      </Container>
    );
  }

  const isPortfolioRole = ["editor", "admin", "super_admin"].includes(
    user.role,
  );

  if (!isPortfolioRole) {
    return (
      <Container className="py-20">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="h-32 bg-gradient-to-r from-zinc-900 to-black relative border-b border-white/5"></div>

            <div className="px-8 pb-8">
              <div className="relative -mt-16 mb-6 flex justify-between items-end">
                <div className="h-32 w-32 rounded-full bg-zinc-800 border-4 border-[#0D0D0D] flex items-center justify-center text-4xl font-bold text-white overflow-hidden shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user.name?.charAt(0)}</span>
                  )}
                </div>

                {isMyProfile && (
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => router.push("/profile")}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>

              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  {user.name}
                  <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5 text-zinc-500 uppercase tracking-wider">
                    Reader
                  </span>
                </h1>
                <p className="text-zinc-500 mt-1">
                  {user.title || "KnowledgeLog Reader"}
                </p>

                <div className="mt-6 max-w-2xl text-zinc-300">
                  {user.bio ? (
                    <p>{user.bio}</p>
                  ) : (
                    <p className="italic text-zinc-600">No bio available.</p>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex gap-8 text-sm text-zinc-500">
                  <div>
                    <span className="block font-bold text-white">
                      {new Date(user.createdAt).getFullYear()}
                    </span>
                    <span>Joined</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Sidebar: Identity */}
          <div className="lg:col-span-4 space-y-8">
            <div className="relative group">
              <div className="h-48 w-48 rounded-2xl bg-zinc-800 border-2 border-white/10 overflow-hidden shadow-2xl relative z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-zinc-700">
                    {user.name?.charAt(0)}
                  </div>
                )}
              </div>
              {/* Decorative background blob */}
              <div className="absolute -inset-4 bg-gradient-to-br from-accent/20 to-purple-500/20 blur-2xl -z-10 opacity-50 rounded-full"></div>
            </div>

            <div>
              <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
                {user.name}
              </h1>
              <p className="text-xl text-accent font-medium mb-4">
                {user.title || "Writer"}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    user.role === "super_admin"
                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                      : user.role === "admin"
                        ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                        : user.role === "editor"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                  }`}
                >
                  {user.role === "super_admin" ? "Super Admin" : user.role}
                </span>
                {user.location && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-zinc-400 border border-white/5 bg-white/5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3 h-3"
                    >
                      <path
                        fillRule="evenodd"
                        d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.45-.96 2.337-1.768C15.428 14.975 18 11.81 18 8c0-4.418-3.582-8-8-8S2 3.582 2 8c0 3.81 2.572 6.975 4.29 8.616.888.807 1.717 1.384 2.337 1.768.311.192.571.337.757.433.092.049.186.096.281.14l.018.008.006.003h.002ZM10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {user.location}
                  </span>
                )}
              </div>

              {isMyProfile ? (
                <Button
                  className="w-full cursor-pointer"
                  onClick={() => router.push("/profile")}
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="primary"
                    onClick={() =>
                      showToast("Follow feature coming soon", "info")
                    }
                  >
                    Follow
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => showToast("Messaging coming soon", "info")}
                  >
                    Message
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-white/10 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Joined</span>
                <span className="text-white font-medium">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Posts Published</span>
                <span className="text-white font-medium">0</span>
              </div>
            </div>
          </div>

          {/* Right Column: Portfolio Content */}
          <div className="lg:col-span-8 space-y-12">
            {/* About Section */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-8 h-1 bg-accent rounded-full"></span>
                About
              </h2>

              <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                {/* Highlights Grid */}
                {(user.occupation || user.qualification) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-white/5">
                    {user.occupation && (
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/5 rounded-lg text-accent">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 2.25 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm text-zinc-500 font-medium mb-1">
                            Current Occupation
                          </h3>
                          <p className="text-white font-medium">
                            {user.occupation}
                          </p>
                        </div>
                      </div>
                    )}

                    {user.qualification && (
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/5 rounded-lg text-purple-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.499 5.516 50.552 50.552 0 0 0-2.658.813m-15.482 0A50.553 50.553 0 0 1 12 13.489a50.551 50.551 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm text-zinc-500 font-medium mb-1">
                            Qualification
                          </h3>
                          <p className="text-white font-medium">
                            {user.qualification}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="prose prose-invert max-w-none">
                  <p className="text-zinc-300 leading-relaxed text-lg whitespace-pre-line">
                    {user.bio || "No biography available."}
                  </p>
                </div>
              </div>
            </section>

            {/* Latest Posts (Placeholder for now) */}
            {/* Latest Posts */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-8 h-1 bg-zinc-700 rounded-full"></span>
                Latest from {user.name?.split(" ")[0]}
              </h2>

              {user.posts && user.posts.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {user.posts.map((post: any) => (
                    <BlogCard
                      key={post._id}
                      post={{
                        slug: post.slug,
                        title: post.title,
                        excerpt: post.excerpt,
                        date: new Date(post.createdAt).toLocaleDateString(),
                        category: post.category,
                        imageUrl: post.image,
                        likes: post.likes,
                        views: post.views,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-[#0D0D0D] border border-white/5 rounded-xl overflow-hidden p-8 text-center">
                  <span className="text-zinc-500 block mb-2">
                    No articles published yet.
                  </span>
                  {isMyProfile && (
                    <Button
                      variant="outline"
                      onClick={() => router.push("/admin/posts/create")}
                    >
                      Write your first post
                    </Button>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </Container>
  );
}
