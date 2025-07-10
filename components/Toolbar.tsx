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
    <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-white shadow-sm">
      {/* Headings */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'text-gray-700'
        }`}
        title="Heading 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'text-gray-700'
        }`}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive('heading', { level: 3 }) ? 'bg-blue-500 text-white' : 'text-gray-700'
        }`}
        title="Heading 3"
      >
        <Heading3 size={16} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-2"></div>

      {/* Text Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive('bold') ? 'bg-blue-500 text-white' : 'text-gray-700'
        }`}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive('italic') ? 'bg-blue-500 text-white' : 'text-gray-700'
        }`}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive('strike') ? 'bg-blue-500 text-white' : 'text-gray-700'
        }`}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive('code') ? 'bg-blue-500 text-white' : 'text-gray-700'
        }`}
        title="Code"
      >
        <Code size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive('blockquote') ? 'bg-blue-500 text-white' : 'text-gray-700'
        }`}
        title="Blockquote"
      >
        <Quote size={16} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-2"></div>

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'text-gray-700'
        }`}
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor.isActive('orderedList') ? 'bg-blue-500 text-white' : 'text-gray-700'
        }`}
        title="Numbered List"
      >
        <ListOrdered size={16} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-2"></div>

      {/* Media */}
      <button
        onClick={addLink}
        className="p-2 rounded text-gray-700 hover:bg-gray-100"
        title="Add Link"
      >
        <Link size={16} />
      </button>
      <button
        onClick={addImage}
        className="p-2 rounded text-gray-700 hover:bg-gray-100"
        title="Add Image"
      >
        <Image size={16} />
      </button>
      <button
        onClick={addVideo}
        className="p-2 rounded text-gray-700 hover:bg-gray-100"
        title="Add Video"
      >
        <Video size={16} />
      </button>
    </div>
  )
}

export default Toolbar