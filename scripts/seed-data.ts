import { config } from 'dotenv';
config();

import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { join } from 'path';

let app: App;
try {
  // Try using service account JSON file first
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || join(process.cwd(), 'srivalli-school-firebase-adminsdk-fbsvc-12a20df797.json');
  const serviceAccount = JSON.parse(readFileSync(saPath, 'utf8'));
  app = getApps().length === 0
    ? initializeApp({ credential: cert(serviceAccount), storageBucket: `${serviceAccount.project_id}.firebasestorage.app` })
    : getApps()[0];
} catch {
  // Fall back to env vars
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!privateKey || !clientEmail || !projectId) {
    console.error('No service account JSON found and missing env vars.');
    process.exit(1);
  }
  app = getApps().length === 0
    ? initializeApp({ credential: cert({ privateKey, clientEmail, projectId }), storageBucket: `${projectId}.firebasestorage.app` })
    : getApps()[0];
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

// ═══════════════════════════════════════════════════════
//   SAMPLE DATA
// ═══════════════════════════════════════════════════════

const teachers = [
  { name: 'Lakshmi Priya', email: 'lakshmi@srivallischool.com', mobile: '9876543210', gender: 'female', qualification: 'M.A. English Literature', specialization: 'Public Speaking', experience: 8, bio: 'Experienced communication trainer with expertise in public speaking and debate coaching.', profileImage: '' },
  { name: 'Ramesh Kumar', email: 'ramesh@srivallischool.com', mobile: '9876543211', gender: 'male', qualification: 'M.Ed., B.Ed.', specialization: 'Creative Writing', experience: 6, bio: 'Creative writing specialist helping students discover their voice through storytelling.', profileImage: '' },
  { name: 'Anjali Reddy', email: 'anjali@srivallischool.com', mobile: '9876543212', gender: 'female', qualification: 'B.A. Mass Communication', specialization: 'Content Writing', experience: 4, bio: 'Digital content creator and writing coach passionate about nurturing young writers.', profileImage: '' },
  { name: 'Suresh Babu', email: 'suresh@srivallischool.com', mobile: '9876543213', gender: 'male', qualification: 'M.A. Telugu Literature', specialization: 'Public Speaking', experience: 10, bio: 'Award-winning orator and debate coach with 10+ years of teaching experience.', profileImage: '' },
  { name: 'Divya Sharma', email: 'divya@srivallischool.com', mobile: '9876543214', gender: 'female', qualification: 'M.Sc. Psychology', specialization: 'Student Counselling', experience: 5, bio: 'Certified counsellor helping students build confidence and communication skills.', profileImage: '' },
];

const courses = [
  { name: 'Public Speaking Mastery', description: 'Build confidence and learn to speak fluently in front of any audience. Covers speech preparation, body language, voice modulation, and impromptu speaking.', category: 'Public Speaking', duration: '3 months', level: 'beginner', fee: 4500, maxStudents: 20, status: 'active', thumbnail: '', gradeRange: '2-10', schedule: 'Mon, Wed, Fri - 4:00 PM to 5:00 PM', prerequisites: 'None', objectives: 'Overcome stage fear, structure speeches, deliver presentations confidently' },
  { name: 'Creative Writing Adventures', description: 'Explore the world of creative writing through stories, poems, essays, and journals. Develop vocabulary, grammar, and storytelling skills.', category: 'Creative Writing', duration: '3 months', level: 'beginner', fee: 4000, maxStudents: 25, status: 'active', thumbnail: '', gradeRange: '2-10', schedule: 'Tue, Thu, Sat - 4:00 PM to 5:00 PM', prerequisites: 'None', objectives: 'Write short stories, improve grammar, develop creative thinking' },
  { name: 'Content Writing for Kids', description: 'Learn to write engaging content for blogs, social media, and school projects. Focus on clarity, structure, and audience awareness.', category: 'Content Writing', duration: '2 months', level: 'intermediate', fee: 3500, maxStudents: 20, status: 'active', thumbnail: '', gradeRange: '5-10', schedule: 'Sat, Sun - 10:00 AM to 11:30 AM', prerequisites: 'Basic writing skills', objectives: 'Write blog posts, create social media content, understand content structure' },
  { name: 'Debate & Elocution', description: 'Master the art of argumentation and elocution. Learn to research topics, build arguments, counter opponents, and present with impact.', category: 'Public Speaking', duration: '2 months', level: 'intermediate', fee: 5000, maxStudents: 15, status: 'active', thumbnail: '', gradeRange: '5-10', schedule: 'Wed, Fri - 5:30 PM to 7:00 PM', prerequisites: 'Public Speaking Mastery or equivalent', objectives: 'Win debates, deliver elocution pieces, think critically' },
  { name: 'Storytelling & Drama', description: 'Combine acting and storytelling to become a confident performer. Includes voice acting, character building, and stage performance.', category: 'Public Speaking', duration: '2 months', level: 'beginner', fee: 4000, maxStudents: 18, status: 'upcoming', thumbnail: '', gradeRange: '2-7', schedule: 'Mon, Wed - 3:00 PM to 4:00 PM', prerequisites: 'None', objectives: 'Perform on stage, tell compelling stories, express emotions' },
  { name: 'Advanced Writing Workshop', description: 'For serious young writers ready to take their skills to the next level. Covers advanced techniques, peer review, and publishing.', category: 'Creative Writing', duration: '3 months', level: 'advanced', fee: 5500, maxStudents: 12, status: 'upcoming', thumbnail: '', gradeRange: '7-10', schedule: 'Sat - 2:00 PM to 4:00 PM', prerequisites: 'Creative Writing Adventures or portfolio review', objectives: 'Write a short anthology, peer editing, submit to competitions' },
];

const students = [
  { name: 'Aarav Mehta', email: 'aarav@parent.com', mobile: '9988776601', gender: 'male', dateOfBirth: '2014-05-12', age: 12, grade: '7', schoolName: 'Delhi Public School', parentName: 'Rajesh Mehta', parentMobile: '9988776601', parentEmail: 'rajesh.mehta@gmail.com' },
  { name: 'Priya Nair', email: 'priya.nair@parent.com', mobile: '9988776602', gender: 'female', dateOfBirth: '2015-08-23', age: 11, grade: '6', schoolName: 'Kendriya Vidyalaya', parentName: 'Suresh Nair', parentMobile: '9988776602', parentEmail: 'suresh.nair@gmail.com' },
  { name: 'Rohan Gupta', email: 'rohan@parent.com', mobile: '9988776603', gender: 'male', dateOfBirth: '2013-02-14', age: 13, grade: '8', schoolName: 'Sri Chaitanya School', parentName: 'Amit Gupta', parentMobile: '9988776603', parentEmail: 'amit.gupta@gmail.com' },
  { name: 'Ananya Rao', email: 'ananya@parent.com', mobile: '9988776604', gender: 'female', dateOfBirth: '2016-11-05', age: 9, grade: '4', schoolName: 'Oakridge International', parentName: 'Venkat Rao', parentMobile: '9988776604', parentEmail: 'venkat.rao@gmail.com' },
  { name: 'Karthik Reddy', email: 'karthik@parent.com', mobile: '9988776605', gender: 'male', dateOfBirth: '2014-09-18', age: 11, grade: '6', schoolName: 'FIITJEE School', parentName: 'Srinivas Reddy', parentMobile: '9988776605', parentEmail: 'srinivas.reddy@gmail.com' },
  { name: 'Ishita Patel', email: 'ishita@parent.com', mobile: '9988776606', gender: 'female', dateOfBirth: '2015-03-30', age: 11, grade: '5', schoolName: 'Narayana School', parentName: 'Dinesh Patel', parentMobile: '9988776606', parentEmail: 'dinesh.patel@gmail.com' },
  { name: 'Aditya Sharma', email: 'aditya@parent.com', mobile: '9988776607', gender: 'male', dateOfBirth: '2013-07-22', age: 13, grade: '8', schoolName: 'Bharatiya Vidya Bhavan', parentName: 'Vikram Sharma', parentMobile: '9988776607', parentEmail: 'vikram.sharma@gmail.com' },
  { name: 'Meera Krishnan', email: 'meera@parent.com', mobile: '9988776608', gender: 'female', dateOfBirth: '2016-01-15', age: 10, grade: '4', schoolName: 'PSBB Learning Leadership', parentName: 'Krishnan Iyer', parentMobile: '9988776608', parentEmail: 'krishnan.iyer@gmail.com' },
  { name: 'Arjun Singh', email: 'arjun@parent.com', mobile: '9988776609', gender: 'male', dateOfBirth: '2012-12-08', age: 13, grade: '9', schoolName: 'Delhi Public School', parentName: 'Harpreet Singh', parentMobile: '9988776609', parentEmail: 'harpreet.singh@gmail.com' },
  { name: 'Saanvi Das', email: 'saanvi@parent.com', mobile: '9988776610', gender: 'female', dateOfBirth: '2015-06-20', age: 11, grade: '5', schoolName: 'St. Ann\'s School', parentName: 'Bikash Das', parentMobile: '9988776610', parentEmail: 'bikash.das@gmail.com' },
  { name: 'Vivaan Joshi', email: 'vivaan@parent.com', mobile: '9988776611', gender: 'male', dateOfBirth: '2014-04-10', age: 12, grade: '6', schoolName: 'Greenwood High', parentName: 'Sanjay Joshi', parentMobile: '9988776611', parentEmail: 'sanjay.joshi@gmail.com' },
  { name: 'Tara Menon', email: 'tara@parent.com', mobile: '9988776612', gender: 'female', dateOfBirth: '2013-10-25', age: 12, grade: '7', schoolName: 'Global Indian International', parentName: 'Ravi Menon', parentMobile: '9988776612', parentEmail: 'ravi.menon@gmail.com' },
  { name: 'Dev Iyer', email: 'dev@parent.com', mobile: '9988776613', gender: 'male', dateOfBirth: '2016-08-14', age: 9, grade: '3', schoolName: 'Chirec Public School', parentName: 'Ramesh Iyer', parentMobile: '9988776613', parentEmail: 'ramesh.iyer@gmail.com' },
  { name: 'Kavya Murthy', email: 'kavya@parent.com', mobile: '9988776614', gender: 'female', dateOfBirth: '2015-01-03', age: 11, grade: '6', schoolName: 'Vidyaranya High School', parentName: 'Mohan Murthy', parentMobile: '9988776614', parentEmail: 'mohan.murthy@gmail.com' },
  { name: 'Reyansh Agarwal', email: 'reyansh@parent.com', mobile: '9988776615', gender: 'male', dateOfBirth: '2012-09-19', age: 13, grade: '9', schoolName: 'Sri Kumarans', parentName: 'Praveen Agarwal', parentMobile: '9988776615', parentEmail: 'praveen.agarwal@gmail.com' },
];

const parents = students.map(s => ({
  name: s.parentName,
  email: s.parentEmail,
  mobile: s.parentMobile,
  childName: s.name,
  childAge: String(s.age),
  childGrade: s.grade,
  courseInterest: 'Both Courses',
  city: 'Hyderabad',
  state: 'Telangana',
}));

// ═══════════════════════════════════════════════════════
//   SEED FUNCTION
// ═══════════════════════════════════════════════════════

async function seed() {
  console.log('🌱 Seeding Srivalli SmartSpeak database...\n');
  const now = Timestamp.now();
  const batch = db.batch();
  let count = 0;

  // 1. Create courses
  console.log('📚 Creating courses...');
  const courseIds: string[] = [];
  for (const c of courses) {
    const ref = db.collection('courses').doc();
    batch.set(ref, { ...c, createdAt: now, updatedAt: now, enrolledCount: 0 });
    courseIds.push(ref.id);
    count++;
  }
  console.log(`   Created ${courses.length} courses`);

  // 2. Create teachers (with Firebase Auth)
  console.log('\n👩‍🏫 Creating teachers...');
  const teacherUids: string[] = [];
  for (const t of teachers) {
    try {
      const user = await auth.getUserByEmail(t.email);
      teacherUids.push(user.uid);
    } catch {
      const user = await auth.createUser({ email: t.email, password: 'Teacher@123', displayName: t.name });
      await auth.setCustomUserClaims(user.uid, { role: 'teacher' });
      teacherUids.push(user.uid);
    }
    const uid = teacherUids[teacherUids.length - 1];
    batch.set(db.collection('teachers').doc(uid), { ...t, uid, createdAt: now, updatedAt: now, status: 'active' });
    batch.set(db.collection('users').doc(uid), { name: t.name, email: t.email, role: 'teacher', uid, createdAt: now });
    count += 2;
  }
  console.log(`   Created ${teachers.length} teachers (password: Teacher@123)`);

  // 3. Create students (with Firebase Auth)
  console.log('\n🎓 Creating students...');
  const studentUids: string[] = [];
  for (const s of students) {
    try {
      const user = await auth.getUserByEmail(s.email);
      studentUids.push(user.uid);
    } catch {
      const user = await auth.createUser({ email: s.email, password: 'Student@123', displayName: s.name });
      await auth.setCustomUserClaims(user.uid, { role: 'student' });
      studentUids.push(user.uid);
    }
    const uid = studentUids[studentUids.length - 1];
    batch.set(db.collection('students').doc(uid), { ...s, uid, createdAt: now, updatedAt: now, status: 'active' });
    batch.set(db.collection('users').doc(uid), { name: s.name, email: s.email, role: 'student', uid, createdAt: now });
    count += 2;
  }
  console.log(`   Created ${students.length} students (password: Student@123)`);

  // 4. Create parents (with Firebase Auth)
  console.log('\n👨‍👩‍👧 Creating parents...');
  const parentUids: string[] = [];
  for (const p of parents) {
    try {
      const user = await auth.getUserByEmail(p.email);
      parentUids.push(user.uid);
    } catch {
      const user = await auth.createUser({ email: p.email, password: 'Parent@123', displayName: p.name });
      await auth.setCustomUserClaims(user.uid, { role: 'parent' });
      parentUids.push(user.uid);
    }
    const uid = parentUids[parentUids.length - 1];
    batch.set(db.collection('parents').doc(uid), { ...p, uid, createdAt: now, updatedAt: now, status: 'active' });
    batch.set(db.collection('users').doc(uid), { name: p.name, email: p.email, role: 'parent', uid, createdAt: now });
    count += 2;
  }
  console.log(`   Created ${parents.length} parents (password: Parent@123)`);

  // 5. Create classes
  console.log('\n🏫 Creating classes...');
  const classIds: string[] = [];
  const classData = [
    { courseId: 0, teacherIdx: 0, name: 'Public Speaking - Batch A (Grades 2-5)', schedule: 'Mon, Wed, Fri 4:00-5:00 PM', capacity: 20 },
    { courseId: 0, teacherIdx: 3, name: 'Public Speaking - Batch B (Grades 6-10)', schedule: 'Mon, Wed, Fri 5:30-6:30 PM', capacity: 20 },
    { courseId: 1, teacherIdx: 1, name: 'Creative Writing - Batch A (Grades 2-5)', schedule: 'Tue, Thu, Sat 4:00-5:00 PM', capacity: 25 },
    { courseId: 1, teacherIdx: 2, name: 'Creative Writing - Batch B (Grades 6-10)', schedule: 'Tue, Thu 5:30-6:30 PM', capacity: 25 },
    { courseId: 2, teacherIdx: 2, name: 'Content Writing - Weekend Batch', schedule: 'Sat, Sun 10:00-11:30 AM', capacity: 20 },
    { courseId: 3, teacherIdx: 3, name: 'Debate & Elocution - Advanced', schedule: 'Wed, Fri 5:30-7:00 PM', capacity: 15 },
  ];
  for (const cd of classData) {
    const ref = db.collection('classes').doc();
    batch.set(ref, {
      name: cd.name,
      courseId: courseIds[cd.courseId],
      courseName: courses[cd.courseId].name,
      teacherId: teacherUids[cd.teacherIdx],
      teacherName: teachers[cd.teacherIdx].name,
      schedule: cd.schedule,
      capacity: cd.capacity,
      enrolledCount: 0,
      status: 'active',
      startDate: '2026-08-01',
      endDate: '2026-10-31',
      createdAt: now,
      updatedAt: now,
    });
    classIds.push(ref.id);
    count++;
  }
  console.log(`   Created ${classData.length} classes`);

  // 6. Create enrollments
  console.log('\n📝 Creating enrollments...');
  let enrollCount = 0;
  for (let i = 0; i < students.length; i++) {
    // Each student enrolls in 1-2 courses
    const numEnrollments = i % 3 === 0 ? 2 : 1;
    const courseIndices = i % 2 === 0 ? [0, 1] : [i % 3 === 1 ? 0 : 1];
    for (let j = 0; j < numEnrollments && j < courseIndices.length; j++) {
      const cIdx = courseIndices[j];
      const classIdx = cIdx * 2 + (i % 2); // distribute across batches
      if (classIdx < classIds.length) {
        const ref = db.collection('enrollments').doc();
        batch.set(ref, {
          studentId: studentUids[i],
          studentName: students[i].name,
          parentId: parentUids[i],
          courseId: courseIds[cIdx],
          courseName: courses[cIdx].name,
          classId: classIds[classIdx],
          status: 'active',
          enrolledAt: now,
          progress: Math.floor(Math.random() * 60) + 20,
          feePaid: Math.random() > 0.3,
          feeAmount: courses[cIdx].fee,
          createdAt: now,
          updatedAt: now,
        });
        enrollCount++;
        count++;
      }
    }
  }
  console.log(`   Created ${enrollCount} enrollments`);

  // 7. Create assignments
  console.log('\n📋 Creating assignments...');
  const assignments = [
    { classIdx: 0, title: 'Self Introduction Speech', description: 'Prepare a 2-minute self-introduction speech. Focus on body language and eye contact.', dueDate: '2026-08-20', type: 'speaking', maxMarks: 50 },
    { classIdx: 0, title: 'My Favorite Hobby', description: 'Write and deliver a 3-minute speech about your favorite hobby.', dueDate: '2026-08-27', type: 'speaking', maxMarks: 50 },
    { classIdx: 2, title: 'Short Story: Magical Adventure', description: 'Write a 300-word short story about a magical adventure. Use descriptive language.', dueDate: '2026-08-22', type: 'writing', maxMarks: 40 },
    { classIdx: 2, title: 'Poem: Nature Around Us', description: 'Compose a poem (minimum 8 lines) about nature. Use rhyming words.', dueDate: '2026-08-29', type: 'writing', maxMarks: 30 },
    { classIdx: 1, title: 'Debate: Technology in Schools', description: 'Prepare arguments for and against technology in schools. Include 3 points each side.', dueDate: '2026-08-25', type: 'speaking', maxMarks: 60 },
    { classIdx: 3, title: 'Essay: My Role Model', description: 'Write a 400-word essay about your role model and why they inspire you.', dueDate: '2026-08-30', type: 'writing', maxMarks: 50 },
    { classIdx: 4, title: 'Blog Post Review', description: 'Write a review of your favorite book as a blog post (200-300 words).', dueDate: '2026-09-05', type: 'writing', maxMarks: 40 },
    { classIdx: 5, title: 'Debate Preparation: Climate Change', description: 'Research and prepare arguments on climate change for an upcoming debate.', dueDate: '2026-09-01', type: 'speaking', maxMarks: 60 },
  ];
  const assignmentIds: string[] = [];
  for (const a of assignments) {
    const ref = db.collection('assignments').doc();
    batch.set(ref, {
      ...a,
      classId: classIds[a.classIdx],
      className: classData[a.classIdx].name,
      courseId: courseIds[classData[a.classIdx].courseId],
      createdBy: teacherUids[classData[a.classIdx].teacherIdx],
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    assignmentIds.push(ref.id);
    count++;
  }
  console.log(`   Created ${assignments.length} assignments`);

  // 8. Create quizzes
  console.log('\n📝 Creating quizzes...');
  const quizzes = [
    { classIdx: 0, title: 'Public Speaking Basics Quiz', description: 'Test your knowledge of public speaking fundamentals.', questions: 10, duration: 15, passingMarks: 6, totalMarks: 10 },
    { classIdx: 2, title: 'Grammar Essentials Quiz', description: 'Test your understanding of basic grammar rules.', questions: 15, duration: 20, passingMarks: 10, totalMarks: 15 },
    { classIdx: 1, title: 'Advanced Speaking Techniques', description: 'Quiz on advanced public speaking techniques and rhetoric.', questions: 10, duration: 15, passingMarks: 7, totalMarks: 10 },
  { classIdx: 3, title: 'Creative Writing Elements', description: 'Test knowledge of story elements, plot, character, and setting.', questions: 12, duration: 20, passingMarks: 8, totalMarks: 12 },
  ];
  for (const q of quizzes) {
    const ref = db.collection('quizzes').doc();
    batch.set(ref, {
      ...q,
      classId: classIds[q.classIdx],
      className: classData[q.classIdx].name,
      courseId: courseIds[classData[q.classIdx].courseId],
      createdBy: teacherUids[classData[q.classIdx].teacherIdx],
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    count++;
  }
  console.log(`   Created ${quizzes.length} quizzes`);

  // 9. Create attendance records
  console.log('\n📊 Creating attendance records...');
  let attCount = 0;
  for (let i = 0; i < Math.min(10, students.length); i++) {
    for (const cIdx of [0, 1]) {
      const classIdx = cIdx * 2 + (i % 2);
      if (classIdx >= classIds.length) continue;
      const ref = db.collection('attendance').doc();
      const totalClasses = 12;
      const attended = Math.floor(Math.random() * 4) + 8; // 8-11 out of 12
      batch.set(ref, {
        studentId: studentUids[i],
        studentName: students[i].name,
        classId: classIds[classIdx],
        className: classData[classIdx].name,
        courseId: courseIds[cIdx],
        month: '2026-08',
        totalClasses,
        attended,
        percentage: Math.round((attended / totalClasses) * 100),
        createdAt: now,
      });
      attCount++;
      count++;
    }
  }
  console.log(`   Created ${attCount} attendance records`);

  // 10. Create payments
  console.log('\n💰 Creating payments...');
  let payCount = 0;
  for (let i = 0; i < students.length; i++) {
    const numCourses = i % 3 === 0 ? 2 : 1;
    for (let j = 0; j < numCourses; j++) {
      const cIdx = i % 2 === 0 ? 0 : 1;
      const ref = db.collection('payments').doc();
      const paid = Math.random() > 0.2;
      batch.set(ref, {
        studentId: studentUids[i],
        studentName: students[i].name,
        parentId: parentUids[i],
        courseId: courseIds[cIdx],
        courseName: courses[cIdx].name,
        amount: courses[cIdx].fee,
        status: paid ? 'completed' : 'pending',
        paymentMethod: paid ? (Math.random() > 0.5 ? 'upi' : 'bank_transfer') : '',
        transactionId: paid ? `TXN${Date.now()}${i}${j}` : '',
        paidAt: paid ? now : null,
        createdAt: now,
        updatedAt: now,
      });
      payCount++;
      count++;
    }
  }
  console.log(`   Created ${payCount} payment records`);

  // 11. Create notifications
  console.log('\n🔔 Creating notifications...');
  const notifications = [
    { title: 'Welcome to Srivalli SmartSpeak!', message: 'The new academic session 2026-27 has begun. Explore our courses and start your learning journey!', type: 'announcement', targetRole: 'all' },
    { title: 'New Course: Storytelling & Drama', message: 'We are launching a new Storytelling & Drama course for grades 2-7. Registrations opening soon!', type: 'info', targetRole: 'all' },
    { title: 'Fee Reminder', message: 'Please complete the fee payment for the current quarter before August 31st.', type: 'reminder', targetRole: 'parent' },
    { title: 'Upcoming Debate Competition', message: 'Inter-school debate competition scheduled for September 15th. Interested students should register with their class teacher.', type: 'event', targetRole: 'student' },
    { title: 'Teacher Training Workshop', message: 'Mandatory teacher training workshop on September 1st. All teachers are requested to attend.', type: 'announcement', targetRole: 'teacher' },
  ];
  for (const n of notifications) {
    const ref = db.collection('notifications').doc();
    batch.set(ref, { ...n, read: false, createdAt: now });
    count++;
  }
  console.log(`   Created ${notifications.length} notifications`);

  // 12. Create leaderboard entries
  console.log('\n🏆 Creating leaderboard...');
  const sortedStudents = [...students].sort(() => Math.random() - 0.5);
  for (let i = 0; i < sortedStudents.length; i++) {
    const origIdx = students.indexOf(sortedStudents[i]);
    const ref = db.collection('leaderboard').doc();
    batch.set(ref, {
      studentId: studentUids[origIdx],
      studentName: sortedStudents[i].name,
      grade: sortedStudents[i].grade,
      totalPoints: Math.max(100 - (i * 15) + Math.floor(Math.random() * 20), 10),
      badges: Math.floor(Math.random() * 5) + 1,
      rank: i + 1,
      month: '2026-08',
      updatedAt: now,
    });
    count++;
  }
  console.log(`   Created ${students.length} leaderboard entries`);

  // 13. Create badges
  console.log('\n🏅 Creating badges...');
  const badgeData = [
    { name: 'First Speech', description: 'Delivered your first speech in class', icon: '🎤', category: 'speaking' },
    { name: 'Storyteller', description: 'Wrote and shared an original story', icon: '📖', category: 'writing' },
    { name: 'Debate Champion', description: 'Won your first debate competition', icon: '🏆', category: 'speaking' },
    { name: 'Perfect Attendance', description: 'Attended all classes in a month', icon: '⭐', category: 'attendance' },
    { name: 'Quick Learner', description: 'Completed a course with top marks', icon: '🎓', category: 'academic' },
    { name: 'Creative Writer', description: 'Published 3 original pieces', icon: '✍️', category: 'writing' },
    { name: 'Confident Speaker', description: 'Gave 5 impromptu speeches', icon: '💬', category: 'speaking' },
    { name: 'Team Player', description: 'Participated in 3 group activities', icon: '🤝', category: 'teamwork' },
  ];
  for (const b of badgeData) {
    const ref = db.collection('badges').doc();
    batch.set(ref, { ...b, createdAt: now });
    count++;
  }
  console.log(`   Created ${badgeData.length} badges`);

  // 14. Create certificates
  console.log('\n📜 Creating certificates...');
  for (let i = 0; i < 5; i++) {
    const ref = db.collection('certificates').doc();
    batch.set(ref, {
      studentId: studentUids[i],
      studentName: students[i].name,
      courseId: courseIds[i % 2],
      courseName: courses[i % 2].name,
      certificateType: 'completion',
      issueDate: '2026-07-31',
      certificateUrl: '',
      createdAt: now,
    });
    count++;
  }
  console.log(`   Created 5 certificates`);

  // 15. Create materials
  console.log('\n📂 Creating study materials...');
  const materials = [
    { courseId: 0, title: 'Public Speaking Handbook', description: 'Complete guide to public speaking for beginners', type: 'pdf', classId: classIds[0] },
    { courseId: 0, title: 'Body Language Tips', description: 'Visual guide to effective body language during speeches', type: 'image', classId: classIds[0] },
    { courseId: 1, title: 'Creative Writing Workbook', description: 'Exercises and prompts for creative writing practice', type: 'pdf', classId: classIds[2] },
    { courseId: 1, title: 'Grammar Reference Sheet', description: 'Quick reference for common grammar rules', type: 'pdf', classId: classIds[2] },
    { courseId: 2, title: 'Content Writing Templates', description: 'Ready-to-use templates for blog posts and articles', type: 'pdf', classId: classIds[4] },
    { courseId: 3, title: 'Debate Preparation Guide', description: 'How to research, structure, and deliver debate arguments', type: 'pdf', classId: classIds[5] },
  ];
  for (const m of materials) {
    const ref = db.collection('materials').doc();
    batch.set(ref, { ...m, fileUrl: '', uploadedBy: 'admin', status: 'active', createdAt: now, updatedAt: now });
    count++;
  }
  console.log(`   Created ${materials.length} study materials`);

  // 16. Create demo requests
  console.log('\n📞 Creating demo requests...');
  const demoRequests = [
    { name: 'Sunitha Reddy', mobile: '9900112233', email: 'sunitha.r@gmail.com', childName: 'Vihaan Reddy', childAge: '8', courseInterest: 'Public Speaking', status: 'new' },
    { name: 'Amit Patel', mobile: '9900112244', email: 'amit.p@gmail.com', childName: 'Nisha Patel', childAge: '11', courseInterest: 'Creative Writing', status: 'contacted' },
    { name: 'Kavitha Ram', mobile: '9900112255', email: 'kavitha.r@gmail.com', childName: 'Aditya Ram', childAge: '10', courseInterest: 'Both Courses', status: 'completed' },
  ];
  for (const d of demoRequests) {
    const ref = db.collection('demoRequests').doc();
    batch.set(ref, { ...d, createdAt: now, updatedAt: now });
    count++;
  }
  console.log(`   Created ${demoRequests.length} demo requests`);

  // Commit all batched writes
  console.log('\n⏳ Writing to Firestore...');
  await batch.commit();

  console.log(`\n✅ Seed complete! ${count} documents created.`);
  console.log('\n📋 Login Credentials:');
  console.log('   Admin:   admin@srivallischool.com / Admin@123');
  console.log('   Teacher: lakshmi@srivallischool.com / Teacher@123');
  console.log('   Student: aarav@parent.com / Student@123');
  console.log('   Parent:  rajesh.mehta@gmail.com / Parent@123');
}

seed().catch(e => {
  console.error('❌ Seed error:', e);
  process.exit(1);
});
