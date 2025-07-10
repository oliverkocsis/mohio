'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState } from 'react'

export default function EditorPage() {
  const [title, setTitle] = useState('Untitled Document')
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start writing your document...</p>',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[600px] px-12 py-8',
      },
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white min-h-screen shadow-sm">
          {/* Header */}
          <div className="px-12 py-8 border-b border-gray-100">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-4xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-400 w-full"
              placeholder="Untitled"
            />
          </div>
          
          {/* Editor */}
          <div className="relative">
            <EditorContent 
              editor={editor}
              className="text-gray-900 text-lg leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  )
}