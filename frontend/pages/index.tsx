import React, { useEffect, useState } from 'react'

type ApiResp = { status: string; message: string }

export default function Home() {
  const [msg, setMsg] = useState<ApiResp | null>(null)

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/` : '/api')
      .then((r) => r.json())
      .then((j) => setMsg(j))
      .catch(() => setMsg({ status: 'error', message: 'Failed to fetch API' }))
  }, [])

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>NewsAPP Frontend (Next.js + TypeScript)</h1>
      <h2>Backend response</h2>
      <pre>{msg ? JSON.stringify(msg, null, 2) : 'loading...'}</pre>
    </main>
  )
}
