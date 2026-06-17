'use client'

import { useState } from 'react'

type Form = { name: string; socialReason: string; cnpj: string }
type CreatedOrg = { id: string; name: string }

const emptyForm: Form = { name: '', socialReason: '', cnpj: '' }

export default function NovaOrgPage() {
  const [form, setForm] = useState<Form>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedOrg | null>(null)

  function field(key: keyof Form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCreated(null)
    setLoading(true)
    try {
      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao criar organização')
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

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center p-6">
      <div className="w-full max-w-md flex flex-col gap-4">
        <div>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Backstage</p>
          <h1 className="text-lg font-semibold text-gray-800">Nova organização</h1>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
              type="text"
              placeholder="Razão social"
              value={form.socialReason}
              onChange={field('socialReason')}
              required
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
            />
            <input
              type="text"
              placeholder="CNPJ"
              value={form.cnpj}
              onChange={field('cnpj')}
              required
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
            />

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            {created && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
                <p className="text-xs font-semibold text-emerald-700">Organização criada com sucesso</p>
                <p className="text-[10px] font-mono text-emerald-600 mt-0.5">ID: {created.id}</p>
                {created.name && (
                  <p className="text-[10px] text-emerald-600">{created.name}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              {loading ? 'Criando...' : 'Criar organização'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
