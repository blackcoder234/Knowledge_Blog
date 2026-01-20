"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/app/components/ui/Button";
import { Container } from "@/app/components/ui/Container";
import GlobalLoading from "@/app/loading";
import { useToast } from "@/app/context/ToastContext";
import { BlogCard } from "@/app/components/BlogCard";
import Image from "next/image";
import {
  Twitter,
  Linkedin,
  Github,
  Globe,
  MapPin,
  Calendar,
  BookOpen,
  Heart,
  Bookmark,
  MessageSquare,
  Loader2,
} from "lucide-react";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    "activity" | "bookmarks" | "likes"
  >("activity");
  const [interactedPosts, setInteractedPosts] = useState<any[]>([]);
  const [interactionsLoading, setInteractionsLoading] = useState(false);
  const [myComments, setMyComments] = useState<any[]>([]);

  const isMyProfile = session?.user && (session.user as any).id === id;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${id}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
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

  // Fetch interactions when tab changes (Lazy Load)
  useEffect(() => {
    if (!isMyProfile) return;

    const fetchData = async () => {
      setInteractionsLoading(true);
      try {
        if (activeTab === "bookmarks") {
          const res = await fetch("/api/user/interactions?type=bookmarks");
          const data = await res.json();
          setInteractedPosts(data);
        } else if (activeTab === "likes") {
          const res = await fetch("/api/user/interactions?type=liked");
          const data = await res.json();
          setInteractedPosts(data);
        } else if (activeTab === "activity") {
          // Fetch comments
          const res = await fetch("/api/user/comments");
          const data = await res.json();
          setMyComments(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInteractionsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, isMyProfile]);

  if (loading) return <GlobalLoading />;

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

  const SocialLinks = () => {
    if (
      !user.socialLinks ||
      (!user.socialLinks.twitter &&
        !user.socialLinks.linkedin &&
        !user.socialLinks.github &&
        !user.socialLinks.website)
    )
      return null;

    return (
      <div className="flex gap-4 pt-4 border-t border-white/5 mt-6">
        {user.socialLinks.twitter && (
          <a
            href={user.socialLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-[#1DA1F2] transition-colors"
          >
            <Twitter size={20} />
          </a>
        )}
        {user.socialLinks.linkedin && (
          <a
            href={user.socialLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-[#0A66C2] transition-colors"
          >
            <Linkedin size={20} />
          </a>
        )}
        {user.socialLinks.github && (
          <a
            href={user.socialLinks.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <Github size={20} />
          </a>
        )}
        {user.socialLinks.website && (
          <a
            href={user.socialLinks.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-accent transition-colors"
          >
            <Globe size={20} />
          </a>
        )}
      </div>
    );
  };

  // --- Layout 1: Reader Profile ---
  if (!isPortfolioRole) {
    return (
      <Container className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Header Card (Isolated) */}
          <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl overflow-hidden shadow-sm relative">
            {/* Banner */}
            <div className="h-32 w-full relative bg-zinc-900">
              {user.bannerImage ? (
                <Image
                  src={user.bannerImage}
                  alt="Banner"
                  fill
                  className="object-cover opacity-80"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-black" />
              )}
            </div>

            <div className="px-6 pb-6 relative">
              <div className="flex justify-between items-end -mt-10 mb-4">
                <div className="h-20 w-20 rounded-full bg-zinc-800 border-4 border-[#0D0D0D] flex items-center justify-center text-2xl font-bold text-white overflow-hidden shadow-xl relative z-10">
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
                    size="sm"
                    className="cursor-pointer bg-white/5 hover:bg-white/10"
                    onClick={() => router.push("/profile")}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                <p className="text-zinc-400 text-sm mt-1">
                  {user.title || "KnowledgeLog Reader"}
                </p>
              </div>

              {/* Bio & Details */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  {user.bio || "No biography available."}
                </p>

                <div className="flex flex-wrap gap-6 text-xs text-zinc-500 items-center">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>Joined {new Date(user.createdAt).getFullYear()}</span>
                  </div>
                  {user.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{user.location}</span>
                    </div>
                  )}
                </div>
                <SocialLinks />
              </div>
            </div>
          </div>

          {/* User Engagement Tabs (Only for Owner) */}
          {isMyProfile && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex gap-1 border-b border-white/10">
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                    activeTab === "activity"
                      ? "border-accent text-white bg-white/5 rounded-t-lg"
                      : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-t-lg"
                  }`}
                >
                  <MessageSquare size={14} /> Activity
                </button>
                <button
                  onClick={() => setActiveTab("bookmarks")}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                    activeTab === "bookmarks"
                      ? "border-purple-500 text-white bg-purple-500/10 rounded-t-lg"
                      : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-t-lg"
                  }`}
                >
                  <Bookmark size={14} /> Bookmarks
                </button>
                <button
                  onClick={() => setActiveTab("likes")}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                    activeTab === "likes"
                      ? "border-red-500 text-white bg-red-500/10 rounded-t-lg"
                      : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-t-lg"
                  }`}
                >
                  <Heart size={14} /> Liked Posts
                </button>
              </div>

              <div className="min-h-[200px]">
                {interactionsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-zinc-500" />
                  </div>
                ) : (
                  <>
                    {activeTab === "activity" && (
                      <div className="space-y-4">
                        {myComments.length > 0 ? (
                          myComments.map((c) => (
                            <div
                              key={c._id}
                              className="bg-[#0D0D0D] border border-white/5 rounded-xl p-4 flex gap-4 hover:border-white/10 transition-colors"
                            >
                              <div className="shrink-0 pt-1">
                                <MessageSquare
                                  size={16}
                                  className="text-zinc-500"
                                />
                              </div>
                              <div>
                                <p className="text-zinc-300 text-sm mb-2 font-medium">
                                  {c.content}
                                </p>
                                <div className="text-xs text-zinc-500 flex gap-2">
                                  <span>
                                    {new Date(c.createdAt).toLocaleDateString()}
                                  </span>
                                  <span className="text-zinc-600">•</span>
                                  {c.post ? (
                                    <a
                                      href={`/blog/${c.post.slug}`}
                                      className="text-accent hover:underline"
                                    >
                                      {c.post.title}
                                    </a>
                                  ) : (
                                    <span className="text-red-500">
                                      Deleted Post
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 text-zinc-500 bg-[#0D0D0D] rounded-xl border border-white/5">
                            No recent activity.
                          </div>
                        )}
                      </div>
                    )}

                    {(activeTab === "bookmarks" || activeTab === "likes") && (
                      <div className="grid md:grid-cols-2 gap-6">
                        {interactedPosts.length > 0 ? (
                          interactedPosts.map((post) => (
                            <BlogCard
                              key={post._id}
                              post={{
                                slug: post.slug,
                                title: post.title,
                                excerpt: post.excerpt,
                                date: new Date(
                                  post.createdAt,
                                ).toLocaleDateString(),
                                category: post.category,
                                imageUrl: post.image,
                                likes: 0, // Not fetching counts here for now
                                views: 0,
                              }}
                            />
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-12 text-zinc-500 bg-[#0D0D0D] rounded-xl border border-white/5">
                            No {activeTab} yet.
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Container>
    );
  }

  // --- Layout 2: Portfolio/Editor Profile ---
  return (
    <Container className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto">
        {/* Full Width Banner for Editors */}
        <div className="h-64 md:h-80 w-full relative rounded-3xl overflow-hidden mb-12 border border-white/10 shadow-2xl">
          {user.bannerImage ? (
            <Image
              src={user.bannerImage}
              alt="Banner"
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 via-zinc-800 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] to-transparent opacity-80"></div>

          {/* Overlaid Info */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 flex flex-col md:flex-row items-end gap-8">
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-2xl bg-zinc-800 border-4 border-[#0D0D0D] overflow-hidden shadow-2xl shrink-0">
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
            <div className="flex-1 pb-2">
              <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-white mb-2 leading-tight font-display">
                    {user.name}
                  </h1>
                  <p className="text-xl text-accent font-medium mb-4 flex items-center gap-2">
                    {user.title || "Writer"}
                    <span className="w-1 h-1 bg-zinc-500 rounded-full"></span>
                    <span className="text-sm text-zinc-400 font-normal">
                      {user.role === "super_admin" ? "Super Admin" : user.role}
                    </span>
                  </p>
                </div>
                {isMyProfile ? (
                  <Button
                    className="cursor-pointer bg-white text-black hover:bg-zinc-200"
                    onClick={() => router.push("/profile")}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-3">
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
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Sidebar: Info & Socials */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                About
              </h3>
              <p className="text-zinc-300 leading-relaxed mb-6">
                {user.bio || "No biography available."}
              </p>

              <div className="space-y-3 pt-6 border-t border-white/5 text-sm">
                <div className="flex items-center gap-3 text-zinc-400">
                  <Calendar size={16} className="text-accent" />
                  <span>Joined {new Date(user.createdAt).getFullYear()}</span>
                </div>
                {user.location && (
                  <div className="flex items-center gap-3 text-zinc-400">
                    <MapPin size={16} className="text-accent" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.occupation && (
                  <div className="flex items-center gap-3 text-zinc-400">
                    <BookOpen size={16} className="text-accent" />
                    <span>{user.occupation}</span>
                  </div>
                )}
              </div>

              <SocialLinks />
            </div>
          </div>

          {/* Right Column: Portfolio Content */}
          <div className="lg:col-span-8 space-y-12">
            {/* Highlights Grid */}
            {user.qualification && (
              <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-6 mb-8 flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
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
                      d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.499 5.516 50.552 50.552 0 0 0-2.658.813m-15.482 0A50.553 50.553 0 0 1 12 13.489a50.551 50.551 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    Education
                  </h4>
                  <p className="text-white font-medium text-lg">
                    {user.qualification}
                  </p>
                </div>
              </div>
            )}

            {/* Latest Posts */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-1 h-8 bg-accent rounded-sm"></span>
                Published Articles
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
                <div className="bg-[#0D0D0D] border border-white/5 rounded-xl overflow-hidden p-12 text-center">
                  <span className="text-zinc-500 block mb-4">
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
