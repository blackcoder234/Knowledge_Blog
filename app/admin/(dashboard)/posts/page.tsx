import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import Category from "@/models/Category";
import User from "@/models/User";
import { DeletePostButton } from "../../components/DeletePostButton";
import { AdminSearch } from "../../components/AdminSearch";
import { AdminFilter } from "../../components/AdminFilter";
import { Pagination } from "@/app/components/ui/Pagination";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Image from "next/image";
import { QuickStatusToggle } from "@/app/components/QuickStatusToggle";
import { FeaturedToggle } from "@/app/components/FeaturedToggle";

export const revalidate = 0; // Always fresh for admin

async function getPosts(
  page: number,
  limit: number,
  query: string,
  category?: string,
  sort: string = "newest",
) {
  await dbConnect();
  const skip = (page - 1) * limit;

  const dbQuery: any = {};

  if (query) {
    const searchRegex = new RegExp(query, "i");

    // Find users who match the search query
    const matchingAuthors = await User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }],
    }).distinct("_id");

    // Find categories that match the search query
    const matchingCategories = await Category.find({
      name: searchRegex,
    }).distinct("_id");

    dbQuery.$or = [
      { title: searchRegex },
      { status: searchRegex },
      { author: { $in: matchingAuthors } },
      { category: { $in: matchingCategories } },
    ];
  }

  if (category) {
    dbQuery.category = category;
  }

  let sortOptions: any = { createdAt: -1 };
  if (sort === "oldest") sortOptions = { createdAt: 1 };
  if (sort === "views_desc") sortOptions = { views: -1 };
  if (sort === "views_asc") sortOptions = { views: 1 };

  // Total count
  const totalPosts = await Post.countDocuments(dbQuery);
  const totalPages = Math.ceil(totalPosts / limit);

  const posts = await Post.find(dbQuery)
    .sort(sortOptions)
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
  searchParams: Promise<{
    page?: string;
    query?: string;
    category?: string;
    sort?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const query = searchParams.query || "";
  const category = searchParams.category || "";
  const sort = searchParams.sort || "newest";
  const limit = 10;

  const { posts, totalPages } = await getPosts(
    page,
    limit,
    query,
    category,
    sort,
  );
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as any;
  const isSuperOrAdmin =
    currentUser?.role === "admin" || currentUser?.role === "super_admin";

  // Fetch categories for filter
  const categoriesRaw = await Category.find().select("name").lean();
  const categories = categoriesRaw.map((c: any) => ({
    _id: c._id.toString(),
    name: c.name,
  }));

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-8 font-sans selection:bg-yellow-500/30">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Posts Manager
            </span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm flex items-center gap-2 font-medium">
            Manage your blog content, status, and categories.
          </p>
        </div>
        <Link href="/admin/posts/create">
          <Button
            variant="primary"
            className="gap-2 bg-yellow-500 hover:bg-yellow-400 text-black border-0 shadow-[0_0_15px_rgba(234,179,8,0.3)] font-semibold"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Create New Post
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Search Bar Container */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <AdminSearch placeholder="Search title, author, category..." />
            <AdminFilter categories={categories} />
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-zinc-500 whitespace-nowrap">
            <span>Showing {posts.length} posts</span>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Post Details
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-300 uppercase tracking-wider text-center">
                    Engagement
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-300 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {posts.map((post: any) => {
                  const isAuthor = currentUser?.id === post.author?._id;
                  const isSuperAdmin = currentUser?.role === "super_admin";
                  const canEdit = isSuperAdmin || isAuthor;

                  return (
                    <tr
                      key={post._id}
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-1.5 min-w-[200px]">
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="text-[15px] font-semibold text-zinc-100 group-hover:text-yellow-400 hover:underline transition-colors tracking-tight leading-snug break-words cursor-pointer"
                          >
                            {post.title}
                          </Link>
                          <span className="text-xs text-zinc-400 font-medium flex items-center gap-2">
                            <span className="tabular-nums">
                              {new Date(post.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-3">
                          {post.author?.image ? (
                            <div className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-white/5 shadow-sm">
                              <Image
                                src={post.author.image}
                                alt={post.author.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 ring-2 ring-white/5 shadow-sm">
                              ?
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-zinc-200">
                              {post.author?.name || "Unknown"}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-medium">
                              {post.author?.email || "No Email"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800/80 border border-zinc-700/50 text-zinc-300">
                          {post.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center align-middle">
                        <div className="flex flex-col items-center gap-1">
                          {/* Views */}
                          <div
                            className="flex items-center gap-1.5"
                            title="Views"
                          >
                            <span className="text-zinc-500">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-3.5 h-3.5"
                              >
                                <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                                <path
                                  fillRule="evenodd"
                                  d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                            <span className="font-mono text-sm font-medium text-zinc-300 tabular-nums">
                              {post.views?.toLocaleString() || 0}
                            </span>
                          </div>

                          {/* Likes */}
                          <div
                            className="flex items-center gap-1.5"
                            title="Likes"
                          >
                            <span className="text-zinc-500">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-3.5 h-3.5 text-rose-500/70"
                              >
                                <path d="m9.653 16.915-.005-.003-.019-.01a20.759 20.759 0 0 1-1.162-.682 22.045 22.045 0 0 1-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 0 1 8-2.828A4.5 4.5 0 0 1 18 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 0 1-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 0 1-.69.001l-.002-.001Z" />
                              </svg>
                            </span>
                            <span className="font-mono text-sm font-medium text-zinc-300 tabular-nums">
                              {post.likes?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        {canEdit ? (
                          <div className="flex items-center gap-2">
                            <QuickStatusToggle
                              id={post._id}
                              initialStatus={post.status}
                            />
                            <FeaturedToggle
                              id={post._id}
                              initialFeatured={post.featured}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-2">
                              {/* Read-only Status Pill */}
                              <span
                                className={`flex items-center gap-2 px-2.5 py-1 rounded-full border ${
                                  post.status === "published"
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                    : post.status === "archived"
                                      ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                      : "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    post.status === "published"
                                      ? "bg-emerald-500"
                                      : post.status === "archived"
                                        ? "bg-rose-500"
                                        : "bg-zinc-500"
                                  }`}
                                ></span>
                                <span className="text-xs font-semibold capitalize tracking-wide">
                                  {post.status}
                                </span>
                              </span>
                            </span>
                            {post.featured && (
                              <span className="text-[10px] font-extrabold text-amber-500 tracking-wider uppercase px-1.5 py-0.5 bg-amber-500/10 rounded w-fit border border-amber-500/20">
                                Featured
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right align-middle">
                        <div className="flex justify-end gap-1 items-center">
                          {canEdit ? (
                            <Link
                              href={`/admin/posts/create?id=${post._id}`}
                              className="p-2 text-zinc-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all"
                              title="Edit Post"
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
                                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                />
                              </svg>
                            </Link>
                          ) : (
                            <span
                              className="p-2 text-zinc-700 cursor-not-allowed"
                              title="You cannot edit this post"
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
                      className="px-6 py-12 text-center text-zinc-500 font-medium"
                    >
                      No posts found. Create your first post!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-white/5 bg-white/[0.02]">
              <Pagination totalPages={totalPages} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
