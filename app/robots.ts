
import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.knowledgelog.blog'; // Production URL

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/profile/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
