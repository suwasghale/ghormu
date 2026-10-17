import type { MetadataRoute } from 'next'
import { site } from '@/config/site'
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/profile', '/api', '/login', '/register', '/reset-password', '/verify-email'] }, sitemap: `${site.url}/sitemap.xml` }
}
