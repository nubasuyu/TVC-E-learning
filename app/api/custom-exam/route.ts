import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { examBodyName, subjectsConfig, totalTime } = body;
    // subjectsConfig = [{ subjectName, topicName, numQuestions }]

    let allQuestions: any[] = [];

    for (const config of subjectsConfig) {
      const whereClause: any = {
        examBody: { name: examBodyName },
        subject: { name: config.subjectName }
      };

      if (config.topicName && config.topicName !== 'All') {
        whereClause.topic = { name: config.topicName };
      }

      // 1. Fetch only IDs for performance
      const allIds = await prisma.question.findMany({
        where: whereClause,
        select: { id: true }
      });

      // 2. Shuffle IDs
      const shuffledIds = allIds.map((q: any) => q.id).sort(() => 0.5 - Math.random());
      
      // 3. Slice to requested number of questions
      const selectedIds = shuffledIds.slice(0, config.numQuestions);

      // 4. Fetch full question details
      const questions = await prisma.question.findMany({
        where: { id: { in: selectedIds } },
        include: { options: true, subject: true, topic: true }
      });

      // 5. Sort to maintain shuffled order
      const randomized = questions.sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));
      
      // Attach subject name for frontend grouping/display
      randomized.forEach((q: any) => {
        q.customSubjectName = config.subjectName;
      });

      allQuestions = allQuestions.concat(randomized);
    }

    // Optional: Shuffle the final combined array so subjects are mixed (like real JAMB), 
    // or remove this line to keep them grouped by subject.
    allQuestions.sort(() => 0.5 - Math.random());

    return NextResponse.json({ 
      success: true, 
      questions: allQuestions, 
      totalTime,
      examBodyName
    });
  } catch (error) {
    console.error('Custom exam fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch custom exam' }, { status: 500 });
  }
}