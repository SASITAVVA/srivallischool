import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

let app;
try {
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || join(process.cwd(), 'srivalli-school-firebase-adminsdk-fbsvc-12a20df797.json');
  if (existsSync(saPath)) {
    const serviceAccount = JSON.parse(readFileSync(saPath, 'utf8'));
    app = getApps().length === 0
      ? initializeApp({ credential: cert(serviceAccount) })
      : getApps()[0];
  } else {
    // Read .env.local manually for robust parsing as tested
    const envFile = readFileSync('.env.local', 'utf-8');
    const env: any = {};
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        let key = match[1].trim();
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        env[key] = val;
      }
    });

    let privateKey = env['FIREBASE_PRIVATE_KEY'] || '';
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/`n/g, '\n');

    app = getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId: env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] || env['FIREBASE_PROJECT_ID'],
            clientEmail: env['FIREBASE_CLIENT_EMAIL'],
            privateKey,
          }),
        })
      : getApps()[0];
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
  process.exit(1);
}

const db = getFirestore(app);
const auth = getAuth(app);

// ─── DEMO USERS DATA ───

const demoUsers = [
  { uid: 'demo-admin', email: 'admin.demo@srivallischool.test', password: 'DemoAdmin@2026!', displayName: 'Demo Admin', role: 'admin' },
  { uid: 'demo-teacher-1', email: 'teacher1.demo@srivallischool.test', password: 'DemoTeacher1@2026!', displayName: 'Demo Teacher Ananya', role: 'teacher' },
  { uid: 'demo-teacher-2', email: 'teacher2.demo@srivallischool.test', password: 'DemoTeacher2@2026!', displayName: 'Demo Teacher Rahul', role: 'teacher' },
  { uid: 'demo-parent-1', email: 'parent1.demo@srivallischool.test', password: 'DemoParent1@2026!', displayName: 'Demo Parent Priya', role: 'parent' },
  { uid: 'demo-parent-2', email: 'parent2.demo@srivallischool.test', password: 'DemoParent2@2026!', displayName: 'Demo Parent Kumar', role: 'parent' },
  { uid: 'demo-student-1', email: 'student1.demo@srivallischool.test', password: 'DemoStudent1@2026!', displayName: 'Demo Student Aarav', role: 'student' },
  { uid: 'demo-student-2', email: 'student2.demo@srivallischool.test', password: 'DemoStudent2@2026!', displayName: 'Demo Student Anika', role: 'student' },
  { uid: 'demo-student-3', email: 'student3.demo@srivallischool.test', password: 'DemoStudent3@2026!', displayName: 'Demo Student Riya', role: 'student' }
];

async function seed() {
  console.log('🌱 Starting Idempotent Demo Seed...');
  
  // 1. Create/Update Auth Users
  for (const user of demoUsers) {
    try {
      try {
        await auth.getUserByEmail(user.email);
        console.log(`User ${user.email} exists, updating...`);
        await auth.updateUser(user.uid, {
          password: user.password,
          displayName: user.displayName,
        });
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
          console.log(`Creating user ${user.email}...`);
          await auth.createUser({
            uid: user.uid,
            email: user.email,
            password: user.password,
            displayName: user.displayName,
            emailVerified: true
          });
        } else {
          throw e;
        }
      }
      
      // Set Custom Claims
      await auth.setCustomUserClaims(user.uid, { role: user.role });
      
      // Upsert User Profile
      await db.collection('users').doc(user.uid).set({
        name: user.displayName,
        email: user.email,
        role: user.role,
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Create role specific records
      if (user.role === 'teacher') {
        await db.collection('teachers').doc(user.uid).set({
          name: user.displayName,
          email: user.email,
          teacherId: user.uid === 'demo-teacher-1' ? 'TEST-TEACHER-001' : 'TEST-TEACHER-002'
        }, { merge: true });
      } else if (user.role === 'parent') {
        await db.collection('parents').doc(user.uid).set({
          name: user.displayName,
          email: user.email
        }, { merge: true });
      }

    } catch (error) {
      console.error(`Error processing user ${user.email}:`, error);
    }
  }

  // 2. Setup Parents and Students Relationships
  const studentsRef = db.collection('students');
  
  await studentsRef.doc('demo-student-1').set({
    name: 'Demo Student Aarav',
    email: 'student1.demo@srivallischool.test',
    age: 10,
    grade: '5',
    schoolName: 'Demo School',
    parentId: 'demo-parent-1',
    parentName: 'Demo Parent Priya',
    points: 780,
    studentId: 'demo-student-1'
  }, { merge: true });

  await studentsRef.doc('demo-student-2').set({
    name: 'Demo Student Anika',
    email: 'student2.demo@srivallischool.test',
    age: 12,
    grade: '7',
    schoolName: 'Demo School',
    parentId: 'demo-parent-1',
    parentName: 'Demo Parent Priya',
    points: 920,
    studentId: 'demo-student-2'
  }, { merge: true });

  await studentsRef.doc('demo-student-3').set({
    name: 'Demo Student Riya',
    email: 'student3.demo@srivallischool.test',
    age: 9,
    grade: '4',
    schoolName: 'Demo School',
    parentId: 'demo-parent-2',
    parentName: 'Demo Parent Kumar',
    points: 640,
    studentId: 'demo-student-3'
  }, { merge: true });

  // 3. Courses Setup
  const course1Ref = db.collection('courses').doc('demo-course-cw');
  await course1Ref.set({
    title: 'Content Writing for Kids',
    tagline: 'Express, Create and Communicate with Confidence',
    category: 'Writing',
    status: 'active',
  }, { merge: true });

  const course2Ref = db.collection('courses').doc('demo-course-ps');
  await course2Ref.set({
    title: 'Public Speaking for Kids',
    tagline: 'Speak Clearly, Confidently and Fearlessly',
    category: 'Speaking',
    status: 'active',
  }, { merge: true });

  // 4. Enrollments (Active subscriptions)
  const enrollments = [
    { id: 'demo-enroll-1', studentId: 'demo-student-1', courseId: 'demo-course-cw', status: 'active', parentId: 'demo-parent-1' },
    { id: 'demo-enroll-2', studentId: 'demo-student-1', courseId: 'demo-course-ps', status: 'active', parentId: 'demo-parent-1' },
    { id: 'demo-enroll-3', studentId: 'demo-student-2', courseId: 'demo-course-ps', status: 'active', parentId: 'demo-parent-1' },
    { id: 'demo-enroll-4', studentId: 'demo-student-3', courseId: 'demo-course-cw', status: 'active', parentId: 'demo-parent-2' }
  ];

  for (const en of enrollments) {
    await db.collection('enrollments').doc(en.id).set(en, { merge: true });
  }

  // 5. Classes
  const now = new Date();
  
  const classDocs = [
    { id: 'demo-class-1', courseId: 'demo-course-cw', teacherId: 'demo-teacher-1', status: 'completed', date: new Date(now.getTime() - 86400000*3).toISOString().split('T')[0], title: 'Intro to Content Writing' },
    { id: 'demo-class-2', courseId: 'demo-course-cw', teacherId: 'demo-teacher-1', status: 'completed', date: new Date(now.getTime() - 86400000*2).toISOString().split('T')[0], title: 'Vocabulary Building' },
    { id: 'demo-class-3', courseId: 'demo-course-ps', teacherId: 'demo-teacher-1', status: 'completed', date: new Date(now.getTime() - 86400000*2).toISOString().split('T')[0], title: 'Intro to Public Speaking' },
    { id: 'demo-class-4', courseId: 'demo-course-ps', teacherId: 'demo-teacher-1', status: 'completed', date: new Date(now.getTime() - 86400000*1).toISOString().split('T')[0], title: 'Body Language Basics' },
    { id: 'demo-class-5', courseId: 'demo-course-cw', teacherId: 'demo-teacher-1', status: 'upcoming', date: new Date(now.getTime() + 86400000*1).toISOString().split('T')[0], title: 'Creative Writing' },
    { id: 'demo-class-6', courseId: 'demo-course-ps', teacherId: 'demo-teacher-1', status: 'upcoming', date: new Date(now.getTime() + 86400000*2).toISOString().split('T')[0], title: 'Eye Contact' },
    { id: 'demo-class-7', courseId: 'demo-course-ps', teacherId: 'demo-teacher-1', status: 'live', date: now.toISOString().split('T')[0], title: 'Live Debate Session' },
  ];

  for (const cl of classDocs) {
    await db.collection('classes').doc(cl.id).set(cl, { merge: true });
  }

  // 6. Attendance
  // Aarav: 8 classes (7 present, 1 absent)
  for (let i = 0; i < 8; i++) {
    await db.collection('attendance').doc(`demo-att-aarav-${i}`).set({
      studentId: 'demo-student-1',
      classId: `demo-class-${(i%4)+1}`,
      present: i < 7,
      date: now.toISOString(),
      parentId: 'demo-parent-1'
    });
  }

  // Anika: 6 classes (6 present)
  for (let i = 0; i < 6; i++) {
    await db.collection('attendance').doc(`demo-att-anika-${i}`).set({
      studentId: 'demo-student-2',
      classId: `demo-class-${(i%4)+1}`,
      present: true,
      date: now.toISOString(),
      parentId: 'demo-parent-1'
    });
  }

  // Riya: 5 classes (4 present)
  for (let i = 0; i < 5; i++) {
    await db.collection('attendance').doc(`demo-att-riya-${i}`).set({
      studentId: 'demo-student-3',
      classId: `demo-class-${(i%4)+1}`,
      present: i < 4,
      date: now.toISOString(),
      parentId: 'demo-parent-2'
    });
  }

  // 7. Assignments & Submissions
  const assign1 = { id: 'demo-assign-1', title: 'My Favourite Animal', type: 'Writing', courseId: 'demo-course-cw', teacherId: 'demo-teacher-1', maxMarks: 50 };
  const assign2 = { id: 'demo-assign-2', title: 'Introduce Yourself', type: 'Speaking', courseId: 'demo-course-ps', teacherId: 'demo-teacher-1', maxMarks: 50 };
  const assign3 = { id: 'demo-assign-3', title: 'Describe a Picture', type: 'Writing', courseId: 'demo-course-cw', teacherId: 'demo-teacher-1', maxMarks: 50 };
  
  await db.collection('assignments').doc(assign1.id).set(assign1, { merge: true });
  await db.collection('assignments').doc(assign2.id).set(assign2, { merge: true });
  await db.collection('assignments').doc(assign3.id).set(assign3, { merge: true });

  await db.collection('assignment_submissions').doc('demo-sub-1').set({
    assignmentId: 'demo-assign-1',
    studentId: 'demo-student-1',
    parentId: 'demo-parent-1',
    status: 'submitted',
    marks: 42,
    feedback: 'Good structure and creative ideas. Improve vocabulary and sentence variety.',
    evaluation: {
      grammar: 8, vocabulary: 8, creativity: 9, sentenceFormation: 8, organization: 9, originality: 9, presentation: 8
    }
  }, { merge: true });

  await db.collection('assignment_submissions').doc('demo-sub-2').set({
    assignmentId: 'demo-assign-2',
    studentId: 'demo-student-2',
    parentId: 'demo-parent-1',
    status: 'evaluated',
    marks: 45,
    feedback: 'Clear presentation and good confidence.',
    evaluation: {
      confidence: 9, pronunciation: 8, voice: 9, eyeContact: 8, bodyLanguage: 8, content: 9, fluency: 8
    }
  }, { merge: true });

  await db.collection('assignment_submissions').doc('demo-sub-3').set({
    assignmentId: 'demo-assign-3',
    studentId: 'demo-student-3',
    parentId: 'demo-parent-2',
    status: 'pending'
  }, { merge: true });

  // 8. Quizzes & Attempts
  const quiz1 = { id: 'demo-quiz-1', title: 'Creative Writing Fun Quiz', questionsCount: 10, courseId: 'demo-course-cw' };
  const quiz2 = { id: 'demo-quiz-2', title: 'Public Speaking Challenge Quiz', questionsCount: 10, courseId: 'demo-course-ps' };
  await db.collection('quizzes').doc(quiz1.id).set(quiz1, { merge: true });
  await db.collection('quizzes').doc(quiz2.id).set(quiz2, { merge: true });

  await db.collection('quiz_attempts').doc('demo-qa-1').set({
    quizId: 'demo-quiz-1', studentId: 'demo-student-1', parentId: 'demo-parent-1', score: 8, total: 10, percentage: 80
  }, { merge: true });

  await db.collection('quiz_attempts').doc('demo-qa-2').set({
    quizId: 'demo-quiz-2', studentId: 'demo-student-2', parentId: 'demo-parent-1', score: 9, total: 10, percentage: 90
  }, { merge: true });

  // 9. Payments & Subscriptions
  await db.collection('payments').doc('demo-pay-1').set({
    parentId: 'demo-parent-1',
    studentId: 'demo-student-1',
    plan: 'Monthly',
    amount: 4000,
    status: 'Successful',
    transactionId: 'TEST-TXN-0001',
    date: FieldValue.serverTimestamp()
  }, { merge: true });

  await db.collection('payments').doc('demo-pay-2').set({
    parentId: 'demo-parent-1',
    studentId: 'demo-student-2',
    plan: 'Weekly',
    amount: 1000,
    status: 'Successful',
    transactionId: 'TEST-TXN-0002',
    date: FieldValue.serverTimestamp()
  }, { merge: true });

  await db.collection('subscriptions').doc('demo-sub-aarav').set({
    studentId: 'demo-student-1',
    parentId: 'demo-parent-1',
    plan: 'Monthly',
    amount: 4000,
    status: 'active',
    startDate: now.toISOString(),
    endDate: new Date(now.getTime() + 86400000*30).toISOString()
  }, { merge: true });

  await db.collection('subscriptions').doc('demo-sub-anika').set({
    studentId: 'demo-student-2',
    parentId: 'demo-parent-1',
    plan: 'Weekly',
    amount: 1000,
    status: 'active',
    startDate: now.toISOString(),
    endDate: new Date(now.getTime() + 86400000*7).toISOString()
  }, { merge: true });

  // 10. Badges
  const aaravBadges = ['Creative Writer', 'Regular Learner', 'Creative Thinker'];
  const anikaBadges = ['Best Speaker', 'Confident Speaker', 'Star Performer'];
  const riyaBadges = ['Regular Learner'];

  for (let i = 0; i < aaravBadges.length; i++) {
    await db.collection('badges').doc(`demo-badge-aarav-${i}`).set({ studentId: 'demo-student-1', name: aaravBadges[i] }, { merge: true });
  }
  for (let i = 0; i < anikaBadges.length; i++) {
    await db.collection('badges').doc(`demo-badge-anika-${i}`).set({ studentId: 'demo-student-2', name: anikaBadges[i] }, { merge: true });
  }
  for (let i = 0; i < riyaBadges.length; i++) {
    await db.collection('badges').doc(`demo-badge-riya-${i}`).set({ studentId: 'demo-student-3', name: riyaBadges[i] }, { merge: true });
  }

  // 11. Certificates
  await db.collection('certificates').doc('TEST-CERT-0001').set({
    studentId: 'demo-student-2',
    studentName: 'Demo Student Anika',
    courseId: 'demo-course-ps',
    courseName: 'Public Speaking for Kids',
    certificateId: 'TEST-CERT-0001',
    verificationCode: 'TEST-VERIFY-0001',
    trainerName: 'Demo Teacher Ananya',
    date: FieldValue.serverTimestamp()
  }, { merge: true });

  // 12. Notifications
  await db.collection('notifications').doc('demo-notif-1').set({
    userId: 'demo-student-2', message: 'Your Public Speaking class starts in 30 minutes.', type: 'class', read: false
  }, { merge: true });
  await db.collection('notifications').doc('demo-notif-2').set({
    userId: 'demo-parent-1', message: "Your child has completed today's class.", type: 'class', read: false
  }, { merge: true });
  await db.collection('notifications').doc('demo-notif-3').set({
    userId: 'demo-teacher-1', message: 'New assignment submission received.', type: 'assignment', read: false
  }, { merge: true });
  await db.collection('notifications').doc('demo-notif-4').set({
    userId: 'demo-admin', message: 'New student registration received.', type: 'registration', read: false
  }, { merge: true });

  console.log('✅ Demo Seeding Complete!');
  process.exit(0);
}

seed().catch(console.error);
