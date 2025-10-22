import { GetServerSideProps } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

// This page resolves a referral slug or invite code, sets a cookie, and redirects the user.
export const getServerSideProps: GetServerSideProps = async ({ params, query, res }) => {
  const slug = String(params?.slug || '').trim();
  const next = typeof query.next === 'string' && query.next.startsWith('/') ? query.next : '/request';

  const cookies: string[] = [];
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  const cookieBase = `Path=/; Max-Age=${maxAge}; SameSite=Lax; HttpOnly`;

  try {
    let referrerId: string | null = null;
    let inviteCode: string | null = null;

    // 1) Try resolve by driver refSlug
    const driverSnap = await adminDb
      .collection('drivers')
      .where('refSlug', '==', slug)
      .limit(1)
      .get();

    if (!driverSnap.empty) {
      referrerId = driverSnap.docs[0].id;
    }

    // 2) If not found, try resolve by referralInvites.inviteCode
    if (!referrerId) {
      const inviteSnap = await adminDb
        .collection('referralInvites')
        .where('inviteCode', '==', slug)
        .limit(1)
        .get();
      if (!inviteSnap.empty) {
        const inv = inviteSnap.docs[0].data() as any;
        referrerId = inv.referrerId || inv.recruiterId || null;
        inviteCode = inv.inviteCode || slug;
      }
    }

    // 3) If still not found, try resolve by drivers.referralCode (legacy)
    if (!referrerId) {
      const legacySnap = await adminDb
        .collection('drivers')
        .where('referralCode', '==', slug)
        .limit(1)
        .get();
      if (!legacySnap.empty) {
        referrerId = legacySnap.docs[0].id;
      }
    }

    if (referrerId) {
      cookies.push(`referral_referrer_id=${encodeURIComponent(referrerId)}; ${cookieBase}`);
    }
    if (inviteCode) {
      cookies.push(`referral_invite_code=${encodeURIComponent(inviteCode)}; ${cookieBase}`);
    }

    if (cookies.length > 0) {
      res.setHeader('Set-Cookie', cookies);
    }
  } catch (e) {
    // swallow and just redirect
    console.error('[referral slug resolve] error:', e);
  }

  return {
    redirect: {
      destination: next,
      permanent: false,
    },
  };
};

export default function ReferralRedirect() {
  return null;
}
