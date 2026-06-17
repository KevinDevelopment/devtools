import { NextRequest, NextResponse } from 'next/server'
import { agentsDb } from '@/lib/db'

const BACKEND = process.env.NEXT_PUBLIC_API ?? 'http://localhost:9877'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const res = await fetch(`${BACKEND}/v1/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    return NextResponse.json(
      { error: err?.message ?? 'Credenciais inválidas' },
      { status: res.status }
    )
  }

  const { body } = await res.json()

  const agent = agentsDb.upsert({
    email,
    agent_id: body.agentId,
    agent_name: body.agentName,
    organization_id: body.organizationId,
    organization_name: body.organizationName,
    role: body.role,
    is_admin: body.isAdmin ? 1 : 0,
    access_token: body.accessToken,
    refresh_token: body.refreshToken,
    sectors: JSON.stringify(body.sectors ?? []),
  })

  return NextResponse.json(agent)
}
