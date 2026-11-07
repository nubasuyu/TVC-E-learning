import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const examName = searchParams.get('exam') || 'JAMB';
    const subjectName = searchParams.get('subject') || 'Mathematics';
    const topicName = searchParams.get('topic');

    const whereClause: any = {
      examBody: { name: examName },
      subject: { name: subjectName }
    };

    // STRICT FILTER: If a topic is in the URL, ONLY get questions for that topic
    if (topicName && topicName.trim() !== '') {
      whereClause.topic = { name: topicName };
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      include: { options: true, topic: true },
      take: 50, 
      orderBy: { id: 'desc' }
    });

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions found' }, { status: 404 });
    }

    return NextResponse.json({ examName, subjectName, topicName, questions });
  } catch (error) {
    console.error('Exam fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 });
  }
}