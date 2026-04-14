'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Database, Package, Key, Users, ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
       router.push('/');
       return;
    }
    // Verify admin token
    fetch('/api/me', {
       headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => {
      if (!r.ok) throw new Error("Invalid");
      return r.json();
    })
    .then(data => {
      if (!data.is_admin) throw new Error("Not Admin");
      setAuthorized(true);
    })
    .catch(() => {
      alert("UNAUTHORIZED ACCESS DETECTED. You are not an admin.");
      router.push('/');
    });
  }, [router]);

  if (!authorized) return <div className="min-h-screen bg-black text-[#39ff14] p-10 font-mono text-2xl">VERIFYING SECURITIY CREDENTIALS...</div>;

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-green-500/30 bg-black p-6 flex flex-col gap-6 h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-8">
          <ShieldAlert className="text-[#39ff14] w-8 h-8" />
          <h1 className="text-2xl font-bold text-[#39ff14] glitch-text">ADMIN</h1>
        </div>
        
        <nav className="flex flex-col gap-4">
          <Link href="/admin" className="flex items-center gap-3 p-3 rounded hover:bg-[#39ff14] hover:text-black transition-colors">
            <Database className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 p-3 rounded hover:bg-[#39ff14] hover:text-black transition-colors">
            <Users className="w-5 h-5" /> Manage Users
          </Link>
          <Link href="/admin/products" className="flex items-center gap-3 p-3 rounded hover:bg-[#39ff14] hover:text-black transition-colors">
            <Package className="w-5 h-5" /> Manage Products
          </Link>
          <Link href="/admin/keys" className="flex items-center gap-3 p-3 rounded hover:bg-[#39ff14] hover:text-black transition-colors">
            <Key className="w-5 h-5" /> Manage Stock (Keys)
          </Link>
          <Link href="/store" className="mt-10 text-gray-500 hover:text-white transition-colors text-sm">
             &larr; BACK TO STORE
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
