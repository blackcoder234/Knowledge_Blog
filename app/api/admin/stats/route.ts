import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Post from '@/models/Post';
import Subscriber from '@/models/Subscriber';
import Visitor from '@/models/Visitor';
import PageView from '@/models/PageView';
import Contact from '@/models/Contact';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || !['admin', 'super_admin'].includes(userRole)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Parallel fetch for dashboard stats
    const [
      totalRegisteredUsers,
      totalPosts,
      totalSubscribers,
      totalPageViews,
      totalUniqueVisitors,
      activeUsers,
      recentUsers, // Registered users
      recentVisits, // Anonymous visitors
      topPosts, // Top Viewed Posts (Added)
      deviceStats,
      browserStats,
      osStats,
      countryStats,
      referrerStats,
      unreadCount
    ] = await Promise.all([
      User.countDocuments({}),
      Post.countDocuments({}),
      Subscriber.countDocuments({}),
      PageView.countDocuments({}), // "Total Page Views"
      Visitor.countDocuments({}),  // "Total Unique Visitors"
      
      // Active Users (Last 5 mins)
      Visitor.countDocuments({ 
          lastSeen: { $gte: new Date(Date.now() - 5 * 60 * 1000) } 
      }),

      User.find().sort({ createdAt: -1 }).limit(5).lean(),
      Visitor.find().sort({ lastSeen: -1 }).limit(10).lean(),
      Post.find().sort({ views: -1 }).limit(5).select('title views category').lean(), // Top Posts

      // Breakdowns (Audience)
      Visitor.aggregate([
          { $group: { _id: "$device", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
      ]),
      Visitor.aggregate([
          { $group: { _id: "$browser", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
      ]),
      Visitor.aggregate([
          { $group: { _id: "$os", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
      ]),
      Visitor.aggregate([
          { $group: { _id: "$country", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
      ]),
      Visitor.aggregate([
          { $group: { _id: "$referrer", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
      ]),

      // Unread Messages
      Contact.countDocuments({ read: false })
    ]);

    // Chart Data (Page Views Last 7 Days)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const viewsLast7Days = await PageView.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill missing days
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const record = viewsLast7Days.find((r: any) => r._id === dateStr);
        chartData.push({
            date: dateStr,
            visitors: record ? record.count : 0
        });
    }

    return NextResponse.json({
        metrics: {
            users: totalRegisteredUsers,
            posts: totalPosts,
            subscribers: totalSubscribers,
            visitors: totalPageViews
        },
        
        totalVisitors: totalUniqueVisitors, 
        activeUsers,
        recentVisits,
        topPosts,
        deviceStats,
        browserStats,
        osStats,
        countryStats,
        referrerStats,
        uptime: process.uptime(),
        dbStatus: mongoose.connection.readyState === 1,
        unreadMessages: unreadCount,
        
        charts: {
            visitors: chartData
        }
    });

  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
