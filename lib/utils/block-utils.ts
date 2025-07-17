import { Block, BlockStyle, View, SyntacticVariant } from '../types'

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

  switch (block.style.format) {
    case 'p':
      return `<p>${content}</p>`
    case 'h1':
      return `<h1>${content}</h1>${childrenHTML}`
    case 'h2':
      return `<h2>${content}</h2>${childrenHTML}`
    case 'h3':
      return `<h3>${content}</h3>${childrenHTML}`
    case 'h4':
      return `<h4>${content}</h4>${childrenHTML}`
    case 'h5':
      return `<h5>${content}</h5>${childrenHTML}`
    case 'h6':
      return `<h6>${content}</h6>${childrenHTML}`
    case 'blockquote':
      return `<blockquote>${childrenHTML || content}</blockquote>`
    case 'code':
      return `<code>${content}</code>`
    case 'li':
      return `<li>${content}</li>`
    case 'ul':
      return `<ul>${childrenHTML || content}</ul>`
    case 'ol':
      return `<ol>${childrenHTML || content}</ol>`
    default:
      return content
  }
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