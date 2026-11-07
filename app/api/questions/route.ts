import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch questions (Used by the Exam Page)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const examName = searchParams.get('exam') || 'JAMB';
  const subjectName = searchParams.get('subject') || 'Mathematics';
  const topicName = searchParams.get('topic');

  try {
    const whereClause: any = {
      examBody: { name: examName },
      subject: { name: subjectName }
    };

    // STRICT FILTER: Only fetch questions for this specific topic
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
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST: Save a new question (Fixed to prevent duplicate topics)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { examBodyName, subjectName, topicName, year, content, options } = body;

    const examBody = await prisma.examBody.upsert({
      where: { name: examBodyName }, update: {}, create: { name: examBodyName },
    });

    const subject = await prisma.subject.upsert({
      where: { name: subjectName }, update: {}, create: { name: subjectName },
    });

    // FIX: Find existing topic or create a new one (Prevents duplicates!)
    let topicId = null;
    if (topicName && topicName.trim() !== "") {
      let topic = await prisma.topic.findFirst({
        where: { name: topicName, subjectId: subject.id }
      });
      
      if (!topic) {
        topic = await prisma.topic.create({
          data: { name: topicName, subjectId: subject.id }
        });
      }
      topicId = topic.id;
    }

    const question = await prisma.question.create({
      data: {
        examBodyId: examBody.id,
        subjectId: subject.id,
        topicId: topicId, 
        year: parseInt(year),
        content: JSON.stringify(content),
        options: {
          create: options.map((opt: any) => ({
            label: opt.label,
            optionType: opt.optionType,
            textContent: opt.textContent || null,
            imageUrl: opt.imageUrl || null,
            isCorrect: opt.isCorrect || false,
          })),
        },
      },
      include: { options: true },
    });

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('Create question error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create question' }, { status: 500 });
  }
}