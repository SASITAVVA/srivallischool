import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

function generateEnrollmentId() {
  const year = new Date().getFullYear();
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SS-${year}-${randomStr}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role } = body;

    if (role === 'parent') {
      // ── Parent Registration ──
      const { name, mobile, email, password, city, state, childName, childAge, childGrade, courseInterest } = body;

      if (!name || !mobile || !password || !email) {
        return NextResponse.json(
          { success: false, message: 'Name, email, mobile, and password are required' },
          { status: 400 }
        );
      }

      // Create Firebase Auth user
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
      });

      try {
        // Set custom claims for role
        await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'parent' });

        // Create parent profile in Firestore
        const parentRef = adminDb.collection('parents').doc(userRecord.uid);
        await parentRef.set({
        name,
        email,
        mobile,
        city: city || '',
        state: state || '',
        children: [],
        uid: userRecord.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Also create in users collection for unified lookup
      await adminDb.collection('users').doc(userRecord.uid).set({
        name,
        email,
        mobile,
        role: 'parent',
        uid: userRecord.uid,
        createdAt: FieldValue.serverTimestamp(),
      });

      // If child info was provided, create the child profile
      if (childName) {
        const childId = adminDb.collection('students').doc().id;
        const enrollmentId = generateEnrollmentId();
        
        await adminDb.collection('students').doc(childId).set({
          enrollmentId,
          name: childName,
          age: childAge ? parseInt(childAge) : null,
          grade: childGrade ? parseInt(childGrade) : null,
          courseSelection: courseInterest || '',
          parentId: userRecord.uid,
          parentName: name,
          parentMobile: mobile,
          city: city || '',
          state: state || '',
          uid: childId, // Non-auth student profile
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Link child to parent
        await parentRef.update({
          children: FieldValue.arrayUnion(childId)
        });

        // Generate enrollment if course is provided
        if (courseInterest) {
          try {
            const courseSnap = await adminDb.collection('courses').get();
            const matchedCourse = courseSnap.docs.find(doc => {
              const data = doc.data();
              return (data.name || data.title) === courseInterest;
            });
            if (matchedCourse) {
              await adminDb.collection('enrollments').add({
                studentId: childId,
                courseId: matchedCourse.id,
                plan: 'Monthly Plan',
                parentId: userRecord.uid,
                status: 'active',
                startDate: new Date().toISOString().split('T')[0],
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
          } catch (err) {
            console.error('Error auto-enrolling parent child', err);
          }
        }
      }

      } catch (dbError) {
        await adminAuth.deleteUser(userRecord.uid);
        throw dbError;
      }

      return NextResponse.json(
        {
          success: true,
          user: { id: userRecord.uid, name, email, mobile, role: 'parent' },
          role: 'parent',
        },
        { status: 201 }
      );
    }

    // ── Student Registration (default) ──
    const { 
      name, email, password, dateOfBirth, age, gender, grade, 
      schoolName, parentName, parentMobile, city, state, 
      preferredClassDays, preferredClassTime, courseSelection 
    } = body;

    if (!name || !password || !email) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // Set custom claims for role
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'student' });

    // Create student profile in Firestore
    const enrollmentId = generateEnrollmentId();
    const studentData: Record<string, unknown> = {
      enrollmentId,
      name,
      email,
      dateOfBirth: dateOfBirth || '',
      age: age ? parseInt(age) : null,
      gender: gender || '',
      grade: grade ? parseInt(grade) : null,
      schoolName: schoolName || '',
      parentName: parentName || '',
      parentMobile: parentMobile || '',
      city: city || '',
      state: state || '',
      preferredClassDays: preferredClassDays || '',
      preferredClassTime: preferredClassTime || '',
      courseSelection: courseSelection || '',
      uid: userRecord.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    try {
      await adminDb.collection('students').doc(userRecord.uid).set(studentData);

      // Also create in users collection
      await adminDb.collection('users').doc(userRecord.uid).set({
        name,
        email,
        role: 'student',
        uid: userRecord.uid,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (dbError) {
      // ATOMICITY: Rollback auth user creation if database write fails
      await adminAuth.deleteUser(userRecord.uid);
      throw dbError; // Re-throw to be caught by outer try-catch
    }

    // If parent info provided, check if parent exists and link
    let parentIdStr = null;
    if (parentMobile) {
      const parentQuery = await adminDb
        .collection('parents')
        .where('mobile', '==', parentMobile)
        .limit(1)
        .get();

      if (!parentQuery.empty) {
        const parentDoc = parentQuery.docs[0];
        parentIdStr = parentDoc.id;
        await adminDb.collection('students').doc(userRecord.uid).update({
          parentId: parentDoc.id,
        });
        await adminDb.collection('parents').doc(parentDoc.id).update({
          children: FieldValue.arrayUnion(userRecord.uid),
        });
      }
    }

    // Auto-enroll if course selection provided
    if (courseSelection) {
      try {
        const courseSnap = await adminDb.collection('courses').get();
        const matchedCourse = courseSnap.docs.find(doc => {
          const data = doc.data();
          return (data.name || data.title) === courseSelection;
        });
        if (matchedCourse) {
          await adminDb.collection('enrollments').add({
            studentId: userRecord.uid,
            courseId: matchedCourse.id,
            plan: 'Monthly Plan',
            parentId: parentIdStr,
            status: 'active',
            startDate: new Date().toISOString().split('T')[0],
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      } catch (err) {
        console.error('Error auto-enrolling student', err);
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: { id: userRecord.uid, name, email, role: 'student' },
        role: 'student',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    console.error('Registration error:', error);

    const msg = firebaseError.code === 'auth/email-already-exists' ? 'Email is already in use. Please login.' : firebaseError.message || 'Registration failed.';
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}
