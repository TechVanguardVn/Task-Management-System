import { appUrl } from '@/lib/app-url'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: ['/', '/login', '/signup'],
            disallow: ['/boards'],
        },
        sitemap: `${appUrl}/sitemap.xml`,
    }
}
