import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PostRada } from '../types';
import { motion } from 'motion/react';
import { Newspaper, ExternalLink, Share2, Bookmark } from 'lucide-react';

export default function FeedRada() {
  const [posts, setPosts] = useState<PostRada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "posts_rada"), orderBy("timestamp", "desc"));
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

  if (loading) return <div className="p-8 text-gray-500 text-center font-mono">Loading #Rada...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24 space-y-6">
      <header className="flex items-center gap-2 mb-8">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Newspaper className="w-6 h-6 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">#Rada</h1>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Real-time RSS Active</span>
        </div>
      </header>

      {posts.length === 0 && (
        <div className="text-center py-20 bg-[#1e1e1e] rounded-3xl border border-white/5">
          <p className="text-gray-500">No news trending right now. Check back later!</p>
        </div>
      )}

      <div className="grid gap-6">
        {posts.map((post, idx) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#1e1e1e] rounded-3xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors"
          >
            {post.imageUrl && (
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-48 object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                  {post.category || 'Trending'}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">
                  {post.source}
                </span>
                <span className="text-[10px] text-gray-500 font-mono ml-auto">
                  {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2 leading-snug">
                {post.title}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {post.content}
              </p>
              
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                {post.link ? (
                  <a 
                    href={post.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 text-xs font-bold uppercase tracking-widest hover:text-blue-400 transition-colors flex items-center gap-1"
                  >
                    Read Full Story
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">Verified Story</span>
                )}
                <div className="flex gap-4">
                  <button className="text-gray-500 hover:text-white transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="text-gray-500 hover:text-white transition-colors">
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
