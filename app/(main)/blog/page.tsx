import { Container } from "@/app/components/ui/Container";
import { BlogControls } from "@/app/components/blog/BlogControls";
import { Pagination } from "@/app/components/ui/Pagination";
import BlogErrorNotifier from "@/app/components/blog/BlogErrorNotifier";
import Image from "next/image";
import Link from "next/link";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import Category from "@/models/Category";
import User from "@/models/User"; // Required for population

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Essays & Notes",
  description:
    "Browse our complete archive of articles on Technology, Science, and Culture.",
};

export const revalidate = 0; // Dynamic for search

async function getBlogData(searchParams: {
  q?: string;
  lang?: string;
  genre?: string;
  category?: string;
  sort?: string;
  page?: string;
}) {
  try {
    await dbConnect();

    const postsPerPage = 12;
    const currentPage = Number(searchParams.page) || 1;
    const skip = (currentPage - 1) * postsPerPage;

    // 1. Fetch Categories
    const allCategories = (await Category.find({})
      .select("name language genre")
      .lean()) as unknown as Array<{
      _id: any;
      name: string;
      language: string;
      genre: string;
    }>;

    // Get categories that actually have published posts
    const activeCategoryIds = await Post.distinct("category", {
      status: "published",
    });
    const activeCategoryIdStrings = activeCategoryIds.map((id) =>
      id.toString(),
    );

    const categoriesForClient = allCategories.map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      language: c.language || "English",
      genre: c.genre || "General",
      isActive: activeCategoryIdStrings.includes(c._id.toString()),
    }));

    // 2. Filter logic: Get active IDs based on filters
    let activeFilterCategories = categoriesForClient;

    if (searchParams.lang && searchParams.lang !== "All") {
      activeFilterCategories = activeFilterCategories.filter(
        (c) => c.language === searchParams.lang,
      );
    }

    if (searchParams.genre && searchParams.genre !== "All") {
      activeFilterCategories = activeFilterCategories.filter(
        (c) => c.genre === searchParams.genre,
      );
    }

    const filteredCategoryIds = activeFilterCategories.map((c) => c._id);

    // 3. Build Query
    const query: any = { status: "published" };
    if (searchParams.q) {
      query.$or = [
        { title: { $regex: searchParams.q, $options: "i" } },
        { content: { $regex: searchParams.q, $options: "i" } },
        { excerpt: { $regex: searchParams.q, $options: "i" } },
      ];
    }

    if (searchParams.category && searchParams.category !== "All") {
      // Find the ID for the named category
      const targetCat = categoriesForClient.find(
        (c) => c.name === searchParams.category,
      );
      if (targetCat) {
        query.category = targetCat._id;
      } else {
        // If name doesn't exist, we must still pass a valid ID or an ID that won't match
        // Passing the name directy would cause BSONError
        query.category = "000000000000000000000000";
      }
    } else if (
      (searchParams.lang && searchParams.lang !== "All") ||
      (searchParams.genre && searchParams.genre !== "All")
    ) {
      query.category = { $in: filteredCategoryIds };
    }

    const isFiltering = !!(
      searchParams.q ||
      (searchParams.lang && searchParams.lang !== "All") ||
      (searchParams.genre && searchParams.genre !== "All") ||
      (searchParams.category && searchParams.category !== "All")
    );

    // Sorting
    let sortQuery: any = { createdAt: -1 };
    if (searchParams.sort === "oldest") {
      sortQuery = { createdAt: 1 };
    } else if (searchParams.sort === "popular") {
      sortQuery = { views: -1 };
    }

    /* 
       4. Featured Logic REMOVED per user request for "no manual data fixing". 
       We now treat all posts equally in the feed, sorted by date/popularity. 
    */

    // 5. Fetch Count & Posts
    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / postsPerPage);

    const feedPosts = await Post.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(postsPerPage)
      .populate("author", "name image")
      .populate("category", "name")
      .lean();

    // 6. Fetch Trending/Featured (Top 4)
    const trendingPosts = await Post.find({ status: "published" })
      .sort({ featured: -1, views: -1 })
      .limit(4)
      .select("title slug views category")
      .populate("category", "name")
      .lean();

    const latestBreaking = await Post.findOne({ status: "published" })
      .sort({ createdAt: -1 })
      .select("title slug")
      .lean();

    return {
      feedPosts: feedPosts.map((p: any) => ({
        ...p,
        _id: p._id.toString(),
        createdAt: p.createdAt.toISOString(),
        category: p.category?.name || "General", // Flatten to string
        author: p.author
          ? {
              ...p.author,
              _id: p.author._id.toString(),
            }
          : null,
      })),
      trendingPosts: trendingPosts.map((p: any) => ({
        _id: p._id.toString(),
        title: p.title,
        slug: p.slug,
        categoryName: p.category?.name || "Topic",
      })),
      latestBreaking,
      categoriesForClient,
      isFiltering,
      totalPages,
      currentPage,
      error: null,
    };
  } catch (error: any) {
    console.error("Error fetching blog data:", error);
    return {
      feedPosts: [],
      trendingPosts: [],
      latestBreaking: null,
      categoriesForClient: [],
      isFiltering: false,
      totalPages: 0,
      currentPage: 1,
      error: "Failed to load articles. Please refresh the page.",
    };
  }
}

// Abstract "Knowledge" Image for Static Hero
const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop";

export default async function BlogPage(props: {
  searchParams: Promise<{
    q?: string;
    lang?: string;
    genre?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const {
    feedPosts,
    trendingPosts,
    latestBreaking,
    categoriesForClient,
    isFiltering,
    totalPages,
    currentPage,
    error,
  } = await getBlogData(searchParams);

  // Logic to get some tags/categories for the sidebar cloud - use real ACTIVE categories
  const popularTags = categoriesForClient
    .filter((c) => (c as any).isActive)
    .slice(0, 10)
    .map((c) => c.name);

  return (
    <div className="bg-background min-h-screen pt-20">
      {/* Toast Notification for Errors */}
      <BlogErrorNotifier error={error || undefined} />

      {/* 1. New Dispatch Ticker (Only on first page, no filters) */}
      {latestBreaking && !isFiltering && currentPage === 1 && (
        <div className="bg-accent/10 border-b border-accent/20">
          <Container className="py-2 flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-3">
              <span className="bg-accent text-black font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                New
              </span>
              <span className="text-white truncate max-w-[200px] md:max-w-none">
                {latestBreaking.title}
              </span>
            </div>
            <Link
              href={`/blog/${latestBreaking.slug}`}
              className="hidden md:inline text-accent hover:underline"
            >
              Read Story &rarr;
            </Link>
          </Container>
        </div>
      )}

      <Container className="pb-20">
        {/* 2. Static Editorial Hero (Industry Standard) */}
        {!isFiltering && currentPage === 1 && (
          <section className="py-12 md:py-20 border-b border-white/5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-black text-white leading-tight font-display tracking-tight">
                  The <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-white">
                    KnowledgeLog
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-lg">
                  Explaining the complex world of Science, Technology, and
                  Culture. Unpacking the future of humanity, one story at a
                  time.
                </p>
                <div className="flex items-center gap-4 pt-4">
                  <Link
                    href="/about"
                    className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors"
                  >
                    Our Mission
                  </Link>
                  <Link
                    href="/blog?sort=popular"
                    className="px-6 py-3 border border-white/20 text-white font-medium rounded-full hover:bg-white/10 transition-colors"
                  >
                    Popular Reads
                  </Link>
                </div>
              </div>
              <div className="relative h-[300px] md:h-[400px] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <Image
                  src={HERO_IMAGE_URL}
                  alt="Abstract Knowledge"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-1000"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent pointer-events-none" />
              </div>
            </div>
          </section>
        )}

        {/* 3. Main Feed + Controls */}
        <div className="flex flex-col mt-4">
          <BlogControls categories={categoriesForClient} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
            {/* Feed */}
            <div className="lg:col-span-8 space-y-10">
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-8 bg-accent rounded-sm"></span>
                  {isFiltering ? "Search Results" : "Latest Articles"}
                </h2>
                <span className="text-zinc-500 text-sm">
                  Page {currentPage} of {totalPages || 1}
                </span>
              </div>

              {feedPosts.length === 0 ? (
                <div className="py-20 text-center border bg-white/5 border-white/10 rounded-2xl">
                  <p className="text-zinc-400">
                    {error
                      ? "Unable to load articles."
                      : "No articles found matching your criteria."}
                  </p>
                  {!error && (
                    <Link
                      href="/blog"
                      className="text-accent text-sm mt-4 hover:underline block"
                    >
                      Reset Filters
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-8">
                    {feedPosts.map((post: any) => (
                      <Link key={post._id} href={`/blog/${post.slug}`}>
                        <div className="flex flex-col md:flex-row gap-6 group cursor-pointer bg-transparent border-b border-white/5 pb-8 hover:border-accent/30 transition-all">
                          <div className="relative w-full md:w-72 h-52 rounded-xl overflow-hidden shrink-0 bg-zinc-800">
                            <Image
                              src={post.image}
                              alt={post.title}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                          <div className="flex-1 py-1 flex flex-col justify-center">
                            <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
                              <span className="text-accent font-bold uppercase tracking-wider">
                                {post.category}
                              </span>
                              <span>
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight group-hover:text-accent transition-colors font-display">
                              {post.title}
                            </h3>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-2">
                              {post.excerpt}
                            </p>
                            <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                              <span>Read Article</span>
                              <span>•</span>
                              <span>{post.likes} likes</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination - Only show if multiple pages exist */}
                  {totalPages > 1 && <Pagination totalPages={totalPages} />}
                </>
              )}
            </div>

            {/* Sidebar with "Culprit" Fixes */}
            <aside className="lg:col-span-4 space-y-10">
              <div className="sticky top-24 space-y-10">
                {/* 1. Newsletter Card */}
                <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-white/10 rounded-3xl p-8 relative overflow-hidden group shadow-xl">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-accent/20 transition-colors"></div>
                  <h3 className="text-xl font-bold text-white mb-3 font-display">
                    KnowledgeLog Weekly
                  </h3>
                  <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                    Join 10,000+ readers getting our best stories on science,
                    philosphy and tech delivered every Sunday.
                  </p>
                  <div className="flex flex-col gap-3">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent focus:bg-white/10 w-full transition-all outline-none"
                    />
                    <button className="bg-accent text-black w-full px-4 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-transform active:scale-95">
                      Subscribe Free
                    </button>
                  </div>
                </div>

                {/* 2. Popular Topics Cloud (New) */}
                <div>
                  <h3 className="font-bold text-white uppercase tracking-wider text-xs mb-6 border-l-2 border-accent pl-3">
                    Discover Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/blog?category=${tag}`}
                        className="text-xs font-medium text-zinc-400 bg-white/5 hover:bg-white/10 hover:text-white px-3 py-1.5 rounded-full border border-white/5 transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* 3. Trending/Editor's Picks (Visual Refresh) */}
                <div>
                  <h3 className="font-bold text-white uppercase tracking-wider text-xs mb-6 border-l-2 border-accent pl-3">
                    Trending Now
                  </h3>
                  <div className="space-y-6">
                    {trendingPosts.map((pick, index) => (
                      <Link
                        key={pick._id}
                        href={`/blog/${pick.slug}`}
                        className="flex gap-4 group items-start p-3 -mx-3 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <span className="text-4xl font-black text-white/10 group-hover:text-accent/50 font-display -mt-2 transition-colors">
                          0{index + 1}
                        </span>
                        <div>
                          <span className="text-[10px] text-accent font-bold uppercase tracking-wider mb-1 block">
                            {pick.categoryName}
                          </span>
                          <h4 className="text-sm font-bold text-white group-hover:text-accent transition-colors leading-snug">
                            {pick.title}
                          </h4>
                        </div>
                      </Link>
                    ))}
                    {trendingPosts.length === 0 && (
                      <p className="text-zinc-500 text-xs italic">
                        No trending posts yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </Container>
    </div>
  );
}
