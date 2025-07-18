'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useCallback, useState } from 'react'
import { getEditorConfig } from './editorConfig'
import Toolbar from './Toolbar'
import { useBlockStore } from '@/lib/store/block-store'
import { renderViewAsHTML, sanitizeHtmlForTipTap } from '@/lib/utils/block-utils'

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
  
  const [localTitle, setLocalTitle] = useState('')
  const editor = useEditor(getEditorConfig())

  const loadView = useCallback(async (id: string) => {
    let view = getView(id)
    if (!view) {
      await loadInitialData()
      view = getView(id)
    }
    
    if (view) {
      setCurrentView(view)
      setLocalTitle(view.title)
      if (editor) {
        const content = renderViewAsHTML(view)
        // Sanitize HTML to prevent TipTap wrapping issues
        const sanitizedContent = sanitizeHtmlForTipTap(content)
        editor.commands.setContent(sanitizedContent)
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
        if (localTitle !== currentView.title) {
          await updateView(currentView.id, { title: localTitle })
        }
      } else {
        await createView({
          type: 'document',
          title: localTitle || 'Untitled Document',
          purpose: 'User-created document',
          tone: ['professional'],
          rootBlocks: [],
          createdBy: 'user'
        })
      }
    } catch (error) {
      console.error('[DocumentEditor] Failed to save view:', error)
    }
  }

  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveView()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [saveView])

  useEffect(() => {
    if (currentView) {
      setLocalTitle(currentView.title)
    }
  }, [currentView])

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
              value={localTitle || 'Untitled Document'}
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