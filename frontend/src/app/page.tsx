'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MatrixBackground from '@/components/MatrixBackground';

export default function LoginWall() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/store');
    }
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (authMode === 'register') {
       const res = await fetch('/api/register', {
         method: 'POST', headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ username, password })
       });
       if (res.ok) { setAuthMode('login'); setAuthError('Registered! Please login.'); }
       else { const d = await res.json(); setAuthError(d.detail); }
    } else {
       const fd = new URLSearchParams(); fd.append('username', username); fd.append('password', password);
       const res = await fetch('/api/login', {
         method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: fd
       });
       if (res.ok) {
         const data = await res.json();
         localStorage.setItem('token', data.access_token);
         router.push('/store');
       } else {
         setAuthError('Invalid credentials');
       }
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4">
      <MatrixBackground />

      <div className="relative z-50 neon-border bg-black/80 backdrop-blur-sm p-8 rounded-lg max-w-sm w-full shadow-[0_0_20px_rgba(57,255,20,0.5)]">
        <h1 className="text-3xl text-[#39ff14] font-extrabold mb-2 font-mono text-center glitch-text cursor-default select-none tracking-widest pt-4 pb-2">JT29 HUB</h1>
        <h2 className="text-xl text-white font-bold mb-6 font-mono text-center uppercase tracking-widest">{authMode}</h2>
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <input required type="text" placeholder="Username" className="bg-black border border-green-500 p-3 text-white font-mono focus:outline-none focus:border-[#39ff14] transition-colors" value={username} onChange={e=>setUsername(e.target.value)} />
          <input required type="password" placeholder="Password" className="bg-black border border-green-500 p-3 text-white font-mono focus:outline-none focus:border-[#39ff14] transition-colors" value={password} onChange={e=>setPassword(e.target.value)} />
          {authError && <p className={`font-bold text-center ${authError.includes('Registered') ? 'text-blue-400' : 'text-red-500'}`}>{authError}</p>}
          <button type="submit" className="bg-[#39ff14] text-black font-bold py-3 mt-4 hover:bg-white hover:shadow-[0_0_15px_#39ff14] transition-all uppercase">{authMode}</button>
          
          <button 
            type="button" 
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'register' : 'login');
              setAuthError('');
            }} 
            className="text-gray-400 hover:text-white mt-2 text-sm decoration-dashed underline underline-offset-4"
          >
            {authMode === 'login' ? "DON'T HAVE AN ACCOUNT? REGISTER" : "ALREADY HAVE AN ACCOUNT? LOGIN"}
          </button>
        </form>
      </div>
    </main>
  );
}
