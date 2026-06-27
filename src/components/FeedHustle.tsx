import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, getDoc, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import GenZHubPaymentGate from './GenZHubPaymentGate';
import { PostHustle, UserProfile } from '../types';
import { translations } from '../lib/i18n';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Plus, CheckCircle, ShieldCheck, X, BadgeCheck, RefreshCw, MessageSquare, TrendingUp, Zap, ArrowRight, DollarSign, Heart } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface FeedHustleProps {
  user: UserProfile;
  searchQuery: string;
  onStartChat: (seller: { uid: string, displayName: string, photoURL?: string }) => void;
}

export default function FeedHustle({ user, searchQuery, onStartChat }: FeedHustleProps) {
  const lang = user?.language || 'en';
  const t = translations[lang];
  const [posts, setPosts] = useState<PostHustle[]>([]);
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
  const [type, setType] = useState<'gig' | 'item'>('gig');

  const [activeFilter, setActiveFilter] = useState<'market' | 'mine'>('market');

  useEffect(() => {
    let q;
    if (activeFilter === 'market') {
      q = query(collection(db, "posts_hustle"), orderBy("timestamp", "desc"));
    } else {
      q = query(collection(db, "posts_hustle"), where("sellerId", "==", auth.currentUser?.uid), orderBy("timestamp", "desc"));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostHustle));
      setPosts(data);
      setLoading(false);
    }, (err) => {
      console.error("FeedHustle Snapshot Error:", err);
      setLoading(false);
    });
    return unsubscribe;
  }, [activeFilter]);

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!auth.currentUser) return;
    const postRef = doc(db, "posts_hustle", postId);
    try {
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(auth.currentUser.uid) : arrayUnion(auth.currentUser.uid)
      });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const userData = userDoc.data();

      if (!userData?.isPremium && (userData?.dripPostsCount || 0) >= 3) {
        alert("You've reached the 3-post limit for free accounts. Upgrade to Premium to keep posting hustles!");
        return;
      }

      setUploading(true);
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

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        dripPostsCount: (userData?.dripPostsCount || 0) + 1
      });

      setShowAdd(false);
      setTitle('');
      setPrice('');
      setDesc('');
    } catch (err) {
      console.error(err);
      alert("Failed to post hustle. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleHustle = async (post: PostHustle) => {
    if (!auth.currentUser) return;
    
    const total = post.price + 100; // Price + 100 fee
    const confirmHustle = window.confirm(`Initiate ${post.type === 'gig' ? 'hiring' : 'purchase'} for ${formatCurrency(post.price)}? A KSh 100 Escrow protection fee applies.`);
    if (!confirmHustle) return;

    try {
      const response = await axios.post('/api/payments/order', {
        userId: auth.currentUser.uid,
        email: auth.currentUser.email || `${auth.currentUser.uid}@genzhub.com`,
        firstName: auth.currentUser.displayName?.split(' ')[0] || 'User',
        lastName: auth.currentUser.displayName?.split(' ')[1] || 'Customer',
        type: 'escrow',
        amount: total,
        postId: post.id,
        postType: 'hustle'
      });

      if (response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Hustle initiation failed. Please try again.");
    }
  };

  const handleComplete = async (post: PostHustle) => {
    if (!auth.currentUser) return;
    const confirmComplete = window.confirm("Confirm that the service/item has been delivered? This will release funds to the provider.");
    if (!confirmComplete) return;

    try {
      await updateDoc(doc(db, "posts_hustle", post.id), {
        status: 'completed'
      });

      await addDoc(collection(db, "transactions"), {
        userId: post.sellerId,
        type: 'payout',
        description: `Earnings from "${post.title}" (#Hustle)`,
        amount: post.price,
        status: 'completed',
        timestamp: Date.now()
      });

      await addDoc(collection(db, "notifications"), {
        userId: post.sellerId,
        title: "Funds Released! 💰",
        message: `Payment for "${post.title}" has been released from escrow. Check your wallet!`,
        type: 'hustle_accepted',
        isRead: false,
        timestamp: Date.now()
      });

      alert("Hustle completed! Funds have been released to the seller.");
    } catch (err) {
      console.error(err);
      alert("Completion failed. Please try again.");
    }
  };

  return (
    <div className="space-y-10 pb-24">
      {/* Hustle Header */}
      <header className="relative p-10 rounded-[3rem] bg-[#0a0a0a] border border-white/5 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Briefcase className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                Hustle Economy
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter leading-none uppercase font-display">
              GLOBAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">GIGS</span>
            </h1>
            <p className="text-gray-400 font-medium max-w-md">
              The premier hub for GenZ talent. Hire professionals or get paid for your skills with zero risk.
            </p>
          </div>
          
          <button 
            onClick={() => setShowAdd(true)}
            className="group flex items-center gap-4 bg-white text-black px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/10 active:scale-95"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Post Your Gig
          </button>
        </div>

        <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/10 w-full md:max-w-xs mt-8">
          <button 
            onClick={() => setActiveFilter('market')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'market' ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'}`}
          >
            Explore
          </button>
          <button 
            onClick={() => setActiveFilter('mine')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'mine' ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'}`}
          >
            My Gigs
          </button>
        </div>
      </header>

      {/* Hustle List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
             Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-[2.5rem] animate-pulse border border-white/5" />
            ))
          ) : (
            filteredPosts.map((post, i) => {
              const isLiked = post.likes?.includes(auth.currentUser?.uid || '') || false;

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative bg-[#0a0a0a] rounded-[2.5rem] p-8 border border-white/5 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/5 flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            post.type === 'gig' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                          }`}>
                            {post.type === 'gig' ? 'Gig Service' : 'Product Sales'}
                        </div>
                        <button 
                          onClick={() => handleLike(post.id, isLiked)}
                          className={`p-1.5 rounded-lg transition-all border ${isLiked ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' : 'bg-white/5 text-gray-500 hover:text-pink-500 border-white/5'}`}
                        >
                          <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                     <h3 className="text-2xl font-black text-white italic leading-tight uppercase tracking-tighter font-display group-hover:text-green-500 transition-colors">
                        {post.title}
                     </h3>
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">@{post.sellerName}</span>
                        {post.sellerVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                     </div>
                   </div>
                   <div className="text-right">
                      <p className="text-2xl font-black text-white italic tracking-tighter leading-none">KES {post.price}</p>
                      <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1">Escrow Fee Included</p>
                   </div>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1 font-medium">
                  {post.description}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    {post.status === 'available' ? (
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                         <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Open to Hire</span>
                      </div>
                    ) : post.status === 'escrow' ? (
                      <div className="flex items-center gap-2">
                         <ShieldCheck className="w-4 h-4 text-orange-500" />
                         <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">In Progress</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                         <CheckCircle className="w-4 h-4 text-gray-500" />
                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Completed</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                      {post.status === 'available' && post.sellerId !== auth.currentUser?.uid && (
                        <div className="flex flex-col gap-4 w-full">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => onStartChat({ 
                                uid: post.sellerId, 
                                displayName: post.sellerName
                              })}
                              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-500 hover:text-white transition-all border border-white/5 flex-1"
                            >
                               <MessageSquare className="w-5 h-5 mx-auto" />
                            </button>
                          </div>
                          <GenZHubPaymentGate mode="escrow" itemPrice={post.price} />
                        </div>
                      )}

                     {post.status === 'escrow' && post.buyerId === auth.currentUser?.uid && (
                        <button 
                          onClick={() => handleComplete(post)}
                          className="px-8 py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500 transition-all shadow-xl shadow-green-600/20"
                        >
                           Release Funds
                        </button>
                     )}
                  </div>
                </div>
              </motion.div>
            )})
          )}
        </AnimatePresence>
      </div>

      {!loading && filteredPosts.length === 0 && (
        <div className="py-24 text-center glass-card rounded-[3rem]">
          <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-white/10">
            <Briefcase className="w-10 h-10 text-gray-700" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">
            {searchQuery ? "No Results Found" : "No Active Hustles"}
          </h2>
          <p className="text-gray-600 font-bold uppercase tracking-widest text-[9px]">
            {searchQuery ? `Nothing matches "${searchQuery}" in our market` : "The economy is waiting for your next move"}
          </p>
        </div>
      )}

      {/* Add Hustle Modal */}
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
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase font-display">New Hustle</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global talent marketplace</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-500 hover:text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handlePost} className="p-8 space-y-6">
                <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/10">
                  <button 
                    type="button"
                    onClick={() => setType('gig')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'gig' ? 'bg-white text-black shadow-xl' : 'text-gray-500'}`}
                  >
                    Service/Gig
                  </button>
                  <button 
                    type="button"
                    onClick={() => setType('item')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'item' ? 'bg-white text-black shadow-xl' : 'text-gray-500'}`}
                  >
                    Market Item
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Hustle Name</label>
                    <input 
                      placeholder="e.g. Professional Photo Editing"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-green-500/50 focus:bg-white/[0.05] transition-all"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Budget / Price (KSh)</label>
                    <input 
                      type="number"
                      placeholder="0.00"
                      className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-green-500/50 focus:bg-white/[0.05] transition-all"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Hustle Details</label>
                    <textarea 
                      placeholder="What exactly are you offering or selling? Be specific to get hired faster."
                      rows={4}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-green-500/50 focus:bg-white/[0.05] transition-all"
                      value={desc}
                      onChange={e => setDesc(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button 
                  disabled={uploading}
                  className="w-full bg-white text-black py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest disabled:opacity-50 transition-all hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 flex items-center justify-center gap-3"
                >
                  {uploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                    <>
                      <Zap className="w-5 h-5" />
                      Post Global Hustle
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
