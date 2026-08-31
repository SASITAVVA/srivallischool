import { adminDb, adminAuth } from '@/lib/firebaseAdmin'
import { requireRole, handleApiError } from '@/lib/verifyToken'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const userPayload = await requireRole(req, ['admin', 'teacher', 'parent', 'student'])
    const { newEmail, password } = await req.json()

    if (!newEmail || !password) {
      return NextResponse.json({ success: false, message: 'New email and password are required' }, { status: 400 })
    }

    const uid = userPayload.uid
    const userDoc = await adminDb.collection('users').doc(uid).get()
    const userData = userDoc.data()

    if (!userData) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const currentEmail = userData.email
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

    if (!apiKey) {
      return NextResponse.json({ success: false, message: 'Server configuration error: missing API key' }, { status: 500 })
    }

    // Verify password via Firebase Auth REST API
    const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentEmail,
        password,
        returnSecureToken: true
      })
    })

    const verifyData = await verifyRes.json()

    if (verifyData.error) {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 })
    }

    // Password verified, update email in Firebase Auth
    await adminAuth.updateUser(uid, { email: newEmail })

        // Update email in Firestore
    await adminDb.collection('users').doc(uid).update({ email: newEmail })

    // Also update role-specific collection
    let roleCollection = '';
    if (userData.role === 'admin') roleCollection = 'admins';
    else if (userData.role === 'teacher') roleCollection = 'teachers';
    else if (userData.role === 'parent') roleCollection = 'parents';
    else if (userData.role === 'student') roleCollection = 'students';
    
    if (roleCollection) {
      const roleDoc = await adminDb.collection(roleCollection).doc(uid).get();
      if (roleDoc.exists) {
        await adminDb.collection(roleCollection).doc(uid).update({ email: newEmail });
      }
    }

    return NextResponse.json({ success: true, message: 'Email updated successfully' })
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ success: false, message: 'The email address is already in use by another account.' }, { status: 400 })
    }
    return handleApiError(error)
  }
}
