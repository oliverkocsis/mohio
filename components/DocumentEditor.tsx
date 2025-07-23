'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useCallback } from 'react'
import { getEditorConfig } from './editorConfig'
import Toolbar from './Toolbar'
import { useDocumentStore } from '@/lib/store/document-store'

export default function DocumentEditor() {
  const { document, setTitle, setContent } = useDocumentStore()
  const editor = useEditor(getEditorConfig())

  useEffect(() => {
    if (editor && document.content) {
      editor.commands.setContent(document.content)
    }
  }, [editor, document.content])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
  }

  const handleContentChange = useCallback(() => {
    if (editor) {
      const content = editor.getHTML()
      setContent(content)
    }
  }, [editor, setContent])

  useEffect(() => {
    if (editor) {
      editor.on('update', handleContentChange)
      return () => {
        editor.off('update', handleContentChange)
      }
    }
  }, [editor, handleContentChange])

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
              value={document.title}
              onChange={(e) => handleTitleChange(e.target.value)}
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