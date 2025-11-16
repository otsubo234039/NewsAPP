import React from 'react';

type Article = {
  title: string;
  link: string;
  summary?: string;
  published?: string;
  source?: string;
};

const ITNewsPage: React.FC = () => {
  const [articles, setArticles] = React.useState<Article[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/articles?category=it');
        if (!res.ok) throw new Error('network');
        const data = await res.json();
        if (!mounted) return;
        setArticles(data.articles || []);
      } catch (e) {
        setError('記事の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
    const id = setInterval(fetchArticles, 30 * 1000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>IT ニュース（RSS デモ）</h1>
      <p>IT 系 RSS フィードから記事を取得して表示します。</p>

      {loading && <p>読み込み中...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {articles && articles.length > 0 ? (
        <ul>
          {articles.map((a, i) => (
            <li key={i} style={{ marginBottom: 14 }}>
              <a href={a.link} target="_blank" rel="noopener noreferrer">{a.title}</a>
              <div style={{ fontSize: 12, color: '#666' }}>{a.source} — {a.published ? new Date(a.published).toLocaleString() : ''}</div>
              {a.summary && <div dangerouslySetInnerHTML={{ __html: a.summary }} />}
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p>記事がありません。</p>
      )}
    </div>
  );
};

export default ITNewsPage;
