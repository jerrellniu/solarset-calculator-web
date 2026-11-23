import type { MetadataRoute } from 'next';
import { SITE } from '@/content/copy';

// Crawling stays allowed so search engines can read the noindex tag until go-live.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/' }], sitemap: `${SITE.url}/sitemap.xml` };
}
