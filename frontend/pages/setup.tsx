import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import categoriesData from '../data/categories-it-students.json';
import tagsData from '../data/tags-it-students.json';
import TagDropdown from '../components/TagDropdown';
import { useRouter } from 'next/router';

interface Article { category?: string }

type Props = { articles: Article[]; fallback?: boolean; categories?: string[]; tags?: any[]; error?: string | null };

const SetupPage: React.FC<Props> = ({ articles = [], categories = [], tags = [], error = null }) => {
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => {
    try { return localStorage.getItem('user') || null; } catch (e) { return null; }
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    try { const v = localStorage.getItem('selectedCategories'); return v ? JSON.parse(v) : []; } catch (e) { return []; }
  });
  const cats = (categories && categories.length > 0)
    ? categories
    : Array.from(new Set(articles.map(a => a.category).filter(Boolean)));

  // build tag groups from tags prop (hierarchical list with parent_id)
  const [tagListState, setTagListState] = useState<any[]>((Array.isArray(tags) && tags.length > 0) ? tags : tagsData);
  const [serverError, setServerError] = useState<string | null>(error ?? null);
  const tagList = tagListState;
  const topParents = tagList.filter((t:any) => t.parent_id === null || t.parent_id === undefined);
  const childrenByParent: Record<string, any[]> = {};
  for (const t of tagList) {
    if (t.parent_id) {
      childrenByParent[String(t.parent_id)] = childrenByParent[String(t.parent_id)] || [];
      childrenByParent[String(t.parent_id)].push(t);
    }
  }

  useEffect(() => {
    try { localStorage.setItem('selectedCategories', JSON.stringify(selectedCategories)); } catch (e) {}
  }, [selectedCategories]);

  // client-side: allow retry to fetch tags from internal API
  const fetchTagsClient = async () => {
    try {
      setServerError(null);
      const res = await fetch('/api/tags');
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j.error || res.statusText || 'tags fetch failed');
      }
      const j = await res.json();
      const t = Array.isArray(j.tags) ? j.tags : (Array.isArray(j) ? j : []);
      setTagListState(t);
    } catch (err: any) {
      setServerError(err?.message || String(err));
    }
  }

  const doRegisterOrLogin = async (mode: 'login'|'register', name?: string, email?: string, password?: string) => {
    // Simple client-side attempt to call backend endpoints; errors shown as alerts.
    try {
      if (mode === 'register') {
        const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: { name, email, password, password_confirmation: password } }) });
        if (!res.ok) { const j = await res.json().catch(()=>({})); return alert('登録失敗: ' + (j.errors ? j.errors.join(', ') : res.statusText)); }
        const j = await res.json(); setLoggedInUser(j.user?.name || name || ''); localStorage.setItem('user', j.user?.name || (name||''));
      } else {
        const res = await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), credentials: 'include' });
        if (!res.ok) { const j = await res.json().catch(()=>({})); return alert('ログイン失敗: ' + (j.error || res.statusText)); }
        const j = await res.json(); setLoggedInUser(j.user?.name || ''); localStorage.setItem('user', j.user?.name || '');
      }
    } catch (err: any) { alert('通信エラー: ' + (err.message || err)); }
  }

  return (
    <div className="setup-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="setup-card">
        <h2>ようこそ — 初期設定</h2>
        <p>このアプリを利用するには、まずログインまたは登録し、興味のあるタグを選択してください。</p>

        {serverError ? (
          <div style={{ background: '#ffecec', color: '#661010', padding: 10, borderRadius: 6, marginBottom: 12 }}>
            <div>タグの読み込みに問題が発生しました: <strong>{serverError}</strong></div>
            <div style={{ marginTop: 8 }}>
              <button className="primary" onClick={() => fetchTagsClient()}>再試行</button>
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <strong>ログイン / 登録</strong>
            <p style={{ color: '#666' }}>既存アカウントでログインするか、新規登録してください。</p>
            <div className="auth-box" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Login form */}
              <form onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget as HTMLFormElement); const email = String(f.get('login_email') || ''); const password = String(f.get('login_password') || ''); await doRegisterOrLogin('login', undefined, email, password); }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontWeight: 600 }}>ログイン</label>
                  <input name="login_email" type="email" placeholder="メールアドレス" className="auth-input" required />
                  <input name="login_password" type="password" placeholder="パスワード" className="auth-input" required />
                  <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8 }}>
                    <button type="submit" className="primary">ログイン</button>
                  </div>
                </div>
              </form>

              {/* Register form */}
              <form onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget as HTMLFormElement); const name = String(f.get('reg_name') || ''); const email = String(f.get('reg_email') || ''); const password = String(f.get('reg_password') || ''); await doRegisterOrLogin('register', name, email, password); }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontWeight: 600 }}>新規登録</label>
                  <input name="reg_name" type="text" placeholder="ユーザー名" className="auth-input" required />
                  <input name="reg_email" type="email" placeholder="メールアドレス" className="auth-input" required />
                  <input name="reg_password" type="password" placeholder="パスワード" className="auth-input" required />
                  <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8 }}>
                    <button type="submit" className="primary">登録</button>
                  </div>
                </div>
              </form>

              {loggedInUser ? <div style={{ marginTop: 8 }}>ログイン中: <strong>{loggedInUser}</strong></div> : null}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <strong>タグ選択</strong>
            <div style={{ marginTop: 8 }}>
              {tagList.length === 0 ? (
                <div style={{ color: '#666' }}>まだ利用可能なタグが見つかりません。後で設定できます。</div>
              ) : (
                <TagDropdown
                  groups={topParents.map((parent:any) => ({ label: parent.name, options: (childrenByParent[String(parent.id)] || []).map((c:any) => ({ value: c.slug, label: c.name })) }))}
                  selected={selectedCategories}
                  onChange={(next) => setSelectedCategories(next)}
                  placeholder="興味のあるタグを選択"
                />
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="primary" onClick={() => {
            if (!loggedInUser) return alert('まずログイン／登録してください。');
            if (!selectedCategories || selectedCategories.length === 0) return alert('少なくとも1つタグを選択してください。');
            try { localStorage.setItem('newsapp:setupComplete', '1'); } catch (e) {}
            router.replace('/');
          }}>設定を完了して開始</button>
        </div>
      </div>
    </div>
  );
}

export default SetupPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
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
  async function fetchTags(base: string) {
    const res = await fetch(`${base}/api/tags`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }
  try {
    let json: any = null;
    for (const base of candidates) {
      try { json = await fetchArticles(base); break; } catch (e) {}
    }
    const articles = Array.isArray(json?.articles) ? json.articles : [];
    const safe = articles.map((a: any) => ({ category: a.category ?? null }));
    const derivedCats = Array.from(new Set(safe.map((s: any) => s.category).filter(Boolean)));
    // try to fetch tags from API candidates as well
    let tagsJson: any = null;
    for (const base of candidates) {
      try { tagsJson = await fetchTags(base); break; } catch (e) {}
    }
    const tagsProp = Array.isArray(tagsJson?.tags) ? tagsJson.tags : (Array.isArray(tagsJson) ? tagsJson : []);
    return { props: { articles: safe, fallback: !!json?.fallback, categories: derivedCats, tags: tagsProp } };
  } catch (e) {
    // fallback to local categories JSON
    try {
      const names = Array.isArray(categoriesData) ? categoriesData.map((c: any) => c.name) : [];
      const tags = Array.isArray(tagsData) ? tagsData : [];
      return { props: { articles: [], fallback: true, categories: names, tags } };
    } catch (err) {
      return { props: { articles: [], fallback: true, categories: [], tags: [] } };
    }
  }
}
