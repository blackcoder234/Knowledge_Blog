import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import PageView from "@/models/PageView";
import User from "@/models/User";
import Comment from "@/models/Comment";
import Category from "@/models/Category";

export interface CategoryInterestMetric {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  interestScore: number; // 0 - 100
  recentViews30d: number;
  totalLikes: number;
  totalBookmarks: number;
  totalComments: number;
  subscriberCount: number;
  topTags: { tag: string; score: number }[];
  explanation: string;
}

/**
 * Calculates aggregate reader interest scores across categories and tags
 * based exclusively on first-party engagement data with exponential recency decay.
 * Includes evergreen articles that continue driving traffic.
 */
export async function calculateAudienceInterest(
  timeWindowDays: number = 30
): Promise<CategoryInterestMetric[]> {
  await dbConnect();

  const now = new Date();
  const windowStart = new Date(now.getTime() - timeWindowDays * 24 * 60 * 60 * 1000);

  // 1. Fetch categories
  const categories = await Category.find({}).lean();
  if (!categories || categories.length === 0) return [];

  // 2. Fetch all published posts (including evergreen content)
  const posts = await Post.find({
    status: "published",
  })
    .select("_id title slug category tags views likes createdAt")
    .lean();

  if (posts.length === 0) return [];

  // 3. Aggregate PageViews within the time window grouped by path
  const pathViewsMap = new Map<string, number>();
  try {
    const pageViewsGroup = await PageView.aggregate([
      {
        $match: {
          createdAt: { $gte: windowStart },
        },
      },
      {
        $group: {
          _id: "$path",
          count: { $sum: 1 },
        },
      },
    ]);

    pageViewsGroup.forEach((pv: any) => {
      if (pv._id) pathViewsMap.set(pv._id, pv.count);
    });
  } catch (pvErr) {
    console.warn("Could not query PageView collection, falling back to post.views:", pvErr);
  }

  // 4. Count total bookmarks across users for these posts
  const userBookmarks = await User.aggregate([
    { $unwind: "$bookmarks" },
    {
      $group: {
        _id: "$bookmarks",
        bookmarkCount: { $sum: 1 },
      },
    },
  ]);

  const bookmarkMap = new Map<string, number>();
  userBookmarks.forEach((b: any) => {
    if (b._id) bookmarkMap.set(b._id.toString(), b.bookmarkCount);
  });

  // 5. Count strictly APPROVED comments within window (Security & Data Integrity)
  const commentsGroup = await Comment.aggregate([
    {
      $match: {
        status: "approved",
        createdAt: { $gte: windowStart },
      },
    },
    {
      $group: {
        _id: "$post",
        commentCount: { $sum: 1 },
      },
    },
  ]);

  const commentMap = new Map<string, number>();
  commentsGroup.forEach((c: any) => {
    if (c._id) commentMap.set(c._id.toString(), c.commentCount);
  });

  // 6. Compute metrics per category
  const results: CategoryInterestMetric[] = [];
  const halfLifeDays = 21; // Half-life decay of 21 days for balanced evergreen valuation
  const decayLambda = Math.LN2 / halfLifeDays;

  for (const cat of categories) {
    const catIdStr = cat._id.toString();
    const catPosts = posts.filter(
      (p) => p.category && p.category.toString() === catIdStr
    );

    let rawScore = 0;
    let totalViews = 0;
    let totalLikes = 0;
    let totalBookmarks = 0;
    let totalComments = 0;
    const tagScores = new Map<string, number>();

    for (const post of catPosts) {
      const pIdStr = post._id.toString();
      
      // Determine recent views: prefer PageView window count, fallback to proportional views
      const blogPath = `/blog/${post.slug}`;
      const loggedViews = pathViewsMap.get(blogPath) || pathViewsMap.get(`${blogPath}/`) || 0;
      const pViews = loggedViews > 0 ? loggedViews : Math.round((post.views || 0) * 0.15);

      const pLikes = post.likes || 0;
      const pBookmarks = bookmarkMap.get(pIdStr) || 0;
      const pComments = commentMap.get(pIdStr) || 0;

      totalViews += pViews;
      totalLikes += pLikes;
      totalBookmarks += pBookmarks;
      totalComments += pComments;

      // Recency decay in days (capped decay to honor high-value evergreen content)
      const ageDays = Math.max(
        0,
        (now.getTime() - new Date(post.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      // Floor decay factor at 0.25 so evergreen articles don't drop to 0
      const decayFactor = Math.max(0.25, Math.exp(-decayLambda * ageDays));

      const postEngagement =
        (pViews * 0.3 + pLikes * 1.0 + pBookmarks * 2.5 + pComments * 3.0) *
        decayFactor;

      rawScore += postEngagement;

      // Accumulate tag popularity
      if (Array.isArray(post.tags)) {
        for (const tag of post.tags) {
          const cleanTag = tag.trim().toLowerCase();
          if (cleanTag) {
            tagScores.set(
              cleanTag,
              (tagScores.get(cleanTag) || 0) + postEngagement
            );
          }
        }
      }
    }

    // Normalize to 0-100 range with logarithmic dampening
    const normalizedScore = Math.min(
      98,
      Math.max(20, Math.round(20 + Math.log10(1 + rawScore) * 26))
    );

    // Sort top tags
    const sortedTags = Array.from(tagScores.entries())
      .map(([tag, score]) => ({ tag, score: Math.round(score) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const explanation =
      `Derived from ${totalViews} window views, ${totalBookmarks} bookmarks, ` +
      `${totalComments} approved reader comments, and ${totalLikes} likes across ${catPosts.length} category articles.`;

    results.push({
      categoryId: catIdStr,
      categoryName: cat.name,
      categorySlug: cat.slug,
      interestScore: normalizedScore,
      recentViews30d: totalViews,
      totalLikes,
      totalBookmarks,
      totalComments,
      subscriberCount: 0,
      topTags: sortedTags,
      explanation,
    });
  }

  // Sort categories by interestScore descending
  return results.sort((a, b) => b.interestScore - a.interestScore);
}
