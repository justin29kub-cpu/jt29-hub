'use client';
import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_sales: 0,
    revenue: 0,
    products_count: 0,
    keys_in_stock: 0
  });

  useEffect(() => {
    fetch('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  return (
    <div className="animate-pulse-slow">
      <h2 className="text-3xl font-bold mb-8 text-white border-b border-green-500/30 pb-4 flex items-center gap-2">
        <ShieldCheck className="text-[#39ff14]"/> SYSTEM METRICS
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Orders" value={stats.total_sales} />
        <StatCard title="Revenue (฿)" value={stats.revenue} textClass="text-[#39ff14]" />
        <StatCard title="Active Products" value={stats.products_count} />
        <StatCard title="Keys in Stock" value={stats.keys_in_stock} textClass="text-blue-400" />
      </div>
    </div>
  );
}

function StatCard({ title, value, textClass = 'text-white' }: { title: string, value: number, textClass?: string }) {
  return (
    <div className="neon-border bg-black/60 p-6 rounded relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-16 h-16 bg-[#39ff14]/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
      <p className="text-gray-400 text-sm tracking-wider uppercase mb-2">{title}</p>
      <p className={`text-4xl font-bold font-mono ${textClass}`}>{value}</p>
    </div>
  );
}
