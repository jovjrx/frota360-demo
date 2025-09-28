#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running Conduz.pt migrations...\n');

// Check if Firebase service account exists
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Firebase service account file not found!');
  console.error('Please create firebase-service-account.json in the project root');
  process.exit(1);
}

try {
  // Run content migration
  console.log('📄 Migrating content to CMS...');
  execSync('node scripts/migrate-content-to-cms.js', { stdio: 'inherit' });
  console.log('✅ Content migration completed\n');
  
  // Run plans creation
  console.log('📋 Creating default plans...');
  execSync('node scripts/create-default-plans.js', { stdio: 'inherit' });
  console.log('✅ Default plans created\n');
  
  console.log('🎉 All migrations completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Start the development server: yarn dev');
  console.log('2. Test the public pages to ensure content loads from CMS');
  console.log('3. Check admin panel at /admin/content to manage content');
  console.log('4. Verify plans are displayed correctly on home page');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
