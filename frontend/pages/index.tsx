import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
  tags?: any[];
};

const HomeScreen: React.FC<Props> = ({ articles: initialArticles = [], fallback = false, error, tags = [] }) => {
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
  const [selectedCountry, setSelectedCountry] = useState<'japan' | 'world'>('japan');
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
  const [tagList, setTagList] = useState<any[]>(tags || []); // categories/tags list for drawer

  // Count articles per category
  const [categoryArticleCounts, setCategoryArticleCounts] = useState<Record<string, number>>({});
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const articlesPerPage = 15; // 3 cols * 5 rows

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

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

  // Fetch tags on client if not provided (e.g., SSR fetch failed)
  useEffect(() => {
    const loadTags = async () => {
      if (tagList && tagList.length > 0) return;
      try {
        const res = await fetch('/api/tags');
        if (!res.ok) return;
        const j = await res.json();
        if (Array.isArray(j?.tags)) setTagList(j.tags);
        else if (Array.isArray(j)) setTagList(j);
      } catch (e) {}
    };
    loadTags();
  }, [tagList]);

  // Count articles per category/tag
  useEffect(() => {
    const counts: Record<string, number> = {};
    
    // Build slug to category map
    const slugMap: Record<string, any> = {};
    const buildSlugMap = (items: any[]) => {
      for (const item of items) {
        if (item.slug) slugMap[item.slug] = item;
        if (Array.isArray(item.children)) buildSlugMap(item.children);
      }
    };
    if (tagList && tagList.length > 0) buildSlugMap(tagList);
    
    // Source -> category slug mapping
    const sourceToCategory: Record<string, string> = {
      'techcrunch': 'programming',
      'the verge': 'software',
      'ars technica': 'software',
      'wired': 'ai-ml',
      'zdnet japan': 'devops-infra',
      'cnet japan': 'software',
      'ascii.jp': 'programming',
      'itmedia': 'programming',
    };
    
    for (const article of allArticles) {
      const source = article.source ? String(article.source).toLowerCase() : '';
      const tags = Array.isArray((article as any).tags) ? (article as any).tags : [];
      
      // Try to determine category from source
      let articleCategory: string | null = null;
      for (const [sourceKey, categorySlug] of Object.entries(sourceToCategory)) {
        if (source.includes(sourceKey.toLowerCase())) {
          articleCategory = categorySlug;
          break;
        }
      }
      
      // Count by determined category or use top-level as fallback
      if (articleCategory && slugMap[articleCategory]) {
        counts[articleCategory] = (counts[articleCategory] || 0) + 1;
      } else {
        // Fallback: count to all top-level if no match
        if (tagList && tagList.length > 0) {
          tagList.forEach((item: any) => {
            if (!item.parent_id && item.slug) {
              counts[item.slug] = (counts[item.slug] || 0) + 1;
            }
          });
        }
      }
      
      // Also support tags if present
      for (const tag of tags) {
        const tagStr = String(tag).toLowerCase();
        if (slugMap[tagStr]) {
          counts[tagStr] = (counts[tagStr] || 0) + 1;
        }
      }
    }
    setCategoryArticleCounts(counts);
  }, [allArticles, tagList]);

  // 初回訪問時のみsetup画面へ誘導
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const visited = localStorage.getItem('newsapp:visited');
        const user = localStorage.getItem('user');
        // 初回訪問かつ未ログインの場合のみsetup画面へ
        if (!visited && !user) {
          localStorage.setItem('newsapp:visited', '1');
          router.replace('/setup');
        } else if (!visited) {
          localStorage.setItem('newsapp:visited', '1');
        }
      }
    } catch (e) {}
  }, [router]);

  // Fetch articles when country changes
  useEffect(() => {
    const fetchArticlesByCountry = async () => {
      try {
        const res = await fetch(`/api/articles?category=${selectedCountry}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        if (json && json.articles) {
          setAllArticles(json.articles.map(cleanArticle));
          setCurrentPage(1);
        }
      } catch (e) {
        console.error('Error fetching articles:', e);
      }
    };
    fetchArticlesByCountry();
  }, [selectedCountry]);

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
    // search filter
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const title = String(article.title || '').toLowerCase();
      const summary = String(article.summary || '').toLowerCase();
      matchesSearch = title.includes(query) || summary.includes(query);
    }
    return matchesLang && matchesCategory && matchesSearch;
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

        <div className="header-center" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="記事を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setCurrentPage(1);
              }
            }}
            className="search-input"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.1)',
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff',
              color: theme === 'dark' ? '#e6eef8' : '#07314a',
              fontSize: 14,
              flex: 1,
              maxWidth: 400
            }}
          />
          <button
            onClick={() => setCurrentPage(1)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
              background: theme === 'dark' ? 'linear-gradient(135deg, #1e5aa8 0%, #0b3d91 100%)' : '#0b3d91',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              boxShadow: theme === 'dark' ? '0 2px 8px rgba(30,90,168,0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme === 'dark' ? 'linear-gradient(135deg, #2672c7 0%, #1e5aa8 100%)' : '#0a2f7a';
              e.currentTarget.style.boxShadow = theme === 'dark' ? '0 4px 12px rgba(38,114,199,0.4)' : 'none';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme === 'dark' ? 'linear-gradient(135deg, #1e5aa8 0%, #0b3d91 100%)' : '#0b3d91';
              e.currentTarget.style.boxShadow = theme === 'dark' ? '0 2px 8px rgba(30,90,168,0.3)' : 'none';
            }}
          >
            🔍 検索
          </button>
        </div>

        <div className="header-right" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: theme === 'dark' ? '#999' : '#666' }}>
            表示件数: {filteredArticles.length}
          </div>
          <button
            className="theme-toggle"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.1)',
              background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#f5f5f5',
              color: theme === 'dark' ? '#e6eef8' : '#07314a',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {/* Avoid server/client text mismatch by only showing the theme label after mount */}
            {mounted ? (theme === 'dark' ? '☀️ ライト' : '🌙 ダーク') : ''}
          </button>

          <select className="lang-select" value={selectedLang} onChange={e => setSelectedLang(e.target.value)}>
            <option value="">すべての言語</option>
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>

          <select 
            value={selectedCountry} 
            onChange={e => setSelectedCountry(e.target.value as 'japan' | 'world')}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.1)',
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff',
              color: theme === 'dark' ? '#e6eef8' : '#07314a',
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <option value="japan">日本</option>
            <option value="world">アメリカ</option>
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
                <>
                  <div style={{ marginBottom: 8 }}>ログイン中: <strong>{loggedInUser}</strong></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="primary" onClick={async () => {
                      try {
                        localStorage.removeItem('user');
                        localStorage.removeItem('user_id');
                        setLoggedInUser(null);
                        alert('ログアウトしました');
                      } catch (err: any) { alert('エラー: ' + err.message); }
                    }}>ログアウト</button>
                  </div>
                </>
              ) : (
                <button className="primary" onClick={() => {
                  setShowDrawer(false);
                  router.push('/setup');
                }}>ログイン / 登録</button>
              )}
            </div>

            <div className="drawer-section">
              <strong>カテゴリ選択</strong>
              <div className="category-list">
                {
                  (() => {
                    if (!tagList || tagList.length === 0) {
                      return <div style={{ color: '#666', marginTop: 8 }}>カテゴリが登録されていません</div>;
                    }
                    const topParents = tagList.filter((t:any) => t.parent_id === null || t.parent_id === undefined);
                    const childrenByParent: Record<string, any[]> = {};
                    for (const t of tagList) {
                      if (t.parent_id) {
                        childrenByParent[String(t.parent_id)] = childrenByParent[String(t.parent_id)] || [];
                        childrenByParent[String(t.parent_id)].push(t);
                      }
                    }
                    
                    const toggleCategory = (slug: string) => {
                      const next = selectedCategories.includes(slug) 
                        ? selectedCategories.filter(s => s !== slug) 
                        : [...selectedCategories, slug];
                      setSelectedCategories(next);
                      try { 
                        localStorage.setItem('selectedCategories', JSON.stringify(next)); 
                      } catch (err) {}
                    };

                    return (
                      <>
                        <div style={{ 
                          maxHeight: 300, 
                          overflowY: 'auto', 
                          marginTop: 8,
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: 8,
                          padding: 8
                        }}>
                          {topParents.map((parent:any) => {
                            const children = childrenByParent[String(parent.id)] || [];
                            return (
                              <div key={parent.id} style={{ marginBottom: 12 }}>
                                <div style={{ 
                                  fontWeight: 700, 
                                  fontSize: 13, 
                                  marginBottom: 6,
                                  color: 'var(--text-color-light)',
                                  paddingLeft: 4
                                }}>
                                  {parent.name}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {children.map((child:any) => {
                                    const isSelected = selectedCategories.includes(child.slug);
                                    const articleCount = categoryArticleCounts[child.slug] || 0;
                                    return (
                                    <label 
                                      key={child.slug} 
                                      style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 8, 
                                        cursor: 'pointer',
                                        padding: '6px 8px',
                                        borderRadius: 4,
                                        transition: 'background 0.15s',
                                        userSelect: 'none'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <input 
                                        type="checkbox" 
                                        checked={isSelected}
                                        onChange={() => toggleCategory(child.slug)}
                                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                                      />
                                      <span style={{ fontSize: 13, flex: 1 }}>{child.name}</span>
                                      <span style={{ fontSize: 12, color: '#666', marginLeft: 4 }}>({articleCount})</span>
                                    </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {loggedInUser && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button 
                              className="primary" 
                              style={{ flex: 1 }}
                              onClick={async () => {
                                if (selectedCategories.length === 0) {
                                  return alert('少なくとも1つのカテゴリを選択してください');
                                }
                                const userId = localStorage.getItem('user_id');
                                if (!userId) {
                                  return alert('ユーザーIDが見つかりません');
                                }
                                try {
                                  const res = await fetch('http://localhost:3001/api/user_categories', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ user_id: Number(userId), category_slugs: selectedCategories })
                                  });
                                  if (!res.ok) {
                                    const text = await res.text();
                                    throw new Error(text || res.statusText);
                                  }
                                  alert('カテゴリを保存しました！');
                                } catch (err: any) {
                                  alert('保存エラー: ' + (err.message || err));
                                }
                              }}
                            >
                              保存
                            </button>
                            <button 
                              style={{ 
                                flex: 1,
                                padding: '8px 16px',
                                borderRadius: 8,
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: '#dc3545',
                                color: '#fff',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                              onClick={() => {
                                if (confirm('すべてのカテゴリ選択をクリアしますか？')) {
                                  setSelectedCategories([]);
                                  try { 
                                    localStorage.setItem('selectedCategories', JSON.stringify([])); 
                                  } catch (err) {}
                                }
                              }}
                            >
                              クリア
                            </button>
                          </div>
                        )}
                      </>
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

  async function fetchArticles(base: string, country: 'japan' | 'world' = 'japan') {
    const res = await fetch(`${base}/api/articles?category=${country}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async function fetchTags(base: string) {
    const res = await fetch(`${base}/api/tags`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  try {
    let json: any = null;
    let tagsJson: any = null;
    const errors: string[] = [];
    // First, try internal Next API (same origin) by constructing base from request headers
    const req = context.req as any;
    const proto = (req.headers['x-forwarded-proto'] as string) || (req.connection && req.connection.encrypted ? 'https' : 'http');
    const host = req.headers.host;
    const selfBase = host ? `${proto}://${host}` : null;
    if (selfBase) {
      try {
        json = await fetchArticles(selfBase, 'japan');
      } catch (err) {
        // fallthrough to other candidates
      }
      try {
        tagsJson = await fetchTags(selfBase);
      } catch (err) {}
    }
    if (!json) {
      for (const base of candidates) {
        try {
          json = await fetchArticles(base, 'japan');
          break;
        } catch (err: any) {
          errors.push(`${base}: ${err.message}`);
        }
      }
    }
    if (!tagsJson) {
      for (const base of candidates) {
        try {
          tagsJson = await fetchTags(base);
          break;
        } catch (err: any) {}
      }
    }
    if (!json) {
      throw new Error(errors.join(' ; '));
    }
    const articles = Array.isArray(json.articles) ? json.articles : [];
    const fallback = !!json.fallback;
    const tagsProp = Array.isArray(tagsJson?.tags) ? tagsJson.tags : (Array.isArray(tagsJson) ? tagsJson : []);
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
    return { props: { articles: safeArticles, fallback, tags: tagsProp } };
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
    return { props: { articles: mockArticles, fallback: true, error: null, tags: [] } };
  }
};