import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET: Fetch questions for a specific subject/topic
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'TEACHER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectName = searchParams.get('subject');
    const topicName = searchParams.get('topic');

    if (!subjectName) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    const whereClause: any = { subject: { name: subjectName } };
    if (topicName && topicName.trim() !== '') {
      whereClause.topic = { name: topicName };
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      include: { 
        options: { orderBy: { label: 'asc' } }, 
        topic: true,
        examBody: true
      },
      orderBy: { id: 'desc' },
      take: 100 // Limit to 100 for performance
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Fetch questions error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// PUT: Update a question and its options
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'TEACHER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, content, explanation, year, options } = body;

    // Update the question
    await prisma.question.update({
      where: { id: parseInt(questionId) },
      data: { content, explanation, year: parseInt(year) }
    });

    // Update options sequentially
    if (options && Array.isArray(options)) {
      for (const opt of options) {
        await prisma.option.update({
          where: { id: parseInt(opt.id) },
          data: {
            textContent: opt.textContent,
            imageUrl: opt.imageUrl || null,
            optionType: opt.imageUrl ? 'IMAGE' : 'TEXT',
            isCorrect: opt.isCorrect
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update question error:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}