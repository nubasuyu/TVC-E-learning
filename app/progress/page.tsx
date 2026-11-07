'use client';

import { useEffect, useState } from 'react';
import Header from '@/app/components/Header';
import { useRouter } from 'next/navigation';

export default function ProgressPage() {
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch('/api/results');
        const data = await res.json();
        setResults(data.results || []);
      } catch (error) {
        console.error('Failed to fetch results', error);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
            <p className="text-gray-600 mt-1">Track your exam history and improvement.</p>
          </div>
          <button 
            onClick={() => router.push('/')} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Take New Exam
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading your history...</div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No exams taken yet!</h2>
            <p className="text-gray-600 mb-6">Complete your first mock exam to start tracking your progress.</p>
            <button 
              onClick={() => router.push('/')} 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Exam</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Subject</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Topic</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Score</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((result) => {
                    const percentage = Math.round((result.score / result.totalQuestions) * 100);
                    const date = new Date(result.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', month: 'short', day: 'numeric' 
                    });

                    let gradeColor = 'text-red-600 bg-red-50';
                    if (percentage >= 70) gradeColor = 'text-green-600 bg-green-50';
                    else if (percentage >= 50) gradeColor = 'text-yellow-600 bg-yellow-50';

                    return (
                      <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm text-gray-600">{date}</td>
                        <td className="p-4 text-sm font-medium text-gray-900">{result.examBody}</td>
                        <td className="p-4 text-sm text-gray-700">{result.subject}</td>
                        <td className="p-4 text-sm text-gray-500">{result.topic || 'Full Mock'}</td>
                        <td className="p-4 text-sm font-bold text-gray-900">{result.score} / {result.totalQuestions}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${gradeColor}`}>
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}