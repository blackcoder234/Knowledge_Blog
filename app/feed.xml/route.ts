import dbConnect from "@/lib/db";
import Post from "@/models/Post";

const BASE_URL = "https://knowledgelog.blog";

export async function GET() {
  await dbConnect();
  
  // Fetch latest 20 published posts
  const posts = await Post.find({ 
    status: "published",
    noindex: { $ne: true }
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("author", "name")
    .lean();

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>KnowledgeLog</title>
    <link>${BASE_URL}</link>
    <description>Insights for the Modern Developer</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    ${posts
      .map((post: any) => {
        return `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${BASE_URL}/blog/${post.slug}</link>
        <guid isPermaLink="true">${BASE_URL}/blog/${post.slug}</guid>
        <description><![CDATA[${post.excerpt}]]></description>
        <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
        <author>${post.author?.name || "KnowledgeLog Team"}</author>
      </item>`;
      })
      .join("")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
