import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PostRada } from '../types';
import { motion } from 'motion/react';
import { Newspaper } from 'lucide-react';

export default function FeedRada() {
  const [posts, setPosts] = useState<PostRada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "posts_rada"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostRada));
      setPosts(data);
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
                <span className="text-[10px] uppercase tracking-widest font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                  {post.source}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2 leading-snug">
                {post.title}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                {post.content}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
