'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import { useRouter } from 'next/navigation';

export default function CatalogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [examBodies, setExamBodies] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);

  // Form states
  const [newExam, setNewExam] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [message, setMessage] = useState('');

  // Fetch catalog data
  const fetchCatalog = async () => {
    try {
      const res = await fetch('/api/catalog');
      const data = await res.json();
      if (data.examBodies) setExamBodies(data.examBodies);
      if (data.subjects) setSubjects(data.subjects);
      if (data.topics) setTopics(data.topics);
    } catch (error) {
      console.error('Failed to fetch catalog', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Add Item Handler
  const handleAdd = async (type: 'EXAM' | 'SUBJECT' | 'TOPIC') => {
    setMessage('');
    let name = '';
    let subjectId = undefined;

    if (type === 'EXAM') name = newExam.trim();
    if (type === 'SUBJECT') name = newSubject.trim();
    if (type === 'TOPIC') {
      name = newTopic.trim();
      subjectId = selectedSubjectId;
    }

    if (!name) {
      setMessage('❌ Please enter a name.');
      return;
    }

    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name, subjectId }),
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage(`✅ ${type} added successfully!`);
        if (type === 'EXAM') setNewExam('');
        if (type === 'SUBJECT') setNewSubject('');
        if (type === 'TOPIC') setNewTopic('');
        fetchCatalog(); // Refresh list
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Network error.');
    }
  };

  // Delete Item Handler
  const handleDelete = async (id: number, type: 'EXAM' | 'SUBJECT' | 'TOPIC') => {
    if (!window.confirm(`Are you sure you want to delete this ${type.toLowerCase()}? This may affect existing questions.`)) return;
    
    try {
      const res = await fetch(`/api/catalog?id=${id}&type=${type}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${type} deleted successfully.`);
        fetchCatalog();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Network error.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-virtue-cream flex items-center justify-center">
        <div className="text-virtue-brown font-bold text-xl">Loading Catalog...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-virtue-cream">
      <Header />
      <main className="max-w-6xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-virtue-brown">Manage Catalog</h1>
          <button onClick={() => router.push('/admin')} className="px-4 py-2 bg-virtue-cream-dark text-virtue-brown rounded-lg font-semibold hover:bg-virtue-orange hover:text-white transition-colors">
            ← Back to Dashboard
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${message.includes('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Exam Bodies Section */}
          <div className="bg-white rounded-xl shadow-md border border-virtue-orange/10 p-6">
            <h2 className="text-xl font-bold text-virtue-brown mb-4 flex items-center gap-2">
              📚 Exam Bodies
            </h2>
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {examBodies.map(exam => (
                <div key={exam.id} className="flex justify-between items-center bg-virtue-cream p-3 rounded-lg border border-virtue-orange/10">
                  <span className="font-medium text-virtue-brown">{exam.name}</span>
                  <button onClick={() => handleDelete(exam.id, 'EXAM')} className="text-red-600 hover:text-red-800 text-sm font-semibold">Delete</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g., IGCSE" 
                value={newExam} 
                onChange={(e) => setNewExam(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-virtue-orange outline-none"
              />
              <button onClick={() => handleAdd('EXAM')} className="bg-virtue-brown text-virtue-cream px-3 py-2 rounded-lg text-sm font-semibold hover:bg-virtue-brown-light transition-colors">Add</button>
            </div>
          </div>

          {/* 2. Subjects Section */}
          <div className="bg-white rounded-xl shadow-md border border-virtue-orange/10 p-6">
            <h2 className="text-xl font-bold text-virtue-brown mb-4 flex items-center gap-2">
              📖 Subjects
            </h2>
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {subjects.map(sub => (
                <div key={sub.id} className="flex justify-between items-center bg-virtue-cream p-3 rounded-lg border border-virtue-orange/10">
                  <span className="font-medium text-virtue-brown">{sub.name}</span>
                  <button onClick={() => handleDelete(sub.id, 'SUBJECT')} className="text-red-600 hover:text-red-800 text-sm font-semibold">Delete</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g., Literature" 
                value={newSubject} 
                onChange={(e) => setNewSubject(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-virtue-orange outline-none"
              />
              <button onClick={() => handleAdd('SUBJECT')} className="bg-virtue-brown text-virtue-cream px-3 py-2 rounded-lg text-sm font-semibold hover:bg-virtue-brown-light transition-colors">Add</button>
            </div>
          </div>

          {/* 3. Topics Section */}
          <div className="bg-white rounded-xl shadow-md border border-virtue-orange/10 p-6">
            <h2 className="text-xl font-bold text-virtue-brown mb-4 flex items-center gap-2">
              📌 Topics
            </h2>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-virtue-brown mb-1">Select Subject First:</label>
              <select 
                value={selectedSubjectId} 
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-virtue-orange outline-none"
              >
                <option value="">-- Choose a Subject --</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
              {selectedSubjectId ? (
                topics.filter(t => t.subjectId === parseInt(selectedSubjectId)).map(topic => (
                  <div key={topic.id} className="flex justify-between items-center bg-virtue-cream p-3 rounded-lg border border-virtue-orange/10">
                    <span className="font-medium text-virtue-brown text-sm">{topic.name}</span>
                    <button onClick={() => handleDelete(topic.id, 'TOPIC')} className="text-red-600 hover:text-red-800 text-xs font-semibold">Delete</button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic text-center py-4">Select a subject to view its topics.</p>
              )}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g., Algebra" 
                value={newTopic} 
                onChange={(e) => setNewTopic(e.target.value)}
                disabled={!selectedSubjectId}
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-virtue-orange outline-none disabled:bg-gray-100"
              />
              <button 
                onClick={() => handleAdd('TOPIC')} 
                disabled={!selectedSubjectId}
                className="bg-virtue-orange text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-virtue-orange-light transition-colors disabled:bg-gray-400"
              >
                Add
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}