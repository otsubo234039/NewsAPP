/**
 * カテゴリカウント計算ユーティリティ
 */

import { Article } from './textUtils';

const SOURCE_TO_CATEGORY: Record<string, string> = {
  'techcrunch': 'programming',
  'the verge': 'software',
  'ars technica': 'software',
  'wired': 'ai-ml',
  'zdnet japan': 'devops-infra',
  'cnet japan': 'software',
  'ascii.jp': 'programming',
  'itmedia': 'programming',
};

export function calculateCategoryCounts(
  articles: Article[],
  tagList: any[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  // Count articles by source
  for (const article of articles) {
    const source = article.source ? String(article.source).toLowerCase() : '';
    for (const [sourceKey, categorySlug] of Object.entries(SOURCE_TO_CATEGORY)) {
      if (source.includes(sourceKey)) {
        counts[categorySlug] = (counts[categorySlug] || 0) + 1;
        break;
      }
    }
  }

  // Build parent-child map
  const childrenByParent: Record<string, string[]> = {};
  const parentById: Record<string, any> = {};
  (tagList || []).forEach((item: any) => {
    if (!item) return;
    if (item.parent_id) {
      const pid = String(item.parent_id);
      childrenByParent[pid] = childrenByParent[pid] || [];
      childrenByParent[pid].push(String(item.slug || ''));
    } else {
      parentById[String(item.id)] = item;
    }
  });

  // Propagate child counts to parents
  for (const [pid, parent] of Object.entries(parentById)) {
    const children = childrenByParent[pid] || [];
    const childSum = children.reduce((sum, slug) => sum + (counts[slug] || 0), 0);
    const parentSlug = String(parent.slug || '');
    if (parentSlug) {
      counts[parentSlug] = (counts[parentSlug] || 0) + childSum;
    }
  }

  return counts;
}
