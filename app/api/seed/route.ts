import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() { // Changed from POST to GET
  try {
    // 1. Create or find Exam Body and Subject
    const jamb = await prisma.examBody.upsert({
      where: { name: 'JAMB' },
      update: {},
      create: { name: 'JAMB' },
    });

    const math = await prisma.subject.upsert({
      where: { name: 'Mathematics' },
      update: {},
      create: { name: 'Mathematics' },
    });

    // 2. Create the Question and its Options all at once
    const question = await prisma.question.create({
      data: {
        examBodyId: jamb.id,
        subjectId: math.id,
        questionType: 'MCQ_SINGLE',
        year: 2023,
        content: JSON.stringify({
          text: "Based on the table below, what is the average annual growth rate?",
          table_html: `<table class="min-w-full divide-y divide-gray-200 text-sm"><thead class="bg-gray-50"><tr><th class="px-4 py-2 text-left font-medium text-gray-700">Year</th><th class="px-4 py-2 text-left font-medium text-gray-700">Population</th></tr></thead><tbody class="bg-white divide-y divide-gray-200"><tr><td class="px-4 py-2">1995</td><td class="px-4 py-2">500</td></tr><tr><td class="px-4 py-2">2026</td><td class="px-4 py-2">2,500</td></tr></tbody></table>`
        }),
        explanation: JSON.stringify({ text: "The growth is 2000 over 31 years." }),
        options: {
          create: [
            { label: 'A', optionType: 'TEXT', textContent: 'Rate = $\\frac{2000}{31}$ students/year', isCorrect: true },
            { label: 'B', optionType: 'TEXT', textContent: 'Rate = $100$ students/year', isCorrect: false },
            { label: 'C', optionType: 'IMAGE', imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop', isCorrect: false },
            { label: 'D', optionType: 'BOTH', textContent: 'Cannot be determined', imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=150&h=150&fit=crop', isCorrect: false },
          ],
        },
      },
      include: { options: true, examBody: true, subject: true },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Database seeded successfully! Now visit http://localhost:3000 to see the question.",
      question 
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to seed database. It might already be seeded. Try deleting the dev.db file and running the seed again.' 
    }, { status: 500 });
  }
}