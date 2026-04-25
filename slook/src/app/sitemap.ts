import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://slook.luxury';

  // In a real scenario, you'd fetch all products and categories from the API here
  // const products = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`).then(res => res.json());

  const routes = [
    '',
    '/shop',
    '/looks',
    '/blog',
    '/about',
    '/contact',
    '/cartdrawer',
    '/auth/login',
    '/auth/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return [...routes];
}
