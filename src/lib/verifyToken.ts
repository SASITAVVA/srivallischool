import { adminAuth, adminDb } from './firebaseAdmin';
import { NextResponse } from 'next/server';
import type { UserRole } from './store';

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  role: UserRole;
  name?: string;
}

/**
 * Verify Firebase ID token from Authorization header.
 * Returns the authenticated user with role from custom claims.
 */
export async function verifyToken(req: Request): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid Authorization header', 401);
  }

  const token = authHeader.split('Bearer ')[1];
  let decodedToken: import('firebase-admin/auth').DecodedIdToken;

  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch {
    throw new AuthError('Invalid or expired token', 401);
  }

  const role = (decodedToken.role as UserRole) || null;
  if (!role) {
    throw new AuthError('User has no role assigned. Contact admin.', 403);
  }

  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    role,
    name: decodedToken.name || decodedToken.email || 'User',
  };
}

/**
 * Require a specific role. Throws if user doesn't have it.
 */
export async function requireRole(req: Request, allowedRoles: UserRole[]): Promise<AuthenticatedUser> {
  const user = await verifyToken(req);
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError(`Access denied. Required role: ${allowedRoles.join(' or ')}`, 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}

/**
 * Helper to handle errors in API routes
 */
export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status });
  }
  console.error('API Error:', error);
  return NextResponse.json({ success: false, message: 'Internal server error', error: String(error), stack: error?.stack }, { status: 500 });
}


export async function verifyStudentAccess(studentId: string, courseId?: string): Promise<string[]> {
  const doc = await adminDb.collection('students').doc(studentId).get();
  if (!doc.exists) throw new AuthError('Student not found', 404);
  const data = doc.data();
  if (data?.isActive === false) {
    throw new AuthError('Your account has been deactivated. Please contact the administrator.', 403);
  }

  let enrollmentsQuery = adminDb.collection('enrollments')
    .where('studentId', '==', studentId)
    .where('status', '==', 'active');
    
  if (courseId) {
    enrollmentsQuery = enrollmentsQuery.where('courseId', '==', courseId);
  }

  const enrollments = await enrollmentsQuery.get();
  
  if (courseId && enrollments.empty) {
    throw new AuthError('You do not have active access to this course.', 403);
  }
  
  return [...new Set(enrollments.docs.map(d => d.data().courseId).filter(Boolean))];
}
