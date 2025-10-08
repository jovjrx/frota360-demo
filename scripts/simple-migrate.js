const fs = require('fs');
const path = require('path');

console.log('🚀 Starting simple content migration...');

// Read translation files
const locales = ['pt', 'en'];
const pages = ['home', 'about', 'contact', 'services-drivers', 'services-companies'];

let totalItems = 0;

for (const locale of locales) {
  for (const page of pages) {
  const filePath = path.join(__dirname, '..', 'locales', locale, 'public', `${page}.json`);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`📄 Processing ${locale}/public/${page}.json`);
        
        // Flatten the content
        const flattenContent = (obj, prefix = '') => {
          const result = {};
          for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              Object.assign(result, flattenContent(value, newKey));
            } else {
              result[newKey] = value;
            }
          }
          return result;
        };
        
        const flattened = flattenContent(content);
        
        for (const [key, value] of Object.entries(flattened)) {
          const [section, ...keyParts] = key.split('.');
          const contentKey = keyParts.join('.');
          
          console.log(`  📝 ${page} | ${section}.${contentKey} | ${locale}: ${String(value).substring(0, 50)}...`);
          totalItems++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  }
}

console.log(`\n✅ Migration simulation completed!`);
console.log(`📊 Total items that would be migrated: ${totalItems}`);
console.log(`\n📝 Next steps:`);
console.log('1. Configure Firebase service account');
console.log('2. Run: node scripts/migrate-content-to-cms.js');
console.log('3. Test pages to ensure content loads from CMS');
