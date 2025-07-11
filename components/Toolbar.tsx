import { 
  Heading1, 
  Heading2, 
  Heading3, 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  Quote, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  Video 
} from 'lucide-react'
import { Editor } from '@tiptap/react'

const Toolbar = ({ editor }: { editor: Editor | null }) => {
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
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 py-3 px-4 bg-white border-b border-gray-100">
      {/* Headings */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('heading', { level: 1 }) 
            ? 'bg-primary text-white' 
            : 'text-gray-600 hover:text-primary'
        }`}
        style={editor.isActive('heading', { level: 1 }) 
          ? { backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Heading 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('heading', { level: 2 }) 
            ? 'bg-primary text-white' 
            : 'text-gray-600 hover:text-primary'
        }`}
        style={editor.isActive('heading', { level: 2 }) 
          ? { backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Heading 2"
      >
        <Heading2 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('heading', { level: 3 }) 
            ? 'bg-primary text-white' 
            : 'text-gray-600 hover:text-primary'
        }`}
        style={editor.isActive('heading', { level: 3 }) 
          ? { backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Heading 3"
      >
        <Heading3 size={16} />
      </button>

      <div className="w-px h-6 bg-gray-200 mx-2"></div>

      {/* Text Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('bold') 
            ? 'bg-primary text-white' 
            : 'text-gray-600 hover:text-primary'
        }`}
        style={editor.isActive('bold') 
          ? { backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('italic') 
            ? 'bg-primary text-white' 
            : 'text-gray-600 hover:text-primary'
        }`}
        style={editor.isActive('italic') 
          ? { backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('strike') 
            ? 'bg-primary text-white' 
            : 'text-gray-600 hover:text-primary'
        }`}
        style={editor.isActive('strike') 
          ? { backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('code') 
            ? 'bg-primary text-white' 
            : 'text-gray-600 hover:text-primary'
        }`}
        style={editor.isActive('code') 
          ? { backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Code"
      >
        <Code size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('blockquote') 
            ? 'bg-primary text-white' 
            : 'text-gray-600 hover:text-primary'
        }`}
        style={editor.isActive('blockquote') 
          ? { backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Blockquote"
      >
        <Quote size={16} />
      </button>

      <div className="w-px h-6 bg-gray-200 mx-2"></div>

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('bulletList') 
            ? 'bg-primary text-white' 
            : 'text-gray-600 hover:text-primary'
        }`}
        style={editor.isActive('bulletList') 
          ? { backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-lg transition-colors ${
          editor.isActive('orderedList') 
            ? 'bg-primary text-white' 
            : 'text-gray-600 hover:text-primary'
        }`}
        style={editor.isActive('orderedList') 
          ? { backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Numbered List"
      >
        <ListOrdered size={16} />
      </button>

      <div className="w-px h-6 bg-gray-200 mx-2"></div>

      {/* Media */}
      <button
        onClick={addLink}
        className="p-2 rounded-lg text-gray-600 hover:text-primary transition-colors"
        title="Add Link"
      >
        <Link size={16} />
      </button>
      <button
        onClick={addImage}
        className="p-2 rounded-lg text-gray-600 hover:text-primary transition-colors"
        title="Add Image"
      >
        <Image size={16} aria-label="Add Image" />
      </button>
      <button
        onClick={addVideo}
        className="p-2 rounded-lg text-gray-600 hover:text-primary transition-colors"
        title="Add Video"
      >
        <Video size={16} />
      </button>
    </div>
  )
}

export default Toolbar