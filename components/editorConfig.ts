import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Strike from '@tiptap/extension-strike'
import Code from '@tiptap/extension-code'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'

export const getEditorConfig = () => ({
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