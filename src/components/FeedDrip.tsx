import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../lib/firebase';
import { PostDrip } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Plus, Camera, X, BadgeCheck, RefreshCw } from 'lucide-react';
import { compressImage, formatCurrency } from '../lib/utils';

export default function FeedDrip() {
  const [posts, setPosts] = useState<PostDrip[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    const q = query(collection(db, "posts_drip"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostDrip));
      setPosts(data);
      setLoading(false);
    }, (err) => {
      console.error("FeedDrip Snapshot Error:", err);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !auth.currentUser) return;

    // Check post limits for non-premium users
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const userData = userDoc.data();
      
      if (!userData?.isPremium && (userData?.dripPostsCount || 0) >= 3) {
        alert("You've reached the 3-post limit for free accounts. Upgrade to Premium for unlimited drops!");
        return;
      }

      setUploading(true);
      const compressed = await compressImage(image);
      const storageRef = ref(storage, `drip/${Date.now()}_${image.name}`);
      await uploadBytes(storageRef, compressed);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "posts_drip"), {
        title,
        price: Number(price),
        description: desc,
        imageUrl: url,
        sellerId: auth.currentUser.uid,
        sellerName: auth.currentUser.displayName || 'GenZ User',
        sellerVerified: userData?.isVerified || false,
        status: 'available',
        timestamp: Date.now()
      });

      // Update post count
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        dripPostsCount: (userData?.dripPostsCount || 0) + 1
      });

      setShowAdd(false);
      setTitle('');
      setPrice('');
      setDesc('');
      setImage(null);
    } catch (err) {
      console.error(err);
      alert("Failed to post item. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500 text-center font-mono">Loading #Drip...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-600/20">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tighter text-white">#DRIP</h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Live</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
              Marketplace
              <span className="w-1 h-1 bg-gray-700 rounded-full" />
              <span className="text-white">{posts.length} Items</span>
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-tight hover:bg-gray-100 transition-all active:scale-95 shadow-xl shadow-white/5"
        >
          <Plus className="w-4 h-4" /> Post Drop
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {posts.map((post) => (
            <motion.div
              layout
              key={post.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-[#1e1e1e] rounded-3xl overflow-hidden border border-white/5 group shadow-xl"
            >
            <div className="relative aspect-[4/5]">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg">
                <span className="text-xs font-bold text-white">{formatCurrency(post.price)}</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-white font-medium truncate mb-1">{post.title}</h3>
              <div className="flex items-center gap-1">
                <p className="text-gray-500 text-xs truncate">@{post.sellerName}</p>
                {post.sellerVerified && (
                  <BadgeCheck className="w-3 h-3 text-blue-500 fill-blue-500/10" />
                )}
              </div>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
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
              className="bg-[#1e1e1e] w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">List Your Drip</h2>
                <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handlePost} className="p-6 space-y-4">
                <div 
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="aspect-video bg-white/5 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors overflow-hidden"
                >
                  {image ? (
                    <img src={URL.createObjectURL(image)} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-gray-500 mb-2" />
                      <span className="text-xs text-gray-500">Add Photo</span>
                    </>
                  )}
                  <input 
                    id="image-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                  />
                </div>
                <input 
                  placeholder="Item Name"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-pink-500/50"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
                <div className="flex gap-4">
                  <input 
                    placeholder="Price (KSh)"
                    type="number"
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-pink-500/50"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    required
                  />
                </div>
                <textarea 
                  placeholder="Description..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-pink-500/50"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                />
                <button 
                  disabled={uploading}
                  className="w-full bg-white text-black py-4 rounded-2xl font-bold disabled:opacity-50 transition-all hover:bg-white/90 active:scale-95 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Uploading Drop...
                    </>
                  ) : 'Post for Free (1/3)'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
