import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

type Article = any;

const BACKUP_PATH = path.resolve(process.cwd(), 'backups', 'articles-20251130-221004.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const raw = await fs.readFile(BACKUP_PATH, 'utf8');
    const json = JSON.parse(raw);
    const all: Article[] = Array.isArray(json?.articles) ? json.articles : [];

    const q = (req.query.q as string | undefined)?.toLowerCase();
    const category = (req.query.category as string | undefined) || undefined;
    const tags = (req.query.tags as string | undefined) ? (req.query.tags as string).split(',').map(s=>s.trim().toLowerCase()).filter(Boolean) : [];
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const per_page = Math.min(100, Math.max(1, parseInt((req.query.per_page as string) || '20', 10)));

    let filtered = all.slice();

    if (category) {
      filtered = filtered.filter(a => (a.category || '').toLowerCase() === category.toLowerCase());
    }

    if (tags.length > 0) {
      filtered = filtered.filter(a => {
        const t = Array.isArray(a.tags) ? a.tags.map((x:string)=>String(x).toLowerCase()) : [];
        return tags.every(tag => t.includes(tag));
      });
    }

    if (q) {
      filtered = filtered.filter(a => {
        const combined = [a.title, a.summary, a.content, a.description, a.body].filter(Boolean).join(' ').toLowerCase();
        return combined.includes(q) || (String(a.source || '').toLowerCase().includes(q));
      });
    }

    const total = filtered.length;
    const start = (page - 1) * per_page;
    const end = start + per_page;
    const pageItems = filtered.slice(start, end).map(a => ({
      id: a.id || a.url || Math.abs((a.title||'').split('').reduce((s,c)=>s+c.charCodeAt(0),0)),
      title: a.title,
      summary: a.summary || a.description || null,
      url: a.url,
      source: a.source,
      published_at: a.published_at || a.publishedAt || a.published || null,
      category: a.category || null,
      tags: Array.isArray(a.tags) ? a.tags : [],
    }));

    return res.status(200).json({ articles: pageItems, meta: { page, per_page, total } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'Failed to read articles backup: ' + msg });
  }
}
