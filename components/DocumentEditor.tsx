'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useState, useEffect, useCallback } from 'react'
import { getEditorConfig } from './editorConfig'
import Toolbar from './Toolbar'
import { Artifact } from '@/lib/types'

interface DocumentEditorProps {
  artifactId?: string
}

export default function DocumentEditor({ artifactId }: DocumentEditorProps) {
  const [title, setTitle] = useState('Untitled Document')
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const editor = useEditor(getEditorConfig())

  const loadArtifact = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/artifacts/${id}`)
      if (response.ok) {
        const data: Artifact = await response.json()
        setArtifact(data)
        setTitle(data.title)
        if (editor) {
          editor.commands.setContent(data.content)
        }
      }
    } catch (error) {
      console.error('Error loading artifact:', error)
    } finally {
      setIsLoading(false)
    }
  }, [editor])

  useEffect(() => {
    if (artifactId) {
      loadArtifact(artifactId)
    }
  }, [artifactId, loadArtifact])

  const saveArtifact = async () => {
    if (!editor) return

    const content = editor.getHTML()
    
    try {
      if (artifact) {
        const response = await fetch(`/api/artifacts/${artifact.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content })
        })
        if (response.ok) {
          const updated = await response.json()
          setArtifact(updated)
        }
      } else {
        const response = await fetch('/api/artifacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content })
        })
        if (response.ok) {
          const created = await response.json()
          setArtifact(created)
        }
      }
    } catch (error) {
      console.error('Error saving artifact:', error)
    }
  }

  return (
    <div className="min-h-screen bg-white overscroll-none">
      <div className="max-w-4xl mx-auto overscroll-none">
        {/* Toolbar */}
        <Toolbar editor={editor} onSave={saveArtifact} />
        
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