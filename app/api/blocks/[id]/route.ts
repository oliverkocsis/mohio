import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from '@/lib/storage'
import { UpdateBlockInput, BlockID } from '@/lib/types'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const storage = getStorage()
    const block = await storage.getBlock(id as BlockID)
    
    if (!block) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 })
    }
    
    return NextResponse.json(block)
  } catch (error) {
    console.error('Error fetching block:', error)
    return NextResponse.json({ error: 'Failed to fetch block' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await request.json()
    const input: UpdateBlockInput = {
      canonical: body.canonical,
      html: body.html,
      style: body.style,
      children: body.children
    }
    
    const storage = getStorage()
    const block = await storage.updateBlock(id as BlockID, input)
    
    if (!block) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 })
    }
    
    return NextResponse.json(block)
  } catch (error) {
    console.error('Error updating block:', error)
    return NextResponse.json({ error: 'Failed to update block' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const storage = getStorage()
    const success = await storage.deleteBlock(id as BlockID)
    
    if (!success) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting block:', error)
    return NextResponse.json({ error: 'Failed to delete block' }, { status: 500 })
  }
}