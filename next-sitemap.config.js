/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://frota360.pt',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/admin',
    '/admin/*',
    '/dashboard',
    '/dashboard/*',
    '/painel',
    '/painel/*',
    '/api/*',
    '/404',
    '/500',
    '/reset-password',
    '/forgot-password',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/painel', '/api'],
      },
    ],
    additionalSitemaps: [
      'https://frota360.pt/sitemap.xml',
    ],
  },
  transform: async (config, path) => {
    // Adicionar versões em inglês de páginas públicas
    const publicPages = ['/', '/about', '/contact', '/drivers'];
    
    if (publicPages.includes(path)) {
      return [
        {
          loc: path,
          changefreq: 'daily',
          priority: path === '/' ? 1.0 : 0.8,
          lastmod: new Date().toISOString(),
          alternateRefs: [
            {
              href: `https://frota360.pt${path}`,
              hreflang: 'pt-PT',
            },
            {
              href: `https://frota360.pt/en${path === '/' ? '' : path}`,
              hreflang: 'en-GB',
            },
            {
              href: `https://frota360.pt${path}`,
              hreflang: 'x-default',
            },
          ],
        },
      ];
    }

    return {
      loc: path,
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date().toISOString(),
    };
  },
};
