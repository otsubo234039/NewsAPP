import type { NextApiRequest, NextApiResponse } from 'next';
import categoriesData from '../../data/categories-it-students.json';

const CANDIDATES = [
  process.env.SERVER_API_URL,
  process.env.NEXT_PUBLIC_API_URL,
  'http://host.docker.internal:3001',
  'http://localhost:3001',
  'http://localhost:3002',
].filter(Boolean) as string[];

async function tryFetch(url: string, timeout = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Try backend candidates first
  for (const base of CANDIDATES) {
    try {
      const url = `${base.replace(/\/$/, '')}/api/categories`;
      const r = await tryFetch(url, 2500);
      if (r && r.ok) {
        const json = await r.json().catch(() => null);
        if (json) {
          return res.status(200).json(json);
        }
      }
    } catch (e) {
      // ignore and try next
    }
  }

  // Fallback: return local categories JSON (as { categories: [...] })
  try {
    const names = Array.isArray(categoriesData) ? categoriesData.map((c: any) => c.name) : [];
    return res.status(200).json({ categories: names });
  } catch (err) {
    return res.status(200).json({ categories: [] });
  }
}
