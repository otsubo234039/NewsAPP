import React from 'react'

type ApiResp = { status: string; message: string }

export default function Home({ msg }: { msg: ApiResp | null }) {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>テスト表示 — NewsAPP フロントエンド</h1>
        <p style={{ color: '#333', marginTop: 12 }}>このテキストが見えればレンダリング成功です。</p>
        <div style={{ marginTop: 18, textAlign: 'left' }}>
          <h3 style={{ marginBottom: 6 }}>バックエンド応答（デバッグ用）</h3>
          <pre style={{ background: '#f6f6f6', padding: 12 }}>{msg ? JSON.stringify(msg, null, 2) : 'no data'}</pre>
        </div>
      </div>
    </main>
  )
}

export async function getServerSideProps() {
  const serverUrl = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  try {
    const res = await fetch(`${serverUrl}/`)
    const data = await res.json()
    return { props: { msg: data } }
  } catch (err) {
    return { props: { msg: { status: 'error', message: 'Failed to fetch API' } } }
  }
}
