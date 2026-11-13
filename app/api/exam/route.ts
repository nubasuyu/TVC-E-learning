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

    // Step 1: Fetch ONLY the IDs of all matching questions (Very fast & lightweight)
    const allQuestionIds = await prisma.question.findMany({
      where: whereClause,
      select: { id: true }
    });

    if (!allQuestionIds || allQuestionIds.length === 0) {
      return NextResponse.json({ error: 'No questions found' }, { status: 404 });
    }

    // Step 2: Shuffle the IDs randomly
    const shuffledIds = allQuestionIds
      .map(q => q.id)
      .sort(() => 0.5 - Math.random());

    // Step 3: Pick up to 50 random IDs (or all of them if there are fewer than 50)
    const selectedIds = shuffledIds.slice(0, 50);

    // Step 4: Fetch the full details (with options and topic) for only those 50 random questions
    const questions = await prisma.question.findMany({
      where: {
        id: { in: selectedIds }
      },
      include: { options: true, topic: true }
    });

    return NextResponse.json({ examName, subjectName, topicName, questions });
  } catch (error) {
    console.error('Exam fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 });
  }
}