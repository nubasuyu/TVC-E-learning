'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Placeholder } from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onUpdate: (html: string) => void;
}

export default function RichTextEditor({ content, onUpdate }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({ placeholder: 'Type your question here... Use $ for math like $x^2$' }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return <div className="p-4 border rounded bg-gray-50">Loading editor...</div>;

  const addImage = () => {
    const url = window.prompt('Enter the image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addMath = () => {
    // Inserts LaTeX delimiters for math
    editor.chain().focus().insertContent(' $ $ ').run();
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-2 items-center">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-3 py-1 rounded text-sm font-bold border ${editor.isActive('bold') ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-100'}`}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-3 py-1 rounded text-sm italic border ${editor.isActive('italic') ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-100'}`}>I</button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button type="button" onClick={addMath} className="px-3 py-1 rounded text-sm bg-white border border-gray-300 hover:bg-gray-100 font-mono">∑ Math ($)</button>
        <button type="button" onClick={addImage} className="px-3 py-1 rounded text-sm bg-white border border-gray-300 hover:bg-gray-100">🖼️ Image</button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="px-3 py-1 rounded text-sm bg-white border border-gray-300 hover:bg-gray-100">📊 Insert Table</button>
        <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="px-3 py-1 rounded text-sm bg-white border border-gray-300 hover:bg-red-50 text-red-600">🗑️ Delete Table</button>
      </div>

      {/* Editor Area */}
      <EditorContent editor={editor} className="p-4 min-h-[150px] outline-none prose max-w-none" />
    </div>
  );
}