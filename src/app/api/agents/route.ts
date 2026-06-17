import { NextResponse } from 'next/server'
import { agentsDb } from '@/lib/db'

export async function GET() {
  return NextResponse.json(agentsDb.getAll())
}
