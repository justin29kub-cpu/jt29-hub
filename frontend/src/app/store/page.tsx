'use client';
import { useEffect, useState } from 'react';
import { Wallet, ShieldAlert, LogOut, ShoppingCart, Info, Code, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MatrixBackground from '@/components/MatrixBackground';

interface User { id: number; username: string; credit_balance: number; is_admin: boolean; }
interface Product { id: number; name: string; category: string; description: string; price: number; stock_count: number; }

export default function StoreHome() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [topupUrl, setTopupUrl] = useState('');
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [topupStatus, setTopupStatus] = useState('');

  const [activeTab, setActiveTab] = useState<'scripts'>('scripts'); // Only one tab for now: Get Script
  const [buyStatus, setBuyStatus] = useState<string | null>(null);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUser(await res.json());
      else { localStorage.removeItem('token'); router.push('/'); }
    } catch {
      localStorage.removeItem('token'); router.push('/');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    } else {
      fetchUser(token);
      fetchProducts();
    }
  }, [router]);

  const handleLogout = () => { localStorage.removeItem('token'); router.push('/'); };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault(); setTopupStatus('Processing...');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/topup/truemoney', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ voucher_url: topupUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setTopupStatus(`Success: + ฿${data.amount}`);
        setTopupUrl(''); fetchUser(token!);
      } else setTopupStatus(`Error: ${data.detail}`);
    } catch (err) { setTopupStatus('Network error.'); }
  };

  const buyProduct = async (product_id: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/buy', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id })
      });
      const data = await res.json();
      if (res.ok) {
        setBuyStatus(`PURCHASE SUCCESS! YOUR KEY: ${data.key_value}`);
        fetchUser(token!);
        fetchProducts(); // refresh stock
      } else {
        setBuyStatus(`FAILED: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      setBuyStatus('Network error during purchase.');
    }
  };

  if (!user) return <div className="min-h-screen bg-black text-[#39ff14] p-10 font-mono text-2xl">INITIALIZING...</div>;

  return (
    <main className="relative min-h-screen bg-black font-mono">
      <MatrixBackground />
      
      {/* Top Navbar */}
      <nav className="relative z-20 flex flex-col md:flex-row justify-between items-center p-4 bg-black/90 backdrop-blur-md border-b border-green-500/50 shadow-[0_4px_20px_rgba(0,255,0,0.1)]">
         <div className="font-bold text-2xl text-[#39ff14] glitch-text px-4 mb-4 md:mb-0 cursor-default tracking-widest pt-2 pb-1">JT29 HUB</div>
         <div className="flex flex-wrap items-center gap-4">
           {user.is_admin && (
              <Link href="/admin" className="flex items-center gap-2 text-red-500 border border-red-500 px-4 py-2 hover:bg-red-500/20 transition-colors uppercase font-bold text-sm">
                <ShieldAlert className="w-5 h-5"/> ADMIN PANEL
              </Link>
           )}
           <div className="flex items-center gap-2 text-white bg-green-900/40 border border-[#39ff14] px-4 py-2 rounded shadow-[0_0_10px_rgba(57,255,20,0.2)]">
              <Wallet className="w-5 h-5 text-[#39ff14]" />
              <span className="font-mono text-lg font-bold text-white tracking-widest">฿{user.credit_balance.toFixed(2)}</span>
           </div>
           <button onClick={() => {setIsTopupOpen(true); setTopupStatus('');}} className="bg-[#39ff14] text-black px-6 py-2 font-extrabold hover:bg-white hover:shadow-[0_0_15px_#39ff14] transition-all">
             TOP UP
           </button>
           <button onClick={handleLogout} title="Logout" className="text-gray-400 hover:text-white border border-gray-600 p-2 rounded hover:bg-gray-800 transition-colors">
              <LogOut className="w-5 h-5"/>
           </button>
         </div>
      </nav>

      {/* Topup Modal */}
      {isTopupOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="neon-border bg-black/90 p-8 rounded-lg max-w-lg w-full shadow-[0_0_30px_rgba(57,255,20,0.3)]">
            <h2 className="text-2xl text-[#39ff14] font-bold mb-4 font-mono tracking-wider flex items-center gap-2">
              <Wallet className="w-6 h-6"/> REDEEM TRUEMONEY
            </h2>
            <div className="bg-green-900/40 border border-green-500/30 p-4 mb-6 rounded">
              <p className="text-gray-300 text-sm flex items-start gap-2">
                 <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                 <span>Paste your TrueMoney Voucher link below. The voucher must be sent exclusively to phone number <strong className="text-[#39ff14]">0621466134</strong>.</span>
              </p>
            </div>
            <form onSubmit={handleTopup}>
              <input type="text" placeholder="https://gift.truemoney.com..." className="w-full bg-black border border-green-500 p-3 text-[#39ff14] font-mono mb-4 focus:outline-none focus:border-white transition-colors" value={topupUrl} onChange={e => setTopupUrl(e.target.value)} />
              {topupStatus && <p className={`mb-4 font-bold text-center ${topupStatus.startsWith('Error') ? 'text-red-500' : 'text-blue-400'}`}>{topupStatus}</p>}
              <div className="flex justify-end gap-4 mt-6">
                 <button type="button" onClick={() => setIsTopupOpen(false)} className="text-gray-400 hover:text-white px-4">CLOSE</button>
                 <button type="submit" className="bg-[#39ff14] text-black font-bold px-6 py-2 hover:bg-white hover:shadow-[0_0_10px_#39ff14] transition-all">REDEEM</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto p-6 pt-10">
        
        {/* Purchase Status Alert */}
        {buyStatus && (
          <div className="mb-8 p-6 border-2 border-[#39ff14] bg-black/90 rounded text-center relative shadow-[0_0_20px_rgba(57,255,20,0.5)]">
            <h3 className="text-2xl text-[#39ff14] font-bold mb-2">SYSTEM MESSAGE</h3>
            <p className="text-white text-xl font-mono tracking-wide">{buyStatus}</p>
            <button onClick={() => setBuyStatus(null)} className="mt-4 text-gray-400 hover:text-white border-b border-gray-600">DISMISS</button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Side Menu */}
          <div className="w-full md:w-64 flex flex-col gap-4">
             <button onClick={() => setActiveTab('scripts')} className={`p-4 border ${activeTab === 'scripts' ? 'border-[#39ff14] bg-[#39ff14]/10 text-[#39ff14]' : 'border-green-500/30 text-gray-400 hover:text-white'} font-bold flex items-center gap-3 transition-colors uppercase tracking-widest`}>
                <Code className="w-5 h-5"/> GET SCRIPT
             </button>
             {/* Add more menus here in the future if needed */}
          </div>

          {/* Main Catalog Area */}
          <div className="flex-1">
             <h2 className="text-3xl font-extrabold text-white mb-6 uppercase tracking-widest border-b border-green-500/30 pb-4">
               {activeTab === 'scripts' && 'AVAILABLE SCRIPTS'}
             </h2>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {products.length === 0 ? (
                 <div className="col-span-full border border-dashed border-green-500/50 p-8 text-center text-gray-400">
                    NO SCRIPTS AVAILABLE AT THE MOMENT.
                 </div>
               ) : (
                 products.map(p => (
                   <div key={p.id} className="neon-border bg-black/80 p-6 rounded flex flex-col group relative overflow-hidden backdrop-blur-sm">
                      <div className="absolute top-0 right-0 p-2 bg-[#39ff14]/20 text-[#39ff14] text-xs font-bold font-mono">
                        {p.category}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 pr-16">{p.name}</h3>
                      <p className="text-gray-400 text-sm mb-4 h-12 overflow-hidden">{p.description}</p>
                      
                      <div className="mt-auto pt-4 border-t border-green-500/30 flex justify-between items-center">
                         <div className="flex flex-col">
                            <span className="text-[#39ff14] font-bold text-xl">฿{p.price.toFixed(2)}</span>
                            <span className={`text-xs ${p.stock_count > 0 ? 'text-blue-400' : 'text-red-500'}`}>Stock: {p.stock_count}</span>
                         </div>
                         <button 
                           onClick={() => {
                             if(confirm(`Buy ${p.name} for ฿${p.price.toFixed(2)}?`)) buyProduct(p.id);
                           }}
                           disabled={p.stock_count === 0}
                           className={`px-4 py-2 font-bold uppercase transition-all flex items-center gap-2 ${p.stock_count === 0 ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-600' : 'bg-[#39ff14] text-black hover:bg-white hover:shadow-[0_0_15px_rgba(57,255,20,0.8)]'}`}
                         >
                            <ShoppingCart className="w-4 h-4"/>
                            {p.stock_count > 0 ? 'BUY' : 'SOLD OUT'}
                         </button>
                      </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
