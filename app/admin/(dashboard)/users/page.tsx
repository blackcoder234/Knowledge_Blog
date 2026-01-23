import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import { UserRowActions } from "../../components/UserRowActions";
import { AdminSearch } from "../../components/AdminSearch";
import { UserFilter } from "../../components/UserFilter";
import { Pagination } from "@/app/components/ui/Pagination";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

export const revalidate = 0; // Always fresh

async function getUsers(
  page: number,
  limit: number,
  query: string,
  role?: string,
) {
  await dbConnect();
  const skip = (page - 1) * limit;

  const dbQuery: any = {};

  if (query) {
    const searchRegex = new RegExp(query, "i");
    dbQuery.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  if (role && role !== "all") {
    dbQuery.role = role;
  }

  const totalUsers = await User.countDocuments(dbQuery);
  const totalPages = Math.ceil(totalUsers / limit);

  const users = await User.find(dbQuery)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Get post counts for filtered users
  const userIds = users.map((u) => u._id);
  const postCounts = await Post.aggregate([
    { $match: { author: { $in: userIds } } },
    { $group: { _id: "$author", count: { $sum: 1 } } },
  ]);

  const postCountMap = postCounts.reduce(
    (acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Get comment counts for filtered users
  const commentCounts = await Comment.aggregate([
    { $match: { author: { $in: userIds } } },
    { $group: { _id: "$author", count: { $sum: 1 } } },
  ]);

  const commentCountMap = commentCounts.reduce(
    (acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    users: users.map((u: any) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      image: u.image,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      postCount: postCountMap[u._id.toString()] || 0,
      commentCount: commentCountMap[u._id.toString()] || 0,
    })),
    totalPages,
  };
}

export default async function UsersPage(props: {
  searchParams: Promise<{
    page?: string;
    query?: string;
    role?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const query = searchParams.query || "";
  const role = searchParams.role || "all";
  const limit = 10;

  const session = await getServerSession(authOptions);
  const currentUser = session?.user as any;
  const isSuperOrAdmin =
    currentUser?.role === "admin" || currentUser?.role === "super_admin";

  if (!isSuperOrAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-zinc-400">
        Access Denied
      </div>
    );
  }

  const { users, totalPages } = await getUsers(page, limit, query, role);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-8 font-sans selection:bg-yellow-500/30">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              User Management
            </span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm flex items-center gap-2 font-medium">
            Manage user roles, permissions, and access.
          </p>
        </div>
        {/* Only show Add User if valid (usually not manual, but here for UI consistency) */}
        <Link href="/admin/users/create">
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
            Add User
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <AdminSearch placeholder="Search name or email..." />
            <UserFilter />
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-zinc-500 whitespace-nowrap">
            <span>Showing {users.length} users</span>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-300 uppercase tracking-wider text-center">
                    Activity
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-300 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {users.map((user: any) => (
                  <tr
                    key={user._id}
                    className="group hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-white/5 shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={user.image}
                              alt={user.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 ring-2 ring-white/5 shadow-sm">
                            {(user.name && user.name[0]) || "?"}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-zinc-100 group-hover:text-yellow-400 transition-colors">
                            {user.name}
                          </span>
                          <span className="text-xs text-zinc-500 font-medium">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize tracking-wide ${
                          user.role === "super_admin"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : user.role === "admin"
                              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                              : user.role === "editor"
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                        }`}
                      >
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle text-center">
                      <div className="flex flex-col gap-0.5">
                        {(user.role === "admin" ||
                          user.role === "super_admin" ||
                          user.role === "editor") && (
                          <span
                            className={`text-xs font-medium tabular-nums ${user.postCount > 0 ? "text-zinc-200" : "text-zinc-600"}`}
                          >
                            {user.postCount} Posts
                          </span>
                        )}
                        <span
                          className={`text-xs font-medium tabular-nums ${user.commentCount > 0 ? "text-yellow-400" : "text-zinc-600"}`}
                        >
                          {user.commentCount} Comments
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span className="text-xs text-zinc-400 font-medium tabular-nums">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle text-right">
                      <UserRowActions
                        userId={user._id}
                        currentRole={user.role}
                        userName={user.name}
                      />
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-zinc-500 font-medium"
                    >
                      No users found.
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
