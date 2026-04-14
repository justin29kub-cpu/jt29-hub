'use client';
import { useEffect, useState } from 'react';
import { History } from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()).then(setOrders).catch(console.error);
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-white flex items-center gap-2">
        <History className="text-[#39ff14]"/> ประวัติการซื้อสินค้า
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-green-500/50 text-[#39ff14]">
              <th className="p-3">#</th>
              <th className="p-3">ผู้ซื้อ</th>
              <th className="p-3">สินค้า</th>
              <th className="p-3">Key ที่ได้รับ</th>
              <th className="p-3">ราคา</th>
              <th className="p-3">เวลา</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">ยังไม่มีการซื้อสินค้า</td></tr>
            )}
            {orders.map(o => (
              <tr key={o.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                <td className="p-3 text-gray-500">{o.id}</td>
                <td className="p-3 text-white font-bold">{o.username}</td>
                <td className="p-3 text-gray-300">{o.product_name}</td>
                <td className="p-3 font-mono text-[#39ff14] text-xs bg-black/50 rounded">{o.key_value}</td>
                <td className="p-3 text-[#39ff14] font-bold">฿{o.amount}</td>
                <td className="p-3 text-gray-400">{o.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
