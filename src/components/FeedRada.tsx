import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PostRada, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, Zap, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import RadaCard from './RadaCard';

interface FeedRadaProps {
  user: UserProfile;
  searchQuery: string;
}

export default function FeedRada({ user, searchQuery }: FeedRadaProps) {
  const [posts, setPosts] = useState<PostRada[]>([]);
  const [loading, setLoading] = useState(true);

  const filteredPosts = posts.filter(post => 
    (post.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (post.content?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (post.category?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const q = query(collection(db, "posts_rada"), orderBy("timestamp", "desc"), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostRada));
      // Only show approved posts to general users
      setPosts(data.filter(p => p.isApproved));
      setLoading(false);
    }, (err) => {
      console.error("FeedRada Snapshot Error:", err);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="space-y-12 pb-24">
      {/* Featured Headline */}
      <section className="relative group rounded-[3rem] overflow-hidden bg-[#0a0a0a] border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10" />
        <div className="relative z-10 p-8 md:p-14 flex flex-col md:flex-row gap-10 items-center">
          <div className="flex-1 space-y-8">
            <div className="flex items-center gap-3">
              <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Live Rada</div>
              <div className="flex items-center gap-1.5 text-gray-600 text-[10px] font-black uppercase tracking-widest">
                <Clock className="w-3 h-3" />
                Live Feed
              </div>
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white italic tracking-tighter leading-[0.9] uppercase font-display">
              THE HUB <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">EVOLUTION</span> IS LIVE
            </h1>
            <p className="text-lg text-gray-400 font-medium max-w-xl leading-relaxed">
              Stay ahead with the latest drops, hustles, and global Genz updates. The Rada is your official source of truth.
            </p>
            <div className="flex gap-4">
              <button className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/10 active:scale-95">
                Explore Feed <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="hidden md:flex w-1/3 aspect-square glass-card rounded-[3rem] items-center justify-center p-8 group-hover:rotate-3 transition-transform duration-1000 relative">
             <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full" />
             <Zap className="w-32 h-32 text-blue-500 animate-pulse relative z-10" />
          </div>
        </div>
      </section>

      {/* Post Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-72 bg-[#0a0a0a] rounded-[3rem] animate-pulse border border-white/5" />
            ))
          ) : (
            filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <RadaCard post={post} user={user} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {!loading && filteredPosts.length === 0 && (
        <div className="py-24 text-center glass-card rounded-[3rem]">
          <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-white/10">
            <Newspaper className="w-10 h-10 text-gray-700" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">
            {searchQuery ? "No Results Found" : "Feed is Silent"}
          </h2>
          <p className="text-gray-600 font-bold uppercase tracking-widest text-[9px]">
            {searchQuery ? `We couldn't find anything matching "${searchQuery}"` : "Check back later for the latest Rada"}
          </p>
        </div>
      )}
    </div>
  );
}
