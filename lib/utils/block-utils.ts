import { Block, BlockStyle, View, SyntacticVariant } from '../types'

// Type for HTML renderer functions
type HTMLRenderer = (content: string, childrenHTML: string) => string

// Tag mapping configuration for HTML rendering
const TAG_RENDERERS: Record<NonNullable<BlockStyle['format']>, HTMLRenderer> = {
  p: (content: string) => `<p>${content}</p>`,
  h1: (content: string, childrenHTML: string) => `<h1>${content}</h1>${childrenHTML}`,
  h2: (content: string, childrenHTML: string) => `<h2>${content}</h2>${childrenHTML}`,
  h3: (content: string, childrenHTML: string) => `<h3>${content}</h3>${childrenHTML}`,
  h4: (content: string, childrenHTML: string) => `<h4>${content}</h4>${childrenHTML}`,
  h5: (content: string, childrenHTML: string) => `<h5>${content}</h5>${childrenHTML}`,
  h6: (content: string, childrenHTML: string) => `<h6>${content}</h6>${childrenHTML}`,
  blockquote: (content: string, childrenHTML: string) => `<blockquote>${childrenHTML || content}</blockquote>`,
  code: (content: string) => `<code>${content}</code>`,
  li: (content: string) => `<li>${content}</li>`,
  ul: (content: string, childrenHTML: string) => `<ul>${childrenHTML || content}</ul>`,
  ol: (content: string, childrenHTML: string) => `<ol>${childrenHTML || content}</ol>`
}

export function createBlock(
  canonical: string,
  html?: string,
  style?: BlockStyle,
  children?: Block[],
  createdBy: string = 'anonymous'
): Omit<Block, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    canonical,
    html,
    style,
    children,
    createdBy,
    updatedBy: createdBy
  }
}

export function renderBlockAsHTML(block: Block): string {
  const content = block.html || block.canonical

  if (!block.style?.format) {
    return content
  }

  // Handle children for container blocks
  const childrenHTML = block.children ? block.children.map(child => renderBlockAsHTML(child)).join('') : ''

  // Use the tag renderer configuration
  const renderer = TAG_RENDERERS[block.style.format]
  if (renderer) {
    return renderer(content, childrenHTML)
  }

  // Fallback for unknown formats
  return content
}

export function renderViewAsHTML(view: View): string {
  const blocksHTML = view.rootBlocks.map(block => renderBlockAsHTML(block)).join('\n')
  return blocksHTML
}

export function extractTextFromBlock(block: Block): string {
  let text = block.canonical
  
  if (block.children) {
    const childrenText = block.children.map(child => extractTextFromBlock(child)).join(' ')
    text += ' ' + childrenText
  }
  
  return text.trim()
}

export function findBlockById(blocks: Block[], id: string): Block | null {
  for (const block of blocks) {
    if (block.id === id) {
      return block
    }
    if (block.children) {
      const found = findBlockById(block.children, id)
      if (found) return found
    }
  }
  return null
}

export function countBlocks(blocks: Block[]): number {
  let count = blocks.length
  for (const block of blocks) {
    if (block.children) {
      count += countBlocks(block.children)
    }
  }
  return count
}

export function collectAllBlocks(blocks: Block[]): Block[] {
  const allBlocks: Block[] = []
  
  for (const block of blocks) {
    allBlocks.push(block)
    if (block.children) {
      allBlocks.push(...collectAllBlocks(block.children))
    }
  }
  
  return allBlocks
}

export function calculateVariancePath(variants: SyntacticVariant[], fromId: string, toId: string): SyntacticVariant[] {
  const path: SyntacticVariant[] = []
  
  function findPath(currentId: string, targetId: string, visited: Set<string>): boolean {
    if (currentId === targetId) {
      return true
    }
    
    if (visited.has(currentId)) {
      return false
    }
    
    visited.add(currentId)
    
    for (const variant of variants) {
      if (variant.base === currentId) {
        path.push(variant)
        if (findPath(variant.variant, targetId, visited)) {
          return true
        }
        path.pop()
      }
    }
    
    return false
  }
  
  findPath(fromId, toId, new Set())
  return path
}

export function calculateTotalVariance(variantPath: SyntacticVariant[]): number {
  return variantPath.reduce((total, variant) => total + variant.variance, 0) / variantPath.length
}

export function getBlockDepth(block: Block): number {
  if (!block.children || block.children.length === 0) {
    return 1
  }
  
  const maxChildDepth = Math.max(...block.children.map(child => getBlockDepth(child)))
  return 1 + maxChildDepth
}

// Sanitize HTML to prevent TipTap wrapping issues
export function sanitizeHtmlForTipTap(html: string): string {
  if (!html) return html
  
  // Remove unnecessary paragraph wrapping that can cause nesting issues
  // If the entire content is wrapped in a single paragraph, unwrap it
  const singleParagraphMatch = html.match(/^<p>([\s\S]*)<\/p>$/)
  if (singleParagraphMatch) {
    const innerContent = singleParagraphMatch[1]
    // Only unwrap if the inner content doesn't contain block elements
    if (!innerContent.includes('<p>') && !innerContent.includes('<h1>') && 
        !innerContent.includes('<h2>') && !innerContent.includes('<h3>') &&
        !innerContent.includes('<ul>') && !innerContent.includes('<ol>')) {
      return innerContent
    }
  }
  
  return html
}

// Clean HTML content from blocks to prevent nested structures
export function cleanBlockHTML(html: string | undefined): string {
  if (!html) return ''
  
  // Remove any outer paragraph tags that might cause nesting
  return html.replace(/^<p>([\s\S]*)<\/p>$/, '$1').trim()
}