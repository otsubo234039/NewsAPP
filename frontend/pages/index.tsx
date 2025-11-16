import React, { useState } from 'react';
import { GetServerSideProps } from 'next';


interface Article {
  id?: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  category?: string;
  link?: string;
  published?: string | number;
  source?: string;
}

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const published = article.published ? new Date(article.published).toLocaleString() : null;
  return (
    <div className="article-card">
      {article.imageUrl ? (
        <img src={article.imageUrl} alt={article.title} className="article-image" />
      ) : null}
      <div className="article-content">
        {article.source ? <span className="article-source">{article.source}</span> : null}
        {published ? <span className="article-published">{published}</span> : null}
        <h3 className="article-title">{article.title}</h3>
        {article.summary ? <p className="article-summary">{article.summary}</p> : null}
        {article.link ? (
          <p className="article-link">
            <a href={article.link} target="_blank" rel="noreferrer">記事を開く</a>
          </p>
        ) : null}
      </div>
    </div>
  );
};

type Props = {
  articles: Article[];
  fallback?: boolean;
  error?: string | null;
};

const HomeScreen: React.FC<Props> = ({ articles: initialArticles = [], fallback = false, error }) => {
  const [allArticles, setAllArticles] = useState<Article[]>(initialArticles);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredArticles = allArticles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="home-screen">
      {fallback ? (
        <div style={{ textAlign: 'center', padding: '8px', background: '#fff3cd', color: '#856404' }}>開発用フォールバック記事を表示しています</div>
      ) : null}
      <header className="home-header">
        <h1>今日のニュース</h1>

        <div className="search-bar-container">
          <input
            type="text"
            placeholder="タイトルで記事を検索..."
            className="search-input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <main className="article-list-container">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article, idx) => (
            <ArticleCard key={article.id || idx} article={article} />
          ))
        ) : (
          <p className="no-results-message">該当する記事が見つかりません。</p>
        )}
      </main>
    </div>
  );
};

export default HomeScreen;

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Try internal Docker Compose hostname first (stable within containers).
  const primary = 'http://backend:3000';
  const envFallback = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  async function fetchArticles(base: string) {
    const res = await fetch(`${base}/api/articles?category=it`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  try {
    let json;
    try {
      json = await fetchArticles(primary);
    } catch (primaryErr) {
      // primary failed, try env-configured URL
      try {
        json = await fetchArticles(envFallback);
      } catch (envErr) {
        throw new Error(`primary: ${primaryErr.message}; fallback: ${envErr.message}`);
      }
    }
    const articles = Array.isArray(json.articles) ? json.articles : [];
    const fallback = !!json.fallback;
    return { props: { articles, fallback } };
  } catch (e: any) {
    return { props: { articles: [], error: e.message || 'データ取得中にエラーが発生しました' } };
  }
};