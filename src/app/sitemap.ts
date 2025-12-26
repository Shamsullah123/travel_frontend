import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://travelling-agency.vercel.app';

    // Core public routes
    const routes = [
        '',
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1.0 : 0.8,
    }));

    // In a real scenario, we would fetch public blog posts or packages here
    // const services = await getServices();
    // const serviceUrls = services.map(...)

    return [...routes];
}
