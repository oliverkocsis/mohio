import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'

export const getEditorConfig = () => ({
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,
    }),
    Image,
  ],
  content: '<p>Start writing your document...</p>',
  editorProps: {
    attributes: {
      class: 'focus:outline-none min-h-[600px] font-serif text-lg leading-relaxed text-gray-700',
    },
  },
})