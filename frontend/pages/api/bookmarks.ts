import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

const BOOKMARKS_PATH = path.resolve(process.cwd(), 'frontend', 'data', 'bookmarks.json');

async function readBookmarks() {
  try { const raw = await fs.readFile(BOOKMARKS_PATH, 'utf8'); return JSON.parse(raw); } catch (e) { return {}; }
}
async function writeBookmarks(obj: any) { await fs.mkdir(path.dirname(BOOKMARKS_PATH), { recursive: true }); await fs.writeFile(BOOKMARKS_PATH, JSON.stringify(obj, null, 2), 'utf8'); }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simple auth: pass `user_email` in body or query to identify user (dev-only)
  const user_email = (req.body && req.body.user_email) || (req.query && req.query.user_email);
  if (!user_email) return res.status(400).json({ error: 'user_email required (dev-only)' });

  const all = await readBookmarks();
  const list = Array.isArray(all[user_email]) ? all[user_email] : [];

  if (req.method === 'GET') {
    return res.status(200).json({ bookmarks: list });
  }
  if (req.method === 'POST') {
    const { article_id } = req.body || {};
    if (!article_id) return res.status(400).json({ error: 'article_id required' });
    const next = new Set(list);
    next.add(article_id);
    all[user_email] = Array.from(next);
    await writeBookmarks(all);
    return res.status(201).json({ bookmarks: all[user_email] });
  }
  if (req.method === 'DELETE') {
    const { article_id } = req.body || {};
    if (!article_id) return res.status(400).json({ error: 'article_id required' });
    all[user_email] = (all[user_email] || []).filter((x:any)=>x !== article_id);
    await writeBookmarks(all);
    return res.status(200).json({ bookmarks: all[user_email] });
  }

  return res.status(405).end();
}
