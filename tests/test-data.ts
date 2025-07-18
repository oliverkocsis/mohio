import { Block, View, BlockID, UserID, Timestamp } from '../lib/types'
import { vi } from 'vitest'

// Helper function to create mock timestamps
const createMockTimestamp = (date: string = '2024-01-01'): Timestamp => new Date(date)

// Helper function to create mock user ID
const createMockUserID = (id: string = 'test-user'): UserID => id

// Test data matching the specification
export const testDocument: Block[] = [
  {
    id: "block_h1_1" as BlockID,
    canonical: "First Header 1",
    html: "First Header 1",
    style: { format: "h1" },
    createdBy: createMockUserID(),
    createdAt: createMockTimestamp(),
    updatedBy: createMockUserID(),
    updatedAt: createMockTimestamp(),
    children: [
      {
        id: "block_p1" as BlockID,
        canonical: "This is a longer paragraph with various inline formats.",
        html: "This is a <strong>longer</strong> <em>paragraph</em> with <u>various</u> <s>inline</s> <code>formats</code>.",
        style: { format: "p" },
        createdBy: createMockUserID(),
        createdAt: createMockTimestamp(),
        updatedBy: createMockUserID(),
        updatedAt: createMockTimestamp(),
      }
    ]
  },
  {
    id: "block_h1_2" as BlockID,
    canonical: "Second Header 1",
    html: "Second Header 1",
    style: { format: "h1" },
    createdBy: createMockUserID(),
    createdAt: createMockTimestamp(),
    updatedBy: createMockUserID(),
    updatedAt: createMockTimestamp(),
    children: [
      {
        id: "block_quote" as BlockID,
        canonical: "This is a quoted insight.",
        html: "<blockquote><strong><em>This is a quoted insight.</em></strong></blockquote>",
        style: { format: "blockquote" },
        createdBy: createMockUserID(),
        createdAt: createMockTimestamp(),
        updatedBy: createMockUserID(),
        updatedAt: createMockTimestamp(),
      },
      {
        id: "block_h2" as BlockID,
        canonical: "Subheader",
        html: "Subheader",
        style: { format: "h2" },
        createdBy: createMockUserID(),
        createdAt: createMockTimestamp(),
        updatedBy: createMockUserID(),
        updatedAt: createMockTimestamp(),
        children: [
          {
            id: "block_list" as BlockID,
            canonical: "List of benefits",
            style: { format: "ol" },
            createdBy: createMockUserID(),
            createdAt: createMockTimestamp(),
            updatedBy: createMockUserID(),
            updatedAt: createMockTimestamp(),
            children: [
              {
                id: "block_li1" as BlockID,
                canonical: "Improves reusability",
                html: "<strong>Improves</strong> <em>reusability</em>",
                style: { format: "li" },
                createdBy: createMockUserID(),
                createdAt: createMockTimestamp(),
                updatedBy: createMockUserID(),
                updatedAt: createMockTimestamp(),
              },
              {
                id: "block_li2" as BlockID,
                canonical: "Reduces duplication",
                html: "<strong>Reduces</strong> <em>duplication</em>",
                style: { format: "li" },
                createdBy: createMockUserID(),
                createdAt: createMockTimestamp(),
                updatedBy: createMockUserID(),
                updatedAt: createMockTimestamp(),
              }
            ]
          }
        ]
      }
    ]
  }
]

// Test view containing the document
export const testView: View = {
  id: "test-view" as BlockID,
  type: "document",
  title: "Test Document",
  purpose: "Testing block rendering and editing",
  tone: ["professional"],
  rootBlocks: testDocument,
  createdBy: createMockUserID(),
  createdAt: createMockTimestamp(),
  updatedBy: createMockUserID(),
  updatedAt: createMockTimestamp(),
}

// Expected HTML output after applying Test 2 edits
export const expectedEditedHTML = {
  // After toggling bold on "paragraph" in block_p1
  block_p1: "This is a <strong>longer</strong> <em><strong>paragraph</strong></em> with <u>various</u> <s>inline</s> <code>formats</code>.",
  // After changing blockquote format to code
  block_quote: "This is a quoted insight.",
}

// Helper function to create a deep copy of test data
export const createTestDocumentCopy = (): Block[] => {
  return JSON.parse(JSON.stringify(testDocument))
}

// Helper function to create a test view copy
export const createTestViewCopy = (): View => {
  return JSON.parse(JSON.stringify(testView))
}

// Helper function to find a block by ID in nested structure
export const findBlockById = (blocks: Block[], id: BlockID): Block | null => {
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

// Helper function to collect all blocks from nested structure
export const collectAllBlocks = (blocks: Block[]): Block[] => {
  const result: Block[] = []
  
  const traverse = (blockList: Block[]) => {
    for (const block of blockList) {
      result.push(block)
      if (block.children) {
        traverse(block.children)
      }
    }
  }
  
  traverse(blocks)
  return result
}

// Mock Prisma client functions for testing
export const mockPrismaClient = {
  block: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  },
  view: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $connect: vi.fn(),
  $disconnect: vi.fn(),
}

