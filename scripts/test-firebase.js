const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

console.log('🔥 Testing Firebase connection...');

try {
  // Check if service account exists
  const serviceAccountPath = './firebase-service-account.json';
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Firebase service account file not found!');
    console.log('📝 Please create firebase-service-account.json with your Firebase credentials');
    process.exit(1);
  }

  // Initialize Firebase
  const serviceAccount = require(serviceAccountPath);
  const app = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id
  });

  const db = getFirestore(app);
  console.log('✅ Firebase initialized successfully');
  console.log(`📊 Project ID: ${serviceAccount.project_id}`);

  // Test connection by creating a test document
  console.log('🧪 Testing Firestore connection...');
  
  const testDoc = await db.collection('test').add({
    message: 'Firebase connection test',
    timestamp: new Date(),
    status: 'success'
  });
  
  console.log(`✅ Test document created with ID: ${testDoc.id}`);
  
  // Clean up test document
  await db.collection('test').doc(testDoc.id).delete();
  console.log('🧹 Test document cleaned up');

  // Check existing collections
  console.log('\n📋 Checking existing collections...');
  const collections = await db.listCollections();
  console.log('Existing collections:');
  collections.forEach(collection => {
    console.log(`  - ${collection.id}`);
  });

  console.log('\n✅ Firebase connection test completed successfully!');
  process.exit(0);

} catch (error) {
  console.error('❌ Firebase connection failed:', error.message);
  
  if (error.code === 'ENOENT') {
    console.log('\n💡 To fix this:');
    console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.log('2. Generate new private key');
    console.log('3. Save as firebase-service-account.json in project root');
  }
  
  process.exit(1);
}
