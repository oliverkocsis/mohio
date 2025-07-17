'use client'

import { useEffect, useState, useCallback } from 'react'
import { useBlockStore } from '@/lib/store/block-store'
import { BlockShareProvider } from './BlockShareProvider'
import { BlockList } from './BlockEditor'
import { View, Block } from '@/lib/types'

function StoreTestContent() {
  const { 
    getAllViews, 
    getAllBlocks, 
    createView, 
    createBlock, 
    loadInitialData,
    isLoading,
    error,
    currentUser,
    setCurrentUser
  } = useBlockStore()
  
  const [views, setViews] = useState<View[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null)

  useEffect(() => {
    loadInitialData()
    setCurrentUser('test-user')
  }, [loadInitialData, setCurrentUser])

  const refreshData = useCallback(() => {
    setViews(getAllViews())
    setBlocks(getAllBlocks())
  }, [getAllViews, getAllBlocks])

  const handleCreateTestView = async () => {
    try {
      const testView = await createView({
        type: 'document',
        title: 'Test View',
        purpose: 'Testing Zustand store',
        tone: ['casual'],
        rootBlocks: [],
        createdBy: currentUser
      })
      refreshData()
      setSelectedViewId(testView.id)
    } catch (error) {
      console.error('Failed to create test view:', error)
    }
  }

  const handleCreateTestBlock = async () => {
    try {
      await createBlock({
        canonical: 'This is a test block created from the store',
        html: '<p>This is a test block created from the store</p>',
        style: { format: 'p' },
        createdBy: currentUser
      })
      refreshData()
    } catch (error) {
      console.error('Failed to create test block:', error)
    }
  }

  useEffect(() => {
    refreshData()
  }, [refreshData])

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Zustand Store Test</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Store Actions</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCreateTestView}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Test View
          </button>
          <button
            onClick={handleCreateTestBlock}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Create Test Block
          </button>
          <button
            onClick={refreshData}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-3">Views ({views.length})</h2>
          <div className="space-y-2">
            {views.map((view) => (
              <div
                key={view.id}
                className={`p-3 border rounded cursor-pointer ${
                  selectedViewId === view.id ? 'bg-blue-100 border-blue-500' : 'bg-gray-50'
                }`}
                onClick={() => setSelectedViewId(view.id)}
              >
                <h3 className="font-medium">{view.title}</h3>
                <p className="text-sm text-gray-600">{view.purpose}</p>
                <p className="text-xs text-gray-500">
                  {view.rootBlocks.length} blocks • {view.type}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Blocks ({blocks.length})</h2>
          <div className="space-y-2">
            {blocks.map((block) => (
              <div key={block.id} className="p-3 border rounded bg-gray-50">
                <p className="text-sm">{block.canonical}</p>
                <p className="text-xs text-gray-500">
                  {block.style?.format} • {block.createdBy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedViewId && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Block Editor for Selected View</h2>
          <BlockList viewId={selectedViewId} />
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-medium mb-2">Store State</h3>
        <p className="text-sm text-gray-600">
          Current User: {currentUser} | Loading: {isLoading.toString()} | Error: {error || 'none'}
        </p>
      </div>
    </div>
  )
}

export default function StoreTestPage() {
  return (
    <BlockShareProvider>
      <StoreTestContent />
    </BlockShareProvider>
  )
}