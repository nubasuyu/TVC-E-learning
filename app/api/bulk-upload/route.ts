import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { questions } = body; // Array of question objects

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'No questions provided' }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each question
    for (const q of questions) {
      try {
        // 1. Find or Create Exam Body
        const examBody = await prisma.examBody.upsert({
          where: { name: q.exam },
          update: {},
          create: { name: q.exam },
        });

        // 2. Find or Create Subject
        const subject = await prisma.subject.upsert({
          where: { name: q.subject },
          update: {},
          create: { name: q.subject },
        });

        // 3. Find or Create Topic (FIXED: Using findFirst instead of unique constraint)
        let topicId = null;
        if (q.topic && q.topic.trim() !== '') {
          // First, try to find if topic already exists
          let topic = await prisma.topic.findFirst({
            where: { 
              name: q.topic, 
              subjectId: subject.id 
            }
          });

          // If it doesn't exist, create it
          if (!topic) {
            topic = await prisma.topic.create({
              data: { 
                name: q.topic, 
                subjectId: subject.id 
              }
            });
          }
          
          topicId = topic.id;
        }

        // 4. Create the Question and Options
        await prisma.question.create({
          data: {
            examBodyId: examBody.id,
            subjectId: subject.id,
            topicId: topicId,
            year: parseInt(q.year) || 2024,
            content: JSON.stringify({ text: q.question_text, table_html: '' }),
            options: {
              create: [
                { label: 'A', textContent: q.opt_a, optionType: 'TEXT', isCorrect: q.correct === 'A' || q.correct === 'a' },
                { label: 'B', textContent: q.opt_b, optionType: 'TEXT', isCorrect: q.correct === 'B' || q.correct === 'b' },
                { label: 'C', textContent: q.opt_c, optionType: 'TEXT', isCorrect: q.correct === 'C' || q.correct === 'c' },
                { label: 'D', textContent: q.opt_d, optionType: 'TEXT', isCorrect: q.correct === 'D' || q.correct === 'd' },
              ],
            },
          },
        });
        successCount++;
      } catch (error) {
        console.error('Error processing question:', q, error);
        errorCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${questions.length} questions. ${successCount} saved, ${errorCount} failed.` 
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ error: 'Failed to process bulk upload' }, { status: 500 });
  }
}