import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  getDocs,
  where
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  Users, 
  Newspaper, 
  Gavel, 
  Check, 
  X, 
  Trash2, 
  Search,
  Star,
  Ban,
  BadgeCheck,
  CreditCard,
  MessageSquare,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { PostRada, UserProfile, PostHustle } from '../types';

type AdminTab = 'rada' | 'users' | 'escrow';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('rada');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [radaPosts, setRadaPosts] = useState<PostRada[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [escrowHustles, setEscrowHustles] = useState<PostHustle[]>([]);
  const [isAdminRole, setIsAdminRole] = useState(false);
  const [autoApprove, setAutoApprove] = useState(true);

  const ADMIN_UID = import.meta.env.VITE_ALLOWED_ADMIN_UID;

  useEffect(() => {
    if (!auth.currentUser) return;

    // Check if current user is admin in DB
    const checkAdmin = async () => {
      const path = 'users';
      try {
        if (db && ADMIN_UID && auth.currentUser) {
          const adminDoc = await getDocs(query(collection(db, path), where("uid", "==", ADMIN_UID), where("role", "==", "admin")));
          setIsAdminRole(!adminDoc.empty);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    };
    checkAdmin();

    // Rada Feed Listener
    const radaPath = "posts_rada";
    const qRada = query(collection(db, radaPath), orderBy("timestamp", "desc"));
    const unsubscribeRada = onSnapshot(qRada, (snapshot) => {
      setRadaPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostRada)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, radaPath);
    });

    // Users Listener
    const usersPath = "users";
    const qUsers = query(collection(db, usersPath), orderBy("createdAt", "desc"));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, usersPath);
    });

    // Escrow Hustles Listener
    const hustlePath = "posts_hustle";
    const qEscrow = query(collection(db, hustlePath), where("status", "==", "escrow"));
    const unsubscribeEscrow = onSnapshot(qEscrow, (snapshot) => {
      setEscrowHustles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostHustle)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, hustlePath);
    });

    return () => {
      unsubscribeRada();
      unsubscribeUsers();
      unsubscribeEscrow();
    };
  }, [auth.currentUser]);

  const handleFetchNews = async () => {
    setLoading(true);
    setMessage('Connecting to Standard Media & Nation RSS feeds + Gemini Search...');
    const path = "posts_rada";
    try {
      const res = await axios.get('/api/rada/fetch');
      const newsItems = res.data;
      
      for (const item of newsItems) {
        await addDoc(collection(db, path), {
          ...item,
          isApproved: autoApprove, // Automatically approve if enabled
          timestamp: item.timestamp || Date.now()
        });
      }

      setMessage(`Successfully synced ${newsItems.length} stories. ${autoApprove ? 'All auto-approved.' : 'Pending review.'}`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setMessage('Scraping failed. Check server logs.');
      } else {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Rada Actions
  const approveRada = async (post: PostRada) => {
    const path = `posts_rada/${post.id}`;
    try {
      await updateDoc(doc(db, "posts_rada", post.id), { isApproved: true });
      
      // If it's a user-submitted post (hypothetical userId field)
      if ((post as any).userId) {
        const notifPath = "notifications";
        await addDoc(collection(db, notifPath), {
          userId: (post as any).userId,
          title: "Post Approved! 📰",
          message: `Your story "${post.title}" has been approved and is now live on #Rada.`,
          type: 'post_approved',
          isRead: false,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };
  const deleteRada = async (id: string) => {
    const path = `posts_rada/${id}`;
    try {
      await deleteDoc(doc(db, "posts_rada", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // User Actions
  const togglePremium = async (uid: string, currentStatus: boolean) => {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, "users", uid), { isPremium: !currentStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };
  const toggleVerified = async (uid: string, currentStatus: boolean) => {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, "users", uid), { isVerified: !currentStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };
  const toggleBan = async (uid: string, currentStatus: boolean) => {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, "users", uid), { isBanned: !currentStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const bootstrapAdmin = async () => {
    if (ADMIN_UID) {
      const path = `users/${ADMIN_UID}`;
      try {
        await updateDoc(doc(db, "users", ADMIN_UID), { role: 'admin' });
        setIsAdminRole(true);
        setMessage('Admin role bootstrapped successfully!');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  // Escrow Actions
  const resolveEscrow = async (hustleId: string, release: boolean) => {
    const hustlePath = `posts_hustle/${hustleId}`;
    try {
      const hustle = escrowHustles.find(h => h.id === hustleId);
      await updateDoc(doc(db, "posts_hustle", hustleId), { 
        status: release ? 'completed' : 'available',
        buyerId: release ? (hustle?.buyerId || null) : null // Keep buyer if completing, null if refunding
      });

      if (hustle) {
        const notifPath = "notifications";
        if (release) {
          // Notify Seller
          await addDoc(collection(db, notifPath), {
            userId: hustle.sellerId,
            title: "Escrow Resolved! ✅",
            message: `The admin has released the funds for "${hustle.title}".`,
            type: 'hustle_accepted',
            isRead: false,
            timestamp: Date.now()
          });
        } else if (hustle.buyerId) {
          // Notify Buyer
          await addDoc(collection(db, notifPath), {
            userId: hustle.buyerId,
            title: "Refund Processed! 💸",
            message: `The admin has refunded your payment for "${hustle.title}".`,
            type: 'system',
            isRead: false,
            timestamp: Date.now()
          });
        }
      }
      
      alert(release ? "Funds released to seller!" : "Funds refunded to buyer!");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, hustlePath);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-32">
      <header className="flex flex-col gap-6 px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">GENZHUB COMMAND</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Admin Oversight Console</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
          {[
            { id: 'rada', icon: Newspaper, label: 'Rada Curator' },
            { id: 'users', icon: Users, label: 'Ban Hammer' },
            { id: 'escrow', icon: CreditCard, label: 'Escrow Referee' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-bold flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {message}
          </motion.div>
        )}

        {!isAdminRole && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <p className="text-amber-500 text-xs font-bold">Admin role not detected in database.</p>
            </div>
            <button 
              onClick={bootstrapAdmin}
              className="bg-amber-500 text-black px-4 py-2 rounded-lg font-bold text-xs"
            >
              Bootstrap Role
            </button>
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'rada' && (
          <motion.div 
            key="rada"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-6 space-y-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-center bg-[#1c1c1e] p-6 rounded-3xl border border-white/5 gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Live News Sync</h3>
                <p className="text-gray-500 text-sm">Fetch real-time news from Standard & Nation</p>
                <label className="flex items-center gap-2 mt-4 cursor-pointer group">
                  <div 
                    onClick={() => setAutoApprove(!autoApprove)}
                    className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${autoApprove ? 'bg-green-500' : 'bg-gray-700'}`}
                  >
                    <motion.div 
                      animate={{ x: autoApprove ? 16 : 0 }}
                      className="w-4 h-4 bg-white rounded-full shadow-md" 
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                    Auto-Approve to #Rada
                  </span>
                </label>
              </div>
              <button
                onClick={handleFetchNews}
                disabled={loading}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-white shadow-xl shadow-blue-600/20 active:scale-95"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Run Global Rada Sync
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-2">Review Queue ({radaPosts.filter(p => !p.isApproved).length})</h4>
              {radaPosts.map((post) => (
                <div key={post.id} className={`bg-[#1c1c1e] rounded-3xl border ${post.isApproved ? 'border-white/5' : 'border-amber-500/20'} overflow-hidden`}>
                  <div className="p-5 flex gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-800 shrink-0">
                      <img src={post.imageUrl} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black bg-white/5 px-2 py-0.5 rounded text-gray-400 uppercase tracking-tighter">{post.source}</span>
                        {!post.isApproved && <span className="text-[10px] font-black bg-amber-500 text-black px-2 py-0.5 rounded uppercase tracking-tighter">Pending</span>}
                      </div>
                      <h5 className="font-bold text-white leading-tight mb-1">{post.title}</h5>
                      <p className="text-gray-500 text-xs line-clamp-2">{post.content}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 flex gap-2 justify-end">
                    <button 
                      onClick={() => deleteRada(post.id)}
                      className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {!post.isApproved && (
                      <button 
                        onClick={() => approveRada(post)}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl py-2 flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Approve for #Rada
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div 
            key="users"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-6 space-y-4"
          >
            <div className="bg-[#1c1c1e] rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                <Search className="w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Search by name, email or UID..." className="bg-transparent border-none focus:ring-0 text-sm text-white w-full" />
              </div>
              <div className="divide-y divide-white/5">
                {allUsers.map((u) => (
                  <div key={u.uid} className="p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0">
                        <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{u.displayName}</span>
                          {u.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                          {u.isPremium && <Star className="w-4 h-4 text-amber-500 fill-amber-500/10" />}
                        </div>
                        <p className="text-gray-500 text-xs">{u.email}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{u.dripPostsCount}/3 Posts</span>
                          {u.isBanned && <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">BANNED</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => toggleVerified(u.uid, !!u.isVerified)}
                        className={`p-2 rounded-xl border ${u.isVerified ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-white/5 border-white/5 text-gray-500'}`}
                        title="Verify User"
                      >
                        <BadgeCheck className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => togglePremium(u.uid, u.isPremium)}
                        className={`p-2 rounded-xl border ${u.isPremium ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-white/5 border-white/5 text-gray-500'}`}
                        title="Grant Premium"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toggleBan(u.uid, !!u.isBanned)}
                        className={`p-2 rounded-xl border ${u.isBanned ? 'bg-red-500 text-white border-red-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
                        title="Ban Hammer"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'escrow' && (
          <motion.div 
            key="escrow"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-6 space-y-4"
          >
            {escrowHustles.length === 0 ? (
              <div className="text-center py-20 bg-[#1c1c1e] rounded-3xl border border-white/5">
                <CreditCard className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No active escrow disputes</p>
              </div>
            ) : (
              escrowHustles.map((h) => (
                <div key={h.id} className="bg-[#1c1c1e] rounded-3xl border border-white/5 overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-black bg-amber-500 text-black px-2 py-0.5 rounded uppercase tracking-tighter mb-2 inline-block">Hustle Escrow Hold</span>
                        <h5 className="text-xl font-bold text-white leading-tight">{h.title}</h5>
                        <p className="text-gray-500 text-sm">Referee Oversight for KES {h.price}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-2xl text-center">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Escrow Fund</p>
                        <p className="text-lg font-black text-white">KES {h.price}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 mb-6">
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Seller</p>
                        <p className="text-sm font-bold text-white">{h.sellerName}</p>
                        <p className="text-[10px] text-gray-600">{h.sellerId}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Buyer</p>
                        <p className="text-sm font-bold text-white">{h.buyerId || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => resolveEscrow(h.id, false)}
                        className="flex-1 py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                      >
                        Refund Buyer
                      </button>
                      <button 
                        onClick={() => resolveEscrow(h.id, true)}
                        className="flex-1 py-4 rounded-2xl bg-green-600 text-white font-bold shadow-lg shadow-green-600/20 hover:bg-green-500 transition-all"
                      >
                        Release to Seller
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
