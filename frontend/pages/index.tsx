import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import TagDropdown from '../components/TagDropdown';



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
  const router = useRouter();
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
    // Default to light on the server to avoid referencing localStorage during SSR.
    // The real persisted theme (if any) will be applied on the client after mount.
    try {
      const v = (typeof window !== 'undefined') ? localStorage.getItem('theme') : null;
      return (v === 'dark' ? 'dark' : 'light');
    } catch (e) {
      return 'light';
    }
  });

  // Prevent hydration mismatch: only render theme-dependent UI after client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    try {
      if (theme === 'dark') document.documentElement.classList.add('theme-dark');
      else document.documentElement.classList.remove('theme-dark');
      if (typeof window !== 'undefined') localStorage.setItem('theme', theme);
    } catch (e) {}
  }, [theme]);

  // If the user hasn't completed initial setup, send them to the dedicated setup screen
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const done = localStorage.getItem('newsapp:setupComplete');
        if (done !== '1') {
          router.replace('/setup');
        }
      }
    } catch (e) {}
  }, [router]);

  const filteredArticles = allArticles.filter(article => {
    let matchesLang = true;
    if (selectedLang) {
      matchesLang = article.lang === selectedLang;
    }
    // category filter (if any selected)
    let matchesCategory = true;
    if (selectedCategories && selectedCategories.length > 0) {
      const loweredSel = selectedCategories.map(s => String(s).toLowerCase());
      const artCat = String(article.category || '').toLowerCase();
      const artSrc = String(article.source || '').toLowerCase();
      const artTags = Array.isArray((article as any).tags) ? (article as any).tags.map((t:any)=>String(t).toLowerCase()) : [];
      matchesCategory = loweredSel.some(sel => (artCat && artCat === sel) || (artSrc && artSrc === sel) || artTags.includes(sel));
    }
    return matchesLang && matchesCategory;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLang, allArticles.length]);

  // persist selected categories whenever they change
  useEffect(() => {
    try { localStorage.setItem('selectedCategories', JSON.stringify(selectedCategories)); } catch (e) {}
  }, [selectedCategories]);

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
    return (
      <div style={{ padding: 20 }}>
        <div style={{ background: '#ffecec', color: '#661010', padding: 12, borderRadius: 6 }}>
          <div style={{ fontWeight: 600 }}>エラー</div>
          <div style={{ marginTop: 6 }}>{error}</div>
          <div style={{ marginTop: 10 }}>
            <button className="primary" onClick={() => location.reload()}>再読み込み</button>
          </div>
        </div>
      </div>
    );
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
          <button
            className="theme-toggle"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: 'transparent', cursor: 'pointer' }}
          >
            {/* Avoid server/client text mismatch by only showing the theme label after mount */}
            {mounted ? (theme === 'dark' ? 'ライト' : 'ダーク') : ''}
          </button>

          <select className="lang-select" value={selectedLang} onChange={e => setSelectedLang(e.target.value)}>
            <option value="">すべての言語</option>
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
          <button className="hamburger" aria-label="メニュー" onClick={() => setShowDrawer(true)}>☰</button>
        </div>
      </header>

      {/* 初回セットアップは専用ページ `/setup` に分離しました */}

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
                {
                  (() => {
                    const cats = Array.from(new Set(allArticles.map(a => a.category).filter(Boolean)));
                    if (cats.length === 0) return <div style={{ color: '#666', marginTop: 8 }}>カテゴリーが登録されていません</div>;
                    return (
                      <TagDropdown
                        groups={[{ label: 'Categories', options: cats.map((c:any)=>({ value: c, label: c })) }]}
                        selected={selectedCategories}
                        onChange={(next) => { setSelectedCategories(next); try { localStorage.setItem('selectedCategories', JSON.stringify(next)); } catch (err) {} }}
                        placeholder="カテゴリーを選択"
                      />
                    );
                  })()
                }
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
    // First, try internal Next API (same origin) by constructing base from request headers
    const req = context.req as any;
    const proto = (req.headers['x-forwarded-proto'] as string) || (req.connection && req.connection.encrypted ? 'https' : 'http');
    const host = req.headers.host;
    const selfBase = host ? `${proto}://${host}` : null;
    if (selfBase) {
      try {
        json = await fetchArticles(selfBase);
      } catch (err) {
        // fallthrough to other candidates
      }
    }
    if (!json) {
      for (const base of candidates) {
        try {
          json = await fetchArticles(base);
          break;
        } catch (err: any) {
          errors.push(`${base}: ${err.message}`);
        }
      }
    }
    if (!json) {
      throw new Error(errors.join(' ; '));
    }
    const articles = Array.isArray(json.articles) ? json.articles : [];
    const fallback = !!json.fallback;
    // Normalize articles: Next.js cannot serialize `undefined`, convert to `null`.
    const safeArticles = articles.map((a: any) => ({
      id: a.id ?? null,
      title: a.title ?? null,
      summary: a.summary ?? null,
      imageUrl: a.imageUrl ?? null,
      category: a.category ?? null,
      link: a.link ?? null,
      published: a.published ?? null,
      source: a.source ?? null,
      lang: a.lang ?? null,
    }));
    return { props: { articles: safeArticles, fallback } };
  } catch (e: any) {
    // If we cannot reach any backend candidate, return a safe set of mock articles
    // so the frontend can be developed and inspected without the backend running.
    const mockArticles: Article[] = [
      {
        id: 'mock-1',
        title: '開発用ダミー記事 — サーバー未接続',
        summary: 'バックエンドに接続できないため、モック記事を表示しています。バックエンドが利用可能になったら自動で実データに切り替わります。',
        imageUrl: '/images/placeholder.svg',
        category: 'it',
        link: null,
        published: Date.now(),
        source: 'ローカルモック',
        lang: 'ja',
      },
      {
        id: 'mock-2',
        title: 'Sample article (EN) — offline mock',
        summary: 'This is a fallback article shown while the backend is unreachable.',
        imageUrl: '/images/placeholder.svg',
        category: 'it',
        link: null,
        published: Date.now(),
        source: 'local-mock',
        lang: 'en',
      }
    ];
    return { props: { articles: mockArticles, fallback: true, error: null } };
  }
};