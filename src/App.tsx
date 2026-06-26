import { useState, useEffect } from 'react';
import { auth, db, rtdb } from './lib/firebase';
import { signInAnonymously, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { UserProfile } from './types';
import Navbar from './components/Navbar';
import FeedRada from './components/FeedRada';
import FeedDrip from './components/FeedDrip';
import FeedHustle from './components/FeedHustle';
import AdminPanel from './components/AdminPanel';
import UserSettings from './components/UserSettings';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User as UserIcon, LogIn, Sparkles, Ban } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rada');
  const [newsTicker, setNewsTicker] = useState<string[]>([]);

  useEffect(() => {
    // 1. Socket.io Stream
    const socket = io();
    socket.on("rada:news_update", (newNews) => {
      if (newNews && newNews.length > 0) {
        setNewsTicker(newNews.slice(0, 5).map((n: any) => n.title));
      }
    });

    // 2. Realtime Database (RTDB) Fallback
    const newsRef = ref(rtdb, 'rada_news');
    const unsubscribeRTDB = onValue(newsRef, (snapshot) => {
      const data = snapshot.val();
      if (data && Array.isArray(data)) {
        setNewsTicker(data.map(n => n.title));
      }
    });

    return () => { 
      socket.disconnect(); 
      unsubscribeRTDB();
    };
  }, []);

  useEffect(() => {
    // 3. Firestore (Long Polling) fallback
    const q = query(collection(db, "posts_rada"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      const approvedTitles = data
        .filter(d => d.isApproved === true)
        .slice(0, 5)
        .map(d => d.title);
      setNewsTicker(approvedTitles);
    });
    return unsubscribe;
  }, []);

  const ADMIN_UID = import.meta.env.VITE_ALLOWED_ADMIN_UID;

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
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
        });
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

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login error:", err);
      // Silent fail for common iframe/user cancellation errors
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      
      if (err.code === 'auth/admin-restricted-operation') {
        alert("This sign-in method is restricted. Please contact the administrator.");
      } else {
        alert(`Login failed: ${err.message}. If you are in the AI Studio preview, try opening the app in a new tab.`);
      }
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
          <div className="w-24 h-24 bg-gradient-to-tr from-white to-gray-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-white/10 mx-auto">
            <Sparkles className="w-12 h-12 text-[#121212]" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter">GenZHub</h1>
          <p className="text-gray-500 text-sm">Premium Social-Marketplace for the Kenyan Gen Z.</p>
        </div>
        <button 
          onClick={handleLogin}
          className="w-full bg-white text-black py-4 rounded-[2rem] font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95"
        >
          <LogIn className="w-5 h-5" /> Get Started
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
          <h1 className="text-4xl font-black italic text-white tracking-tighter">ACCESS DENIED</h1>
          <p className="text-gray-500 font-medium leading-relaxed">
            Your account has been permanently restricted from the GenZHub platform for violating community guidelines.
          </p>
          <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">Status</p>
            <p className="text-red-500 font-bold uppercase italic">Banned permanently</p>
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

      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isAdmin={user?.role === 'admin'} 
      />

      <main className="max-w-7xl mx-auto px-6 pt-12">
        <AnimatePresence mode="wait">
          {activeTab === 'rada' && (
            <motion.div key="rada" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <FeedRada />
            </motion.div>
          )}
          {activeTab === 'drip' && (
            <motion.div key="drip" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <FeedDrip />
            </motion.div>
          )}
          {activeTab === 'hustle' && (
            <motion.div key="hustle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <FeedHustle />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <UserSettings user={user!} />
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
  );
}
