import { Feed } from 'feed';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import Category from '@/models/Category';
import User from '@/models/User';

export async function GET() {
  await dbConnect();

  const posts = await Post.find({ 
    status: 'published',
    noindex: { $ne: true } 
  })
  .sort({ createdAt: -1 })
  .limit(20)
  .populate({ path: 'author', model: User, select: 'name email link' })
  .populate({ path: 'category', model: Category, select: 'name' })
  .lean();

  const feed = new Feed({
    title: "KnowledgeLog",
    description: "Insights for the Modern Developer",
    id: "https://knowledgelog.blog/",
    link: "https://knowledgelog.blog/",
    language: "en", // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
    image: "https://knowledgelog.blog/icon.png",
    favicon: "https://knowledgelog.blog/favicon.ico",
    copyright: `All rights reserved ${new Date().getFullYear()}, KnowledgeLog`,
    updated: posts[0] ? new Date(posts[0].createdAt) : new Date(),
    generator: "Feed for Node.js",
    feedLinks: {
      json: "https://knowledgelog.blog/api/feed/json",
      atom: "https://knowledgelog.blog/feed.xml"
    },
    author: {
      name: "KnowledgeLog Team",
      email: "hello@knowledgelog.blog",
      link: "https://knowledgelog.blog/about"
    }
  });

  posts.forEach((post: any) => {
    feed.addItem({
      title: post.title,
      id: `https://knowledgelog.blog/blog/${post.slug}`,
      link: `https://knowledgelog.blog/blog/${post.slug}`,
      description: post.excerpt,
      content: post.content, // Ideally should be sanitized/rendered HTML, but raw string is often OK for basic readers or needs marked transform
      author: [
        {
          name: post.author?.name || 'KnowledgeLog Team',
          email: post.author?.email,
          link: post.author?.link
        }
      ],
      date: new Date(post.createdAt),
      image: post.image,
      category: [{ name: post.category?.name || 'Uncategorized' }]
    });
  });

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
