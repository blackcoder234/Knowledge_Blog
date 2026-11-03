import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import AIResearchSource from "@/models/AIResearchSource";
import AIStudioSettings from "@/models/AIStudioSettings";
import Category from "@/models/Category";
import { syncResearchSource } from "@/lib/ai-studio/researchFetcher";
import { logAIStudioAction } from "@/lib/ai-studio/auditLogger";
import {
  checkDistributedRateLimit,
  QuotaStoreUnavailableError,
} from "@/lib/ai-studio/rateLimiter";

const DEFAULT_SOURCES = [
  {
    name: "arXiv Computer Science & AI",
    url: "https://export.arxiv.org/rss/cs",
    publisher: "Cornell University",
    sourceType: "academic",
    trustTier: "verified",
  },
  {
    name: "Nature Science & Technology",
    url: "https://www.nature.com/nature.rss",
    publisher: "Nature Publishing Group",
    sourceType: "rss",
    trustTier: "verified",
  },
  {
    name: "MIT Technology Review",
    url: "https://www.technologyreview.com/feed/",
    publisher: "MIT",
    sourceType: "rss",
    trustTier: "verified",
  },
  {
    name: "Hacker News Top Stories",
    url: "https://news.ycombinator.com/rss",
    publisher: "Y Combinator",
    sourceType: "rss",
    trustTier: "primary",
  },
] as const;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !["admin", "super_admin"].includes(user?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();
    const settings = await AIStudioSettings.findOne();
    if (settings?.killSwitch) {
      return NextResponse.json({ error: "AI Studio is paused." }, { status: 503 });
    }

    const rateLimit = await checkDistributedRateLimit(user.id, "research_fetch");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.isServiceUnavailable ? "Quota service is unavailable." : "Research fetch rate limit reached." },
        { status: rateLimit.isServiceUnavailable ? 503 : 429 },
      );
    }

    // Find any category to link
    const defaultCat = await Category.findOne();

    const createdSources = [];
    for (const def of DEFAULT_SOURCES) {
      let existing = await AIResearchSource.findOne({ url: def.url });
      if (!existing) {
        existing = await AIResearchSource.create({
          name: def.name,
          url: def.url,
          publisher: def.publisher,
          sourceType: def.sourceType,
          trustTier: def.trustTier,
          category: defaultCat?._id,
          active: true,
          fetchIntervalMinutes: 360,
          createdBy: user.id,
        });
      }
      createdSources.push(existing);
    }

    // Ingest initial feeds
    const syncResults = [];
    const maxDailyFetches = settings?.dailyLimits?.maxDailyResearchFetches || 50;
    let quotaReached = false;
    for (const src of createdSources) {
      const res = await syncResearchSource(src._id.toString(), {
        dailyFetchLimit: maxDailyFetches,
      });
      syncResults.push(res);
      if (res.quotaReached) {
        quotaReached = true;
        break;
      }
    }

    const totalNew = syncResults.reduce((acc, r) => acc + (r.newItemsCount || 0), 0);

    await logAIStudioAction({
      action: "source_synced",
      actorType: "user",
      actorId: user.id,
      metadata: {
        action: "seeded_default_sources",
        sourcesCount: createdSources.length,
        totalNewItems: totalNew,
        quotaReached,
        },
    });

    return NextResponse.json({
      success: true,
      message: `Seeded ${createdSources.length} default research feeds and fetched ${totalNew} articles.`,
      sources: createdSources,
      syncResults,
    });
  } catch (error: any) {
    if (error instanceof QuotaStoreUnavailableError) {
      return NextResponse.json({ error: "Quota service is unavailable. No unreserved feed fetch was started." }, { status: 503 });
    }
    console.error("Seed sources error:", error);
    return NextResponse.json({ error: "Unable to seed research sources." }, { status: 500 });
  }
}
