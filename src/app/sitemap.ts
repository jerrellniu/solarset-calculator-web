import type { MetadataRoute } from 'next';
import { SITE } from '@/content/copy';
import { RATES } from '@/lib/rebate/rates';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE.url}/`, lastModified: RATES.asAt, changeFrequency: 'monthly' }];
}
