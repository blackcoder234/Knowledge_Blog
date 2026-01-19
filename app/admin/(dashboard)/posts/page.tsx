import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import { DeletePostButton } from "../../components/DeletePostButton";
import { Pagination } from "@/app/components/ui/Pagination";

export const revalidate = 0; // Always fresh for admin

async function getPosts(page: number, limit: number) {
  await dbConnect();
  const skip = (page - 1) * limit;

  // Total count for pagination
  const totalPosts = await Post.countDocuments();
  const totalPages = Math.ceil(totalPosts / limit);

  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Convert _id to string to avoid serialization issues
  return {
    posts: posts.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      createdAt: p.createdAt.toISOString(),
    })),
    totalPages,
  };
}

export default async function PostsPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const limit = 10;
  const { posts, totalPages } = await getPosts(page, limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Posts</h1>
          <p className="text-zinc-400">Manage your blog content.</p>
        </div>
        <Link href="/admin/posts/create">
          <Button variant="primary" className="gap-2">
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Create Post
          </Button>
        </Link>
      </div>

      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        {/* Filter/Search Bar mock */}
        <div className="p-4 border-b border-white/5">
          <input
            type="text"
            placeholder="Search posts..."
            className="bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 w-full max-w-md"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-white/5 text-xs uppercase font-bold text-white">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {posts.map((post: any) => (
                <tr
                  key={post._id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-white text-base truncate max-w-[300px]">
                      {post.title}
                    </div>
                    <div className="text-xs text-zinc-500">
                      /blog/{post.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 rounded-md text-xs font-medium bg-white/5 border border-white/10 text-zinc-300">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${post.featured ? "bg-yellow-500/10 text-yellow-500" : "bg-green-500/10 text-green-500"}`}
                    >
                      {post.featured ? "Featured" : "Published"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/posts/create?id=${post._id}`}
                        className="p-2 hover:text-white transition-colors"
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
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                          />
                        </svg>
                      </Link>
                      <DeletePostButton id={post._id} />
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    No posts found. Create your first post!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5">
            <Pagination totalPages={totalPages} />
          </div>
        )}
      </div>
    </div>
  );
}
