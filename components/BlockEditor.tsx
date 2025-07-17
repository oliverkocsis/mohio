'use client'

import { useState, useEffect } from 'react'
import { useBlockStore } from '@/lib/store/block-store'
import { useBlockShare } from './BlockShareProvider'
import { Block, BlockID, BlockStyle } from '@/lib/types'

interface BlockEditorProps {
  blockId: BlockID
  viewId: string
  onBlockChange?: (block: Block) => void
}

export function BlockEditor({ blockId, onBlockChange }: BlockEditorProps) {
  const { getBlock, updateBlock } = useBlockStore()
  const { subscribeToBlockChanges, broadcastBlockChange, getBlockReferences } = useBlockShare()
  const [block, setBlock] = useState<Block | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState('')

  useEffect(() => {
    const blockData = getBlock(blockId)
    if (blockData) {
      setBlock(blockData)
      setContent(blockData.canonical)
    }
  }, [blockId, getBlock])

  useEffect(() => {
    if (!block) return
    
    const unsubscribe = subscribeToBlockChanges(blockId, (updatedBlock) => {
      setBlock(updatedBlock)
      setContent(updatedBlock.canonical)
      onBlockChange?.(updatedBlock)
    })
    
    return unsubscribe
  }, [blockId, block, subscribeToBlockChanges, onBlockChange])

  const handleSave = async () => {
    if (!block) return
    
    const updatedBlock = await updateBlock(blockId, {
      canonical: content,
      html: `<p>${content}</p>` // Simple HTML conversion
    })
    
    if (updatedBlock) {
      broadcastBlockChange(blockId, updatedBlock)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setContent(block?.canonical || '')
    setIsEditing(false)
  }

  const handleStyleChange = async (style: Partial<BlockStyle>) => {
    if (!block) return
    
    const updatedBlock = await updateBlock(blockId, {
      style: { ...block.style, ...style }
    })
    
    if (updatedBlock) {
      broadcastBlockChange(blockId, updatedBlock)
    }
  }

  const references = getBlockReferences(blockId)
  const isShared = references.length > 1

  if (!block) {
    return <div className="p-2 text-gray-500">Block not found</div>
  }

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Block ID: {blockId}</span>
          {isShared && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              Shared ({references.length} views)
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={block.style?.format || 'p'}
            onChange={(e) => handleStyleChange({ format: e.target.value as BlockStyle['format'] })}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="ul">Bullet List</option>
            <option value="ol">Numbered List</option>
            <option value="blockquote">Quote</option>
            <option value="code">Code</option>
          </select>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              Edit
            </button>
          ) : (
            <div className="flex space-x-1">
              <button
                onClick={handleSave}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-2">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter block content..."
          />
        ) : (
          <div 
            className="text-sm p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
            onClick={() => setIsEditing(true)}
            dangerouslySetInnerHTML={{ __html: block.html || `<p>${block.canonical}</p>` }}
          />
        )}
      </div>

      {isShared && (
        <div className="text-xs text-gray-500 mt-2">
          <span className="font-semibold">Used in:</span>{' '}
          {references.map(ref => ref.title).join(', ')}
        </div>
      )}

      <div className="text-xs text-gray-400 mt-1">
        Created by {block.createdBy} • Updated {new Date(block.updatedAt).toLocaleString()}
      </div>
    </div>
  )
}

interface BlockListProps {
  viewId: string
}

export function BlockList({ viewId }: BlockListProps) {
  const { getView } = useBlockStore()
  const view = getView(viewId)
  
  if (!view) {
    return <div className="p-4 text-gray-500">View not found</div>
  }

  const renderBlocks = (blocks: Block[], level = 0) => {
    return blocks.map(block => (
      <div key={block.id} style={{ marginLeft: `${level * 20}px` }}>
        <BlockEditor blockId={block.id} viewId={viewId} />
        {block.children && renderBlocks(block.children, level + 1)}
      </div>
    ))
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg mb-4">Blocks in {view.title}</h3>
      {view.rootBlocks.length > 0 ? (
        renderBlocks(view.rootBlocks)
      ) : (
        <div className="p-4 text-gray-500 text-center">
          No blocks in this view
        </div>
      )}
    </div>
  )
}