import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './supabase.js' // 방금 만든 파일 가져오기

function App() {
  const [message, setMessage] = useState("데이터 로딩 중...")

  useEffect(() => {
    // Supabase 연결 테스트
    console.log("React에서 Supabase 확인:", supabase)
    setMessage("Supabase 연결 성공! (콘솔창 확인)")
  }, [])

  return (
    <div className="p-10 bg-slate-100 min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Studio Mono</h1>
      <p className="text-lg bg-white p-6 rounded-xl shadow-md">
        상태: {message}
      </p>
    </div>
  )
}

const root = createRoot(document.getElementById('root'))
root.render(<App />)
