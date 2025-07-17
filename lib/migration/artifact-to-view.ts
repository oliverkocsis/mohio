import { View, Block, BlockStyle, CreateViewInput, StorageAdapter } from '../types'

// Legacy Artifact type for migration only
interface LegacyArtifact {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export function convertArtifactToView(artifact: LegacyArtifact, createdBy: string = 'migration'): CreateViewInput {
  const blocks = parseArtifactContentToBlocks(artifact.content, createdBy)
  
  return {
    type: 'document',
    title: artifact.title,
    purpose: 'Migrated from legacy artifact',
    tone: ['professional'],
    rootBlocks: blocks,
    createdBy
  }
}

export function parseArtifactContentToBlocks(content: string, createdBy: string = 'migration'): Block[] {
  const blocks: Block[] = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  
  function processNode(node: Element, parentBlocks: Block[] = blocks): void {
    const tagName = node.tagName.toLowerCase()
    
    if (isBlockElement(tagName)) {
      const blockId = generateBlockId()
      const now = new Date()
      
      const block: Block = {
        id: blockId,
        canonical: node.textContent || '',
        html: node.innerHTML,
        style: mapTagToBlockStyle(tagName),
        children: [],
        createdBy,
        createdAt: now,
        updatedBy: createdBy,
        updatedAt: now
      }
      
      if (tagName === 'ul' || tagName === 'ol') {
        const listItems = Array.from(node.querySelectorAll('li'))
        block.children = listItems.map(li => {
          const childId = generateBlockId()
          return {
            id: childId,
            canonical: li.textContent || '',
            html: li.innerHTML,
            style: { format: 'li' },
            createdBy,
            createdAt: now,
            updatedBy: createdBy,
            updatedAt: now
          }
        })
      }
      
      parentBlocks.push(block)
    } else {
      Array.from(node.children).forEach(child => processNode(child as Element, parentBlocks))
    }
  }
  
  Array.from(doc.body.children).forEach(child => processNode(child as Element))
  
  if (blocks.length === 0) {
    const blockId = generateBlockId()
    const now = new Date()
    
    blocks.push({
      id: blockId,
      canonical: content,
      html: content,
      style: { format: 'p' },
      createdBy,
      createdAt: now,
      updatedBy: createdBy,
      updatedAt: now
    })
  }
  
  return blocks
}

function isBlockElement(tagName: string): boolean {
  const blockElements = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'div']
  return blockElements.includes(tagName)
}

function mapTagToBlockStyle(tagName: string): BlockStyle {
  switch (tagName) {
    case 'h1':
      return { format: 'h1' }
    case 'h2':
      return { format: 'h2' }
    case 'h3':
      return { format: 'h3' }
    case 'h4':
      return { format: 'h4' }
    case 'h5':
      return { format: 'h5' }
    case 'h6':
      return { format: 'h6' }
    case 'ul':
      return { format: 'ul' }
    case 'ol':
      return { format: 'ol' }
    case 'blockquote':
      return { format: 'blockquote' }
    case 'code':
      return { format: 'code' }
    case 'p':
    default:
      return { format: 'p' }
  }
}

function generateBlockId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export async function migrateAllArtifactsToViews(artifacts: LegacyArtifact[], storage: StorageAdapter, createdBy: string = 'migration'): Promise<View[]> {
  const views: View[] = []
  
  for (const artifact of artifacts) {
    const viewInput = convertArtifactToView(artifact, createdBy)
    const view = await storage.createView(viewInput)
    views.push(view)
  }
  
  return views
}

export function convertViewToArtifact(view: View): LegacyArtifact {
  const content = view.rootBlocks.map(block => renderBlockToHTML(block)).join('')
  
  return {
    id: view.id,
    title: view.title,
    content,
    createdAt: view.createdAt,
    updatedAt: view.updatedAt
  }
}

function renderBlockToHTML(block: Block): string {
  const content = block.html || block.canonical
  
  if (!block.style?.format) {
    return content
  }
  
  switch (block.style.format) {
    case 'p':
      return `<p>${content}</p>`
    case 'h1':
      return `<h1>${content}</h1>`
    case 'h2':
      return `<h2>${content}</h2>`
    case 'h3':
      return `<h3>${content}</h3>`
    case 'h4':
      return `<h4>${content}</h4>`
    case 'h5':
      return `<h5>${content}</h5>`
    case 'h6':
      return `<h6>${content}</h6>`
    case 'blockquote':
      return `<blockquote>${content}</blockquote>`
    case 'code':
      return `<code>${content}</code>`
    case 'li':
      return `<li>${content}</li>`
    case 'ul':
      if (block.children) {
        const childrenHTML = block.children.map(child => renderBlockToHTML(child)).join('')
        return `<ul>${childrenHTML}</ul>`
      }
      return `<ul>${content}</ul>`
    case 'ol':
      if (block.children) {
        const childrenHTML = block.children.map(child => renderBlockToHTML(child)).join('')
        return `<ol>${childrenHTML}</ol>`
      }
      return `<ol>${content}</ol>`
    default:
      return content
  }
}