import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard/', '/admin/', '/feed/', '/accounting/', '/profile/', '/api/'],
        },
        sitemap: process.env.NEXT_PUBLIC_SERVER_URL + '/sitemap.xml',
    }
}
