const admin = require('firebase-admin');
const path = require('path');

// Init admin SDK from local service account JSON
try {
  if (!admin.apps.length) {
    const serviceAccount = require(path.join(process.cwd(), 'firebase-service-account.json'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (err) {
  console.error('Failed to init Firebase Admin. Ensure firebase-service-account.json exists.', err);
  process.exit(1);
}

const db = admin.firestore();

async function reconcileWeek(weekId) {
  if (!weekId) {
    console.error('Usage: node scripts/reconcile_week_payments.js <WEEK_ID>  e.g., 2025-W42');
    process.exit(1);
  }

  console.log(`\n🔎 Reconciling payments for week ${weekId} ...`);

  // Find weekly records for the week
  const recordsSnap = await db
    .collection('driverWeeklyRecords')
    .where('weekId', '==', weekId)
    .get();

  if (recordsSnap.empty) {
    console.log('No driverWeeklyRecords found with weekId field; falling back to id suffix scan...');
  }

  // Some documents may not store weekId; scan by id suffix as fallback
  const allRecordsSnap = recordsSnap.empty
    ? await db.collection('driverWeeklyRecords').get()
    : recordsSnap;

  const candidates = allRecordsSnap.docs.filter((doc) => {
    if (doc.data()?.weekId === weekId) return true;
    // Fallback by id convention: <driverId>_<weekId>
    const id = doc.id || '';
    return id.endsWith(`_${weekId}`);
  });

  console.log(`Found ${candidates.length} weekly records to check.`);

  let fixed = 0;
  for (const doc of candidates) {
    const data = doc.data() || {};
    const recordId = doc.id;

    try {
      // Skip already paid (but we may reattach paymentInfo if missing)
      const wasPaid = data.paymentStatus === 'paid';

      // Find latest payment for this record
      const paymentSnap = await db
        .collection('driverPayments')
        .where('recordId', '==', recordId)
        .orderBy('updatedAt', 'desc')
        .limit(1)
        .get();

      if (paymentSnap.empty) {
        if (wasPaid) {
          console.log(`⚠️ Paid status set but no payment doc found for ${recordId}. Skipping.`);
        }
        continue;
      }

      const paymentDoc = paymentSnap.docs[0];
      const payment = paymentDoc.data();

      const paymentInfo = {
        paymentId: paymentDoc.id,
        totalAmount: payment.totalAmount,
      };
      if (typeof payment.bonusAmount === 'number' && payment.bonusAmount > 0) {
        paymentInfo.bonusAmount = payment.bonusAmount;
      }
      if (typeof payment.discountAmount === 'number' && payment.discountAmount > 0) {
        paymentInfo.discountAmount = payment.discountAmount;
      }
      if (payment.proofUrl) {
        paymentInfo.proofUrl = payment.proofUrl;
      }

      const update = {
        paymentStatus: 'paid',
        paymentDate: payment.paymentDate || payment.updatedAt || new Date().toISOString(),
        paymentInfo,
        updatedAt: new Date().toISOString(),
      };

      await db.collection('driverWeeklyRecords').doc(recordId).set(update, { merge: true });
      fixed += 1;
      console.log(`✅ Reconciled ${recordId} -> paid (payment ${paymentDoc.id})`);
    } catch (err) {
      console.error(`❌ Failed to reconcile ${recordId}:`, err.message || err);
    }
  }

  console.log(`\nDone. Reconciled ${fixed} record(s).`);
}

if (require.main === module) {
  const [, , weekId] = process.argv;
  reconcileWeek(weekId).then(() => process.exit(0));
}
