import { NextRequest, NextResponse } from 'next/server'
import { agentsDb } from '@/lib/db'

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  agentsDb.delete(Number(id))
  return NextResponse.json({ ok: true })
}
