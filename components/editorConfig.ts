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
  content: '<h1>Lorem Ipsum Dolor</h1><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut <strong>labore et dolore</strong> magna aliqua.</p><h2>Vestibulum Ante</h2><p>Vestibulum ante ipsum primis in faucibus. <em>Mauris viverra</em> veniam sit amet massa. Sed cursus <del>turpis</del> a purus aliquam <code>consectetur</code> adipiscing elit.</p><h3>Pellentesque Habitant</h3><blockquote>Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat.</blockquote><h2>Ordered List</h2><ol><li><strong>Primum</strong> - Lorem ipsum dolor sit amet</li><li><em>Secundum</em> - Sed do eiusmod tempor</li><li><del>Tertium</del> - Ut enim ad minim veniam</li></ol><h2>Bullet List</h2><ul><li><strong>Consectetur</strong> adipiscing elit</li><li><em>Incididunt</em> ut labore et dolore</li><li>Ut enim ad <code>minim veniam</code></li><li><del>Ullamco</del> laboris nisi ut aliquip</li></ul><p>For more information, visit <a href="https://www.lipsum.com">Lorem Ipsum Generator</a> or check <a href="https://en.wikipedia.org/wiki/Lorem_ipsum">Wikipedia</a>.</p><p><em>End of styling demonstration.</em></p>',
  editorProps: {
    attributes: {
      class: 'prose prose-lg max-w-none focus:outline-none min-h-[600px] font-serif prose-headings:font-sans prose-headings:font-bold prose-headings:text-gray-900 prose-h1:text-4xl prose-h1:mb-6 prose-h2:text-3xl prose-h2:mb-4 prose-h3:text-2xl prose-h3:mb-3 prose-p:text-gray-700 prose-p:mb-6 prose-p:leading-8 prose-p:text-lg prose-strong:text-gray-900 prose-em:text-gray-800 prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-base prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-600 prose-ul:mb-6 prose-ol:mb-6 prose-li:text-gray-700 prose-li:mb-2 prose-li:text-lg prose-a:text-blue-600 prose-a:underline',
    },
  },
})