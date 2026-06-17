import Database from 'better-sqlite3'
import path from 'path'

const db = new Database(path.join(process.cwd(), 'agents.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    role TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    saved_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

try {
  db.exec(`ALTER TABLE agents ADD COLUMN sectors TEXT NOT NULL DEFAULT '[]'`)
} catch {
  // column already exists
}

export type Agent = {
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

export const agentsDb = {
  getAll: () =>
    db.prepare('SELECT * FROM agents ORDER BY saved_at DESC').all() as Agent[],

  upsert: (data: Omit<Agent, 'id' | 'saved_at'>) => {
    db.prepare(`
      INSERT INTO agents (email, agent_id, agent_name, organization_id, organization_name, role, is_admin, access_token, refresh_token, sectors)
      VALUES (@email, @agent_id, @agent_name, @organization_id, @organization_name, @role, @is_admin, @access_token, @refresh_token, @sectors)
      ON CONFLICT(email) DO UPDATE SET
        agent_id = @agent_id,
        agent_name = @agent_name,
        organization_id = @organization_id,
        organization_name = @organization_name,
        role = @role,
        is_admin = @is_admin,
        access_token = @access_token,
        refresh_token = @refresh_token,
        sectors = @sectors,
        saved_at = datetime('now')
    `).run(data)
    return db.prepare('SELECT * FROM agents WHERE email = ?').get(data.email) as Agent
  },

  delete: (id: number) => db.prepare('DELETE FROM agents WHERE id = ?').run(id),
}
