import React, { useState } from 'react';
import { useRouter } from 'next/router';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username || !password) {
      setError('ユーザ名とパスワードを入力してください。');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.message || 'ログインに失敗しました');
        setLoading(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      // 既定: { token: '...' }
      if (data?.token) {
        localStorage.setItem('authToken', data.token);
      }
      // リダイレクト先はホーム
      router.push('/');
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const startGoogle = () => {
    // 既定ではバックエンドの OAuth エンドポイントへリダイレクト
    const url = `${API_BASE}/auth/google`;
    window.location.href = url;
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>ログイン</h2>
        <form onSubmit={submit} className="login-form">
          <label className="login-label">ユーザ名</label>
          <input
            className="login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ユーザ名 または メールアドレス"
            autoComplete="username"
          />

          <label className="login-label">パスワード</label>
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            autoComplete="current-password"
          />

          {error && <div className="login-error">{error}</div>}

          <div className="login-actions">
            <button className="primary" type="submit" disabled={loading}>
              {loading ? '読み込み中...' : 'ログイン'}
            </button>
            <button type="button" className="read-more" onClick={startGoogle}>
              Googleでログイン
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
