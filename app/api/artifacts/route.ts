import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from '@/lib/storage'
import { CreateArtifactInput } from '@/lib/types'

export async function GET() {
  try {
    const storage = getStorage()
    const artifacts = await storage.getAllArtifacts()
    return NextResponse.json(artifacts)
  } catch (error) {
    console.error('Error fetching artifacts:', error)
    return NextResponse.json({ error: 'Failed to fetch artifacts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateArtifactInput = await request.json()
    
    if (!body.title || !body.content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const storage = getStorage()
    const artifact = await storage.createArtifact(body)
    
    return NextResponse.json(artifact, { status: 201 })
  } catch (error) {
    console.error('Error creating artifact:', error)
    return NextResponse.json({ error: 'Failed to create artifact' }, { status: 500 })
  }
}