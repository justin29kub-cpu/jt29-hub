'use client';
import { useState, useEffect } from 'react';
import { KeyRound } from 'lucide-react';

export default function AdminKeys() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [keysText, setKeysText] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(setProducts);
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!selectedProduct || !keysText) return;

    const keysArray = keysText.split('\n').map(k => k.trim()).filter(k => k);
    
    setStatus('Adding...');
    const res = await fetch('/api/admin/keys', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ product_id: parseInt(selectedProduct), keys: keysArray })
    });
    
    if (res.ok) {
      setStatus(`Successfully added ${keysArray.length} keys!`);
      setKeysText('');
    } else {
      setStatus('Failed to add keys.');
    }
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-3xl font-bold mb-8 text-white flex items-center gap-2">
        <KeyRound className="text-[#39ff14]"/> Stock Management
      </h2>

      <div className="neon-border bg-black/50 p-6 rounded">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div>
            <label className="block text-gray-400 mb-2">Select Product Catalog</label>
            <select 
              required
              className="w-full bg-black border border-green-500/50 p-3 text-[#39ff14] outline-none focus:border-[#39ff14]"
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
            >
              <option value="" disabled>-- Select Product --</option>
              {products.map(p => (
                 <option key={p.id} value={p.id}>[ID:{p.id}] {p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Paste Keys (One per line)</label>
            <textarea 
              required
              rows={10}
              placeholder={'ABCD-1234\nEFGH-5678'}
              className="w-full bg-black border border-green-500/50 p-3 text-white font-mono outline-none focus:border-[#39ff14]"
              value={keysText}
              onChange={e => setKeysText(e.target.value)}
            />
          </div>

          <button type="submit" className="bg-[#39ff14] text-black font-bold py-3 hover:bg-white transition-all">
            UPLOAD STOCK
          </button>
          
          {status && <p className="text-center font-bold text-blue-400 mt-2">{status}</p>}
        </form>
      </div>
    </div>
  );
}
