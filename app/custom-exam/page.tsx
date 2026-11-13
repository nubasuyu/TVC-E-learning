'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';

export default function CustomExamPage() {
  const router = useRouter();
  const [step, setStep] = useState<'setup' | 'exam' | 'results'>('setup');
  
  // Setup State
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [examBody, setExamBody] = useState('JAMB');
  const [totalTime, setTotalTime] = useState(120);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectConfigs, setSubjectConfigs] = useState<Record<string, { topic: string; numQuestions: number }>>({});
  
  // Exam State
  const [examData, setExamData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch('/api/catalog')
      .then(res => res.json())
      .then(data => {
        setAllSubjects(data.subjects || []);
        setAllTopics(data.topics || []);
        const englishSub = data.subjects?.find((s: any) => s.name.toLowerCase().includes('english'))?.name || data.subjects?.[0]?.name;
        if (englishSub) {
          setSelectedSubjects([englishSub]);
          setSubjectConfigs({ [englishSub]: { topic: 'All', numQuestions: 50 } });
        }
      });
  }, []);

  // Timer Logic
  useEffect(() => {
    if (step === 'exam' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (step === 'exam' && timeLeft === 0 && examData) {
      submitExam();
    }
  }, [step, timeLeft]);

  const toggleSubject = (subName: string) => {
    if (selectedSubjects.includes(subName)) {
      if (selectedSubjects.length <= 1) return;
      setSelectedSubjects(prev => prev.filter(s => s !== subName));
      const newConfigs = { ...subjectConfigs };
      delete newConfigs[subName];
      setSubjectConfigs(newConfigs);
    } else {
      if (selectedSubjects.length >= 4) { alert('Maximum 4 subjects allowed.'); return; }
      setSelectedSubjects(prev => [...prev, subName]);
      setSubjectConfigs(prev => ({ ...prev, [subName]: { topic: 'All', numQuestions: 40 } }));
    }
  };

  const updateConfig = (subName: string, field: 'topic' | 'numQuestions', value: any) => {
    setSubjectConfigs(prev => ({ ...prev, [subName]: { ...prev[subName], [field]: value } }));
  };

  const startExam = async () => {
    const subjectsConfig = selectedSubjects.map(sub => ({
      subjectName: sub,
      topicName: subjectConfigs[sub].topic,
      numQuestions: subjectConfigs[sub].numQuestions
    }));
    const res = await fetch('/api/custom-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examBodyName: examBody, subjectsConfig, totalTime })
    });
    const data = await res.json();
    if (data.success && data.questions.length > 0) {
      setExamData(data);
      setTimeLeft(data.totalTime * 60);
      setCurrentIndex(0);
      setStep('exam');
    } else {
      alert('No questions found for your selection. Try fewer questions or different topics.');
    }
  };

  const submitExam = () => {
    let calculatedScore = 0;
    examData.questions.forEach((q: any) => {
      const selectedOption = q.options.find((o: any) => o.label === userAnswers[q.id]);
      if (selectedOption?.isCorrect) calculatedScore++;
    });
    setScore(calculatedScore);
    fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examBody: examData.examBodyName,
        subject: 'Custom Mock',
        topic: 'Multiple Subjects',
        score: calculatedScore,
        totalQuestions: examData.questions.length
      })
    });
    setStep('results');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentQuestion = examData?.questions[currentIndex];

  // --- RENDER: SETUP ---
  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-virtue-cream">
        <Header />
        <main className="max-w-4xl mx-auto py-10 px-4">
          <button onClick={() => router.push('/')} className="mb-6 text-virtue-brown hover:text-virtue-orange font-medium">← Back to Dashboard</button>
          <h1 className="text-3xl font-bold text-virtue-brown mb-2">Build Custom Mock Exam</h1>
          <p className="text-virtue-brown/70 mb-8">Simulate a real exam. English is compulsory. Max 4 subjects.</p>
          <div className="bg-white p-8 rounded-xl shadow-lg border border-virtue-orange/10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-virtue-brown mb-1">Exam Body</label>
                <select value={examBody} onChange={(e) => setExamBody(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-virtue-orange outline-none">
                  <option value="JAMB">JAMB</option><option value="WAEC">WAEC</option><option value="NECO">NECO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-virtue-brown mb-1">Total Time (Minutes)</label>
                <input type="number" value={totalTime} onChange={(e) => setTotalTime(parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-virtue-orange outline-none" />
              </div>
            </div>
            <div className="border-t pt-6">
              <h3 className="font-bold text-virtue-brown mb-4">Select Subjects (Max 4)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {allSubjects.map(sub => {
                  const isEnglish = sub.name.toLowerCase().includes('english');
                  const isChecked = selectedSubjects.includes(sub.name);
                  return (
                    <label key={sub.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-virtue-cream border-virtue-orange' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleSubject(sub.name)} disabled={isEnglish} className="w-5 h-5 accent-virtue-orange" />
                      <span className="font-medium text-virtue-brown">{sub.name} {isEnglish && <span className="text-xs bg-virtue-orange text-white px-2 py-0.5 rounded ml-2">Compulsory</span>}</span>
                    </label>
                  );
                })}
              </div>
              <div className="space-y-4">
                {selectedSubjects.map(subName => {
                  const subTopics = allTopics.filter(t => allSubjects.find(s => s.id === t.subjectId)?.name === subName);
                  const config = subjectConfigs[subName];
                  return (
                    <div key={subName} className="bg-virtue-cream p-4 rounded-lg border border-virtue-orange/20">
                      <h4 className="font-bold text-virtue-brown mb-3">{subName} Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Topic</label>
                          <select value={config.topic} onChange={(e) => updateConfig(subName, 'topic', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-virtue-orange outline-none">
                            <option value="All">All Topics (Full Subject)</option>
                            {subTopics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Number of Questions (Max 50)</label>
                          <input type="number" min="1" max="50" value={config.numQuestions} onChange={(e) => updateConfig(subName, 'numQuestions', Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-virtue-orange outline-none" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <button onClick={startExam} className="w-full bg-virtue-brown text-virtue-cream py-4 rounded-xl font-bold text-lg hover:bg-virtue-brown-light transition-colors shadow-md mt-4">🚀 Start Custom Exam</button>
          </div>
        </main>
      </div>
    );
  }

  // --- RENDER: EXAM RUNNER (with Navigator) ---
  if (step === 'exam' && examData && currentQuestion) {
    return (
      <div className="min-h-screen bg-virtue-cream flex flex-col">
        {/* Top Bar: Title + Timer */}
        <div className="bg-white border-b border-virtue-orange/20 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
          <h2 className="font-bold text-virtue-brown text-lg">
            {examData.examBodyName} Custom Mock ({selectedSubjects.length} Subjects)
          </h2>
          <div className={`flex items-center gap-2 font-mono font-bold text-lg ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-virtue-brown'}`}>
            <span>⏱️</span> {formatTime(timeLeft)}
          </div>
        </div>

        <main className="flex-1 max-w-6xl mx-auto w-full py-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-virtue-orange/10 min-h-[400px]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-gray-500">QUESTION {currentIndex + 1} OF {examData.questions.length}</span>
                <button
                  onClick={() => setFlagged(prev => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }))}
                  className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${flagged[currentQuestion.id] ? 'bg-orange-200 text-orange-800' : 'bg-virtue-cream text-virtue-brown hover:bg-virtue-cream-dark'}`}
                >
                  {flagged[currentQuestion.id] ? '🚩 Flagged' : '⚑ Flag for Review'}
                </button>
              </div>

              {/* Subject Badge (custom exams mix subjects) */}
              <div className="mb-4">
                <span className="inline-block bg-virtue-brown text-virtue-cream text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  {currentQuestion.customSubjectName}
                </span>
              </div>

              <div className="text-virtue-brown text-lg mb-6 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: currentQuestion.content }} />

              <div className="space-y-3">
                {currentQuestion.options.map((opt: any) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${userAnswers[currentQuestion.id] === opt.label ? 'bg-virtue-cream border-virtue-orange' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQuestion.id}`}
                      value={opt.label}
                      checked={userAnswers[currentQuestion.id] === opt.label}
                      onChange={() => setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: opt.label }))}
                      className="w-5 h-5 accent-virtue-orange"
                    />
                    <span className="font-bold text-virtue-brown w-6">{opt.label}.</span>
                    {opt.optionType === 'IMAGE' && opt.imageUrl ? (
                      <img src={opt.imageUrl} alt="Option" className="h-24 w-auto rounded border" />
                    ) : (
                      <span className="text-gray-700">{opt.textContent}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Prev / Next */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-6 py-3 bg-white border border-gray-300 rounded-lg font-semibold text-virtue-brown hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={() => setCurrentIndex(prev => Math.min(examData.questions.length - 1, prev + 1))}
                disabled={currentIndex === examData.questions.length - 1}
                className="px-6 py-3 bg-virtue-brown text-virtue-cream rounded-lg font-semibold hover:bg-virtue-brown-light disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-virtue-orange/10 sticky top-24">
              <h3 className="font-bold text-virtue-brown mb-4 text-center">Question Navigator</h3>
              <div className="grid grid-cols-6 gap-2 mb-5">
                {examData.questions.map((q: any, idx: number) => {
                  let cellStyle = 'bg-virtue-cream text-virtue-brown';
                  if (userAnswers[q.id]) cellStyle = 'bg-green-500 text-white';
                  if (flagged[q.id]) cellStyle = 'bg-orange-400 text-white';
                  if (idx === currentIndex) cellStyle = 'bg-virtue-brown text-virtue-cream ring-2 ring-virtue-orange';
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 w-9 rounded-md text-sm font-bold transition-transform hover:scale-110 ${cellStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <button onClick={submitExam} className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors mb-5">
                Submit Exam
              </button>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-500"></span> Answered</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-orange-400"></span> Flagged</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-virtue-cream border"></span> Not Answered</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- RENDER: RESULTS ---
  if (step === 'results') {
    const percentage = Math.round((score / examData.questions.length) * 100);
    return (
      <div className="min-h-screen bg-virtue-cream flex items-center justify-center px-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-virtue-orange/20 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-virtue-brown mb-2">Exam Completed!</h1>
          <div className="bg-virtue-cream p-6 rounded-xl mb-6">
            <p className="text-sm text-gray-500 uppercase font-bold">Your Score</p>
            <p className="text-5xl font-bold text-virtue-orange mt-2">{score} / {examData.questions.length}</p>
            <p className="text-xl font-semibold text-virtue-brown mt-2">{percentage}%</p>
          </div>
          <button onClick={() => router.push('/')} className="w-full bg-virtue-brown text-virtue-cream py-3 rounded-lg font-bold hover:bg-virtue-brown-light transition-colors">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}