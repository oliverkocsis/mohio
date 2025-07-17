import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from '@/lib/storage'
import { BlockID } from '@/lib/types'

export async function GET(request: NextRequest, { params }: { params: Promise<{ baseId: string, variantId: string }> }) {
  const { baseId, variantId } = await params
  try {
    const storage = getStorage()
    const variant = await storage.getSyntacticVariant(baseId as BlockID, variantId as BlockID)
    
    if (!variant) {
      return NextResponse.json({ error: 'Syntactic variant not found' }, { status: 404 })
    }
    
    return NextResponse.json(variant)
  } catch (error) {
    console.error('Error fetching syntactic variant:', error)
    return NextResponse.json({ error: 'Failed to fetch syntactic variant' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ baseId: string, variantId: string }> }) {
  const { baseId, variantId } = await params
  try {
    const storage = getStorage()
    const success = await storage.deleteSyntacticVariant(baseId as BlockID, variantId as BlockID)
    
    if (!success) {
      return NextResponse.json({ error: 'Syntactic variant not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting syntactic variant:', error)
    return NextResponse.json({ error: 'Failed to delete syntactic variant' }, { status: 500 })
  }
}