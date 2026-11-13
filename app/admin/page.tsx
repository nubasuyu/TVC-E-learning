'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import RichTextEditor from '@/app/components/RichTextEditor';
import Header from '@/app/components/Header';
import { UploadButton } from '@/lib/uploadthing'; 

export default function AdminPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'TEACHER';

  // State for Analytics
  const [stats, setStats] = useState({ students: 0, teachers: 0, questions: 0, examsTaken: 0 });

  const [examBodies, setExamBodies] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [examBody, setExamBody] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState(''); 
  const [year, setYear] = useState('2024');
  const [questionText, setQuestionText] = useState('');
  
  const [options, setOptions] = useState([
    { label: 'A', textContent: '', optionType: 'TEXT', imageUrl: '', isCorrect: false },
    { label: 'B', textContent: '', optionType: 'TEXT', imageUrl: '', isCorrect: false },
    { label: 'C', textContent: '', optionType: 'TEXT', imageUrl: '', isCorrect: false },
    { label: 'D', textContent: '', optionType: 'TEXT', imageUrl: '', isCorrect: false },
  ]);

  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch catalog and stats on load
  useEffect(() => {
    fetch('/api/catalog')
      .then(res => res.json())
      .then(data => {
        setExamBodies(data.examBodies || []);
        setSubjects(data.subjects || []);
        if (data.examBodies?.length) setExamBody(data.examBodies[0].name);
        if (data.subjects?.length) setSubject(data.subjects[0].name);
      });

    // Fetch Analytics Stats
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setStats(data.stats);
      })
      .catch(err => console.error('Failed to load stats', err));
  }, []);

  const handleOptionChange = (index: number, field: string, value: any) => {
    const newOptions = [...options];
    (newOptions[index] as any)[field] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('Saving to database...');

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examBodyName: examBody,
          subjectName: subject,
          topicName: topic, 
          year,
          content: { text: questionText, table_html: '' }, 
          options,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('✅ Success! Question saved to database.');
        setQuestionText('');
        setTopic(''); 
        setOptions(options.map(o => ({ ...o, textContent: '', imageUrl: '', isCorrect: false })));
      } else {
        setStatus('❌ Error saving question: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      setStatus('❌ Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-virtue-cream">
      <Header /> 

      <main className="max-w-6xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-virtue-brown mb-8">
          {userRole === 'ADMIN' ? 'Admin Dashboard' : 'Teacher Admin Panel'}
        </h1>

        {/* Analytics Stats Grid */}
        {userRole === 'ADMIN' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-virtue-orange">
              <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Total Students</p>
              <p className="text-3xl font-bold text-virtue-brown mt-2">{stats.students}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-virtue-brown">
              <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Total Teachers</p>
              <p className="text-3xl font-bold text-virtue-brown mt-2">{stats.teachers}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-virtue-orange">
              <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Total Questions</p>
              <p className="text-3xl font-bold text-virtue-brown mt-2">{stats.questions}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-virtue-brown">
              <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Exams Taken</p>
              <p className="text-3xl font-bold text-virtue-brown mt-2">{stats.examsTaken}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          {userRole === 'ADMIN' && (
            <>
              <a href="/admin/users" className="inline-block bg-virtue-brown text-virtue-cream px-4 py-2 rounded-lg font-semibold hover:bg-virtue-brown-light transition-colors shadow-sm">
                👥 Manage Users & Approvals
              </a>
              <a href="/admin/catalog" className="inline-block bg-virtue-orange text-white px-4 py-2 rounded-lg font-semibold hover:bg-virtue-orange-light transition-colors shadow-sm">
                📚 Manage Catalog (Exams/Subjects/Topics)
              </a>
              <a href="/admin/results" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                📊 Student Performance
              </a>
            </>
          )}
          
          {/* NEW: Manage Questions Button (Visible to both Admin and Teacher) */}
          <a href="/admin/questions" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-sm">
            📝 Manage & Edit Questions
          </a>
          
          <a href="/admin/bulk" className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm">
            📤 Bulk Upload Questions (CSV)
          </a>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border border-virtue-orange/10 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-virtue-brown mb-1">Exam Body</label>
              <select value={examBody} onChange={(e) => setExamBody(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-virtue-orange outline-none">
                {examBodies.map(exam => <option key={exam.id} value={exam.name}>{exam.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-virtue-brown mb-1">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-virtue-orange outline-none">
                {subjects.map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-virtue-brown mb-1">Year</label>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-virtue-orange outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-virtue-brown mb-1">Topic (Optional)</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-virtue-orange outline-none" placeholder="e.g., Algebra, Geometry" />
          </div>

          <div>
            <label className="block text-sm font-medium text-virtue-brown mb-1">Question Content</label>
            <RichTextEditor content={questionText} onUpdate={(html) => setQuestionText(html)} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-virtue-brown">Options</h3>
            {options.map((opt, index) => (
              <div key={index} className="bg-virtue-cream p-4 rounded-lg border border-virtue-orange/20 space-y-3">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-virtue-brown w-6">{opt.label}.</span>
                  <input 
                    type="text" 
                    value={opt.textContent} 
                    onChange={(e) => handleOptionChange(index, 'textContent', e.target.value)} 
                    className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-virtue-orange outline-none"
                    placeholder={`Option ${opt.label} text (Use $ for math)`}
                  />
                  <label className="flex items-center gap-2 text-sm text-virtue-brown cursor-pointer">
                    <input type="checkbox" checked={opt.isCorrect} onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)} className="w-4 h-4 accent-virtue-orange" />
                    Correct?
                  </label>
                </div>

                <div className="ml-10 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">Option Image (Optional):</p>
                  {opt.imageUrl ? (
                    <div className="flex items-center gap-4 bg-white p-2 rounded border border-virtue-orange/20">
                      <img src={opt.imageUrl} alt="Uploaded" className="h-20 w-20 object-cover rounded border" />
                      <div className="flex flex-col">
                        <span className="text-xs text-green-600 font-bold">Image Uploaded!</span>
                        <button type="button" onClick={() => handleOptionChange(index, 'imageUrl', '')} className="text-xs text-red-600 hover:underline mt-1">Remove Image</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <div className="inline-block bg-virtue-orange hover:bg-virtue-orange-light rounded-lg p-1 cursor-pointer transition-colors">
                        <UploadButton
                          endpoint="imageUploader"
                          onClientUploadComplete={(res) => {
                            handleOptionChange(index, 'imageUrl', res[0].url);
                            handleOptionChange(index, 'optionType', 'IMAGE');
                            setStatus("✅ Image uploaded successfully!");
                          }}
                          onUploadError={(error: Error) => setStatus(`❌ Upload Error: ${error.message}`)}
                          content={{ button({ ready }) { return <div className="text-white font-bold px-4 py-2">{ready ? '📤 Upload Image' : 'Uploading...'}</div>; }}}
                          appearance={{ button: "bg-virtue-orange hover:bg-virtue-orange-light text-white font-bold py-2 px-4 rounded-lg !important", allowedContent: "hidden" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-virtue-orange/20 flex items-center justify-between">
            <p className={`font-medium ${status.includes('Success') ? 'text-green-600' : status.includes('Error') ? 'text-red-600' : 'text-gray-500'}`}>{status}</p>
            <button type="submit" disabled={isSubmitting} className="bg-virtue-brown text-virtue-cream px-8 py-3 rounded-lg font-semibold hover:bg-virtue-brown-light transition-colors disabled:bg-gray-400 shadow-md">
              {isSubmitting ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}