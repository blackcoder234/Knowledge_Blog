import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Visitor from '@/models/Visitor';
import PageView from '@/models/PageView';
import User from '@/models/User';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import Subscriber from '@/models/Subscriber';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || !['admin', 'super_admin'].includes(userRole)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    let startDate = new Date();
    let dateFormat = "%Y-%m-%d";

    // Determine Date Range
    switch (range) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        dateFormat = "%Y-%m-%dT%H:00"; 
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        dateFormat = "%Y-%m-%d";
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        dateFormat = "%Y-%m-%d";
        break;
      case '6m':
        startDate = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
        dateFormat = "%Y-%m"; 
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        dateFormat = "%Y-%m";
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // 1. History: Comparisons
    // A. Unique Visitors (The "Real" Traffic)
    const historyVisitors = await PageView.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          visitors: { $addToSet: "$visitorId" }
        }
      },
      {
        $project: {
          _id: 1,
          count: { $size: "$visitors" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // B. Total Page Views (The "Volume")
    const historyViews = await PageView.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 2. New vs Returning (User based)
    // New Users (Created in range)
    const historyNew = await Visitor.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
       {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Returning Users (Active in range, but created before? Or just visitCount > 1?)
    // "Returning" typically means users who have visited before.
    // We'll approximate using lastSeen in range AND visitCount > 1.
    // Note: This matches distinct Users, not Hits.
    const historyReturning = await Visitor.aggregate([
      { $match: { lastSeen: { $gte: startDate }, visitCount: { $gt: 1 } } },
       {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$lastSeen" } }, // Use lastSeen
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // 3. Stats Cards (Users in Range)
    const totalInRange = await Visitor.countDocuments({ lastSeen: { $gte: startDate } }); // Active Users
    const newInRange = await Visitor.countDocuments({ createdAt: { $gte: startDate } });
    const returningInRange = await Visitor.countDocuments({ lastSeen: { $gte: startDate }, visitCount: { $gt: 1 } });
    
    const bounceRate = 0; // Still no session tracking for reliable bounce rate

    // 4. Breakdowns
    // Top Pages (Most Viewed) -> PageView
    const pages = await PageView.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$path", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    // Referrers/Device/OS -> Visitor (Audience Profile)
    // Filter by lastSeen to capture "Active Audience"
    const referrers = await Visitor.aggregate([
        { $match: { lastSeen: { $gte: startDate } } },
        { $group: { _id: "$referrer", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

     const devices = await Visitor.aggregate([
        { $match: { lastSeen: { $gte: startDate } } },
        { $group: { _id: "$device", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

     const os = await Visitor.aggregate([
        { $match: { lastSeen: { $gte: startDate } } },
        { $group: { _id: "$os", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    const browsers = await Visitor.aggregate([
        { $match: { lastSeen: { $gte: startDate } } },
        { $group: { _id: "$browser", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    // NEW: Countries
    const countries = await Visitor.aggregate([
        { $match: { lastSeen: { $gte: startDate } } },
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    // NEW: Live Users (Active in last 15 mins)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const liveUsers = await Visitor.countDocuments({ lastSeen: { $gte: fifteenMinutesAgo } });

    // NEW: Average Session Duration (Approximation)
    // Group PageViews by IP (User)
    // Calculate difference between first and last pageview in the period
    const sessionStats = await PageView.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$visitorId",
          firstVisit: { $min: "$createdAt" },
          lastVisit: { $max: "$createdAt" },
          views: { $sum: 1 }
        }
      },
      {
         $project: {
           duration: { $subtract: ["$lastVisit", "$firstVisit"] },
           views: 1
         }
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$duration" } // in milliseconds
        }
      }
    ]);

    const avgSessionDuration = sessionStats.length > 0 ? Math.round(sessionStats[0].avgDuration / 1000) : 0; // seconds

    // 5. Growth Analytics (Signups)
    const historySignups = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 6. Engagement Analytics (Comments)
    const historyComments = await Comment.aggregate([
       { $match: { createdAt: { $gte: startDate } } },
       {
         $group: {
            _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
            count: { $sum: 1 }
         }
       },
       { $sort: { _id: 1 } }
    ]);

    // Totals for "All Time" contexts or simplified stats
    const totalUsers = await User.countDocuments({});
    const totalComments = await Comment.countDocuments({});
    const totalSubscribers = await Subscriber.countDocuments({});
    const totalVisitorsAllTime = await Visitor.countDocuments({}); // All time unique visitors

    // Aggregate absolute total likes from all posts
    const likesAggregation = await Post.aggregate([
        { $group: { _id: null, totalLikes: { $sum: "$likes" } } }
    ]);
    const totalLikes = likesAggregation.length > 0 ? likesAggregation[0].totalLikes : 0;

    return NextResponse.json({
        history: historyVisitors, // Visitors
        historyViews, // Page Views
        historyNew, // New Users (Traffic)
        historyReturning, // Returning Users (Traffic)
        historySignups, // Registered User Signups
        historyComments, // Comments
        stats: {
            total: totalInRange, // Unique Active Visitors
            new: newInRange,
            returning: returningInRange,
            bounceRate,
            live: liveUsers,
            avgDuration: avgSessionDuration,
            // Growth & Community Stats
            totalUsers,
            totalComments,
            totalLikes,
            totalSubscribers,
            totalVisitorsAllTime,
            // Calculate a simple conversion rate for the period (Signups / Unique Visitors)
            conversionRate: totalInRange > 0 
                ? ((historySignups.reduce((acc, curr) => acc + curr.count, 0) / totalInRange) * 100).toFixed(2) 
                : 0
        },
        pages,
        referrers,
        devices,
        os,
        browsers,
        countries
    });

  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
