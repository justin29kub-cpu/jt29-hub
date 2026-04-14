'use client';
import { useState } from 'react';

type Product = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  stock_count: number;
};

export default function ProductCard({ product, userToken }: { product: Product, userToken: string | null }) {
  const [purchased, setPurchased] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleBuy = async () => {
    if (!userToken) {
       alert("SECURITY ALERT: You must be logged in to purchase items. Please login at the top right.");
       return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ product_id: product.id })
      });
      const data = await res.json();
      
      if (res.ok) {
        setPurchased(true);
        setPassword(data.key_value);
      } else {
        setErrorMsg(data.detail);
      }
    } catch (err) {
      setErrorMsg("Error connecting to server.");
    }
    setLoading(false);
  };

  const isOutOfStock = product.stock_count <= 0;

  return (
    <div className="neon-border bg-black/60 backdrop-blur-md p-6 rounded-lg flex flex-col items-center justify-between min-h-[250px] transition-transform hover:-translate-y-1 relative overflow-hidden">
      <div className="text-center w-full">
        <span className="text-xs uppercase tracking-widest text-[#39ff14] opacity-80 border border-[#39ff14] px-2 py-1 rounded inline-block mb-3">
          {product.category}
        </span>
        <h3 className="text-2xl font-bold text-white mb-2">{product.name}</h3>
        <p className="text-gray-400 text-sm mb-4">{product.description}</p>
        <div className="flex justify-between items-center w-full px-2 mb-6">
           <p className="text-xl font-bold text-[#39ff14] tracking-wider">฿{product.price}</p>
           <p className={`text-xs font-mono font-bold ${isOutOfStock ? 'text-red-500' : 'text-blue-400'}`}>
              [STOCK: {product.stock_count}]
           </p>
        </div>
      </div>

      {!purchased ? (
         <div className="w-full flex flex-col gap-2">
           {errorMsg && <p className="text-red-500 text-xs font-bold text-center">{errorMsg}</p>}
           <button
              onClick={handleBuy}
              disabled={loading || isOutOfStock}
              className={`w-full font-bold py-2 px-4 rounded transition-all ${
                 isOutOfStock 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-600' 
                  : 'bg-[#39ff14] text-black hover:bg-white hover:shadow-[0_0_15px_#39ff14]'
              }`}
           >
             {loading ? 'PROCESSING...' : isOutOfStock ? 'OUT OF STOCK' : 'BUY NOW'}
           </button>
         </div>
      ) : (
        <div className="w-full text-center border border-[#39ff14] p-3 rounded bg-green-900/20">
          <p className="text-sm font-bold text-white mb-1">Purchased Successfully!</p>
          <p className="text-xs text-gray-400 mb-1">Your Key/Code:</p>
          <p className="text-lg font-mono text-[#39ff14] tracking-widest bg-black p-2 rounded selectable">
             {password}
          </p>
        </div>
      )}
    </div>
  );
}
