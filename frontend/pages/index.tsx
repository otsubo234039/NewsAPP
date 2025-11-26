import React, { useState, useEffect } from 'react';
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
  lang?: string;
}

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
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
      onKeyDown={(e) => { if (e.key === 'Enter' && article.link) { window.open(article.link, '_blank', 'noopener,noreferrer'); } }}
      tabIndex={0}
      role={article.link ? 'link' : undefined}
      title={article.link ? 'クリックで記事を開く' : undefined}
    >
      <div className="article-image-wrap">
        {article.imageUrl && !imgError ? (
          <img className="article-image" src={article.imageUrl} alt={article.title} loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="article-image--placeholder" aria-hidden="false">
            <img src="/images/placeholder.svg" alt="placeholder" />
            <div className="placeholder-label">アイキャッチなし</div>
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
              <button className="read-more" onClick={() => setExpanded(s => !s)}>{expanded ? '閉じる' : 'もっと見る'}</button>
            ) : null}
          </p>
        ) : null}
        <div className="article-meta-row">
          <div className="meta-left">
            {article.source ? <span className="article-source">{article.source}</span> : null}
          </div>
          {published ? (
            <div className="meta-right"><span className="article-published">{published}</span></div>
          ) : null}
        </div>
        {/* リンクはクリックで開く仕様のため UI 上の個別リンクは削除 */}
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
  // Sanitize article text to remove invisible chars and unwanted newlines
  function cleanText(value?: string) {
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

  function cleanArticle(a: Article): Article {
    return {
      ...a,
      title: cleanText(a.title),
      summary: cleanText(a.summary as string),
      source: cleanText(a.source as string),
    };
  }

  const [allArticles, setAllArticles] = useState<Article[]>(initialArticles.map(cleanArticle));
  const [selectedLang, setSelectedLang] = useState<string>('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => {
    try { return localStorage.getItem('user') || null; } catch (e) { return null; }
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    try { const v = localStorage.getItem('selectedCategories'); return v ? JSON.parse(v) : []; } catch (e) { return []; }
  });
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const articlesPerPage = 15; // 3 cols * 5 rows

  // Theme (light / dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const v = localStorage.getItem('theme');
      return (v === 'dark' ? 'dark' : 'light');
    } catch (e) {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      if (theme === 'dark') document.documentElement.classList.add('theme-dark');
      else document.documentElement.classList.remove('theme-dark');
      localStorage.setItem('theme', theme);
    } catch (e) {}
  }, [theme]);

  const filteredArticles = allArticles.filter(article => {
    let matchesLang = true;
    if (selectedLang) {
      matchesLang = article.lang === selectedLang;
    }
    // category filter (if any selected)
    let matchesCategory = true;
    if (selectedCategories && selectedCategories.length > 0) {
      matchesCategory = !!article.category && selectedCategories.includes(article.category as string);
    }
    return matchesLang;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLang, allArticles.length]);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / articlesPerPage));
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const pageArticles = filteredArticles.slice(startIndex, endIndex);

  // Pagination helper: return pages and ellipsis tokens
  function getPageRange(total: number, current: number, maxVisible = 7): (number | string)[] {
    if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, current + half);
    if (start === 1) end = maxVisible;
    if (end === total) start = total - maxVisible + 1;
    const range: (number | string)[] = [];
    if (start > 1) {
      range.push(1);
      if (start > 2) range.push('start-ellipsis');
    }
    for (let p = start; p <= end; p++) range.push(p);
    if (end < total) {
      if (end < total - 1) range.push('end-ellipsis');
      range.push(total);
    }
    return range;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className={`home-screen`}> 
      {fallback ? (
        <div style={{ textAlign: 'center', padding: '8px', background: '#fff3cd', color: '#856404' }}>開発用フォールバック記事を表示しています</div>
      ) : null}
      <header className="home-header">
        <div className="header-left">
          <h1>ニュース</h1>
        </div>

        <div className="header-center">
          {/* 検索ボックスは非表示（要望により削除） */}
        </div>

        <div className="header-right">
          <div className="header-controls">
            <div style={{ fontSize: 12, color: '#666' }}>表示件数: {filteredArticles.length}</div>
          </div>
          <button className="theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: 'transparent', cursor: 'pointer' }}>
            {theme === 'dark' ? 'ライト' : 'ダーク'}
          </button>

          <select className="lang-select" value={selectedLang} onChange={e => setSelectedLang(e.target.value)}>
            <option value="">すべての言語</option>
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
          <button className="hamburger" aria-label="メニュー" onClick={() => setShowDrawer(true)}>☰</button>
        </div>
      </header>

      {/* Drawer + overlay */}
      {showDrawer ? (
        <div>
          <div className="drawer-overlay" onClick={() => setShowDrawer(false)} />
          <aside className="drawer">
            <div className="drawer-header">
              <strong>メニュー</strong>
              <button className="drawer-close" onClick={() => setShowDrawer(false)}>✕</button>
            </div>

            <div className="drawer-section">
              {loggedInUser ? (
                <div style={{ marginBottom: 8 }}>ログイン中: <strong>{loggedInUser}</strong></div>
              ) : null}
              {/* Auth forms */}
              {!loggedInUser ? (
                <div className="auth-box">
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button onClick={() => setAuthMode('login')} className={authMode === 'login' ? 'tab active' : 'tab'}>ログイン</button>
                    <button onClick={() => setAuthMode('register')} className={authMode === 'register' ? 'tab active' : 'tab'}>登録</button>
                  </div>
                  <input className="auth-input" placeholder="ユーザー名" value={authName} onChange={e => setAuthName(e.target.value)} />
                  <input className="auth-input" placeholder="メールアドレス" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
                  <input className="auth-input" placeholder="パスワード" type="password" value={authPass} onChange={e => setAuthPass(e.target.value)} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={async () => {
                      if (!authName) return alert('ユーザー名を入力してください');
                      if (!authEmail) return alert('メールアドレスを入力してください');
                      if (!authPass) return alert('パスワードを入力してください');
                      try {
                        if (authMode === 'register') {
                          const res = await fetch('/api/users', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ user: { name: authName, email: authEmail, password: authPass, password_confirmation: authPass } })
                          });
                          if (!res.ok) {
                            const j = await res.json();
                            return alert('登録エラー: ' + (j.errors ? j.errors.join(', ') : res.statusText));
                          }
                          const j = await res.json();
                          setLoggedInUser(j.user.name);
                          setAuthName(''); setAuthEmail(''); setAuthPass('');
                          setShowDrawer(false);
                        } else {
                          const res = await fetch('/api/sessions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ email: authEmail, password: authPass })
                          });
                          if (!res.ok) {
                            const j = await res.json();
                            return alert('ログイン失敗: ' + (j.error || res.statusText));
                          }
                          const j = await res.json();
                          setLoggedInUser(j.user.name);
                          setAuthName(''); setAuthEmail(''); setAuthPass('');
                          setShowDrawer(false);
                        }
                      } catch (err: any) {
                        alert('通信エラー: ' + err.message);
                      }
                    }} className="primary">{authMode === 'register' ? '登録' : 'ログイン'}</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="primary" onClick={async () => {
                    try {
                      const res = await fetch('/api/sessions', { method: 'DELETE', credentials: 'include' });
                      if (res.ok) {
                        setLoggedInUser(null);
                        alert('ログアウトしました');
                      } else {
                        alert('ログアウト失敗');
                      }
                    } catch (err: any) { alert('通信エラー: ' + err.message); }
                  }}>ログアウト</button>
                </div>
              )}
            </div>

            <div className="drawer-section">
              <strong>カテゴリー選択</strong>
              <div className="category-list">
                {Array.from(new Set(allArticles.map(a => a.category).filter(Boolean))).map(cat => (
                  <label key={cat} className="category-item">
                    <input type="checkbox" checked={selectedCategories.includes(cat as string)} onChange={e => {
                      let next = [...selectedCategories];
                      if (e.target.checked) next.push(cat as string); else next = next.filter(c => c !== cat);
                      setSelectedCategories(next);
                      try { localStorage.setItem('selectedCategories', JSON.stringify(next)); } catch (err) {}
                    }} />
                    <span>{cat}</span>
                  </label>
                ))}
                {Array.from(new Set(allArticles.map(a => a.category).filter(Boolean))).length === 0 ? (
                  <div style={{ color: '#666', marginTop: 8 }}>カテゴリーが登録されていません</div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      <main>
        <div className="article-list-container">
          {pageArticles.length > 0 ? (
            pageArticles.map((article, idx) => (
              <ArticleCard key={article.id || `${currentPage}-${idx}`} article={article} />
            ))
          ) : (
            <p className="no-results-message">該当する記事が見つかりません。</p>
          )}
        </div>

        <div className="pagination">
          <button className="page-button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
          {getPageRange(totalPages, currentPage, 7).map((item, idx) => {
            if (typeof item === 'string' && item.includes('ellipsis')) {
              return <span key={item + idx} className="page-ellipsis">…</span>;
            }
            const pageNum = item as number;
            return (
              <button
                key={pageNum}
                className={`page-button ${pageNum === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          <button className="page-button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
        </div>
      </main>
    </div>
  );
};

export default HomeScreen;

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Try a list of candidate backend base URLs. This helps when the Next.js server
  // runs inside Docker (use service name `backend`), on the host (use localhost:3001),
  // or inside Docker but needs to reach the host (use host.docker.internal).
  const candidates = [
    'http://backend:3000',
    process.env.SERVER_API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    'http://host.docker.internal:3001',
    'http://localhost:3001',
  ].filter(Boolean) as string[];

  async function fetchArticles(base: string) {
    const res = await fetch(`${base}/api/articles?category=it`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  try {
    let json: any = null;
    const errors: string[] = [];
    for (const base of candidates) {
      try {
        json = await fetchArticles(base);
        // success, stop trying
        break;
      } catch (err: any) {
        errors.push(`${base}: ${err.message}`);
      }
    }
    if (!json) {
      throw new Error(errors.join(' ; '));
    }
    const articles = Array.isArray(json.articles) ? json.articles : [];
    const fallback = !!json.fallback;
    return { props: { articles, fallback } };
  } catch (e: any) {
    return { props: { articles: [], error: e.message || 'データ取得中にエラーが発生しました' } };
  }
};