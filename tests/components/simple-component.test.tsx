import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { testDocument, findBlockById } from '../test-data'
import { Block, BlockID } from '../../lib/types'

describe('Simple Component Tests', () => {
  let testBlocks: Block[]
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    testBlocks = JSON.parse(JSON.stringify(testDocument))
  })

  describe('Basic Block Info Component', () => {
    const BlockInfo = ({ block }: { block: Block }) => (
      <div data-testid="block-info">
        <div>ID: {block.id}</div>
        <div>Format: {block.style?.format || 'none'}</div>
        <div>Content: {block.canonical}</div>
        <div>Created by: {block.createdBy}</div>
      </div>
    )

    it('displays block information correctly', () => {
      const block = findBlockById(testBlocks, 'block_p1' as BlockID)!
      render(<BlockInfo block={block} />)
      
      expect(screen.getByText('ID: block_p1')).toBeInTheDocument()
      expect(screen.getByText('Format: p')).toBeInTheDocument()
      expect(screen.getByText(/Content: This is a longer paragraph/)).toBeInTheDocument()
      expect(screen.getByText('Created by: test-user')).toBeInTheDocument()
    })

    it('handles different block formats', () => {
      const headerBlock = findBlockById(testBlocks, 'block_h1_1' as BlockID)!
      render(<BlockInfo block={headerBlock} />)
      
      expect(screen.getByText('Format: h1')).toBeInTheDocument()
      expect(screen.getByText('Content: First Header 1')).toBeInTheDocument()
    })

    it('handles blockquote format', () => {
      const quoteBlock = findBlockById(testBlocks, 'block_quote' as BlockID)!
      render(<BlockInfo block={quoteBlock} />)
      
      expect(screen.getByText('Format: blockquote')).toBeInTheDocument()
      expect(screen.getByText('Content: This is a quoted insight.')).toBeInTheDocument()
    })
  })

  describe('Simple Editor Component', () => {
    const SimpleEditor = ({ 
      block, 
      onSave 
    }: { 
      block: Block, 
      onSave?: (content: string) => void 
    }) => {
      const [isEditing, setIsEditing] = React.useState(false)
      const [content, setContent] = React.useState(block.canonical)

      const handleSave = () => {
        onSave?.(content)
        setIsEditing(false)
      }

      return (
        <div data-testid="simple-editor">
          {isEditing ? (
            <div>
              <input 
                data-testid="content-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          ) : (
            <div>
              <span data-testid="display-content">{block.canonical}</span>
              <button onClick={() => setIsEditing(true)}>Edit</button>
            </div>
          )}
        </div>
      )
    }

    it('displays content in view mode', () => {
      const block = findBlockById(testBlocks, 'block_p1' as BlockID)!
      render(<SimpleEditor block={block} />)
      
      expect(screen.getByTestId('display-content')).toHaveTextContent(block.canonical)
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    it('enters edit mode when Edit button is clicked', async () => {
      const block = findBlockById(testBlocks, 'block_p1' as BlockID)!
      render(<SimpleEditor block={block} />)
      
      await user.click(screen.getByText('Edit'))
      
      expect(screen.getByTestId('content-input')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('calls onSave with updated content', async () => {
      const block = findBlockById(testBlocks, 'block_p1' as BlockID)!
      const onSave = vi.fn()
      render(<SimpleEditor block={block} onSave={onSave} />)
      
      await user.click(screen.getByText('Edit'))
      
      const input = screen.getByTestId('content-input')
      await user.clear(input)
      await user.type(input, 'Updated content')
      
      await user.click(screen.getByText('Save'))
      
      expect(onSave).toHaveBeenCalledWith('Updated content')
    })

    it('cancels editing without saving', async () => {
      const block = findBlockById(testBlocks, 'block_p1' as BlockID)!
      const onSave = vi.fn()
      render(<SimpleEditor block={block} onSave={onSave} />)
      
      await user.click(screen.getByText('Edit'))
      
      const input = screen.getByTestId('content-input')
      await user.clear(input)
      await user.type(input, 'Changed content')
      
      await user.click(screen.getByText('Cancel'))
      
      expect(screen.getByTestId('display-content')).toHaveTextContent(block.canonical)
      expect(onSave).not.toHaveBeenCalled()
    })
  })

  describe('Format Selector Component', () => {
    const FormatSelector = ({ 
      format, 
      onFormatChange 
    }: { 
      format: string, 
      onFormatChange?: (format: string) => void 
    }) => (
      <div data-testid="format-selector">
        <label>Format:</label>
        <select 
          value={format}
          onChange={(e) => onFormatChange?.(e.target.value)}
          data-testid="format-select"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="blockquote">Quote</option>
          <option value="code">Code</option>
        </select>
      </div>
    )

    it('displays current format', () => {
      render(<FormatSelector format="h1" />)
      
      const select = screen.getByTestId('format-select')
      expect(select).toHaveValue('h1')
    })

    it('calls onFormatChange when selection changes', async () => {
      const onFormatChange = vi.fn()
      render(<FormatSelector format="p" onFormatChange={onFormatChange} />)
      
      await user.selectOptions(screen.getByTestId('format-select'), 'h1')
      
      expect(onFormatChange).toHaveBeenCalledWith('h1')
    })

    it('shows all format options', () => {
      render(<FormatSelector format="p" />)
      
      const select = screen.getByTestId('format-select')
      const options = Array.from(select.children).map(option => option.textContent)
      
      expect(options).toEqual([
        'Paragraph',
        'Heading 1', 
        'Heading 2',
        'Quote',
        'Code'
      ])
    })
  })

  describe('Block Hierarchy Display', () => {
    const BlockHierarchy = ({ blocks }: { blocks: Block[] }) => {
      const renderBlock = (block: Block, level = 0) => (
        <div key={block.id} style={{ marginLeft: `${level * 20}px` }} data-testid={`block-${block.id}`}>
          <span>{block.id}: {block.canonical}</span>
          {block.children?.map(child => renderBlock(child, level + 1))}
        </div>
      )

      return (
        <div data-testid="block-hierarchy">
          {blocks.map(block => renderBlock(block))}
        </div>
      )
    }

    it('renders all blocks in hierarchy', () => {
      render(<BlockHierarchy blocks={testBlocks} />)
      
      expect(screen.getByTestId('block-hierarchy')).toBeInTheDocument()
      expect(screen.getByTestId('block-block_h1_1')).toBeInTheDocument()
      expect(screen.getByTestId('block-block_p1')).toBeInTheDocument()
      expect(screen.getByTestId('block-block_h1_2')).toBeInTheDocument()
      expect(screen.getByTestId('block-block_quote')).toBeInTheDocument()
    })

    it('shows nested structure', () => {
      render(<BlockHierarchy blocks={testBlocks} />)
      
      const nestedBlocks = [
        'block-block_li1',
        'block-block_li2',
        'block-block_list',
        'block-block_h2'
      ]
      
      nestedBlocks.forEach(blockId => {
        expect(screen.getByTestId(blockId)).toBeInTheDocument()
      })
    })
  })
})