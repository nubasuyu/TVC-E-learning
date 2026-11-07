import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET: Fetch all catalog items (Available to all logged-in users)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) { // Changed: Any logged-in user can see the catalog now
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const examBodies = await prisma.examBody.findMany({ orderBy: { name: 'asc' } });
    const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
    const topics = await prisma.topic.findMany({ 
      include: { subject: { select: { name: true } } }, 
      orderBy: { name: 'asc' } 
    });

    return NextResponse.json({ examBodies, subjects, topics });
  } catch (error) {
    console.error('Fetch catalog error:', error);
    return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 });
  }
}

// POST: Add a new Exam Body, Subject, or Topic
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, name, subjectId } = body;

    if (type === 'EXAM') {
      const existing = await prisma.examBody.findUnique({ where: { name } });
      if (existing) return NextResponse.json({ error: 'Exam body already exists' }, { status: 400 });
      const newItem = await prisma.examBody.create({ data: { name } });
      return NextResponse.json({ success: true, item: newItem });
    }

    if (type === 'SUBJECT') {
      const existing = await prisma.subject.findUnique({ where: { name } });
      if (existing) return NextResponse.json({ error: 'Subject already exists' }, { status: 400 });
      const newItem = await prisma.subject.create({ data: { name } });
      return NextResponse.json({ success: true, item: newItem });
    }

    if (type === 'TOPIC') {
      if (!subjectId) return NextResponse.json({ error: 'Subject is required for topics' }, { status: 400 });
      const existing = await prisma.topic.findFirst({ where: { name, subjectId: parseInt(subjectId) } });
      if (existing) return NextResponse.json({ error: 'Topic already exists in this subject' }, { status: 400 });
      const newItem = await prisma.topic.create({ data: { name, subjectId: parseInt(subjectId) } });
      return NextResponse.json({ success: true, item: newItem });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Create catalog error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}

// DELETE: Remove an Exam Body, Subject, or Topic
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id || !type) return NextResponse.json({ error: 'Missing id or type' }, { status: 400 });

    if (type === 'EXAM') {
      await prisma.examBody.delete({ where: { id: parseInt(id) } });
    } else if (type === 'SUBJECT') {
      await prisma.subject.delete({ where: { id: parseInt(id) } });
    } else if (type === 'TOPIC') {
      await prisma.topic.delete({ where: { id: parseInt(id) } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete catalog error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}