import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(req: Request) {
  try {
    const courses = [
      {
        title: 'Content Writing',
        description: 'Learn how to write engaging, high-quality content for blogs, websites, and social media.',
        tagline: 'Master the art of words',
        weeklyFee: 500,
        monthlyFee: 1800,
        duration: '3 Months',
        category: 'Writing',
        topics: ['Blogging', 'Copywriting', 'SEO Writing'],
        activities: ['Drafting Articles', 'Editing', 'Peer Review'],
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        title: 'Public Speaking',
        description: 'Develop confidence and communication skills to speak effectively in front of any audience.',
        tagline: 'Speak with confidence',
        weeklyFee: 600,
        monthlyFee: 2000,
        duration: '4 Months',
        category: 'Communication',
        topics: ['Body Language', 'Speech Structure', 'Overcoming Fear'],
        activities: ['Impromptu Speaking', 'Debate', 'Presentation'],
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }
    ];

    const results = [];
    for (const course of courses) {
      const docRef = await adminDb.collection('courses').add(course);
      results.push(`Added ${course.title} with ID: ${docRef.id}`);
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
