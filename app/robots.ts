
import { MetadataRoute } from 'next';

const BASE_URL = 'https://knowledgelog.com'; // Replace with actual production URL

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
