import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

const TAGS_PATH = path.resolve(process.cwd(), 'frontend', 'data', 'tags-it-students.json');
const BACKUP_PATH = path.resolve(process.cwd(), 'backups', 'articles-20251130-221004.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Prefer explicit tags JSON when available
  try {
    const rawTags = await fs.readFile(TAGS_PATH, 'utf8').catch(() => null);
    if (rawTags) {
      const jsonTags = JSON.parse(rawTags);
      return res.status(200).json({ tags: jsonTags });
    }
  } catch (e) {
    // fallthrough to derived tags
  }

  // Derive tags from backup as fallback
  try {
    const raw = await fs.readFile(BACKUP_PATH, 'utf8');
    const json = JSON.parse(raw);
    const all = Array.isArray(json?.articles) ? json.articles : [];

    const counts: Record<string, number> = {};
    for (const a of all) {
      if (Array.isArray(a.tags)) {
        for (const t of a.tags) {
          const k = String(t).trim();
          if (!k) continue;
          counts[k] = (counts[k] || 0) + 1;
        }
      } else if (a.category) {
        const k = String(a.category).trim();
        if (k) counts[k] = (counts[k] || 0) + 1;
      }
    }

    const derived = Object.keys(counts).map(name => ({ name, count: counts[name] })).sort((a,b)=>b.count-a.count);
    return res.status(200).json({ tags: derived });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: 'Failed to load tags: ' + msg });
  }
}
