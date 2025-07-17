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
  Video,
  Save
} from 'lucide-react'
import { Editor } from '@tiptap/react'
import { LucideIcon } from 'lucide-react'

interface ToolbarProps {
  editor: Editor | null
  onSave?: () => void
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  title: string
  icon: LucideIcon
  className?: string
}

const ToolbarButton = ({ 
  onClick, 
  isActive = false, 
  title, 
  icon: Icon,
  className = "" 
}: ToolbarButtonProps) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg transition-colors ${
      isActive 
        ? 'bg-primary text-white' 
        : 'text-gray-600 hover:text-primary hover:bg-gray-100'
    } ${className}`}
    style={isActive ? { backgroundColor: 'var(--color-primary)' } : {}}
    title={title}
  >
    <Icon size={16} />
  </button>
)

// Type-safe URL validation
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Type-safe prompt with validation
const promptForUrl = (message: string): string | null => {
  if (typeof window === 'undefined') return null
  
  const url = window.prompt(message)
  if (!url) return null
  
  const trimmedUrl = url.trim()
  if (!trimmedUrl) return null
  
  // Basic URL validation - ensure it starts with http/https or add https if missing
  const urlWithProtocol = trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`
  
  if (!isValidUrl(urlWithProtocol)) {
    alert('Please enter a valid URL')
    return null
  }
  
  return urlWithProtocol
}

const Toolbar = ({ editor, onSave }: ToolbarProps) => {
  if (!editor) return null

  const addLink = () => {
    const url = promptForUrl('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addImage = () => {
    const url = promptForUrl('Enter image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addVideo = () => {
    const url = promptForUrl('Enter video URL:')
    if (url) {
      // Sanitize URL for iframe src
      const sanitizedUrl = url.replace(/[<>"']/g, '')
      editor.chain().focus().insertContent(`<iframe src="${sanitizedUrl}" width="560" height="315" frameborder="0"></iframe>`).run()
    }
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-2 py-3 px-4 bg-white border-b border-gray-100">
      <div className="flex items-center gap-2">
      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
        icon={Heading1}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
        icon={Heading2}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
        icon={Heading3}
      />

      <div className="w-px h-6 bg-gray-200 mx-2"></div>

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
        icon={Bold}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
        icon={Italic}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
        icon={Strikethrough}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Code"
        icon={Code}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Blockquote"
        icon={Quote}
      />

      <div className="w-px h-6 bg-gray-200 mx-2"></div>

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
        icon={List}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
        icon={ListOrdered}
      />

      <div className="w-px h-6 bg-gray-200 mx-2"></div>

      {/* Media */}
      <ToolbarButton
        onClick={addLink}
        title="Add Link"
        icon={Link}
      />
      <ToolbarButton
        onClick={addImage}
        title="Add Image"
        icon={Image}
      />
      <ToolbarButton
        onClick={addVideo}
        title="Add Video"
        icon={Video}
      />
      </div>

      {/* Save Button */}
      {onSave && (
        <ToolbarButton
          onClick={onSave}
          title="Save Document"
          icon={Save}
        />
      )}
    </div>
  )
}

export default Toolbar