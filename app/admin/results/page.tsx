'use client';

import { useEffect, useState } from 'react';
import Header from '@/app/components/Header';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminResultsPage() {
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

  // Helper to format data for export
  const getExportData = () => {
    return results.map((result) => {
      const percentage = Math.round((result.score / result.totalQuestions) * 100);
      const date = new Date(result.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric' 
      });
      return {
        'Student Name': result.user?.name || 'Unknown',
        'Email': result.user?.email || 'Unknown',
        'Exam': result.examBody,
        'Subject': result.subject,
        'Topic': result.topic || 'Full Mock',
        'Score': `${result.score} / ${result.totalQuestions}`,
        'Grade': `${percentage}%`,
        'Date': date
      };
    });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = getExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Results');
    
    // Auto-size columns (optional but looks great)
    const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, 'TVC_Student_Performance.xlsx');
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add Title
    doc.setFontSize(16);
    doc.setTextColor(62, 39, 35); // Virtue Brown
    doc.text('The Virtue College - Student Performance', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    // Prepare table data
    const data = getExportData();
    const tableData = data.map(row => [
      row['Student Name'],
      row['Exam'],
      row['Subject'],
      row['Topic'],
      row['Score'],
      row['Grade'],
      row['Date']
    ]);

    // Generate Table
    (doc as any).autoTable({
      head: [['Student', 'Exam', 'Subject', 'Topic', 'Score', 'Grade', 'Date']],
      body: tableData,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [62, 39, 35], textColor: [253, 251, 247] }, // Virtue Brown & Cream
      alternateRowStyles: { fillColor: [245, 230, 211] }, // Virtue Cream Dark
      styles: { fontSize: 9, cellPadding: 3 },
    });

    doc.save('TVC_Student_Performance.pdf');
  };

  return (
    <div className="min-h-screen bg-virtue-cream">
      <Header />
      <main className="max-w-7xl mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-virtue-brown">Student Performance</h1>
            <p className="text-virtue-brown/70 mt-1">Monitor and export all exam results across the platform.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => router.push('/admin')} 
              className="px-4 py-2 bg-virtue-cream-dark text-virtue-brown rounded-lg font-semibold hover:bg-virtue-orange hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </button>
            {results.length > 0 && (
              <>
                <button 
                  onClick={handleExportExcel}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  📊 Export Excel
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  📄 Export PDF
                </button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-virtue-brown font-semibold">Loading results...</div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-virtue-orange/10">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-virtue-brown mb-2">No exams taken yet!</h2>
            <p className="text-virtue-brown/70">Student results will appear here as soon as they complete an exam.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-virtue-orange/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-virtue-brown text-virtue-cream">
                  <tr>
                    <th className="p-4 text-sm font-semibold">Student Name</th>
                    <th className="p-4 text-sm font-semibold">Exam</th>
                    <th className="p-4 text-sm font-semibold">Subject</th>
                    <th className="p-4 text-sm font-semibold">Topic</th>
                    <th className="p-4 text-sm font-semibold">Score</th>
                    <th className="p-4 text-sm font-semibold">Grade</th>
                    <th className="p-4 text-sm font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-virtue-cream-dark">
                  {results.map((result) => {
                    const percentage = Math.round((result.score / result.totalQuestions) * 100);
                    const date = new Date(result.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', month: 'short', day: 'numeric' 
                    });

                    let gradeColor = 'bg-red-100 text-red-700';
                    if (percentage >= 70) gradeColor = 'bg-green-100 text-green-700';
                    else if (percentage >= 50) gradeColor = 'bg-yellow-100 text-yellow-700';

                    return (
                      <tr key={result.id} className="hover:bg-virtue-cream/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-virtue-brown">{result.user?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{result.user?.email}</div>
                        </td>
                        <td className="p-4 text-sm text-virtue-brown font-medium">{result.examBody}</td>
                        <td className="p-4 text-sm text-virtue-brown">{result.subject}</td>
                        <td className="p-4 text-sm text-gray-600">{result.topic || 'Full Mock'}</td>
                        <td className="p-4 text-sm font-bold text-virtue-brown">{result.score} / {result.totalQuestions}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${gradeColor}`}>
                            {percentage}%
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-500">{date}</td>
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