'use client'

import { useEffect, useState } from 'react'

type Org = {
  id: string
  name: string
  socialReason: string
  cnpj: string
}

type CreateForm = {
  name: string
  email: string
  hashPassword: string
}

type CreatedAgent = {
  id: string
  sectors: unknown[]
  connections: unknown[]
}

const emptyForm: CreateForm = { name: '', email: '', hashPassword: '' }

function OrgCard({ org }: { org: Org }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateForm>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedAgent | null>(null)

  function field(key: keyof CreateForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCreated(null)
    setLoading(true)
    try {
      const res = await fetch('/api/orgs/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, organizationId: org.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao criar agente')
        return
      }
      setCreated(data)
      setForm(emptyForm)
    } catch {
      setError('Erro de conexão com o servidor')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setForm(emptyForm)
    setError(null)
    setCreated(null)
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
      {/* Org info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{org.name}</p>
          <p className="text-xs text-gray-500">{org.socialReason}</p>
          <p className="text-[10px] font-mono text-gray-400 mt-0.5">CNPJ: {org.cnpj}</p>
        </div>
        <button
          onClick={() => { setOpen(o => !o); setError(null); setCreated(null) }}
          className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
        >
          {open ? 'Fechar' : 'Criar agente'}
        </button>
      </div>

      {/* ID copiável */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
        <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">ID</span>
        <span className="text-xs font-mono text-gray-700 flex-1 truncate">{org.id}</span>
        <button
          onClick={() => navigator.clipboard.writeText(org.id)}
          className="text-[10px] text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
        >
          copiar
        </button>
      </div>

      {/* Formulário de criação */}
      {open && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Novo agente em {org.name}</p>
          <input
            type="text"
            placeholder="Nome"
            value={form.name}
            onChange={field('name')}
            required
            autoFocus
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={field('email')}
            required
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
          />
          <input
            type="password"
            placeholder="Senha"
            value={form.hashPassword}
            onChange={field('hashPassword')}
            required
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
          />

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          {created && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
              <p className="text-xs font-semibold text-emerald-700">Agente criado com sucesso</p>
              <p className="text-[10px] font-mono text-emerald-600 mt-0.5">ID: {created.id}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              {loading ? 'Criando...' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function BackstagePage() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/orgs')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setOrgs(data)
      })
      .catch(() => setError('Erro ao carregar organizações'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center p-6 gap-5">

      {loading && (
        <p className="text-sm text-gray-400">Carregando organizações...</p>
      )}

      {error && (
        <div className="w-full max-w-3xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && orgs.length === 0 && (
        <p className="text-sm text-gray-400">Nenhuma organização encontrada.</p>
      )}

      {orgs.length > 0 && (
        <div className="w-full max-w-3xl flex flex-col gap-4">
          <p className="text-xs text-gray-400 font-mono">{orgs.length} organização{orgs.length !== 1 ? 'ões' : ''}</p>
          {orgs.map(org => <OrgCard key={org.id} org={org} />)}
        </div>
      )}
    </div>
  )
}
