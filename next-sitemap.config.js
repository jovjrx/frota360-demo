/** @type {import('next-sitemap').IConfig} */
export default {
  siteUrl: 'https://www.conduz.pt',
  generateRobotsTxt: true,
  exclude: [
    '/api/*',
    '/_next/*',
    '/pt/*',
    '/en/*'
  ],
  alternateRefs: [
    { href: 'https://www.conduz.pt', hreflang: 'pt-PT' },
    { href: 'https://www.conduz.pt/en', hreflang: 'en-GB' },
  ],
  transform: async (config, path) => {
    if (path.includes('/pt/') || 
        path.includes('/en/')) {
      return null;
    }

    const baseConfig = {
      loc: path,
      changefreq: 'monthly',
      priority: path === '/' ? 1.0 : 0.7,
      lastmod: new Date().toISOString(),
    };
    
    if (path === '/' || 
        path === '/about' || 
        path === '/services/painels' || 
        path === '/services/companies' || 
        path === '/contact') {
      
      baseConfig.alternateRefs = [
        { href: `https://www.conduz.pt${path}`, hreflang: 'pt-PT' },
        { href: `https://www.conduz.pt/en${path}`, hreflang: 'en-GB' }
      ];
    }

    return baseConfig;
  },
};
  
