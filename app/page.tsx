'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Strike from '@tiptap/extension-strike'
import Code from '@tiptap/extension-code'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import { useState } from 'react'

const Toolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addVideo = () => {
    const url = window.prompt('Enter video URL:')
    if (url) {
      editor.chain().focus().insertContent(`<iframe src="${url}" width="560" height="315" frameborder="0"></iframe>`).run()
    }
  }

  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 bg-white shadow-sm">
      {/* Headings */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-3 py-1 rounded text-sm font-medium ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-3 py-1 rounded text-sm font-medium ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-3 py-1 rounded text-sm font-medium ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
      >
        H3
      </button>

      <div className="w-px h-6 bg-gray-300 mx-2"></div>

      {/* Text Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-3 py-1 rounded text-sm font-bold ${editor.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
      >
        B
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-3 py-1 rounded text-sm italic ${editor.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
      >
        I
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`px-3 py-1 rounded text-sm line-through ${editor.isActive('strike') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
      >
        S
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`px-3 py-1 rounded text-sm font-mono ${editor.isActive('code') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
      >
        &lt;&gt;
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-3 py-1 rounded text-sm ${editor.isActive('blockquote') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
      >
        "
      </button>

      <div className="w-px h-6 bg-gray-300 mx-2"></div>

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-3 py-1 rounded text-sm ${editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
      >
        • List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-3 py-1 rounded text-sm ${editor.isActive('orderedList') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
      >
        1. List
      </button>

      <div className="w-px h-6 bg-gray-300 mx-2"></div>

      {/* Media */}
      <button
        onClick={addLink}
        className="px-3 py-1 rounded text-sm bg-white text-gray-700 hover:bg-gray-100"
      >
        Link
      </button>
      <button
        onClick={addImage}
        className="px-3 py-1 rounded text-sm bg-white text-gray-700 hover:bg-gray-100"
      >
        Image
      </button>
      <button
        onClick={addVideo}
        className="px-3 py-1 rounded text-sm bg-white text-gray-700 hover:bg-gray-100"
      >
        Video
      </button>
    </div>
  )
}

export default function EditorPage() {
  const [title, setTitle] = useState('Untitled Document')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Strike,
      Code,
      BulletList,
      OrderedList,
      ListItem,
    ],
    content: '<p>Start writing your document...</p>',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[600px] px-8',
      },
    },
  })

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