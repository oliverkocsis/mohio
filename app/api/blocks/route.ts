import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from '@/lib/storage'
import { CreateBlockInput } from '@/lib/types'

export async function GET() {
  try {
    const storage = getStorage()
    const blocks = await storage.getAllBlocks()
    return NextResponse.json(blocks)
  } catch (error) {
    console.error('Error fetching blocks:', error)
    return NextResponse.json({ error: 'Failed to fetch blocks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input: CreateBlockInput = {
      canonical: body.canonical,
      html: body.html,
      style: body.style,
      children: body.children,
      createdBy: body.createdBy || 'anonymous'
    }
    
    const storage = getStorage()
    const block = await storage.createBlock(input)
    return NextResponse.json(block, { status: 201 })
  } catch (error) {
    console.error('Error creating block:', error)
    return NextResponse.json({ error: 'Failed to create block' }, { status: 500 })
  }
}