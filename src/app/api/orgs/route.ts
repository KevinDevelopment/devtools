import { NextRequest, NextResponse } from 'next/server'
import { agentsDb } from '@/lib/db'

const BACKEND = process.env.NEXT_PUBLIC_API ?? 'http://localhost:9877'

export async function GET() {
  const agents = agentsDb.getAll()
  if (!agents.length) {
    return NextResponse.json(
      { error: 'Nenhum agente logado. Faça login no Socket Tester primeiro.' },
      { status: 401 }
    )
  }

  const res = await fetch(`${BACKEND}/v1/organizations`, {
    headers: { 'x-access-token': agents[0].access_token },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Erro ao listar organizações' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data.body.organizations)
}

export async function POST(req: NextRequest) {
  const agents = agentsDb.getAll()
  if (!agents.length) {
    return NextResponse.json(
      { error: 'Nenhum agente logado. Faça login no Socket Tester primeiro.' },
      { status: 401 }
    )
  }

  const { name, socialReason, cnpj } = await req.json()

  const form = new FormData()
  form.append('name', name)
  form.append('socialReason', socialReason)
  form.append('cnpj', cnpj)

  const res = await fetch(`${BACKEND}/v1/organizations`, {
    method: 'POST',
    headers: { 'x-access-token': agents[0].access_token },
    body: form,
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json(
      { error: data.message ?? 'Erro ao criar organização' },
      { status: res.status }
    )
  }

  return NextResponse.json(data.body)
}
