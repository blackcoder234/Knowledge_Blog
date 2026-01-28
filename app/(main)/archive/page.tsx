import { Container } from "@/app/components/ui/Container";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archive | KnowledgeLog",
  description:
    "A complete chronological history of all our published essays and notes.",
};

export const revalidate = 60; // Standard ISR

async function getArchivePosts() {
  await dbConnect();

  // Fetch all published posts, sorted by date (newest first)
  const posts = await Post.find({ status: "published" })
    .select("title slug createdAt category readTime")
    .populate("category", "name")
    .sort({ createdAt: -1 }) // Newest first
    .lean();

  // Group by Year
  const grouped: Record<string, any[]> = {};

  posts.forEach((post: any) => {
    const year = new Date(post.createdAt).getFullYear().toString();
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push({
      ...post,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
    });
  });

  return grouped;
}

export default async function ArchivePage() {
  const groupedPosts = await getArchivePosts();
  const years = Object.keys(groupedPosts).sort((a, b) => Number(b) - Number(a)); // Descending years

  return (
    <div className="bg-background min-h-screen pt-32 pb-20">
      <Container className="max-w-3xl">
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-medium text-white mb-6">
            The Archive
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            A complete chronological index of our thinking. <br />
            Exploring technology, science, and the future, one post at a time.
          </p>
        </div>

        <div className="space-y-20">
          {years.map((year) => (
            <section key={year} className="relative">
              {/* Year Marker (Sticky-ish visual) */}
              <div className="flex items-baseline gap-6 mb-8 border-b border-white/10 pb-4">
                <h2 className="text-6xl font-black text-white/5 font-display select-none">
                  {year}
                </h2>
                <span className="text-zinc-500 font-medium uppercase tracking-widest text-sm">
                  {groupedPosts[year].length} Articles
                </span>
              </div>

              {/* Post List */}
              <div className="space-y-6">
                {groupedPosts[year].map((post: any) => {
                  const date = new Date(post.createdAt);
                  return (
                    <Link
                      key={post._id}
                      href={`/blog/${post.slug}`}
                      className="group flex flex-col md:flex-row md:items-baseline gap-2 md:gap-8 hover:bg-white/5 p-4 -mx-4 rounded-xl transition-colors"
                    >
                      <div className="w-32 shrink-0 text-sm font-mono text-zinc-500">
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors mb-1">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-zinc-600 uppercase tracking-wider font-bold">
                          <span>{post.category?.name || "Uncategorized"}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                          <span>{post.readTime || "Read"}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}

          {years.length === 0 && (
            <div className="py-20 text-center text-zinc-500 italic">
              No archives found.
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
