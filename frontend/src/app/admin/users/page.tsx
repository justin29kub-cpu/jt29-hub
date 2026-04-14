'use client';
import { useState, useEffect } from 'react';
import { UsersRound, Wallet } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [addAmount, setAddAmount] = useState(0);

  const fetchUsers = () => {
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(setUsers);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddCredit = async (e: any) => {
    e.preventDefault();
    if (!selectedUser || addAmount === 0) return;

    await fetch('/api/admin/users/credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ user_id: parseInt(selectedUser), amount: addAmount })
    });
    
    setAddAmount(0);
    fetchUsers(); // Refresh
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-3xl font-bold mb-8 text-white flex items-center gap-2">
        <UsersRound className="text-[#39ff14]"/> User & Credit Management
      </h2>

      {/* Credit Form */}
      <form onSubmit={handleAddCredit} className="neon-border bg-black/50 p-6 rounded mb-10 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-gray-400 mb-2">Select User</label>
          <select 
            required
            className="w-full bg-black border border-green-500/50 p-2 text-white"
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
          >
             <option value="" disabled>-- Choose User --</option>
             {users.map(u => (
               <option key={u.id} value={u.id}>[ID:{u.id}] {u.username} (฿{u.credit_balance.toFixed(2)})</option>
             ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-400 mb-2">Amount to Add/Deduct (฿)</label>
          <div className="flex relative">
            <span className="absolute left-3 top-2.5 text-[#39ff14]"><Wallet className="w-4 h-4"/></span>
            <input 
              required type="number" step="0.01"
              placeholder="e.g. 50 or -50" className="w-full pl-10 bg-black border border-green-500/50 p-2 text-white" 
              value={addAmount === 0 ? '' : addAmount} onChange={e => setAddAmount(parseFloat(e.target.value) || 0)} 
            />
          </div>
        </div>
        <button type="submit" className="bg-[#39ff14] text-black font-bold py-2 px-4 hover:bg-white transition-all">
          UPDATE CREDIT
        </button>
      </form>

      {/* List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-green-500/50 text-[#39ff14]">
              <th className="p-3">ID</th>
              <th className="p-3">Username</th>
              <th className="p-3">Balance (฿)</th>
              <th className="p-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                <td className="p-3 font-mono">{u.id}</td>
                <td className="p-3 text-white">{u.username}</td>
                <td className="p-3 text-[#39ff14] font-bold">฿{u.credit_balance.toFixed(2)}</td>
                <td className="p-3">
                   {u.is_admin ? <span className="text-red-400">ADMIN</span> : <span className="text-gray-400">USER</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
