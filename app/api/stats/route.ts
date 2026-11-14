import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch counts in parallel for speed
    const [studentCount, teacherCount, questionCount, examCount] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.question.count(),
      prisma.result.count(),
    ]);

    // NEW: Get subject breakdown
    const subjectStats = await prisma.result.groupBy({
      by: ['subject'],
      _count: { id: true },
      _avg: { score: true },
      orderBy: {
        _count: { id: 'desc' }
      }
    });

    // Format subject stats for the frontend
    const formattedSubjectStats = subjectStats.map(stat => ({
      subject: stat.subject,
      examsTaken: stat._count.id,
      averageScore: stat._avg.score ? Math.round(stat._avg.score) : 0,
    }));

    return NextResponse.json({
      stats: {
        students: studentCount,
        teachers: teacherCount,
        questions: questionCount,
        examsTaken: examCount,
        subjectBreakdown: formattedSubjectStats, // <-- NEW
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}