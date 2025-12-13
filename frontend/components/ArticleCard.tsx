/**
 * ArticleCard コンポーネント
 */

import React, { useState } from 'react';
import { Article } from '../lib/textUtils';

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const published = article.published ? new Date(article.published).toLocaleString() : null;
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const summaryRaw = article.summary || '';
  const truncated = summaryRaw.length > 200 ? summaryRaw.slice(0, 200).trim() + '…' : summaryRaw;

  return (
    <div
      className={`article-card ${article.link ? 'clickable' : ''}`}
      onClick={() => {
        if (article.link) window.open(article.link, '_blank', 'noopener,noreferrer');
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && article.link) {
          window.open(article.link, '_blank', 'noopener,noreferrer');
        }
      }}
      tabIndex={0}
      role={article.link ? 'link' : undefined}
      title={article.link ? 'クリックで記事を開く' : undefined}
    >
      <div className="article-image-wrap">
        {article.imageUrl && !imgError ? (
          <img
            className="article-image"
            src={article.imageUrl}
            alt={article.title}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="article-image--placeholder" aria-hidden="false">
            <img src="/images/placeholder.svg" alt="placeholder" />
            <div className="placeholder-label">Noimage</div>
          </div>
        )}
        <div className="article-image-overlay" aria-hidden="true" />
      </div>
      <div className="article-content">
        <h3 className="article-title">{article.title}</h3>
        {article.summary ? (
          <p className="article-summary">
            {expanded ? summaryRaw : truncated}
            {summaryRaw.length > 200 ? (
              <button className="read-more" onClick={() => setExpanded((s) => !s)}>
                {expanded ? '閉じる' : 'もっと見る'}
              </button>
            ) : null}
          </p>
        ) : null}
        <div className="article-meta-row">
          <div className="meta-left">
            {article.source ? <span className="article-source">{article.source}</span> : null}
          </div>
          {published ? <div className="meta-right"><span className="article-published">{published}</span></div> : null}
        </div>
      </div>
    </div>
  );
};
