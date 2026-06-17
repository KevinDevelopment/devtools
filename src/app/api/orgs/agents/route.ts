import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API ?? 'http://localhost:9877'

export async function POST(req: NextRequest) {
  const accountId = process.env.ACCOUNT_ID
  if (!accountId) {
    return NextResponse.json(
      { error: 'ACCOUNT_ID não configurado no servidor (.env.local)' },
      { status: 500 }
    )
  }

  const { name, email, hashPassword, organizationId } = await req.json()

  const form = new FormData()
  form.append('name', name)
  form.append('email', email)
  form.append('hashPassword', hashPassword)
  form.append('organizationId', organizationId)

  const res = await fetch(`${BACKEND}/v1/agents`, {
    method: 'POST',
    headers: { 'x-account-id': accountId },
    body: form,
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json(
      { error: data.message ?? 'Erro ao criar agente' },
      { status: res.status }
    )
  }

  return NextResponse.json(data.body)
}
