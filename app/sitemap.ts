
import { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';

const BASE_URL = 'https://knowledgelog.blog'; // Production URL

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await dbConnect();
  
  // Fetch all posts with slugs and update times, excluding noindex posts
  const posts = await Post.find({ noindex: { $ne: true } }).select('slug updatedAt').lean();

  const blogEntries: MetadataRoute.Sitemap = posts.map((post: any) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
        url: `${BASE_URL}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
    },
    {
        url: `${BASE_URL}/terms`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
    },
    {
        url: `${BASE_URL}/cookies`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
    }
  ];

  return [...staticPages, ...blogEntries];
}
