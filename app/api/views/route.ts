import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from '@/lib/storage'
import { CreateViewInput } from '@/lib/types'

export async function GET() {
  try {
    const storage = getStorage()
    const views = await storage.getAllViews()
    return NextResponse.json(views)
  } catch (error) {
    console.error('Error fetching views:', error)
    return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input: CreateViewInput = {
      type: body.type,
      title: body.title,
      purpose: body.purpose,
      tone: body.tone || [],
      rootBlocks: body.rootBlocks || [],
      createdBy: body.createdBy || 'anonymous'
    }
    
    const storage = getStorage()
    const view = await storage.createView(input)
    return NextResponse.json(view, { status: 201 })
  } catch (error) {
    console.error('Error creating view:', error)
    return NextResponse.json({ error: 'Failed to create view' }, { status: 500 })
  }
}