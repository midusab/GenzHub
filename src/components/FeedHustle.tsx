import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { PostHustle } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Plus, CheckCircle, ShieldCheck, X, BadgeCheck } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import axios from 'axios';

export default function FeedHustle() {
  const [posts, setPosts] = useState<PostHustle[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<'gig' | 'item'>('gig');

  useEffect(() => {
    const q = query(collection(db, "posts_hustle"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostHustle));
      setPosts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      // Fetch user profile to check verification
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const userData = userDoc.data();

      await addDoc(collection(db, "posts_hustle"), {
        title,
        price: Number(price),
        description: desc,
        type,
        sellerId: auth.currentUser.uid,
        sellerName: auth.currentUser.displayName || 'GenZ Hustler',
        sellerVerified: userData?.isVerified || false,
        status: 'available',
        timestamp: Date.now()
      });

      setShowAdd(false);
      setTitle('');
      setPrice('');
      setDesc('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleHustle = async (post: PostHustle) => {
    if (!auth.currentUser) return;
    
    // Simulate Pesapal STK Push for Escrow
    const total = post.price + 100; // Price + 100 fee
    try {
      const res = await axios.post('/api/payments/stk-push', {
        amount: total,
        phoneNumber: "254700000000", // Placeholder
        description: `Escrow for ${post.title}`,
        accountReference: post.id
      });

      if (res.data.status === 'pending') {
        // Update post status to escrow
        await updateDoc(doc(db, "posts_hustle", post.id), {
          status: 'escrow',
          buyerId: auth.currentUser.uid
        });
        alert(`Payment of ${formatCurrency(total)} (incl. KSh 100 fee) initiated via M-PESA. Escrow active.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (post: PostHustle) => {
    try {
      await updateDoc(doc(db, "posts_hustle", post.id), {
        status: 'completed'
      });
      alert("Hustle completed! Funds released to seller.");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-gray-500 text-center font-mono">Loading #Hustle...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24 space-y-6">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Briefcase className="w-6 h-6 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">#Hustle</h1>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-white/90 transition-colors"
        >
          Post Hustle
        </button>
      </header>

      <div className="space-y-4">
        {posts.map((post, idx) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#1e1e1e] p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded mb-2 inline-block ${
                  post.type === 'gig' ? 'bg-orange-500/10 text-orange-500' : 'bg-purple-500/10 text-purple-500'
                }`}>
                  {post.type === 'gig' ? 'Gig' : 'Item'}
                </span>
                <h3 className="text-xl font-semibold text-white">{post.title}</h3>
                <div className="flex items-center gap-1">
                  <p className="text-gray-500 text-sm">by @{post.sellerName}</p>
                  {post.sellerVerified && (
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-white">{formatCurrency(post.price)}</div>
                <div className="text-[10px] text-gray-500">+ KSh 100 fee</div>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">{post.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium">
                {post.status === 'available' && (
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle className="w-3 h-3" /> Available
                  </span>
                )}
                {post.status === 'escrow' && (
                  <span className="flex items-center gap-1 text-orange-500">
                    <ShieldCheck className="w-3 h-3" /> In Escrow
                  </span>
                )}
                {post.status === 'completed' && (
                  <span className="flex items-center gap-1 text-gray-500">
                    <CheckCircle className="w-3 h-3" /> Completed
                  </span>
                )}
              </div>

              {post.status === 'available' && post.sellerId !== auth.currentUser?.uid && (
                <button 
                  onClick={() => handleHustle(post)}
                  className="bg-green-500 text-black px-6 py-2 rounded-xl text-sm font-bold hover:bg-green-400 transition-colors"
                >
                  {post.type === 'gig' ? 'Hire Now' : 'Buy Now'}
                </button>
              )}

              {post.status === 'escrow' && post.buyerId === auth.currentUser?.uid && (
                <button 
                  onClick={() => handleComplete(post)}
                  className="bg-white text-black px-6 py-2 rounded-xl text-sm font-bold"
                >
                  Confirm Completion
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.9 }}
              className="bg-[#1e1e1e] w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Post a Hustle</h2>
                <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handlePost} className="p-6 space-y-4">
                <div className="flex bg-white/5 p-1 rounded-2xl">
                  <button 
                    type="button"
                    onClick={() => setType('gig')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${type === 'gig' ? 'bg-white text-black' : 'text-gray-500'}`}
                  >
                    Gig/Task
                  </button>
                  <button 
                    type="button"
                    onClick={() => setType('item')}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${type === 'item' ? 'bg-white text-black' : 'text-gray-500'}`}
                  >
                    Market Item
                  </button>
                </div>
                <input 
                  placeholder="What's the hustle?"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
                <input 
                  placeholder="Price (KSh)"
                  type="number"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                />
                <textarea 
                  placeholder="Details about the gig or item..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  required
                />
                <button 
                  className="w-full bg-green-500 text-black py-4 rounded-2xl font-bold"
                >
                  Post to #Hustle
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
