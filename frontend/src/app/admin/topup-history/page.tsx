'use client';
import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';

export default function AdminTopupHistory() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/topup-history', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()).then(setLogs).catch(console.error);
  }, []);

  const totalSuccess = logs.filter(l => l.status === 'success').reduce((sum, l) => sum + l.amount, 0);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4 text-white flex items-center gap-2">
        <Wallet className="text-[#39ff14]"/> ประวัติการเติมเงิน
      </h2>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="neon-border bg-black/60 p-4 rounded">
          <p className="text-gray-400 text-sm">รายการทั้งหมด</p>
          <p className="text-3xl font-bold text-white">{logs.length}</p>
        </div>
        <div className="neon-border bg-black/60 p-4 rounded">
          <p className="text-gray-400 text-sm">ยอดเติมสำเร็จรวม</p>
          <p className="text-3xl font-bold text-[#39ff14]">฿{totalSuccess.toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-green-500/50 text-[#39ff14]">
              <th className="p-3">#</th>
              <th className="p-3">ผู้ใช้</th>
              <th className="p-3">จำนวน</th>
              <th className="p-3">Voucher</th>
              <th className="p-3">สถานะ</th>
              <th className="p-3">เวลา</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">ยังไม่มีการเติมเงิน</td></tr>
            )}
            {logs.map(l => (
              <tr key={l.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                <td className="p-3 text-gray-500">{l.id}</td>
                <td className="p-3 text-white font-bold">{l.username}</td>
                <td className={`p-3 font-bold ${l.status === 'success' ? 'text-[#39ff14]' : 'text-red-400'}`}>
                  {l.status === 'success' ? `+฿${l.amount}` : '-'}
                </td>
                <td className="p-3 text-gray-400 font-mono text-xs">{l.voucher_hash}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${l.status === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {l.status === 'success' ? 'สำเร็จ' : 'ล้มเหลว'}
                  </span>
                </td>
                <td className="p-3 text-gray-400">{l.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
