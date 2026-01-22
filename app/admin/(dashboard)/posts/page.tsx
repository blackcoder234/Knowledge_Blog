import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import Category from "@/models/Category";
import User from "@/models/User";
import { DeletePostButton } from "../../components/DeletePostButton";
import { Pagination } from "@/app/components/ui/Pagination";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Image from "next/image";

export const revalidate = 0; // Always fresh for admin

async function getPosts(page: number, limit: number) {
  await dbConnect();
  const skip = (page - 1) * limit;

  // Total count
  const totalPosts = await Post.countDocuments();
  const totalPages = Math.ceil(totalPosts / limit);

  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate({ path: "category", model: Category, select: "name" })
    .populate({ path: "author", model: User, select: "name image email" })
    .skip(skip)
    .limit(limit)
    .lean();

  // Convert _id to string and sanitize
  return {
    posts: posts.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      createdAt: p.createdAt.toISOString(),
      category: p.category
        ? { _id: p.category._id.toString(), name: p.category.name }
        : null,
      author: p.author
        ? {
            _id: p.author._id.toString(),
            name: p.author.name,
            image: p.author.image,
            email: p.author.email,
          }
        : null,
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
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as any;
  const isSuperOrAdmin =
    currentUser?.role === "admin" || currentUser?.role === "super_admin";

  return (
    <div>
      {/* ... Header ... */}
      <div className="flex items-center justify-between mb-8">
        {/* ... (Existing Header Code) ... */}
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
                <th className="px-6 py-3">Author</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {posts.map((post: any) => {
                const isAuthor = currentUser?.id === post.author?._id;
                const canEdit = isSuperOrAdmin || isAuthor;

                return (
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
                      <div className="flex items-center gap-2">
                        {post.author?.image && (
                          <div className="relative h-6 w-6 rounded-full overflow-hidden">
                            <Image
                              src={post.author.image}
                              alt={post.author.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <span className="text-zinc-300">
                          {post.author?.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded-md text-xs font-medium bg-white/5 border border-white/10 text-zinc-300">
                        {post.category?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-bold capitalize ${
                          post.status === "published"
                            ? "bg-green-500/10 text-green-500"
                            : post.status === "draft"
                              ? "bg-zinc-500/10 text-zinc-500"
                              : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {post.status}
                      </span>
                      {post.featured && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        {canEdit ? (
                          <Link
                            href={`/admin/posts/create?id=${post._id}`}
                            className="p-2 hover:text-white transition-colors"
                            title="Edit Post"
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
                        ) : (
                          <span
                            className="p-2 text-zinc-600 cursor-not-allowed"
                            title="You cannot edit this post"
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
                                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                              />
                            </svg>
                          </span>
                        )}
                        <DeletePostButton id={post._id} disabled={!canEdit} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {posts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
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
