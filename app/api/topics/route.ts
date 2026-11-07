import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const examName = searchParams.get('exam');
  const subjectName = searchParams.get('subject');

  if (!examName || !subjectName) {
    return NextResponse.json({ error: 'Missing exam or subject' }, { status: 400 });
  }

  try {
    // Find the subject and include its topics, along with a count of questions in each
    const subject = await prisma.subject.findUnique({
      where: { name: subjectName },
      include: {
        topics: {
          include: {
            _count: {
              select: { questions: true }
            }
          }
        }
      }
    });

    if (!subject) {
      return NextResponse.json({ topics: [] });
    }

    // Format the topics for the frontend
    const topics = subject.topics
      .filter(t => t._count.questions > 0) // Only show topics that actually have questions
      .map(t => ({
        name: t.name,
        questionCount: t._count.questions
      }));

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Fetch topics error:', error);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}