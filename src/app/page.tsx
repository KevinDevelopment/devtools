'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const PANEL_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:9877'

type Sector = { id: string; name: string }

type Agent = {
  id: number
  email: string
  agent_id: string
  agent_name: string
  organization_id: string
  organization_name: string
  role: string
  is_admin: number
  access_token: string
  refresh_token: string
  sectors: string
  saved_at: string
}

function parseSectors(raw: string): Sector[] {
  try { return JSON.parse(raw) } catch { return [] }
}

type EventLog = {
  event: string
  payload: unknown
  time: string
}

type ConnState = 'disconnected' | 'connecting' | 'connected' | 'error'
type View = 'select' | 'login' | 'monitoring'

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const connColors: Record<ConnState, string> = {
  disconnected: 'bg-gray-300',
  connecting: 'bg-yellow-400 animate-pulse',
  connected: 'bg-emerald-500 animate-pulse',
  error: 'bg-red-500',
}

const connLabels: Record<ConnState, string> = {
  disconnected: 'Desconectado',
  connecting: 'Conectando...',
  connected: 'Conectado',
  error: 'Erro',
}

function OrgPanel({ label, onRemove }: { label: string; onRemove?: () => void }) {
  const [view, setView] = useState<View>('select')
  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const [connState, setConnState] = useState<ConnState>('disconnected')
  const [socketId, setSocketId] = useState<string | null>(null)
  const [events, setEvents] = useState<EventLog[]>([])
  const socketRef = useRef<Socket | null>(null)

  function addEvent(event: string, payload: unknown) {
    setEvents(prev => [{ event, payload, time: new Date().toLocaleTimeString('pt-BR') }, ...prev])
  }

  const fetchAgents = useCallback(async () => {
    setLoadingAgents(true)
    const res = await fetch('/api/agents')
    setAgents(await res.json())
    setLoadingAgents(false)
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])
  useEffect(() => () => { socketRef.current?.disconnect() }, [])

  function connectSocket(agent: Agent) {
    socketRef.current?.disconnect()
    setConnState('connecting')
    setSocketId(null)

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: agent.access_token },
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnState('connected')
      setSocketId(socket.id ?? null)
    })
    socket.on('connect_error', err => {
      setConnState('error')
      addEvent('connect_error', { message: err.message })
    })
    socket.on('disconnect', reason => {
      setConnState('disconnected')
      setSocketId(null)
      addEvent('disconnect', { reason })
    })
    socket.onAny((event: string, payload: unknown) => addEvent(event, payload))
  }

  function disconnect() {
    socketRef.current?.disconnect()
    socketRef.current = null
    setConnState('disconnected')
    setSocketId(null)
  }

  function selectAgent(agent: Agent) {
    setSelectedAgent(agent)
    setEvents([])
    setView('monitoring')
    connectSocket(agent)
  }

  function switchAgent() {
    disconnect()
    setSelectedAgent(null)
    setEvents([])
    setView('select')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)
    try {
      const res = await fetch('/api/agents/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLoginError(data.error ?? 'Erro ao fazer login')
        return
      }
      await fetchAgents()
      selectAgent(data)
    } catch {
      setLoginError('Erro de conexão com o servidor')
    } finally {
      setLoginLoading(false)
    }
  }

  async function removeAgent(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch(`/api/agents/${id}`, { method: 'DELETE' })
    setAgents(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">{label}</h2>
          {selectedAgent && (
            <p className="text-xs text-blue-600 font-medium">{selectedAgent.organization_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {view === 'monitoring' && (
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${connColors[connState]}`} />
              <span className="text-xs text-gray-500 font-mono">{connLabels[connState]}</span>
            </div>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-[10px] text-gray-400 hover:text-red-500 transition-colors px-1"
              title="Remover painel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* SELEÇÃO DE AGENTE */}
      {view === 'select' && (
        <div className="flex flex-col gap-3">
          {loadingAgents ? (
            <p className="text-xs text-gray-400">Carregando agentes salvos...</p>
          ) : agents.length === 0 ? (
            <p className="text-xs text-gray-400">Nenhum agente salvo ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {agents.map(agent => (
                <li
                  key={agent.id}
                  onClick={() => selectAgent(agent)}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {initials(agent.agent_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{agent.agent_name}</p>
                    <p className="text-xs text-gray-500 truncate">{agent.organization_name} · {agent.role}</p>
                    <p className="text-[10px] text-gray-400 truncate">{agent.email}</p>
                  </div>
                  <button
                    onClick={e => removeAgent(agent.id, e)}
                    className="text-[10px] text-gray-400 hover:text-red-500 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                  >
                    remover
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => { setLoginError(null); setEmail(''); setPassword(''); setView('login') }}
            className="w-full border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-500 hover:text-blue-600 text-sm font-medium py-2 rounded-xl transition-colors"
          >
            + Novo login
          </button>
        </div>
      )}

      {/* FORMULÁRIO DE LOGIN */}
      {view === 'login' && (
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            autoFocus
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Senha"
            required
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
          />
          {loginError && (
            <p className="text-xs text-red-500 font-medium">{loginError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loginLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </button>
            <button
              type="button"
              onClick={() => setView('select')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* MONITORAMENTO */}
      {view === 'monitoring' && selectedAgent && (
        <>
          {/* Info do agente */}
          <div className="flex flex-col gap-2 rounded-xl bg-gray-50 border border-gray-200 p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {initials(selectedAgent.agent_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{selectedAgent.agent_name}</p>
                <p className="text-xs text-gray-500 truncate">{selectedAgent.organization_name} · {selectedAgent.role}</p>
              </div>
              <button
                onClick={switchAgent}
                className="text-[10px] text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
              >
                trocar
              </button>
            </div>
            {(() => {
              const sectors = parseSectors(selectedAgent.sectors)
              if (!sectors.length) return null
              return (
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Setores</p>
                  <div className="flex flex-wrap gap-1">
                    {sectors.map(s => (
                      <span key={s.id} className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>

          {socketId && (
            <p className="text-[10px] font-mono text-gray-400 truncate">socket: {socketId}</p>
          )}

          {/* Controles do socket */}
          <div className="flex gap-2">
            <button
              onClick={() => connectSocket(selectedAgent)}
              disabled={connState === 'connecting' || connState === 'connected'}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Reconectar
            </button>
            <button
              onClick={disconnect}
              disabled={connState === 'disconnected'}
              className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Desconectar
            </button>
          </div>

          {/* Log de eventos */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Eventos</span>
            <div className="flex items-center gap-2">
              {events.length > 0 && (
                <span className="text-[10px] font-mono text-gray-400">{events.length}</span>
              )}
              {events.length > 0 && (
                <button onClick={() => setEvents([])} className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                  limpar
                </button>
              )}
            </div>
          </div>

          {events.length === 0 ? (
            <p className="text-xs text-gray-400">Nenhum evento recebido ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2 overflow-auto max-h-[60vh] pr-1">
              {events.map((e, i) => (
                <li key={i} className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold font-mono text-blue-600 truncate">{e.event}</span>
                    <span className="text-[10px] text-gray-400 font-mono ml-auto flex-shrink-0">{e.time}</span>
                  </div>
                  <pre className="text-[10px] text-gray-600 whitespace-pre-wrap break-all leading-relaxed">
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

export default function SocketTestPage() {
  const nextId = useRef(3)
  const [panels, setPanels] = useState([{ id: 1 }, { id: 2 }])

  function addPanel() {
    setPanels(prev => [...prev, { id: nextId.current++ }])
  }

  function removePanel(id: number) {
    setPanels(prev => prev.filter(p => p.id !== id))
  }

  const gridCols =
    panels.length === 1
      ? 'grid-cols-1'
      : panels.length <= 4
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center p-6 gap-5">
      <div className={`w-full max-w-7xl grid ${gridCols} gap-5`}>
        {panels.map((panel, i) => (
          <OrgPanel
            key={panel.id}
            label={`Painel ${PANEL_LABELS[i] ?? i + 1}`}
            onRemove={panels.length > 1 ? () => removePanel(panel.id) : undefined}
          />
        ))}
      </div>
      <button
        onClick={addPanel}
        className="w-full max-w-7xl border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-400 hover:text-blue-600 text-sm font-medium py-3 rounded-2xl transition-colors"
      >
        + Adicionar painel
      </button>
    </div>
  )
}
