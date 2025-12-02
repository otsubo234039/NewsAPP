import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

const USERS_PATH = path.resolve(process.cwd(), 'frontend', 'data', 'users.json');

async function readUsers() {
  try {
    const raw = await fs.readFile(USERS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
async function writeUsers(users: any[]) {
  await fs.mkdir(path.dirname(USERS_PATH), { recursive: true });
  await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2), 'utf8');
}

// Try to proxy to backend Rails API if configured, otherwise fall back to file-backed dev store.
async function proxyToBackend(req: NextApiRequest, backendBase: string) {
  const url = `${backendBase.replace(/\/$/, '')}/api/users`;
  const init: any = { method: req.method, headers: { 'Content-Type': 'application/json' } };
  if (req.method === 'POST') init.body = JSON.stringify(req.body);
  const r = await fetch(url, init);
  const text = await r.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { json = text; }
  return { status: r.status, body: json };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backendCandidates = [process.env.NEXT_PUBLIC_API_URL, process.env.SERVER_API_URL, 'http://localhost:3001'].filter(Boolean) as string[];

  // For POST, try backend first
  if (req.method === 'POST') {
    for (const base of backendCandidates) {
      try {
        const prox = await proxyToBackend(req, base);
        // if backend responded, forward it
        if (prox) return res.status(prox.status).json(prox.body);
      } catch (e) {
        // try next
      }
    }

    // fallback: file-backed dev users
    const body = req.body || {};
    const userParams = body.user || body;
    const { name, email, password } = userParams;
    if (!email || !password) return res.status(400).json({ errors: ['email and password required'] });

    const users = await readUsers();
    if (users.find((u:any)=>u.email === email)) return res.status(422).json({ errors: ['email already taken'] });

    const id = Date.now();
    const newUser = { id, name: name || '', email, password };
    users.push(newUser);
    await writeUsers(users);
    return res.status(201).json({ user: { id, name: newUser.name, email: newUser.email } });
  }

  // list users (dev-only)
  if (req.method === 'GET') {
    const users = await readUsers();
    const safe = users.map((u:any)=>({ id: u.id, name: u.name, email: u.email }));
    return res.status(200).json({ users: safe });
  }

  return res.status(405).end();
}
