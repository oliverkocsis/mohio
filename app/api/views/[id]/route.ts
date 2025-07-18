import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from '@/lib/storage'
import { UpdateViewInput } from '@/lib/types'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const storage = getStorage()
    const view = await storage.getView(id)
    
    if (!view) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }
    
    return NextResponse.json(view)
  } catch (error) {
    console.error(`[ViewAPI] Error fetching view ${id}:`, error)
    return NextResponse.json({ error: 'Failed to fetch view' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await request.json()
    const input: UpdateViewInput = {
      title: body.title,
      purpose: body.purpose,
      tone: body.tone,
      rootBlocks: body.rootBlocks
    }
    
    const storage = getStorage()
    const view = await storage.updateView(id, input)
    
    if (!view) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }
    
    return NextResponse.json(view)
  } catch (error) {
    console.error(`[ViewAPI] Error updating view ${id}:`, error)
    return NextResponse.json({ error: 'Failed to update view' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const storage = getStorage()
    const success = await storage.deleteView(id)
    
    if (!success) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[ViewAPI] Error deleting view ${id}:`, error)
    return NextResponse.json({ error: 'Failed to delete view' }, { status: 500 })
  }
}