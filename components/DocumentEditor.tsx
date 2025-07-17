'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useCallback } from 'react'
import { getEditorConfig } from './editorConfig'
import Toolbar from './Toolbar'
import { useBlockStore } from '@/lib/store/block-store'
import { renderViewAsHTML } from '@/lib/utils/block-utils'

interface DocumentEditorProps {
  viewId?: string
}

export default function DocumentEditor({ viewId }: DocumentEditorProps) {
  const {
    currentView,
    isLoading,
    setCurrentView,
    getView,
    updateView,
    createView,
    loadInitialData,
    syncEditorWithBlocks
  } = useBlockStore()
  
  const editor = useEditor(getEditorConfig())

  const loadView = useCallback(async (id: string) => {
    let view = getView(id)
    if (!view) {
      await loadInitialData()
      view = getView(id)
    }
    
    if (view) {
      setCurrentView(view)
      if (editor) {
        const content = renderViewAsHTML(view)
        editor.commands.setContent(content)
      }
    }
  }, [editor, getView, loadInitialData, setCurrentView])

  useEffect(() => {
    if (viewId) {
      loadView(viewId)
    }
  }, [viewId, loadView])

  useEffect(() => {
    if (!viewId && !currentView) {
      loadInitialData()
    }
  }, [viewId, currentView, loadInitialData])

  const saveView = async () => {
    if (!editor || !currentView) return

    const content = editor.getHTML()
    
    try {
      if (currentView) {
        await syncEditorWithBlocks(currentView.id, content)
      } else {
        await createView({
          type: 'document',
          title: 'Untitled Document',
          purpose: 'User-created document',
          tone: ['professional'],
          rootBlocks: [],
          createdBy: 'user'
        })
      }
    } catch (error) {
      console.error('Error saving view:', error)
    }
  }

  const handleTitleChange = async (newTitle: string) => {
    if (currentView) {
      await updateView(currentView.id, { title: newTitle })
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
              value={currentView?.title || 'Untitled Document'}
              onChange={(e) => handleTitleChange(e.target.value)}
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