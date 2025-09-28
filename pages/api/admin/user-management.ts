import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check admin authentication
    const session = await getSession(req, res);
    if (!session.userId || session.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId, action, userData } = req.body;

    if (!userId || !action) {
      return res.status(400).json({ error: 'userId and action are required' });
    }

    if (action === 'create_user') {
      // Create new user (admin or driver)
      const { name, email, password, role } = userData;

      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'name, email, password and role are required' });
      }

      // Create user in Firebase Auth
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
      });

      // Create user document in appropriate collection
      const userDocData = {
        name,
        email,
        role,
        createdAt: new Date(),
        createdBy: session.userId,
        updatedAt: new Date(),
        updatedBy: session.userId,
      };

      if (role === 'admin') {
        await adminDb.collection('users').doc(userRecord.uid).set(userDocData);
      } else if (role === 'driver') {
        await adminDb.collection('drivers').doc(userRecord.uid).set({
          ...userDocData,
          uid: userRecord.uid,
          status: 'pending',
          weeklyEarnings: 0,
          monthlyEarnings: 0,
          totalEarnings: 0,
        });
      }

      return res.status(200).json({ 
        success: true, 
        userId: userRecord.uid,
        message: 'User created successfully' 
      });

    } else if (action === 'update_user') {
      // Update user information
      const { name, email, role } = userData;

      if (!name || !email || !role) {
        return res.status(400).json({ error: 'name, email and role are required' });
      }

      // Determine which collection to update
      const collection = role === 'admin' ? 'users' : 'drivers';
      const userRef = adminDb.collection(collection).doc(userId);

      const updateData = {
        name,
        email,
        role,
        updatedAt: new Date(),
        updatedBy: session.userId,
      };

      await userRef.update(updateData);

      // Update Firebase Auth if email changed
      if (email) {
        await adminAuth.updateUser(userId, {
          email,
          displayName: name,
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'User updated successfully' 
      });

    } else if (action === 'delete_user') {
      // Delete user
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const driverDoc = await adminDb.collection('drivers').doc(userId).get();

      if (!userDoc.exists && !driverDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete from Firebase Auth
      await adminAuth.deleteUser(userId);

      // Delete from appropriate collection
      if (userDoc.exists) {
        await adminDb.collection('users').doc(userId).delete();
      }
      if (driverDoc.exists) {
        await adminDb.collection('drivers').doc(userId).delete();
      }

      return res.status(200).json({ 
        success: true, 
        message: 'User deleted successfully' 
      });

    } else if (action === 'change_role') {
      // Change user role
      const { newRole } = userData;

      if (!newRole) {
        return res.status(400).json({ error: 'newRole is required' });
      }

      // Get current user data
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const driverDoc = await adminDb.collection('drivers').doc(userId).get();

      if (!userDoc.exists && !driverDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const currentDoc = userDoc.exists ? userDoc : driverDoc;
      const currentData = currentDoc.data();
      const currentCollection = userDoc.exists ? 'users' : 'drivers';

      // Delete from current collection
      await adminDb.collection(currentCollection).doc(userId).delete();

      // Create in new collection
      const newCollection = newRole === 'admin' ? 'users' : 'drivers';
      
      // Create new user data with all necessary properties
      const newUserData: any = {
        ...currentData,
        role: newRole,
        updatedAt: new Date(),
        updatedBy: session.userId,
      };

      if (newRole === 'driver') {
        newUserData.uid = userId;
        newUserData.status = 'pending';
        newUserData.weeklyEarnings = 0;
        newUserData.monthlyEarnings = 0;
        newUserData.totalEarnings = 0;
      }

      await adminDb.collection(newCollection).doc(userId).set(newUserData);

      return res.status(200).json({ 
        success: true, 
        message: 'User role changed successfully' 
      });

    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Error in user management:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
