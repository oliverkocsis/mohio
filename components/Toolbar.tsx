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
        className={`p-2 rounded-lg border transition-colors ${
          editor.isActive('heading', { level: 1 }) 
            ? 'border-primary bg-primary text-white' 
            : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
        }`}
        style={editor.isActive('heading', { level: 1 }) 
          ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Heading 1"
      >
        <Heading1 size={20} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded-lg border transition-colors ${
          editor.isActive('heading', { level: 2 }) 
            ? 'border-primary bg-primary text-white' 
            : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
        }`}
        style={editor.isActive('heading', { level: 2 }) 
          ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Heading 2"
      >
        <Heading2 size={20} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded-lg border transition-colors ${
          editor.isActive('heading', { level: 3 }) 
            ? 'border-primary bg-primary text-white' 
            : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
        }`}
        style={editor.isActive('heading', { level: 3 }) 
          ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Heading 3"
      >
        <Heading3 size={20} />
      </button>

      <div className="w-px h-6 bg-gray-200 mx-2"></div>

      {/* Text Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg border transition-colors ${
          editor.isActive('bold') 
            ? 'border-primary bg-primary text-white' 
            : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
        }`}
        style={editor.isActive('bold') 
          ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Bold"
      >
        <Bold size={20} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg border transition-colors ${
          editor.isActive('italic') 
            ? 'border-primary bg-primary text-white' 
            : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
        }`}
        style={editor.isActive('italic') 
          ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Italic"
      >
        <Italic size={20} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded-lg border transition-colors ${
          editor.isActive('strike') 
            ? 'border-primary bg-primary text-white' 
            : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
        }`}
        style={editor.isActive('strike') 
          ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Strikethrough"
      >
        <Strikethrough size={20} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-2 rounded-lg border transition-colors ${
          editor.isActive('code') 
            ? 'border-primary bg-primary text-white' 
            : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
        }`}
        style={editor.isActive('code') 
          ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Code"
      >
        <Code size={20} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded-lg border transition-colors ${
          editor.isActive('blockquote') 
            ? 'border-primary bg-primary text-white' 
            : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
        }`}
        style={editor.isActive('blockquote') 
          ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Blockquote"
      >
        <Quote size={20} />
      </button>

      <div className="w-px h-6 bg-gray-200 mx-2"></div>

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-lg border transition-colors ${
          editor.isActive('bulletList') 
            ? 'border-primary bg-primary text-white' 
            : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
        }`}
        style={editor.isActive('bulletList') 
          ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Bullet List"
      >
        <List size={20} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-lg border transition-colors ${
          editor.isActive('orderedList') 
            ? 'border-primary bg-primary text-white' 
            : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
        }`}
        style={editor.isActive('orderedList') 
          ? { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary)' }
          : {}
        }
        title="Numbered List"
      >
        <ListOrdered size={20} />
      </button>

      <div className="w-px h-6 bg-gray-200 mx-2"></div>

      {/* Media */}
      <button
        onClick={addLink}
        className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:border-primary hover:text-primary transition-colors"
        title="Add Link"
      >
        <Link size={20} />
      </button>
      <button
        onClick={addImage}
        className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:border-primary hover:text-primary transition-colors"
        title="Add Image"
      >
        <Image size={20} aria-label="Add Image" />
      </button>
      <button
        onClick={addVideo}
        className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:border-primary hover:text-primary transition-colors"
        title="Add Video"
      >
        <Video size={20} />
      </button>
    </div>
  )
}

export default Toolbar