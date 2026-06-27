import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Zap, Bell, ShieldCheck, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';

interface RightPanelProps {
  user: UserProfile;
  setActiveTab: (tab: string) => void;
}

export default function RightPanel({ user, setActiveTab }: RightPanelProps) {
  const [trendingDrip, setTrendingDrip] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "posts_drip"), orderBy("timestamp", "desc"), limit(3));
    return onSnapshot(q, (snapshot) => {
      setTrendingDrip(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  return (
    <aside className="hidden xl:flex flex-col w-80 bg-[#050505] border-l border-white/5 h-screen sticky top-0 z-[70] p-6 space-y-8 overflow-y-auto custom-scrollbar">
      
      {/* Search/Header placeholder */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Hot Right Now</h3>
        <div className="relative">
          <Bell className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer transition-colors" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-black" />
        </div>
      </div>

      {/* Premium Card */}
      {!user.isPremium && (
        <div className="relative group overflow-hidden bg-[#0a0a0a] rounded-[2.5rem] p-6 border border-white/10 shadow-2xl shadow-purple-500/10">
          {/* Animated Background */}
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles className="w-24 h-24 text-white" />
          </div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-600/20 rounded-full blur-[80px]" />
          
          <div className="relative z-10 space-y-5">
            <div className="flex items-center justify-between">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] backdrop-blur-md rounded-full border border-white/10">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Elevated</span>
              </div>
              <ShieldCheck className="w-5 h-5 text-blue-500" />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-xl font-black text-white leading-tight uppercase italic tracking-tighter font-display">THE ELITE PASS</h4>
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-widest">Join 500+ verified hustlers</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-[10px] text-gray-300 font-medium">Priority feed placement</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] text-gray-300 font-medium">Official verification badge</span>
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('bills')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-95 shadow-xl"
            >
              Unlock Access
            </button>
          </div>
        </div>
      )}

      {/* Trending Drips */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-pink-500" />
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Market Trends</h4>
          </div>
          <button onClick={() => setActiveTab('drip')} className="text-[10px] font-black text-blue-500 uppercase hover:underline">View All</button>
        </div>

        <div className="space-y-2">
          {trendingDrip.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-3 rounded-[1.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer group"
              onClick={() => setActiveTab('drip')}
            >
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#111] flex-shrink-0 border border-white/5">
                <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-[11px] font-black text-white truncate uppercase tracking-tight font-display">{item.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-2 py-0.5 bg-pink-500/10 text-pink-500 rounded-full font-black uppercase tracking-tighter italic">KES {item.price}</span>
                  <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">34 VIEWS</span>
                </div>
              </div>
            </motion.div>
          ))}
          
          {trendingDrip.length === 0 && (
            <div className="p-8 text-center bg-white/[0.02] rounded-[2rem] border border-dashed border-white/5">
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">No trends yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Support Section Refined */}
      <div className="relative group p-6 rounded-[2.5rem] bg-[#0a0a0a] border border-white/5 overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-black text-white uppercase tracking-tight font-display">OFFICIAL SUPPORT</h4>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">Verified Channels Only</p>
          </div>
          
          <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
            Run into issues? Our verified admins are here to keep your hustle smooth 24/7.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <button 
              onClick={() => setActiveTab('chat')}
              className="w-full py-3 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-3 h-3" />
              Platform Help
            </button>
            <a 
              href="https://wa.me/254742310494" 
              target="_blank" 
              rel="noreferrer"
              className="w-full py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 rounded-xl text-[9px] font-black text-[#25D366] uppercase tracking-widest transition-all border border-[#25D366]/20 flex items-center justify-center gap-2 group"
            >
              <div className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-pulse" />
              WhatsApp Business
            </a>
          </div>
        </div>
      </div>

      {/* Footer Refined */}
      <div className="px-2 pt-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6">
          <button className="text-[9px] text-gray-700 hover:text-blue-500 font-black uppercase tracking-[0.2em] transition-colors">Privacy</button>
          <button className="text-[9px] text-gray-700 hover:text-blue-500 font-black uppercase tracking-[0.2em] transition-colors">Security</button>
          <button className="text-[9px] text-gray-700 hover:text-blue-500 font-black uppercase tracking-[0.2em] transition-colors">Safety</button>
          <button className="text-[9px] text-gray-700 hover:text-blue-500 font-black uppercase tracking-[0.2em] transition-colors">Cookies</button>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-4 h-px bg-gray-800" />
           <p className="text-[9px] text-gray-800 font-black uppercase tracking-[0.3em]">GENZHUB &copy; 2026</p>
        </div>
      </div>

    </aside>
  );
}
