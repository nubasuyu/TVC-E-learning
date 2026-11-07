'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/app/components/Header';

export default function PracticePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();

  // Get the exam and subject names from the URL
  const examName = params.exam as string;
  const subjectName = params.subject as string;

  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch topics dynamically from the catalog
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/catalog')
        .then(res => res.json())
        .then(data => {
          // Find the current subject's ID from the database
          const currentSubject = data.subjects?.find((s: any) => s.name === subjectName);
          
          if (currentSubject) {
            // Filter the topics to only show those belonging to this subject
            const subjectTopics = data.topics?.filter((t: any) => t.subjectId === currentSubject.id) || [];
            setTopics(subjectTopics);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load topics', err);
          setLoading(false);
        });
    }
  }, [subjectName, status]);

  // Navigate to the exam page with a specific topic
  const handleTopicClick = (topicName: string) => {
    router.push(`/exam?exam=${encodeURIComponent(examName)}&subject=${encodeURIComponent(subjectName)}&topic=${encodeURIComponent(topicName)}`);
  };

  // Navigate to the exam page for a full mock (no specific topic)
  const handleFullMock = () => {
    router.push(`/exam?exam=${encodeURIComponent(examName)}&subject=${encodeURIComponent(subjectName)}`);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-virtue-cream flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-virtue-brown font-semibold">Loading Topics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-virtue-cream flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full py-10 px-4">
        
        {/* Back Button */}
        <button 
          onClick={() => router.push('/')} 
          className="mb-6 flex items-center gap-2 text-virtue-brown/70 hover:text-virtue-orange transition-colors font-medium"
        >
          ← Back to Dashboard
        </button>

        {/* Header Section */}
        <div className="bg-virtue-brown rounded-2xl p-8 text-virtue-cream shadow-lg mb-10 text-center">
          <h1 className="text-3xl font-bold mb-2">{subjectName} Practice</h1>
          <p className="text-virtue-cream/80 text-lg">Exam Body: {examName}</p>
        </div>

        {/* Full Mock Exam Button */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-virtue-brown mb-4">Ready for a challenge?</h2>
          <button 
            onClick={handleFullMock}
            className="w-full bg-virtue-orange text-white p-6 rounded-xl font-bold text-xl hover:bg-virtue-orange-light transition-all shadow-md flex items-center justify-between group"
          >
            <span>📝 Take Full Mock Exam</span>
            <span className="bg-white/20 px-4 py-2 rounded-lg text-sm group-hover:scale-105 transition-transform">Start Now →</span>
          </button>
        </div>

        {/* Topics Section */}
        <div>
          <h2 className="text-xl font-bold text-virtue-brown mb-4">Or practice by specific topic:</h2>
          
          {topics.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-virtue-orange/20 text-center">
              <p className="text-virtue-brown/70">No specific topics have been added for {subjectName} yet.</p>
              <p className="text-sm text-gray-500 mt-2">Try the Full Mock Exam above to practice all available questions!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicClick(topic.name)}
                  className="bg-white p-6 rounded-xl border-2 border-transparent hover:border-virtue-orange hover:shadow-lg transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-virtue-cream flex items-center justify-center text-virtue-orange mb-3 group-hover:bg-virtue-orange group-hover:text-white transition-colors">
                    📌
                  </div>
                  <h3 className="font-bold text-virtue-brown group-hover:text-virtue-orange transition-colors">
                    {topic.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Click to practice</p>
                </button>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}