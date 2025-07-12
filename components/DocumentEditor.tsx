'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useState } from 'react'
import { getEditorConfig } from './editorConfig'
import Toolbar from './Toolbar'

export default function DocumentEditor() {
  const [title, setTitle] = useState('Untitled Document')
  
  const editor = useEditor(getEditorConfig())

  return (
    <div className="min-h-screen bg-white overscroll-none">
      <div className="max-w-4xl mx-auto overscroll-none">
        {/* Toolbar */}
        <Toolbar editor={editor} />
        
        {/* Content */}
        <div className="px-8 py-12">
          {/* Title */}
          <div className="mb-12">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-5xl font-bold bg-transparent border-none outline-none placeholder-gray-400 leading-tight font-sans"
              style={{ color: 'var(--color-primary)' }}
              placeholder="Untitled Document"
            />
          </div>

          {/* Editor */}
          <div className="relative">
            <EditorContent 
              editor={editor}
              className="text-gray-700 text-lg leading-relaxed font-serif"
            />
          </div>
        </div>
      </div>
    </div>
  )
}