import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from '@/lib/storage'
import { CreateSyntacticVariantInput } from '@/lib/types'

export async function GET() {
  try {
    const storage = getStorage()
    const variants = await storage.getAllSyntacticVariants()
    return NextResponse.json(variants)
  } catch (error) {
    console.error('Error fetching syntactic variants:', error)
    return NextResponse.json({ error: 'Failed to fetch syntactic variants' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input: CreateSyntacticVariantInput = {
      base: body.base,
      variant: body.variant,
      variance: body.variance,
      transformation: body.transformation,
      depth: body.depth
    }
    
    const storage = getStorage()
    const variant = await storage.createSyntacticVariant(input)
    return NextResponse.json(variant, { status: 201 })
  } catch (error) {
    console.error('Error creating syntactic variant:', error)
    return NextResponse.json({ error: 'Failed to create syntactic variant' }, { status: 500 })
  }
}