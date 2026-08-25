import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Verify the Authorization Bearer token securely via Firebase Admin SDK
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid authentication token' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return NextResponse.json(
        { success: false, message: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }

    // 2. Derive the UID strictly from the verified token
    const uid = decodedToken.uid;

    try {
      const userRecord = await adminAuth.getUser(uid);
      
      // 3. Read role directly from customClaims
      const customClaims = userRecord.customClaims || {};
      const actualRole = (customClaims.role as string) || 'student';

      // 4. Optionally check if frontend requested a specific role (to prevent confusion if they used the wrong login portal)
      // But we NEVER trust it for authorization. We only use the true role.
      let requestedRole = '';
      try {
        const body = await req.json();
        requestedRole = body.role;
      } catch {
        // Body is optional
      }

      if (requestedRole && requestedRole !== actualRole) {
        return NextResponse.json(
          { success: false, message: `This account is registered as '${actualRole}', not '${requestedRole}'` },
          { status: 403 }
        );
      }

      // 5. Fetch user profile from Firestore based on TRUE role
      const collectionMap: Record<string, string> = {
        student: 'students',
        parent: 'parents',
        teacher: 'teachers',
        admin: 'admins',
      };
      
      const profileDoc = await adminDb
        .collection(collectionMap[actualRole] || 'students')
        .doc(uid)
        .get();

      const profileData = profileDoc.exists ? profileDoc.data() : {};

      // 6. Return secure profile
      return NextResponse.json({
        success: true,
        user: {
          id: uid,
          name: profileData?.name || userRecord.displayName || userRecord.email,
          email: userRecord.email,
          mobile: profileData?.mobile,
          role: actualRole,
          ...profileData,
          uid: uid,
        },
        role: actualRole,
        token: await adminAuth.createCustomToken(uid, { role: actualRole }),
      });
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError) { return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 401 }); }
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
