import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Settings, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import axios from 'axios';

export default function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFetchNews = async () => {
    setLoading(true);
    setMessage('Scraping trending news from Nairobi Gossip, Mpasho, ESPN...');
    try {
      const res = await axios.get('/api/rada/fetch');
      const newsItems = res.data;
      
      // Batch add to Firestore
      for (const item of newsItems) {
        await addDoc(collection(db, "posts_rada"), {
          ...item,
          timestamp: Date.now()
        });
      }
      setMessage(`Successfully added ${newsItems.length} news items to #Rada feed.`);
    } catch (err) {
      console.error(err);
      setMessage('Scraping failed. Check server logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <header className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-red-500/10 rounded-2xl">
          <Settings className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Central</h1>
          <p className="text-gray-500 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Secure Admin Access Only
          </p>
        </div>
      </header>

      <div className="bg-[#1e1e1e] p-8 rounded-[3rem] border border-red-500/20 space-y-6">
        <div className="flex items-start gap-4 p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-xs text-red-500/80 leading-relaxed">
            Authorized Vincent Marizon Chelsiah access only. Actions here impact global #Rada feeds and escrow settlements.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">#Rada Control</h3>
          <button 
            onClick={handleFetchNews}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black py-6 rounded-3xl font-bold hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Processing...' : 'Run Automated Scraping'}
          </button>
          
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-white/5 rounded-2xl border border-white/5 text-sm text-gray-400 font-mono"
            >
              {message}
            </motion.div>
          )}
        </div>

        <div className="pt-6 border-t border-white/5">
          <h3 className="text-lg font-bold text-white mb-4">Escrow Monitoring</h3>
          <div className="p-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-gray-500 text-sm">No active disputes or pending releases.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
