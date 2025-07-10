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
  content: '<h1>Lorem Ipsum Dolor</h1><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut <strong>labore et dolore</strong> magna aliqua.</p><h2>Vestibulum Ante</h2><p>Vestibulum ante ipsum primis in faucibus. <em>Mauris viverra</em> veniam sit amet massa. Sed cursus <del>turpis</del> a purus aliquam <code>consectetur</code> adipiscing elit.</p><h3>Pellentesque Habitant</h3><blockquote>Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat.</blockquote><h2>Ordered List</h2><ol><li><strong>Primum</strong> - Lorem ipsum dolor sit amet</li><li><em>Secundum</em> - Sed do eiusmod tempor</li><li><del>Tertium</del> - Ut enim ad minim veniam</li></ol><h2>Bullet List</h2><ul><li><strong>Consectetur</strong> adipiscing elit</li><li><em>Incididunt</em> ut labore et dolore</li><li>Ut enim ad <code>minim veniam</code></li><li><del>Ullamco</del> laboris nisi ut aliquip</li></ul><p>For more information, visit <a href="https://www.lipsum.com">Lorem Ipsum Generator</a> or check <a href="https://en.wikipedia.org/wiki/Lorem_ipsum">Wikipedia</a>.</p><p><em>End of styling demonstration.</em></p><h1>Lorem Ipsum Dolor</h1><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut <strong>labore et dolore</strong> magna aliqua.</p><h2>Vestibulum Ante</h2><p>Vestibulum ante ipsum primis in faucibus. <em>Mauris viverra</em> veniam sit amet massa. Sed cursus <del>turpis</del> a purus aliquam <code>consectetur</code> adipiscing elit.</p><h3>Pellentesque Habitant</h3><blockquote>Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat.</blockquote><h2>Ordered List</h2><ol><li><strong>Primum</strong> - Lorem ipsum dolor sit amet</li><li><em>Secundum</em> - Sed do eiusmod tempor</li><li><del>Tertium</del> - Ut enim ad minim veniam</li></ol><h2>Bullet List</h2><ul><li><strong>Consectetur</strong> adipiscing elit</li><li><em>Incididunt</em> ut labore et dolore</li><li>Ut enim ad <code>minim veniam</code></li><li><del>Ullamco</del> laboris nisi ut aliquip</li></ul><p>For more information, visit <a href="https://www.lipsum.com">Lorem Ipsum Generator</a> or check <a href="https://en.wikipedia.org/wiki/Lorem_ipsum">Wikipedia</a>.</p><p><em>End of styling demonstration.</em></p>',
  editorProps: {
    attributes: {
      class: 'focus:outline-none min-h-[600px] font-serif text-lg leading-relaxed text-gray-700',
    },
  },
})