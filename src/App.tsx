import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { signInAnonymously, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from './types';
import Navbar from './components/Navbar';
import FeedRada from './components/FeedRada';
import FeedDrip from './components/FeedDrip';
import FeedHustle from './components/FeedHustle';
import AdminPanel from './components/AdminPanel';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User as UserIcon, LogIn, Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rada');

  const ADMIN_UID = import.meta.env.VITE_ALLOWED_ADMIN_UID;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        } else {
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
          await setDoc(doc(db, "users", firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [ADMIN_UID]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      // Fallback to anonymous for preview
      await signInAnonymously(auth);
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

  return (
    <div className="min-h-screen bg-[#121212] text-white selection:bg-white selection:text-black">
      <main className="container mx-auto pt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'rada' && (
            <motion.div key="rada" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FeedRada />
            </motion.div>
          )}
          {activeTab === 'drip' && (
            <motion.div key="drip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FeedDrip />
            </motion.div>
          )}
          {activeTab === 'hustle' && (
            <motion.div key="hustle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FeedHustle />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-xl mx-auto p-4 space-y-8">
              <header className="flex flex-col items-center text-center space-y-4">
                <div className="w-32 h-32 rounded-[3rem] border-4 border-white/5 p-1">
                  <img 
                    src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                    className="w-full h-full object-cover rounded-[2.5rem]" 
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">{user.displayName}</h2>
                  <p className="text-gray-500 text-sm">{user.email || 'Hustler account active'}</p>
                </div>
                {user.role === 'admin' && (
                  <span className="bg-red-500/10 text-red-500 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-red-500/20">
                    System Administrator
                  </span>
                )}
              </header>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1e1e1e] p-6 rounded-[2.5rem] border border-white/5">
                  <p className="text-gray-500 text-xs uppercase font-bold mb-1">Drip Posts</p>
                  <p className="text-2xl font-bold">{user.dripPostsCount}/3 Free</p>
                </div>
                <div className="bg-[#1e1e1e] p-6 rounded-[2.5rem] border border-white/5">
                  <p className="text-gray-500 text-xs uppercase font-bold mb-1">Status</p>
                  <p className="text-2xl font-bold">{user.isPremium ? 'Premium' : 'Standard'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => signOut(auth)}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 text-gray-400 py-4 rounded-[2rem] border border-white/5 hover:bg-white/10 hover:text-white transition-all"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            </motion.div>
          )}
          {activeTab === 'admin' && user.role === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isAdmin={user.role === 'admin'} 
      />
    </div>
  );
}
