/**
 * ページネーション・フィルター関連のユーティリティ
 */

import { Article } from './textUtils';

export function getPageRange(
  total: number,
  current: number,
  windowSize: number
): Array<number | string> {
  const range: Array<number | string> = [];
  if (total <= 1) return range;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, current + half);
  if (end - start + 1 < windowSize) {
    if (start === 1) {
      end = Math.min(total, start + windowSize - 1);
    } else if (end === total) {
      start = Math.max(1, end - windowSize + 1);
    }
  }
  if (start > 1) range.push(1);
  if (start > 2) range.push('start-ellipsis');
  for (let p = start; p <= end; p++) range.push(p);
  if (end < total) {
    if (end < total - 1) range.push('end-ellipsis');
    range.push(total);
  }
  return range;
}

export function filterArticles(
  articles: Article[],
  searchQuery: string,
  selectedLang: string,
  selectedCategories: string[]
): Article[] {
  const q = searchQuery.trim().toLowerCase();
  return articles.filter((a) => {
    const matchesLang = !selectedLang || (a.lang && String(a.lang).toLowerCase() === selectedLang);
    const text = [a.title, a.summary, a.source]
      .filter(Boolean)
      .map((v) => String(v).toLowerCase())
      .join(' ');
    const matchesSearch = q === '' || text.includes(q);

    if (selectedCategories.length === 0) {
      return matchesLang && matchesSearch;
    }

    const tags = Array.isArray((a as any).tags)
      ? (a as any).tags.map((t: any) => String(t).toLowerCase())
      : [];
    const articleSlug = a.category ? String(a.category).toLowerCase() : '';
    const matchesCategory = selectedCategories.some(
      (slug) => slug === articleSlug || tags.includes(slug)
    );
    return matchesLang && matchesSearch && matchesCategory;
  });
}
