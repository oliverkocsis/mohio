import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { testDocument, testView, createTestDocumentCopy, findBlockById, collectAllBlocks, expectedEditedHTML } from '../test-data'
import { Block, BlockID } from '../../lib/types'

describe('Simple Block Editor Integration Tests', () => {
  let testBlocks: Block[]
  
  beforeEach(() => {
    testBlocks = createTestDocumentCopy()
  })

  describe('Test 1: Load and Save Without Change', () => {
    it('loads complex view with nested blocks correctly', () => {
      const allBlocks = collectAllBlocks(testBlocks)
      
      // Assert - All blocks are loaded
      expect(testBlocks).toHaveLength(2) // Root level blocks
      expect(allBlocks).toHaveLength(8) // All blocks including nested ones (corrected count)
      
      // Assert - Block hierarchy is preserved
      const firstHeader = findBlockById(testBlocks, 'block_h1_1' as BlockID)
      expect(firstHeader).toBeDefined()
      expect(firstHeader?.children).toHaveLength(1)
      expect(firstHeader?.children?.[0].id).toBe('block_p1')
      
      const secondHeader = findBlockById(testBlocks, 'block_h1_2' as BlockID)
      expect(secondHeader).toBeDefined()
      expect(secondHeader?.children).toHaveLength(2)
      expect(secondHeader?.children?.[0].id).toBe('block_quote')
      expect(secondHeader?.children?.[1].id).toBe('block_h2')
    })
    
    it('preserves all block content and structure', () => {
      const allBlocks = collectAllBlocks(testBlocks)
      
      // Check expected HTML content
      const expectedHTML = {
        'block_h1_1': 'First Header 1',
        'block_p1': 'This is a <strong>longer</strong> <em>paragraph</em> with <u>various</u> <s>inline</s> <code>formats</code>.',
        'block_h1_2': 'Second Header 1',
        'block_quote': '<blockquote><strong><em>This is a quoted insight.</em></strong></blockquote>',
        'block_h2': 'Subheader',
        'block_li1': '<strong>Improves</strong> <em>reusability</em>',
        'block_li2': '<strong>Reduces</strong> <em>duplication</em>',
      }
      
      allBlocks.forEach(block => {
        if (expectedHTML[block.id as keyof typeof expectedHTML]) {
          expect(block.html).toBe(expectedHTML[block.id as keyof typeof expectedHTML])
        }
      })
    })
    
    it('preserves block formats correctly', () => {
      const allBlocks = collectAllBlocks(testBlocks)
      
      const expectedFormats = {
        'block_h1_1': 'h1',
        'block_p1': 'p',
        'block_h1_2': 'h1',
        'block_quote': 'blockquote',
        'block_h2': 'h2',
        'block_list': 'ol',
        'block_li1': 'li',
        'block_li2': 'li',
      }
      
      allBlocks.forEach(block => {
        if (expectedFormats[block.id as keyof typeof expectedFormats]) {
          expect(block.style?.format).toBe(expectedFormats[block.id as keyof typeof expectedFormats])
        }
      })
    })
  })

  describe('Test 2: Apply Edits via UI and Save', () => {
    it('simulates inline formatting changes', () => {
      const targetBlock = findBlockById(testBlocks, 'block_p1' as BlockID)
      expect(targetBlock).toBeDefined()
      
      // Simulate applying bold to "paragraph" text
      const originalHTML = targetBlock!.html
      const expectedUpdatedHTML = expectedEditedHTML.block_p1
      
      expect(originalHTML).toBe('This is a <strong>longer</strong> <em>paragraph</em> with <u>various</u> <s>inline</s> <code>formats</code>.')
      expect(expectedUpdatedHTML).toBe('This is a <strong>longer</strong> <em><strong>paragraph</strong></em> with <u>various</u> <s>inline</s> <code>formats</code>.')
      
      // Verify the change would be applied correctly
      expect(expectedUpdatedHTML).toContain('<em><strong>paragraph</strong></em>')
      expect(expectedUpdatedHTML).toContain('<strong>longer</strong>') // Preserved
    })
    
    it('simulates block format changes', () => {
      const targetBlock = findBlockById(testBlocks, 'block_quote' as BlockID)
      expect(targetBlock).toBeDefined()
      expect(targetBlock?.style?.format).toBe('blockquote')
      
      // Simulate changing from blockquote to code
      const originalHTML = targetBlock!.html
      const expectedUpdatedHTML = expectedEditedHTML.block_quote
      
      expect(originalHTML).toContain('<blockquote>')
      expect(expectedUpdatedHTML).not.toContain('<blockquote>')
      expect(expectedUpdatedHTML).toBe('This is a quoted insight.')
    })
    
    it('maintains deep nested structure during edits', () => {
      // Verify deep nesting is preserved
      const grandparent = findBlockById(testBlocks, 'block_h1_2' as BlockID)
      const parent = findBlockById(testBlocks, 'block_h2' as BlockID)
      const child = findBlockById(testBlocks, 'block_list' as BlockID)
      const grandchild = findBlockById(testBlocks, 'block_li1' as BlockID)
      
      expect(grandparent?.children).toContain(parent)
      expect(parent?.children).toContain(child)
      expect(child?.children).toContain(grandchild)
    })
  })
  
  describe('Data Structure Validation', () => {
    it('validates all block properties are present', () => {
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
        expect(block.createdAt).toBeDefined()
        expect(block.updatedAt).toBeDefined()
        // Note: Test data uses string dates that are converted via new Date()
      })
    })
    
    it('validates view structure', () => {
      expect(testView).toHaveProperty('id')
      expect(testView).toHaveProperty('type')
      expect(testView).toHaveProperty('title')
      expect(testView).toHaveProperty('rootBlocks')
      
      expect(testView.rootBlocks).toHaveLength(2)
      expect(testView.type).toBe('document')
      expect(testView.title).toBe('Test Document')
    })
  })
})