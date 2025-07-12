import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from '@/lib/storage'
import { UpdateArtifactInput } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const storage = getStorage()
    const artifact = await storage.getArtifact(resolvedParams.id)
    
    if (!artifact) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 })
    }
    
    return NextResponse.json(artifact)
  } catch (error) {
    console.error('Error fetching artifact:', error)
    return NextResponse.json({ error: 'Failed to fetch artifact' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const body: UpdateArtifactInput = await request.json()
    const storage = getStorage()
    const artifact = await storage.updateArtifact(resolvedParams.id, body)
    
    if (!artifact) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 })
    }
    
    return NextResponse.json(artifact)
  } catch (error) {
    console.error('Error updating artifact:', error)
    return NextResponse.json({ error: 'Failed to update artifact' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const storage = getStorage()
    const deleted = await storage.deleteArtifact(resolvedParams.id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting artifact:', error)
    return NextResponse.json({ error: 'Failed to delete artifact' }, { status: 500 })
  }
}