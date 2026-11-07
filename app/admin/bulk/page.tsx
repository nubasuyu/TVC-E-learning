'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import Header from '@/app/components/Header';
import { useRouter } from 'next/navigation';

export default function BulkUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus('Parsing file...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Show first 5 rows as preview
        setPreview(results.data.slice(0, 5));
        setStatus(`✅ Parsed ${results.data.length} questions. Ready to upload!`);
      },
      error: (error) => {
        setStatus(`❌ Error parsing file: ${error.message}`);
      },
    });
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return;
    
    setIsUploading(true);
    setStatus('Uploading to database... This may take a minute.');

    const file = fileInputRef.current.files[0];
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch('/api/bulk-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions: results.data }),
          });
          
          const data = await res.json();
          if (data.success) {
            setStatus(`🎉 Success! ${data.message}`);
          } else {
            setStatus(`❌ Error: ${data.error}`);
          }
        } catch (error) {
          setStatus('❌ Network error during upload.');
        } finally {
          setIsUploading(false);
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Bulk Upload Questions</h1>
          <button onClick={() => router.push('/admin')} className="text-blue-600 hover:underline">← Back to Single Upload</button>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm text-blue-800">
            <p className="font-bold mb-2">📄 How to format your CSV file:</p>
            <p>Your CSV must have these exact headers in the first row:</p>
            <code className="block bg-white p-2 rounded mt-2 text-xs overflow-x-auto">
              exam, subject, topic, year, question_text, opt_a, opt_b, opt_c, opt_d, correct
            </code>
            <p className="mt-2 text-xs">Example: <code>JAMB, Mathematics, Algebra, 2023, Solve 2x=4, 2, 3, 4, 5, A</code></p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange} 
              ref={fileInputRef}
              className="hidden" 
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="text-4xl mb-2">📁</div>
              <p className="font-semibold text-gray-700">Click to select your CSV file</p>
              <p className="text-sm text-gray-500 mt-1">{fileName || 'No file selected'}</p>
            </label>
          </div>

          {preview.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-700 mb-2">Preview (First 5 rows):</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key} className="p-2 border-b">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="p-2">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <p className={`font-medium ${status.includes('Success') || status.includes('🎉') ? 'text-green-600' : status.includes('Error') || status.includes('❌') ? 'text-red-600' : 'text-gray-500'}`}>
              {status}
            </p>
            <button 
              onClick={handleUpload} 
              disabled={isUploading || !fileName}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
            >
              {isUploading ? 'Uploading...' : 'Upload to Database'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}