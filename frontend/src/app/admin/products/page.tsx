'use client';
import { useState, useEffect } from 'react';
import { PackagePlus } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', category: '', description: '', price: 0 });

  const fetchProducts = () => {
    fetch('/api/products')
      .then(r => r.json())
      .then(setProducts);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(form)
    });
    setForm({ name: '', category: '', description: '', price: 0 });
    fetchProducts(); // Refresh list
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-white flex items-center gap-2">
        <PackagePlus className="text-[#39ff14]"/> Product Management
      </h2>

      {/* Add Form */}
      <form onSubmit={handleSubmit} className="neon-border bg-black/50 p-6 rounded mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input required placeholder="Name (ex. Premium Key)" className="bg-black border border-green-500/50 p-2 text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <input required placeholder="Category" className="bg-black border border-green-500/50 p-2 text-white" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
        <input required placeholder="Description" className="bg-black border border-green-500/50 p-2 text-white" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        <input required type="number" placeholder="Price" className="bg-black border border-green-500/50 p-2 text-white" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} />
        <button type="submit" className="md:col-span-2 bg-[#39ff14] text-black font-bold py-2 hover:bg-white transition-all">Add Product</button>
      </form>

      {/* List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-green-500/50 text-[#39ff14]">
              <th className="p-3">ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                <td className="p-3 font-mono">{p.id}</td>
                <td className="p-3 text-white">{p.name}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3 text-[#39ff14]">฿{p.price}</td>
                <td className={`p-3 font-bold ${p.stock_count > 0 ? 'text-blue-400' : 'text-red-500'}`}>{p.stock_count}</td>
                <td className="p-3">
                  <button 
                    onClick={async () => {
                      if(confirm(`Are you sure you want to delete ${p.name}?`)) {
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
