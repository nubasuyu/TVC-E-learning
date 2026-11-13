'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Header from './components/Header';

export default function Dashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Dynamic state for catalog
  const [examBodies, setExamBodies] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState('');

  useEffect(() => {
    if (session && ((session.user as any)?.role === 'TEACHER' || (session.user as any)?.role === 'ADMIN')) {
      router.replace('/admin');
    }
    
    // Fetch catalog from database
    fetch('/api/catalog')
      .then(res => res.json())
      .then(data => {
        setExamBodies(data.examBodies || []);
        setSubjects(data.subjects || []);
        if (data.examBodies && data.examBodies.length > 0) {
          setSelectedExam(data.examBodies[0].name);
        }
      })
      .catch(err => console.error('Failed to load catalog', err));
  }, [session, router]);

  const goToPractice = (examName: string, subjectName: string) => {
    router.push(`/practice/${examName}/${subjectName}`);
  };

  // Filter subjects for the selected exam (For now, we show all subjects for all exams)
  const currentSubjects = subjects; 

  return (
    <main className="min-h-screen bg-virtue-cream">
      <Header />
      
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-virtue-brown mb-2">The Virtue College E-Learning</h1>
          <p className="text-virtue-brown/70 text-lg">Select your exam board and subject to begin practicing.</p>
        </div>

        {/* NEW: Custom Exam Builder Button */}
        <div className="mb-12 text-center">
          <button 
            onClick={() => router.push('/custom-exam')}
            className="bg-virtue-brown text-virtue-cream px-8 py-4 rounded-xl font-bold text-lg hover:bg-virtue-brown-light transition-all shadow-lg flex items-center gap-3 mx-auto group"
          >
            <span className="text-2xl">📝</span> 
            <span>Build Custom Mock Exam (Up to 4 Subjects)</span>
            <span className="bg-virtue-orange text-white text-xs px-3 py-1 rounded-full group-hover:scale-105 transition-transform">New</span>
          </button>
          <p className="text-sm text-virtue-brown/60 mt-3">Simulate a real JAMB exam with English + 3 subjects, custom time, and topic selection.</p>
        </div>

        {examBodies.length === 0 ? (
          <div className="text-center text-virtue-brown py-10">Loading subjects...</div>
        ) : (
          <div className="space-y-10">
            {examBodies.map((exam) => (
              <div key={exam.id} className="bg-white rounded-2xl shadow-md border border-virtue-orange/10 overflow-hidden">
                <div className="bg-virtue-brown p-6 text-virtue-cream">
                  <h2 className="text-2xl font-bold">{exam.name} Past Questions & Practice</h2>
                  <p className="text-virtue-cream/80 text-sm mt-1">Choose a subject below to see available topics and mock exams.</p>
                </div>

                <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentSubjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => goToPractice(exam.name, subject.name)}
                      className="flex flex-col items-center justify-center p-6 bg-virtue-cream rounded-xl border-2 border-transparent hover:border-virtue-orange hover:bg-virtue-cream-dark transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform text-virtue-orange">
                        📚
                      </div>
                      <span className="font-semibold text-virtue-brown group-hover:text-virtue-orange text-center">
                        {subject.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}