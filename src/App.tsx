import { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { signInAnonymously, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { UserProfile } from './types';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import Navbar from './components/Navbar';
import FeedRada from './components/FeedRada';
import FeedDrip from './components/FeedDrip';
import FeedHustle from './components/FeedHustle';
import AdminPanel from './components/AdminPanel';
import UserSettings from './components/UserSettings';
import ChatSystem from './components/ChatSystem';
import Payments from './components/Payments';
import PaymentCallback from './components/PaymentCallback';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User as UserIcon, LogIn, Sparkles, Ban, MessageSquare, Newspaper, ShoppingBag, Briefcase } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rada');
  const [newsTicker, setNewsTicker] = useState<string[]>([]);
  const [chatTarget, setChatTarget] = useState<UserProfile | null>(null);
  const [showPaymentCallback, setShowPaymentCallback] = useState(window.location.pathname === '/payments/callback');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 2. Socket.io Stream
    const socket = io();
    socket.on("rada:news_update", (newNews) => {
      if (newNews && newNews.length > 0) {
        setNewsTicker(newNews.slice(0, 5).map((n: any) => n.title));
      }
    });

    return () => { 
      socket.disconnect(); 
    };
  }, []);

  useEffect(() => {
    // 3. Firestore (Long Polling) fallback
    const path = "posts_rada";
    const q = query(collection(db, path), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      const approvedTitles = data
        .filter(d => d.isApproved === true)
        .slice(0, 5)
        .map(d => d.title);
      setNewsTicker(approvedTitles);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });
    return unsubscribe;
  }, []);

  const ADMIN_UID = import.meta.env.VITE_ALLOWED_ADMIN_UID;

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const path = `users/${firebaseUser.uid}`;
        const userRef = doc(db, "users", firebaseUser.uid);
        
        try {
          // Attempt to get doc. If offline, this might fail if not in cache.
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'GenZ User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              role: firebaseUser.uid === ADMIN_UID ? 'admin' : 'user',
              dripPostsCount: 0,
              isPremium: false,
              createdAt: Date.now()
            };
            await setDoc(userRef, newUser);
          }

          unsubscribeUserDoc = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              setUser(docSnap.data() as UserProfile);
            }
            setLoading(false);
          }, (err) => {
            // If we are offline, onSnapshot still works with cache, but might error if it can't even start
            if (err.code !== 'unavailable') {
              handleFirestoreError(err, OperationType.GET, path);
            }
            setLoading(false);
          });
        } catch (err: any) {
          // If offline and not in cache, getDoc fails. We still want to try onSnapshot for future updates.
          if (err.code === 'unavailable' || err.message?.includes('offline')) {
            console.warn("Firestore is offline, falling back to snapshot listener");
            
            // Set basic user info from auth as a fallback
            setUser({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'GenZ User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              role: firebaseUser.uid === ADMIN_UID ? 'admin' : 'user',
              dripPostsCount: 0,
              isPremium: false,
              createdAt: Date.now()
            });

            unsubscribeUserDoc = onSnapshot(userRef, (docSnap) => {
              if (docSnap.exists()) {
                setUser(docSnap.data() as UserProfile);
              }
              setLoading(false);
            }, (sErr) => {
              if (sErr.code !== 'unavailable') {
                handleFirestoreError(sErr, OperationType.GET, path);
              }
              setLoading(false);
            });
          } else {
            handleFirestoreError(err, OperationType.GET, path);
            setLoading(false);
          }
        }
      } else {
        setUser(null);
        if (unsubscribeUserDoc) unsubscribeUserDoc();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, [ADMIN_UID]);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login error:", err);
      // Silent fail for common iframe/user cancellation errors
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setIsLoggingIn(false);
        return;
      }
      
      if (err.code === 'auth/admin-restricted-operation') {
        alert("This sign-in method is restricted. Please contact the administrator.");
      } else {
        alert(`Login failed: ${err.message}. Please ensure popups are allowed for this site. If you are in the AI Studio preview, try opening the app in a new tab.`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full"
      />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-8">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-white/10 mx-auto border border-white/5">
            <img src="/logo.png" className="w-full h-full object-cover" alt="GenZHub Logo" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter">GenZHub</h1>
          <p className="text-gray-500 text-sm">Premium Social-Marketplace for the Kenyan Gen Z.</p>
        </div>
        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full bg-white text-black py-4 rounded-[2rem] font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoggingIn ? (
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-5 h-5 border-2 border-black/10 border-t-black rounded-full"
            />
          ) : (
            <>
              <LogIn className="w-5 h-5" /> Get Started
            </>
          )}
        </button>
      </div>
    </div>
  );

  if (user?.isBanned) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
            <Ban className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">ACCESS DENIED</h1>
          <p className="text-gray-500 font-medium leading-relaxed">
            Your account has been permanently restricted from the GenZHub platform for violating community guidelines.
          </p>
          <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">Status</p>
            <p className="text-red-500 font-bold uppercase">Banned permanently</p>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-full bg-white text-black py-4 rounded-2xl font-bold transition-transform active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white selection:bg-white selection:text-black">
      {showPaymentCallback && (
        <PaymentCallback onComplete={() => {
          setShowPaymentCallback(false);
          window.history.replaceState({}, '', '/');
        }} />
      )}

      {/* Real-time News Ticker */}
      <div className="bg-blue-600 overflow-hidden py-1 border-b border-white/10 sticky top-0 z-[60]">
        <motion.div 
          animate={{ x: [1000, -2000] }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
          className="whitespace-nowrap flex gap-12 items-center"
        >
          {newsTicker.length > 0 ? newsTicker.map((text, i) => (
            <span key={i} className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-1 bg-white rounded-full" />
              {text}
            </span>
          )) : (
            <span className="text-[10px] font-bold uppercase tracking-widest">Connecting to #Rada News Stream...</span>
          )}
        </motion.div>
      </div>

      <div className="flex">
        {/* Left Sidebar - Desktop only */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isAdmin={user?.role === 'admin'} 
          user={user} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar - Mobile and Tablet usually, hide on Desktop if Sidebar is visible */}
          <div className="md:hidden">
            <Navbar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              isAdmin={user?.role === 'admin'} 
              user={user}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>

          <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-32 md:pb-12">
            <AnimatePresence mode="wait">
              {activeTab === 'rada' && (
                <motion.div key="rada" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <FeedRada user={user!} searchQuery={searchQuery} />
                </motion.div>
              )}
              {activeTab === 'drip' && (
                <motion.div key="drip" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <FeedDrip user={user!} searchQuery={searchQuery} onStartChat={(seller) => {
                    setChatTarget(seller as any);
                    setActiveTab('chat');
                  }} />
                </motion.div>
              )}
              {activeTab === 'hustle' && (
                <motion.div key="hustle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <FeedHustle user={user!} searchQuery={searchQuery} onStartChat={(seller) => {
                    setChatTarget(seller as any);
                    setActiveTab('chat');
                  }} />
                </motion.div>
              )}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <UserSettings user={user!} />
                </motion.div>
              )}
              {activeTab === 'bills' && (
                <motion.div key="bills" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Payments user={user!} />
                </motion.div>
              )}
              {activeTab === 'chat' && (
                <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <ChatSystem 
                    user={user!} 
                    lang={(user?.language || 'en') as any} 
                    initialTarget={chatTarget}
                    onClearTarget={() => setChatTarget(null)}
                  />
                </motion.div>
              )}
              {activeTab === 'admin' && user?.role === 'admin' && (
                <motion.div key="admin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <AdminPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Right Sidebar - Desktop only */}
        <RightPanel 
          user={user}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/5 md:hidden z-[60] pb-safe">
        <div className="flex items-center justify-around h-16">
          <button 
            onClick={() => setActiveTab('rada')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'rada' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <Newspaper className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Rada</span>
          </button>
          <button 
            onClick={() => setActiveTab('drip')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'drip' ? 'text-pink-500' : 'text-gray-500'}`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Drip</span>
          </button>
          <button 
            onClick={() => setActiveTab('hustle')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'hustle' ? 'text-green-500' : 'text-gray-500'}`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Hustle</span>
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chat' ? 'text-white' : 'text-gray-500'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Chat</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
