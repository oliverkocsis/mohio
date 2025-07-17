'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useState, useEffect, useCallback } from 'react'
import { getEditorConfig } from './editorConfig'
import Toolbar from './Toolbar'
import { View } from '@/lib/types'
import { renderViewAsHTML } from '@/lib/utils/block-utils'

interface DocumentEditorProps {
  viewId?: string
}

export default function DocumentEditor({ viewId }: DocumentEditorProps) {
  const [title, setTitle] = useState('Untitled Document')
  const [view, setView] = useState<View | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const editor = useEditor(getEditorConfig())

  const loadView = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/views/${id}`)
      if (response.ok) {
        const data: View = await response.json()
        setView(data)
        setTitle(data.title)
        if (editor) {
          const content = renderViewAsHTML(data)
          editor.commands.setContent(content)
        }
      }
    } catch (error) {
      console.error('Error loading view:', error)
    } finally {
      setIsLoading(false)
    }
  }, [editor])

  useEffect(() => {
    if (viewId) {
      loadView(viewId)
    }
  }, [viewId, loadView])

  const saveView = async () => {
    if (!editor) return

    // TODO: Convert HTML content back to blocks for proper storage
    // const content = editor.getHTML()
    
    try {
      if (view) {
        const response = await fetch(`/api/views/${view.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title })
        })
        if (response.ok) {
          const updated = await response.json()
          setView(updated)
        }
      } else {
        const response = await fetch('/api/views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'document',
            title, 
            purpose: 'User-created document',
            tone: ['professional'],
            rootBlocks: [],
            createdBy: 'user'
          })
        })
        if (response.ok) {
          const created = await response.json()
          setView(created)
        }
      }
    } catch (error) {
      console.error('Error saving view:', error)
    }
  }

  return (
    <div className="min-h-screen bg-white overscroll-none">
      <div className="max-w-4xl mx-auto overscroll-none">
        {/* Toolbar */}
        <Toolbar editor={editor} onSave={saveView} />
        
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
              disabled={isLoading}
            />
          </div>

          {/* Editor */}
          <div className="relative">
            <EditorContent 
              editor={editor}
              className="text-gray-700 text-lg leading-relaxed font-serif"
            />
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}