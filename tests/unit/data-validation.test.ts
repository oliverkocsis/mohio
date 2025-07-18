import { describe, it, expect, beforeEach } from 'vitest'
import { testDocument, testView, createTestDocumentCopy, findBlockById, collectAllBlocks, expectedEditedHTML } from '../test-data'
import { Block, BlockID } from '../../lib/types'

describe('Data Validation and Test Infrastructure', () => {
  let testBlocks: Block[]
  
  beforeEach(() => {
    testBlocks = createTestDocumentCopy()
  })

  describe('Test Data Structure', () => {
    it('creates proper block hierarchy', () => {
      expect(testBlocks).toHaveLength(2)
      
      const firstHeader = findBlockById(testBlocks, 'block_h1_1' as BlockID)
      expect(firstHeader).toBeDefined()
      expect(firstHeader?.style?.format).toBe('h1')
      expect(firstHeader?.children).toHaveLength(1)
      
      const paragraph = findBlockById(testBlocks, 'block_p1' as BlockID)
      expect(paragraph).toBeDefined()
      expect(paragraph?.style?.format).toBe('p')
      expect(paragraph?.html).toContain('<strong>')
      expect(paragraph?.html).toContain('<em>')
    })
    
    it('validates nested block structure', () => {
      const secondHeader = findBlockById(testBlocks, 'block_h1_2' as BlockID)
      expect(secondHeader?.children).toHaveLength(2)
      
      const quote = findBlockById(testBlocks, 'block_quote' as BlockID)
      expect(quote?.style?.format).toBe('blockquote')
      expect(quote?.html).toContain('<blockquote>')
      
      const subheader = findBlockById(testBlocks, 'block_h2' as BlockID)
      expect(subheader?.children).toHaveLength(1)
      
      const list = findBlockById(testBlocks, 'block_list' as BlockID)
      expect(list?.style?.format).toBe('ol')
      expect(list?.children).toHaveLength(2)
    })
    
    it('collects all blocks correctly', () => {
      const allBlocks = collectAllBlocks(testBlocks)
      expect(allBlocks).toHaveLength(8)
      
      const blockIds = allBlocks.map(b => b.id)
      expect(blockIds).toContain('block_h1_1')
      expect(blockIds).toContain('block_p1')
      expect(blockIds).toContain('block_h1_2')
      expect(blockIds).toContain('block_quote')
      expect(blockIds).toContain('block_h2')
      expect(blockIds).toContain('block_list')
      expect(blockIds).toContain('block_li1')
      expect(blockIds).toContain('block_li2')
    })
  })

  describe('Edit Simulation Logic', () => {
    it('validates expected HTML changes for inline formatting', () => {
      const original = 'This is a <strong>longer</strong> <em>paragraph</em> with <u>various</u> <s>inline</s> <code>formats</code>.'
      const expected = expectedEditedHTML.block_p1
      
      expect(expected).toBe('This is a <strong>longer</strong> <em><strong>paragraph</strong></em> with <u>various</u> <s>inline</s> <code>formats</code>.')
      expect(expected).toContain('<em><strong>paragraph</strong></em>')
      expect(expected).toContain('<strong>longer</strong>') // Preserved
    })
    
    it('validates expected HTML changes for block format changes', () => {
      const original = '<blockquote><strong><em>This is a quoted insight.</em></strong></blockquote>'
      const expected = expectedEditedHTML.block_quote
      
      expect(expected).toBe('This is a quoted insight.')
      expect(expected).not.toContain('<blockquote>')
    })
  })

  describe('Block Finding and Manipulation', () => {
    it('finds deeply nested blocks', () => {
      const nestedBlock = findBlockById(testBlocks, 'block_li1' as BlockID)
      expect(nestedBlock).toBeDefined()
      expect(nestedBlock?.canonical).toBe('Improves reusability')
      expect(nestedBlock?.html).toBe('<strong>Improves</strong> <em>reusability</em>')
    })
    
    it('returns null for non-existent blocks', () => {
      const nonExistent = findBlockById(testBlocks, 'nonexistent' as BlockID)
      expect(nonExistent).toBeNull()
    })
    
    it('maintains referential integrity', () => {
      const parent = findBlockById(testBlocks, 'block_h1_1' as BlockID)
      const child = findBlockById(testBlocks, 'block_p1' as BlockID)
      
      expect(parent?.children).toContain(child)
    })
  })

  describe('Block Properties Validation', () => {
    it('validates all required block properties', () => {
      const allBlocks = collectAllBlocks(testBlocks)
      
      allBlocks.forEach(block => {
        expect(block).toHaveProperty('id')
        expect(block).toHaveProperty('canonical')
        expect(block).toHaveProperty('createdBy')
        expect(block).toHaveProperty('createdAt')
        expect(block).toHaveProperty('updatedBy')
        expect(block).toHaveProperty('updatedAt')
        
        expect(typeof block.id).toBe('string')
        expect(typeof block.canonical).toBe('string')
        expect(typeof block.createdBy).toBe('string')
        expect(typeof block.updatedBy).toBe('string')
      })
    })
    
    it('validates block styles', () => {
      const allBlocks = collectAllBlocks(testBlocks)
      const blockWithStyle = allBlocks.find(b => b.style?.format)
      
      expect(blockWithStyle).toBeDefined()
      expect(blockWithStyle?.style?.format).toMatch(/^(h1|h2|p|blockquote|ol|li)$/)
    })
    
    it('validates HTML content format', () => {
      const paragraph = findBlockById(testBlocks, 'block_p1' as BlockID)
      const quote = findBlockById(testBlocks, 'block_quote' as BlockID)
      
      expect(paragraph?.html).toMatch(/<strong>.*<\/strong>/)
      expect(paragraph?.html).toMatch(/<em>.*<\/em>/)
      expect(quote?.html).toMatch(/<blockquote>.*<\/blockquote>/)
    })
  })

  describe('View Structure Validation', () => {
    it('validates test view properties', () => {
      expect(testView).toHaveProperty('id')
      expect(testView).toHaveProperty('type')
      expect(testView).toHaveProperty('title')
      expect(testView).toHaveProperty('rootBlocks')
      expect(testView).toHaveProperty('createdBy')
      expect(testView).toHaveProperty('createdAt')
      
      expect(testView.type).toBe('document')
      expect(testView.title).toBe('Test Document')
      expect(testView.rootBlocks).toHaveLength(2)
    })
    
    it('validates view contains correct blocks', () => {
      const rootBlockIds = testView.rootBlocks.map(b => b.id)
      expect(rootBlockIds).toContain('block_h1_1')
      expect(rootBlockIds).toContain('block_h1_2')
    })
  })

  describe('Test Data Immutability', () => {
    it('creates independent copies', () => {
      const copy1 = createTestDocumentCopy()
      const copy2 = createTestDocumentCopy()
      
      // Modify one copy
      if (copy1[0]) {
        copy1[0].canonical = 'Modified'
      }
      
      // Other copy should be unchanged
      expect(copy2[0]?.canonical).toBe('First Header 1')
    })
  })
})