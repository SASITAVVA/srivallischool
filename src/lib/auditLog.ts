import { adminDb } from './firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export interface AuditLogEntry {
  userId: string
  userRole: string
  action: string
  resource: string
  resourceId: string
  details: Record<string, any>
  ipAddress?: string
  success: boolean
  errorMessage?: string
}

/**
 * ✅ FIX #9: Add audit logging for sensitive operations
 *
 * Usage:
 * await logAuditEvent({
 *   userId: user.uid,
 *   userRole: user.role,
 *   action: 'CREATE_ENROLLMENT',
 *   resource: 'enrollment',
 *   resourceId: enrollmentId,
 *   details: { studentId, courseId, plan },
 *   ipAddress: req.headers.get('x-forwarded-for'),
 *   success: true,
 * })
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, 'timestamp'>) {
  try {
    await adminDb.collection('audit_logs').add({
      ...entry,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    // Don't throw - audit logging failure shouldn't break the application
    console.error('Failed to log audit event:', error)
  }
}

/**
 * Common audit actions
 */
export const AuditActions = {
  // User actions
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_REGISTER: 'USER_REGISTER',
  USER_UPDATE_PROFILE: 'USER_UPDATE_PROFILE',
  USER_CHANGE_PASSWORD: 'USER_CHANGE_PASSWORD',

  // Student actions
  STUDENT_CREATE: 'STUDENT_CREATE',
  STUDENT_UPDATE: 'STUDENT_UPDATE',
  STUDENT_DELETE: 'STUDENT_DELETE',
  STUDENT_ACTIVATE: 'STUDENT_ACTIVATE',
  STUDENT_DEACTIVATE: 'STUDENT_DEACTIVATE',

  // Course actions
  COURSE_CREATE: 'COURSE_CREATE',
  COURSE_UPDATE: 'COURSE_UPDATE',
  COURSE_DELETE: 'COURSE_DELETE',
  COURSE_PUBLISH: 'COURSE_PUBLISH',

  // Enrollment actions
  ENROLLMENT_CREATE: 'ENROLLMENT_CREATE',
  ENROLLMENT_UPDATE: 'ENROLLMENT_UPDATE',
  ENROLLMENT_DELETE: 'ENROLLMENT_DELETE',
  ENROLLMENT_APPROVE: 'ENROLLMENT_APPROVE',
  ENROLLMENT_CANCEL: 'ENROLLMENT_CANCEL',

  // Payment actions
  PAYMENT_CREATE: 'PAYMENT_CREATE',
  PAYMENT_UPDATE: 'PAYMENT_UPDATE',
  PAYMENT_REFUND: 'PAYMENT_REFUND',

  // Teacher actions
  TEACHER_ASSIGN: 'TEACHER_ASSIGN',
  TEACHER_REMOVE: 'TEACHER_REMOVE',
  TEACHER_UPDATE: 'TEACHER_UPDATE',

  // Admin actions
  ADMIN_STUDENT_DEACTIVATE: 'ADMIN_STUDENT_DEACTIVATE',
  ADMIN_SETTINGS_UPDATE: 'ADMIN_SETTINGS_UPDATE',
  ADMIN_COURSE_UPDATE_PRICING: 'ADMIN_COURSE_UPDATE_PRICING',

  // Security events
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
} as const

/**
 * Helper function to log security events
 */
export async function logSecurityEvent(
  userId: string,
  userRole: string,
  action: string,
  resource: string,
  details: Record<string, any>,
  ipAddress?: string,
  errorMessage?: string
) {
  await logAuditEvent({
    userId,
    userRole,
    action,
    resource,
    resourceId: details.resourceId || 'unknown',
    details,
    ipAddress,
    success: !errorMessage,
    errorMessage,
  })
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50
) {
  try {
    const snapshot = await adminDb
      .collection('audit_logs')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return []
  }
}

/**
 * Get audit logs for a specific action
 */
export async function getActionAuditLogs(
  action: string,
  limit: number = 50
) {
  try {
    const snapshot = await adminDb
      .collection('audit_logs')
      .where('action', '==', action)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return []
  }
}

/**
 * Get failed authentication attempts in the last hour
 */
export async function getFailedAuthAttempts(
  userEmail?: string,
  hoursAgo: number = 1
) {
  try {
    const timeThreshold = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

    let query = adminDb
      .collection('audit_logs')
      .where('action', 'in', [AuditActions.AUTHENTICATION_FAILED, AuditActions.USER_LOGIN])
      .where('success', '==', false)
      .where('timestamp', '>=', timeThreshold)
      .orderBy('timestamp', 'desc')

    if (userEmail) {
      query = query.where('details.email', '==', userEmail)
    }

    const snapshot = await query.get()
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Failed to fetch failed auth attempts:', error)
    return []
  }
}

/**
 * Alert on suspicious activity (e.g., multiple failed auth attempts)
 */
export async function checkSuspiciousActivity(
  ipAddress: string,
  action: string,
  thresholdCount: number = 10,
  timeWindowMinutes: number = 15
) {
  try {
    const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000)

    const snapshot = await adminDb
      .collection('audit_logs')
      .where('action', '==', action)
      .where('ipAddress', '==', ipAddress)
      .where('success', '==', false)
      .where('timestamp', '>=', timeThreshold)
      .get()

    return snapshot.docs.length >= thresholdCount
  } catch (error) {
    console.error('Failed to check suspicious activity:', error)
    return false
  }
}
