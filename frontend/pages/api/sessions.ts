import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

const USERS_PATH = path.resolve(process.cwd(), 'frontend', 'data', 'users.json');

async function readUsers() {
  try { const raw = await fs.readFile(USERS_PATH, 'utf8'); return JSON.parse(raw); } catch (e) { return []; }
}

async function proxySessionToBackend(req: NextApiRequest, backendBase: string) {
  const url = `${backendBase.replace(/\/$/, '')}/api/sessions`;
  const init: any = { method: req.method, headers: { 'Content-Type': 'application/json' }, credentials: 'include' };
  if (req.method === 'POST') init.body = JSON.stringify(req.body);
  const r = await fetch(url, init);
  const text = await r.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { json = text; }
  return { status: r.status, body: json };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backendCandidates = [process.env.NEXT_PUBLIC_API_URL, process.env.SERVER_API_URL, 'http://localhost:3001'].filter(Boolean) as string[];
  if (req.method === 'POST') {
    // Try backend first
    for (const base of backendCandidates) {
      try {
        const prox = await proxySessionToBackend(req, base);
        if (prox) return res.status(prox.status).json(prox.body);
      } catch (e) {}
    }

    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const users = await readUsers();
    const found = users.find((u:any)=>u.email === email && u.password === password);
    if (!found) return res.status(401).json({ error: 'invalid credentials' });
    return res.status(200).json({ user: { id: found.id, name: found.name, email: found.email } });
  }
  return res.status(405).end();
}
