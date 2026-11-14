'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { InlineMath } from 'react-katex';
import DOMPurify from 'dompurify';
import 'katex/dist/katex.min.css';
import Header from '../components/Header';

// Helper to render math and text safely
const RenderTextWithMath = ({ text }: { text: string }) => {
  if (!text) return null;
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          return <InlineMath key={index} math={part.slice(1, -1)} />;
        }
        return <span key={index} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(part) }} />;
      })}
    </span>
  );
};

// Main Exam Component
function ExamContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const examName = searchParams.get('exam') || 'JAMB';
  const subjectName = searchParams.get('subject') || 'Mathematics';
  const topicName = searchParams.get('topic');

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [loading, setLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // 1. Fetch questions
  useEffect(() => {
    async function fetchExam() {
      try {
        let fetchUrl = `/api/exam?exam=${examName}&subject=${subjectName}`;
        if (topicName) {
          fetchUrl += `&topic=${encodeURIComponent(topicName)}`;
        }
        
        const res = await fetch(fetchUrl);
        const data = await res.json();
        setQuestions(data.questions || []);
      } catch (error) {
        console.error("Failed to fetch exam", error);
      } finally {
        setLoading(false);
      }
    }
    fetchExam();
  }, [examName, subjectName, topicName]);

  // 2. Timer logic
  useEffect(() => {
    if (timeLeft <= 0 && !isSubmitted) {
      handleSubmitExam(true);
      return;
    }
    const timer = setInterval(() => {
      if (!isSubmitted) {
        setTimeLeft((prev) => prev - 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  // Scroll to top when submitted
  useEffect(() => {
    if (isSubmitted) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 3. Actions
  const handleSelectOption = (questionId: number, optionId: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const toggleFlag = () => {
    const currentId = questions[currentIndex]?.id;
    if (!currentId) return;
    setFlagged((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentId)) newSet.delete(currentId);
      else newSet.add(currentId);
      return newSet;
    });
  };

  const handleSubmitExam = async (auto = false) => {
    if (!auto) {
      const confirmed = window.confirm("⚠️ Are you sure you want to submit your exam? You cannot change your answers after this.");
      if (!confirmed) return;
    } else {
      alert("⏰ Time is up! Your exam is being submitted automatically.");
    }

    // 1. Calculate Score Locally First
    let correctCount = 0;
    questions.forEach(q => {
      const selectedOptionId = answers[q.id];
      const correctOption = q.options.find((opt: any) => opt.isCorrect);
      if (selectedOptionId === correctOption?.id.toString()) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setIsSubmitted(true); // This triggers the Scorecard View immediately

    // 2. Save to Database in Background
    if (session?.user) {
      try {
        const res = await fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examBody: examName,
            subject: subjectName,
            topic: topicName || null,
            score: correctCount,
            totalQuestions: questions.length,
          }),
        });
        
        if (!res.ok) {
          console.error("Failed to save result to database");
        }
      } catch (error) {
        console.error("Network error saving result:", error);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-virtue-cream flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center text-virtue-brown">Loading Exam...</div>
    </div>
  );

  if (questions.length === 0) return (
    <div className="min-h-screen bg-virtue-cream flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center flex-col text-center px-4">
        <h2 className="text-2xl font-bold text-virtue-orange mb-2">No questions found.</h2>
        <p className="text-virtue-brown/70">There are no questions available for {examName} {subjectName} {topicName ? `in ${topicName}` : ''}.</p>
        <button onClick={() => window.location.href = '/'} className="mt-6 px-6 py-3 bg-virtue-brown text-virtue-cream rounded-lg font-semibold hover:bg-virtue-brown-light transition-colors">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  // --- SCORECARD VIEW ---
  if (isSubmitted) {
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="min-h-screen bg-virtue-cream flex flex-col">
        <Header />
        <div className="flex-1 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center border-t-8 border-virtue-orange">
              <h1 className="text-3xl font-bold text-virtue-brown mb-2">Exam Submitted!</h1>
              <p className="text-virtue-brown/70 mb-6">
                Here is how you performed on the {examName} {subjectName} {topicName ? `(${topicName})` : ''} Mock Exam.
              </p>
              
              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-virtue-brown">{score}/{questions.length}</div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide">Total Score</div>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${percentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>{percentage}%</div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide">Percentage</div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => window.location.href = '/'} 
                  className="px-6 py-3 bg-virtue-brown text-virtue-cream rounded-lg font-semibold hover:bg-virtue-brown-light transition-colors"
                >
                  Back to Dashboard
                </button>
                <button 
                  onClick={() => window.location.href = '/progress'} 
                  className="px-6 py-3 bg-virtue-cream-dark text-virtue-brown rounded-lg font-semibold hover:bg-virtue-orange hover:text-white transition-colors"
                >
                  View My Progress
                </button>
              </div>
            </div>

            <h2 className="text-xl font-bold text-virtue-brown mb-4">Question Breakdown & Corrections</h2>
            <div className="space-y-6">
              {questions.map((q, index) => {
                const selectedOptionId = answers[q.id];
                const correctOption = q.options.find((opt: any) => opt.isCorrect);
                const isCorrect = selectedOptionId === correctOption?.id.toString();
                
                // Safely parse content
                let qText = '';
                try {
                  const parsed = JSON.parse(q.content);
                  qText = parsed.text || q.content;
                } catch (e) {
                  qText = q.content;
                }

                return (
                  <div key={q.id} className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-virtue-brown">Question {index + 1}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isCorrect ? 'CORRECT' : 'INCORRECT'}
                      </span>
                    </div>
                    
                    <div className="text-virtue-brown mb-4 text-lg">
                      <RenderTextWithMath text={qText} />
                    </div>

                    <div className="space-y-2 mb-4">
                      {q.options.map((opt: any) => {
                        const isSelected = selectedOptionId === opt.id.toString();
                        const isTheCorrectOne = opt.isCorrect;
                        
                        let bgClass = "bg-virtue-cream border-virtue-orange/20";
                        if (isSelected && !isTheCorrectOne) bgClass = "bg-red-50 border-red-300"; // Wrong answer selected
                        if (isTheCorrectOne) bgClass = "bg-green-50 border-green-300"; // Correct answer

                        return (
                          <div key={opt.id} className={`p-3 rounded-lg border flex items-center gap-3 ${bgClass}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 
                              ${isTheCorrectOne ? 'bg-green-500 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-virtue-cream-dark text-virtue-brown'}`}>
                              {opt.label}
                            </div>
                            <div className="text-virtue-brown">
                              <RenderTextWithMath text={opt.textContent || ''} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="bg-virtue-cream-dark p-4 rounded-lg border border-virtue-orange/20 mt-4">
                        <p className="text-sm font-bold text-virtue-brown mb-1">💡 Explanation:</p>
                        <p className="text-virtue-brown/80 text-sm">
                          {(() => {
                            try {
                              const parsed = JSON.parse(q.explanation);
                              return <RenderTextWithMath text={parsed.text || q.explanation} />;
                            } catch (e) {
                              return <RenderTextWithMath text={q.explanation} />;
                            }
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- EXAM VIEW ---
  const currentQuestion = questions[currentIndex];
  let questionText = '';
  try {
    const parsed = JSON.parse(currentQuestion.content);
    questionText = parsed.text || currentQuestion.content;
  } catch (e) {
    questionText = currentQuestion.content;
  }
  
  const isFlagged = flagged.has(currentQuestion.id);

  return (
    <div className="min-h-screen bg-virtue-cream flex flex-col">
      <Header />
      
      <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-16 z-10 border-b border-virtue-orange/20">
        <h1 className="text-xl font-bold text-virtue-brown">
          {examName} {subjectName} {topicName ? `(${topicName})` : ''} CBT
        </h1>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg font-mono text-lg font-bold ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-virtue-cream-dark text-virtue-brown'}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex flex-col">
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-6 flex-1 border border-virtue-orange/10">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-sm font-bold text-virtue-brown/60 uppercase tracking-wide">
                Question {currentIndex + 1} of {questions.length}
              </h2>
              <button 
                onClick={toggleFlag}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold transition-colors
                  ${isFlagged ? 'bg-virtue-orange/20 text-virtue-orange border border-virtue-orange' : 'bg-virtue-cream-dark text-virtue-brown hover:bg-virtue-cream'}`}
              >
                {isFlagged ? '🚩 Flagged' : '🏳️ Flag for Review'}
              </button>
            </div>

            <div className="text-lg text-virtue-brown leading-relaxed mb-8">
              <RenderTextWithMath text={questionText} />
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option: any) => {
                const isSelected = answers[currentQuestion.id] === option.id.toString();
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(currentQuestion.id, option.id.toString())}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-4
                      ${isSelected ? 'border-virtue-orange bg-virtue-cream-dark' : 'border-virtue-orange/20 hover:border-virtue-orange/50'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
                      ${isSelected ? 'bg-virtue-orange text-white' : 'bg-virtue-cream-dark text-virtue-brown'}`}>
                      {option.label}
                    </div>
                    <div className="text-virtue-brown text-lg">
                      <RenderTextWithMath text={option.textContent || ''} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button 
              onClick={() => setCurrentIndex(currentIndex - 1)} 
              disabled={currentIndex === 0}
              className="px-6 py-3 bg-virtue-cream-dark text-virtue-brown rounded-lg font-semibold hover:bg-virtue-orange hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            
            <button 
              onClick={() => setCurrentIndex(currentIndex + 1)} 
              disabled={currentIndex === questions.length - 1}
              className="px-6 py-3 bg-virtue-brown text-virtue-cream rounded-lg font-semibold hover:bg-virtue-brown-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>

        <aside className="w-full md:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-md p-5 sticky top-36 border border-virtue-orange/10">
            <h3 className="font-bold text-virtue-brown mb-4 text-center">Question Navigator</h3>
            
            <div className="grid grid-cols-5 gap-2 mb-6">
              {questions.map((q, index) => {
                const isAnswered = answers[q.id] !== undefined;
                const isQFlagged = flagged.has(q.id);
                const isCurrent = index === currentIndex;

                let btnClass = "w-full aspect-square rounded flex items-center justify-center font-bold text-sm transition-all ";
                if (isCurrent) btnClass += "bg-virtue-brown text-white ring-2 ring-virtue-orange ring-offset-2";
                else if (isQFlagged) btnClass += "bg-virtue-orange text-white hover:bg-virtue-orange-light";
                else if (isAnswered) btnClass += "bg-green-600 text-white hover:bg-green-700";
                else btnClass += "bg-virtue-cream-dark text-virtue-brown hover:bg-virtue-cream";

                return (
                  <button key={q.id} onClick={() => setCurrentIndex(index)} className={btnClass}>
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => handleSubmitExam()}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md"
            >
              Submit Exam
            </button>

            <div className="space-y-2 text-xs text-virtue-brown/70 border-t border-virtue-orange/20 pt-4 mt-4">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-600"></div> <span>Answered</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-virtue-orange"></div> <span>Flagged</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-virtue-cream-dark"></div> <span>Not Answered</span></div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-virtue-cream flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-virtue-brown">Loading Exam Environment...</div>
      </div>
    }>
      <ExamContent />
    </Suspense>
  );
}