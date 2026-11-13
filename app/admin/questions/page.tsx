'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';

export default function ManageQuestionsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Fetch catalog on load
  useEffect(() => {
    fetch('/api/catalog')
      .then(res => res.json())
      .then(data => {
        setSubjects(data.subjects || []);
        setTopics(data.topics || []);
      });
  }, []);

  // Fetch questions when subject/topic changes
  const fetchQuestions = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    try {
      const url = new URL('/api/admin/questions', window.location.origin);
      url.searchParams.append('subject', selectedSubject);
      if (selectedTopic) url.searchParams.append('topic', selectedTopic);

      const res = await fetch(url.toString());
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Failed to fetch questions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (q: any) => {
    setEditingQuestion(q);
    setEditForm({
      questionId: q.id,
      content: q.content, // Assuming content is plain text or HTML string
      explanation: q.explanation || '',
      year: q.year || 2024,
      options: q.options.map((opt: any) => ({ ...opt }))
    });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Question updated successfully!');
        setEditingQuestion(null);
        fetchQuestions(); // Refresh list
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (error) {
      alert('❌ Network error');
    } finally {
      setSaving(false);
    }
  };

  const filteredTopics = selectedSubject 
    ? topics.filter(t => {
        const sub = subjects.find(s => s.id === t.subjectId);
        return sub && sub.name === selectedSubject;
      })
    : [];

  return (
    <div className="min-h-screen bg-virtue-cream">
      <Header />
      <main className="max-w-6xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-virtue-brown">Manage Questions</h1>
          <button onClick={() => router.push('/admin')} className="px-4 py-2 bg-virtue-cream-dark text-virtue-brown rounded-lg font-semibold hover:bg-virtue-orange hover:text-white transition-colors">
            ← Back to Dashboard
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-virtue-orange/10 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-virtue-brown mb-1">Subject</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => { setSelectedSubject(e.target.value); setSelectedTopic(''); }}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-virtue-orange outline-none"
            >
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-virtue-brown mb-1">Topic (Optional)</label>
            <select 
              value={selectedTopic} 
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-virtue-orange outline-none"
            >
              <option value="">All Topics</option>
              {filteredTopics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={fetchQuestions}
              disabled={!selectedSubject || loading}
              className="w-full bg-virtue-brown text-virtue-cream py-2 rounded-lg font-semibold hover:bg-virtue-brown-light transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Load Questions'}
            </button>
          </div>
        </div>

        {/* Questions List */}
        {questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-virtue-orange/10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-virtue-orange uppercase tracking-wider">Q{index + 1}</span>
                    <span className="text-xs text-gray-500 ml-2">{q.examBody.name} • {q.year}</span>
                    {q.topic && <span className="text-xs bg-virtue-cream text-virtue-brown px-2 py-1 rounded ml-2">{q.topic.name}</span>}
                  </div>
                  <button 
                    onClick={() => handleEditClick(q)}
                    className="text-sm bg-virtue-orange text-white px-4 py-2 rounded-lg hover:bg-virtue-orange-light transition-colors"
                  >
                    ✏️ Edit
                  </button>
                </div>
                <div className="text-virtue-brown mb-4 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: q.content }} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt: any) => (
                    <div key={opt.id} className={`p-3 rounded-lg border ${opt.isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                      <span className="font-bold text-virtue-brown mr-2">{opt.label}.</span>
                      {opt.optionType === 'IMAGE' && opt.imageUrl ? (
                        <img src={opt.imageUrl} alt="Option" className="h-20 w-auto rounded mt-1" />
                      ) : (
                        <span className="text-gray-700">{opt.textContent}</span>
                      )}
                      {opt.isCorrect && <span className="ml-2 text-green-600 text-xs font-bold">✓ Correct</span>}
                    </div>
                ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingQuestion && editForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-virtue-brown mb-4">Edit Question</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-virtue-brown mb-1">Question Content (HTML allowed)</label>
                  <textarea 
                    value={editForm.content} 
                    onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-virtue-orange outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-virtue-brown mb-1">Explanation (Optional)</label>
                  <textarea 
                    value={editForm.explanation} 
                    onChange={(e) => setEditForm({...editForm, explanation: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3 h-20 focus:ring-2 focus:ring-virtue-orange outline-none"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-virtue-brown mb-1">Year</label>
                  <input 
                    type="number" 
                    value={editForm.year} 
                    onChange={(e) => setEditForm({...editForm, year: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-virtue-orange outline-none"
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-virtue-brown mb-3">Options</h3>
                  {editForm.options.map((opt: any, idx: number) => (
                    <div key={opt.id} className="flex gap-3 mb-3 items-start">
                      <span className="font-bold text-virtue-brown mt-2 w-6">{opt.label}</span>
                      <input 
                        type="text" 
                        value={opt.textContent || ''} 
                        onChange={(e) => {
                          const newOpts = [...editForm.options];
                          newOpts[idx].textContent = e.target.value;
                          setEditForm({...editForm, options: newOpts});
                        }}
                        className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-virtue-orange outline-none"
                        placeholder="Option text"
                      />
                      <label className="flex items-center gap-2 text-sm text-virtue-brown mt-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={opt.isCorrect} 
                          onChange={(e) => {
                            const newOpts = [...editForm.options];
                            newOpts[idx].isCorrect = e.target.checked;
                            setEditForm({...editForm, options: newOpts});
                          }}
                          className="w-4 h-4 accent-virtue-orange" 
                        />
                        Correct
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button 
                  onClick={() => setEditingQuestion(null)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit} 
                  disabled={saving}
                  className="px-6 py-2 bg-virtue-orange text-white rounded-lg font-semibold hover:bg-virtue-orange-light transition-colors disabled:bg-gray-400"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}