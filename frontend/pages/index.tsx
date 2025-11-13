import React from 'react'

type ApiResp = { status: string; message: string }

export default function Home({ msg }: { msg: ApiResp | null }) {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>NewsAPP Frontend (Next.js + TypeScript)</h1>
      <h2>Backend response</h2>
      <pre>{msg ? JSON.stringify(msg, null, 2) : 'no data'}</pre>
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
