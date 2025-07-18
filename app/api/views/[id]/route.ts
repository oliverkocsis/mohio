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
    console.error('Error fetching view:', error)
    return NextResponse.json({ error: 'Failed to fetch view' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log('PUT request received for view ID:', id)
  try {
    const body = await request.json()
    console.log('Request body keys:', Object.keys(body))
    const input: UpdateViewInput = {
      title: body.title,
      purpose: body.purpose,
      tone: body.tone,
      rootBlocks: body.rootBlocks
    }
    
    const storage = getStorage()
    console.log('Storage type:', storage.constructor.name)
    const view = await storage.updateView(id, input)
    
    if (!view) {
      console.log('View not found for ID:', id)
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }
    
    console.log('View updated successfully:', view.id)
    return NextResponse.json(view)
  } catch (error) {
    console.error('Error updating view:', error)
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
    console.error('Error deleting view:', error)
    return NextResponse.json({ error: 'Failed to delete view' }, { status: 500 })
  }
}