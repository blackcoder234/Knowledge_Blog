import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Post from '@/models/Post';
import Subscriber from '@/models/Subscriber';
import Visitor from '@/models/Visitor';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || !['admin', 'super_admin'].includes(userRole)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // 1. Fetch Key Metrics
    const [
      userCount,
      postCount,
      subscriberCount,
      visitorCount,
      recentUsers,
      recentPosts
    ] = await Promise.all([
      User.countDocuments({}),
      Post.countDocuments({}),
      Subscriber.countDocuments({}),
      Visitor.countDocuments({}),
      User.find().sort({ createdAt: -1 }).limit(5).lean(),
      Post.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    // 2. Fetch Analytics Data (Last 7 days visitors)
    // Group by Date
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const visitorsLast7Days = await Visitor.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days
    const visitorChartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const record = visitorsLast7Days.find((r: any) => r._id === dateStr);
        visitorChartData.push({
            date: dateStr,
            visitors: record ? record.count : 0
        });
    }

    return NextResponse.json({
      metrics: {
        users: userCount,
        posts: postCount,
        subscribers: subscriberCount,
        visitors: visitorCount
      },
      recentActivity: {
        users: recentUsers,
        posts: recentPosts
      },
      charts: {
        visitors: visitorChartData
      }
    });

  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
