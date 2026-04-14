'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Database, Package, Key, Users, ShieldAlert, History, Wallet } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/'); return; }
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error("Invalid"); return r.json(); })
      .then(data => { if (!data.is_admin) throw new Error("Not Admin"); setAuthorized(true); })
      .catch(() => { alert("UNAUTHORIZED ACCESS DETECTED."); router.push('/'); });
  }, [router]);

  if (!authorized) return (
    <div className="min-h-screen bg-black text-[#39ff14] p-10 font-mono text-2xl">
      VERIFYING SECURITY CREDENTIALS...
    </div>
  );

  const navItems = [
    { href: '/admin', icon: Database, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Manage Users' },
    { href: '/admin/products', icon: Package, label: 'Manage Products' },
    { href: '/admin/keys', icon: Key, label: 'Add Stock (Keys)' },
    { href: '/admin/orders', icon: History, label: 'Order History' },
    { href: '/admin/topup-history', icon: Wallet, label: 'Topup History' },
  ];

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono flex">
      <aside className="w-64 border-r border-green-500/30 bg-black p-6 flex flex-col gap-6 h-screen sticky top-0 overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="text-[#39ff14] w-8 h-8" />
          <h1 className="text-2xl font-bold text-[#39ff14] glitch-text">ADMIN</h1>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 p-3 rounded hover:bg-[#39ff14] hover:text-black transition-colors text-sm">
              <Icon className="w-4 h-4 flex-shrink-0" /> {label}
            </Link>
          ))}
          <Link href="/store" className="mt-8 text-gray-500 hover:text-white transition-colors text-sm p-3">
            &larr; BACK TO STORE
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
