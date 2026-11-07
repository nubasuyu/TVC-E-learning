import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST: Save a new exam result
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid User ID in session' }, { status: 400 });
    }

    const body = await request.json();
    const { examBody, subject, topic, score, totalQuestions } = body;

    const result = await prisma.result.create({
      data: {
        userId: userId,
        examBody,
        subject,
        topic: topic || null,
        score,
        totalQuestions,
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Save result error:', error);
    return NextResponse.json({ error: 'Failed to save result' }, { status: 500 });
  }
}

// GET: Fetch results (Admins see ALL, Students see ONLY their own)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id);
    const role = (session.user as any).role;

    let results;

    if (role === 'ADMIN') {
      // NEW: Admins get all results, including the student's name and email
      results = await prisma.result.findMany({
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Students only get their own results
      results = await prisma.result.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Fetch results error:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}