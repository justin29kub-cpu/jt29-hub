'use client';
import { useState, useEffect } from 'react';
import { PackagePlus, ImageIcon } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', category: '', description: '', price: 0, image_url: '' });

  const fetchProducts = () => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ ...form, image_url: form.image_url || null })
    });
    setForm({ name: '', category: '', description: '', price: 0, image_url: '' });
    fetchProducts();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-white flex items-center gap-2">
        <PackagePlus className="text-[#39ff14]"/> Product Management
      </h2>

      {/* Add Form */}
      <form onSubmit={handleSubmit} className="neon-border bg-black/50 p-6 rounded mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input required placeholder="ชื่อสินค้า (ex. Premium Key)" className="bg-black border border-green-500/50 p-2 text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <input required placeholder="หมวดหมู่ (ex. ไก่ตัน)" className="bg-black border border-green-500/50 p-2 text-white" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
        <input required placeholder="คำอธิบาย" className="bg-black border border-green-500/50 p-2 text-white" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        <input required type="number" placeholder="ราคา (฿)" className="bg-black border border-green-500/50 p-2 text-white" value={form.price || ''} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} />
        <div className="md:col-span-2 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input placeholder="URL รูปภาพสินค้า (ไม่บังคับ) เช่น https://i.imgur.com/xxx.png" className="flex-1 bg-black border border-green-500/50 p-2 text-white" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
        </div>
        {form.image_url && (
          <div className="md:col-span-2">
            <p className="text-gray-400 text-xs mb-1">Preview รูป:</p>
            <img src={form.image_url} alt="preview" className="h-24 object-cover rounded border border-green-500/30" onError={e => (e.currentTarget.style.display='none')} />
          </div>
        )}
        <button type="submit" className="md:col-span-2 bg-[#39ff14] text-black font-bold py-2 hover:bg-white transition-all">
          + ADD PRODUCT
        </button>
      </form>

      {/* Product List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-green-500/50 text-[#39ff14]">
              <th className="p-3">รูป</th>
              <th className="p-3">ID</th>
              <th className="p-3">ชื่อ</th>
              <th className="p-3">หมวด</th>
              <th className="p-3">ราคา</th>
              <th className="p-3">สต๊อก</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                <td className="p-3">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded border border-green-500/30" onError={e => (e.currentTarget.style.display='none')} />
                    : <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-600" /></div>
                  }
                </td>
                <td className="p-3 font-mono text-gray-400">{p.id}</td>
                <td className="p-3 text-white font-bold">{p.name}</td>
                <td className="p-3 text-gray-300">{p.category}</td>
                <td className="p-3 text-[#39ff14] font-bold">฿{p.price}</td>
                <td className={`p-3 font-bold ${p.stock_count > 0 ? 'text-blue-400' : 'text-red-500'}`}>{p.stock_count}</td>
                <td className="p-3">
                  <button
                    onClick={async () => {
                      if (confirm(`ลบ ${p.name} ?`)) {
                        await fetch(`/api/admin/products/${p.id}`, {
                          method: 'DELETE',
                          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                        });
                        fetchProducts();
                      }
                    }}
                    className="bg-red-500/20 text-red-500 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition-colors text-sm font-bold"
                  >
                    DELETE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
