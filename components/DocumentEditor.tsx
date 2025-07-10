'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useState } from 'react'
import { getEditorConfig } from './editorConfig'
import Toolbar from './Toolbar'

export default function DocumentEditor() {
  const [title, setTitle] = useState('Untitled Document')
  
  const editor = useEditor(getEditorConfig())

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto pt-8">
        {/* Toolbar */}
        <Toolbar editor={editor} />
        
        {/* Paper */}
        <div className="bg-white min-h-screen shadow-sm mt-4">
          {/* Header */}
          <div className="px-8 pt-8 pb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-3xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-400 w-full"
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