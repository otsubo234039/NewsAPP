/**
 * テキストクリーニングユーティリティ
 */

export function cleanText(value?: string): string {
  if (!value) return value || '';
  // remove zero-width, soft-hyphen, byte order mark, and control newlines
  let out = value.replace(/\u200B|\u200C|\u200D|\uFEFF|\u00AD/g, '');
  out = out.replace(/\r?\n/g, ' ');
  // decode common named entities
  out = out.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  // decode numeric entities (decimal and hex)
  out = out.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  // strip any HTML tags (e.g., <p>, <img ...>, <br>) that may remain
  out = out.replace(/<[^>]*>/g, ' ');
  // collapse repeated whitespace but avoid touching CJK punctuation spacing
  out = out.replace(/[ \t\f\v\u00A0]+/g, ' ');
  return out.trim();
}

export interface Article {
  id?: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  category?: string;
  link?: string;
  published?: string | number;
  source?: string;
  lang?: string;
}

export function cleanArticle(a: Article): Article {
  return {
    ...a,
    title: cleanText(a.title),
    summary: cleanText(a.summary as string),
    source: cleanText(a.source as string),
  };
}
