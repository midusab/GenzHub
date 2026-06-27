import { useState, useEffect } from 'react';
import axios from 'axios';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc, updateDoc, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import GenZHubPaymentGate from './GenZHubPaymentGate';
import { PostDrip, UserProfile } from '../types';
import { translations } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Plus, Camera, X, BadgeCheck, RefreshCw, Lock, ShieldCheck, MessageSquare, TrendingUp, Sparkles, ArrowRight, Heart } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface FeedDripProps {
  user: UserProfile;
  searchQuery: string;
  onStartChat: (seller: { uid: string, displayName: string, photoURL?: string }) => void;
}

export default function FeedDrip({ user, searchQuery, onStartChat }: FeedDripProps) {
  const lang = user?.language || 'en';
  const t = translations[lang];
  const [posts, setPosts] = useState<PostDrip[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const filteredPosts = posts.filter(post => 
    (post.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (post.sellerName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (post.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [selectedPost, setSelectedPost] = useState<PostDrip | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [activeFilter, setActiveFilter] = useState<'market' | 'mine'>('market');

  useEffect(() => {
    let q;
    if (activeFilter === 'market') {
      q = query(collection(db, "posts_drip"), orderBy("timestamp", "desc"));
    } else {
      q = query(collection(db, "posts_drip"), where("sellerId", "==", auth.currentUser?.uid), orderBy("timestamp", "desc"));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostDrip));
      setPosts(data);
      setLoading(false);
    }, (err) => {
      console.error("FeedDrip Snapshot Error:", err);
      setLoading(false);
    });
    return unsubscribe;
  }, [activeFilter]);

  const handleLike = async (e: React.MouseEvent, postId: string, isLiked: boolean) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    const postRef = doc(db, "posts_drip", postId);
    try {
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(auth.currentUser.uid) : arrayUnion(auth.currentUser.uid)
      });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleBuy = async (post: PostDrip) => {
    if (!auth.currentUser || isProcessing) return;
    if (post.sellerId === auth.currentUser.uid) {
      alert("You cannot buy your own item, champ!");
      return;
    }

    const confirmBuy = window.confirm(`Confirm purchase of "${post.title}" for ${formatCurrency(post.price)} via Escrow protection?`);
    if (!confirmBuy) return;

    setIsProcessing(true);
    try {
      const response = await axios.post('/api/payments/order', {
        userId: auth.currentUser.uid,
        email: auth.currentUser.email || `${auth.currentUser.uid}@genzhub.com`,
        firstName: auth.currentUser.displayName?.split(' ')[0] || 'User',
        lastName: auth.currentUser.displayName?.split(' ')[1] || 'Customer',
        type: 'escrow',
        amount: post.price,
        postId: post.id,
        postType: 'drip'
      });

      if (response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Transaction failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim() || !auth.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const userData = userDoc.data();
      
      if (!userData?.isPremium && (userData?.dripPostsCount || 0) >= 3) {
        alert("You've reached the 3-post limit for free accounts. Upgrade to Premium for unlimited drops!");
        return;
      }

      setUploading(true);

      await addDoc(collection(db, "posts_drip"), {
        title,
        price: Number(price),
        description: desc,
        imageUrl: imageUrlInput.trim(),
        sellerId: auth.currentUser.uid,
        sellerName: auth.currentUser.displayName || 'GenZ User',
        sellerVerified: userData?.isVerified || false,
        status: 'available',
        timestamp: Date.now()
      });

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        dripPostsCount: (userData?.dripPostsCount || 0) + 1
      });

      setShowAdd(false);
      setTitle('');
      setPrice('');
      setDesc('');
      setImageUrlInput('');
    } catch (err: any) {
      console.error("Drip Post Error:", err);
      alert(`Failed to post: ${err.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-10 pb-24">
      {/* Marketplace Header */}
      <header className="relative p-10 rounded-[3rem] bg-[#0a0a0a] border border-white/5 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShoppingBag className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-4 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-full text-[10px] font-black text-pink-500 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                Global Marketplace
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter leading-none uppercase font-display">
              CURATED <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-600">DRIP</span>
            </h1>
            <p className="text-gray-400 font-medium max-w-md">
              Buy and sell verified street fashion with secure escrow protection. 
            </p>
          </div>
          
          <button 
            onClick={() => setShowAdd(true)}
            className="group flex items-center gap-4 bg-white text-black px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/10 active:scale-95"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            List Your Item
          </button>
        </div>

        <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/10 w-full md:max-w-xs mt-8">
          <button 
            onClick={() => setActiveFilter('market')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'market' ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'}`}
          >
            Market
          </button>
          <button 
            onClick={() => setActiveFilter('mine')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'mine' ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'}`}
          >
            Closet
          </button>
        </div>
      </header>

      {/* Grid Feed */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-white/5 rounded-[2.5rem] animate-pulse border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post, i) => {
              const isLiked = post.likes?.includes(auth.currentUser?.uid || '') || false;
              const likesCount = post.likes?.length || 0;

              return (
                <motion.div
                  layout
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className={`group relative bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-xl cursor-pointer hover:border-white/20 transition-all duration-500 hover:-translate-y-1 ${post.status !== 'available' ? 'opacity-50 grayscale' : ''}`}
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img 
                      src={post.imageUrl} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                      <span className="text-[10px] font-black text-white italic tracking-tighter uppercase">KES {post.price}</span>
                    </div>

                    <button 
                      onClick={(e) => handleLike(e, post.id, isLiked)}
                      className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-xl border transition-all ${isLiked ? 'bg-pink-500 text-white border-pink-500' : 'bg-black/60 text-white/70 border-white/10 hover:text-white hover:bg-black/80'}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                    
                    {post.status !== 'available' && (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <div className="px-4 py-2 bg-blue-600 rounded-2xl flex items-center gap-2 shadow-2xl">
                        <Lock className="w-3 h-3 text-white" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Escrow</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <button className="w-full py-3 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                       View Details
                       <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 md:p-6">
                   <h3 className="text-xs md:text-sm font-black text-white uppercase truncate font-display mb-1">{post.title}</h3>
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-1">
                        <span className="text-[8px] md:text-[9px] text-gray-500 font-black uppercase tracking-widest">@{post.sellerName}</span>
                        {post.sellerVerified && <BadgeCheck className="w-2.5 h-2.5 md:w-3 md:h-3 text-blue-500" />}
                     </div>
                     <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-800" />
                   </div>
                </div>
              </motion.div>
            )})
          }
        </AnimatePresence>
        </div>
      )}

      {!loading && filteredPosts.length === 0 && (
        <div className="py-24 text-center glass-card rounded-[3rem]">
          <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-white/10">
            <ShoppingBag className="w-10 h-10 text-gray-700" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">
            {searchQuery ? "No Results Found" : "No Drip Found"}
          </h2>
          <p className="text-gray-600 font-bold uppercase tracking-widest text-[9px]">
            {searchQuery ? `Nothing matches "${searchQuery}" in our market` : "Be the first to list a drop on the market"}
          </p>
        </div>
      )}

      {/* Modal View Redesign */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8"
          >
             <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative w-full max-w-6xl h-full max-h-[92vh] md:max-h-[85vh] bg-[#050505] rounded-[3rem] border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-6 right-6 z-[60] p-4 bg-black/40 hover:bg-black/80 rounded-2xl text-white transition-all backdrop-blur-xl border border-white/10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-full md:w-[55%] h-[45%] md:h-full relative group">
                <img 
                  src={selectedPost.imageUrl} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-10 left-10 hidden md:block">
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">Escrow Protected Listing</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 md:p-16 flex flex-col h-full overflow-y-auto custom-scrollbar">
                <div className="space-y-8 flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <span className="px-4 py-1.5 bg-pink-500/10 text-pink-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-pink-500/10">Streetwear</span>
                       <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Listing ID: {selectedPost.id.slice(0, 8)}</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-[0.9] font-display">
                       {selectedPost.title}
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black italic text-gray-400">
                        {selectedPost.sellerName[0]}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                           @{selectedPost.sellerName}
                           {selectedPost.sellerVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                        </p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Verified Seller</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Description</p>
                    <p className="text-gray-400 text-lg leading-relaxed font-medium">
                       {selectedPost.description || "Every drop tells a story. This unique piece is waiting for its next owner to carry the vibe forward. Authentic and verified."}
                    </p>
                  </div>

                  <div className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1">
                       <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Price</p>
                       <p className="text-4xl font-black text-white italic tracking-tighter leading-none mb-6">KES {selectedPost.price}</p>
                       <GenZHubPaymentGate 
                         mode="escrow" 
                         itemPrice={selectedPost.price} 
                         itemName={selectedPost.title}
                         sellerName={selectedPost.sellerName}
                       />
                    </div>
                    <button 
                      onClick={(e) => handleLike(e, selectedPost.id, selectedPost.likes?.includes(auth.currentUser?.uid || '') || false)}
                      className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-2 ${selectedPost.likes?.includes(auth.currentUser?.uid || '') ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' : 'bg-white/5 text-gray-500 border-white/10'}`}
                    >
                      <Heart className={`w-8 h-8 ${selectedPost.likes?.includes(auth.currentUser?.uid || '') ? 'fill-current' : ''}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{selectedPost.likes?.length || 0} Likes</span>
                    </button>
                  </div>
                </div>

                <div className="pt-10 flex flex-col md:flex-row gap-4 mt-auto">
                   <button 
                      onClick={() => onStartChat({ 
                        uid: selectedPost.sellerId, 
                        displayName: selectedPost.sellerName
                      })}
                      className="flex-1 py-5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 text-blue-500 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                   >
                      <MessageSquare className="w-5 h-5" />
                      Inquire Details
                   </button>
                   <button className="flex-1 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest transition-all">
                      Share Drop
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Drop Modal Refined */}
      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          >
             <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="bg-[#0a0a0a] w-full max-w-xl rounded-[3rem] border border-white/10 overflow-y-auto max-h-[90vh] custom-scrollbar shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase font-display">New Drop</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Add your drip to the feed</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-500 hover:text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handlePost} className="p-8 space-y-6">
                <div className="aspect-[16/9] bg-white/[0.02] rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden relative group">
                  {imageUrlInput ? (
                    <img src={imageUrlInput} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-gray-700 mb-2 group-hover:text-blue-500 transition-colors" />
                      <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Image URL Required</span>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Item Identity</label>
                    <input 
                      placeholder="e.g. Jordan 1 Retro High"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Price (KSh)</label>
                        <input 
                          type="number"
                          placeholder="0.00"
                          className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                          value={price}
                          onChange={e => setPrice(e.target.value)}
                          required
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Cover Link</label>
                        <input 
                          placeholder="https://..."
                          className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all text-xs"
                          value={imageUrlInput}
                          onChange={e => setImageUrlInput(e.target.value)}
                          required
                        />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Drip Details</label>
                    <textarea 
                      placeholder="Size, condition, and why it's a steal..."
                      rows={3}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                      value={desc}
                      onChange={e => setDesc(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  disabled={uploading}
                  className="w-full bg-white text-black py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest disabled:opacity-50 transition-all hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 flex items-center justify-center gap-3"
                >
                  {uploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {user.isPremium ? "Confirm Global Drop" : `Drop for Free (${user.dripPostsCount || 0}/3)`}
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
