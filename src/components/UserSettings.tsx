import { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  CreditCard, 
  LogOut, 
  ChevronRight, 
  Camera,
  Smartphone,
  Globe,
  Star,
  Info,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

interface UserSettingsProps {
  user: UserProfile;
}

export default function UserSettings({ user }: UserSettingsProps) {
  const [notifications, setNotifications] = useState(user.isPremium || false); // Mock persistence logic
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(user.displayName);
  const [editingPhoto, setEditingPhoto] = useState(user.photoURL || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [theme, setTheme] = useState<'midnight' | 'black'>('midnight');

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        displayName: editingName,
        photoURL: editingPhoto 
      });
      setActiveModal(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTogglePreference = async (field: string, value: any) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { [field]: value });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpgrade = async () => {
    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { isPremium: true });
      setActiveModal(null);
      alert("Welcome to GenZ Premium! 🚀");
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const sections = [
    {
      title: "Account",
      items: [
        { id: 'profile', label: "Personal Information", icon: User, color: "bg-blue-500", onClick: () => setActiveModal('profile') },
        { id: 'premium', label: "GenZ Premium", icon: Star, color: "bg-amber-500", detail: user.isPremium ? "Active" : "Upgrade", onClick: () => !user.isPremium && setActiveModal('premium') },
        { id: 'billing', label: "Payments & Billing", icon: CreditCard, color: "bg-green-500" },
      ]
    },
    {
      title: "Preferences",
      items: [
        { id: 'notifications', label: "Notifications", icon: Bell, color: "bg-red-500", toggle: true, value: notifications, onToggle: () => {
          setNotifications(!notifications);
          handleTogglePreference('notificationsEnabled', !notifications);
        } },
        { id: 'display', label: "Appearance", icon: Smartphone, color: "bg-indigo-500", detail: theme === 'midnight' ? "Midnight" : "Black", onClick: () => {
          const newTheme = theme === 'midnight' ? 'black' : 'midnight';
          setTheme(newTheme);
          handleTogglePreference('theme', newTheme);
        } },
        { id: 'language', label: "Language", icon: Globe, color: "bg-gray-500", detail: "English (KE)" },
      ]
    },
    {
      title: "Security & Support",
      items: [
        { id: 'privacy', label: "Privacy & Security", icon: Shield, color: "bg-cyan-500" },
        { id: 'help', label: "Help & Support", icon: HelpCircle, color: "bg-orange-500" },
        { id: 'about', label: "About GenZHub", icon: Info, color: "bg-gray-400", onClick: () => setActiveModal('about') },
      ]
    }
  ];

  return (
    <div className={`max-w-xl mx-auto pb-32 transition-colors duration-500 min-h-screen ${theme === 'black' ? 'bg-black' : 'bg-[#0a0a0a]'}`}>
      {/* iOS Style Large Title */}
      <div className="px-6 py-8">
        <h1 className="text-4xl font-bold tracking-tight text-white">Settings</h1>
      </div>

      {/* Profile Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 mb-8"
      >
        <div className="bg-[#1c1c1e] rounded-2xl p-4 flex items-center gap-4 border border-white/5 shadow-xl">
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden border border-white/10">
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                className="w-full h-full object-cover" 
                alt="Profile"
              />
            </div>
            <button className="absolute -bottom-1 -right-1 bg-white text-black p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate text-white">{user.displayName}</h2>
            <p className="text-gray-500 text-sm truncate">{user.email}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </div>
      </motion.div>

      {/* Settings List */}
      <div className="space-y-8 px-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-[11px] uppercase tracking-[0.15em] font-bold text-gray-500 ml-4 mb-2">
              {section.title}
            </h3>
            <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5 shadow-lg">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] active:bg-white/[0.05] transition-colors text-left"
                  onClick={() => {
                    if (item.toggle) item.onToggle?.();
                    else item.onClick?.();
                  }}
                >
                  <div className={`${item.color} p-1.5 rounded-lg text-white`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1 font-medium text-[15px] text-white">{item.label}</span>
                  
                  {item.detail && (
                    <span className="text-gray-500 text-[15px] mr-1">{item.detail}</span>
                  )}
                  
                  {item.toggle ? (
                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${item.value ? 'bg-green-500' : 'bg-gray-700'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm ${item.value ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Sign Out Section */}
        <div className="pt-4">
          <button
            onClick={() => signOut(auth)}
            className="w-full bg-[#1c1c1e] rounded-2xl p-4 flex items-center justify-center gap-2 text-red-500 font-semibold border border-white/5 hover:bg-red-500/5 transition-colors shadow-lg"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
          <p className="text-center text-gray-600 text-[11px] mt-6 font-mono">
            GenZHub v1.2.0 • Build 2026.06.26
          </p>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1c1c1e] w-full max-w-sm rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative z-10"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">
                    {activeModal === 'profile' && "Edit Profile"}
                    {activeModal === 'premium' && "Get Premium"}
                    {activeModal === 'about' && "About GenZHub"}
                  </h2>
                  <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {activeModal === 'profile' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Display Name</label>
                      <input 
                        type="text" 
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Profile Photo URL</label>
                      <input 
                        type="text" 
                        placeholder="https://example.com/photo.jpg"
                        value={editingPhoto}
                        onChange={(e) => setEditingPhoto(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <button 
                      onClick={handleUpdateProfile}
                      disabled={isUpdating}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                      Save Changes
                    </button>
                  </div>
                )}

                {activeModal === 'premium' && (
                  <div className="text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                      <Star className="w-10 h-10 text-amber-500 fill-amber-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-white">GenZ Premium</h3>
                      <p className="text-gray-400 text-sm">Unlock unlimited Drip posts, verified badge, and exclusive hustle opportunities.</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Price</p>
                      <p className="text-3xl font-bold text-white">KES 499<span className="text-lg text-gray-500">/mo</span></p>
                    </div>
                    <button 
                      onClick={handleUpgrade}
                      disabled={isUpdating}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      {isUpdating ? "Processing..." : "Subscribe Now"}
                    </button>
                  </div>
                )}

                {activeModal === 'about' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl italic text-white shadow-lg shadow-blue-600/20">Z</div>
                      <div>
                        <h4 className="font-bold text-white">GenZHub</h4>
                        <p className="text-xs text-gray-500">The Ultimate Hub for Kenyan Gen Z</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>Built with ❤️ for the hustlers, the fashionistas, and the truth-seekers of Kenya.</p>
                      <p>© 2026 GenZHub Media Group. All rights reserved.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <button className="p-3 bg-white/5 rounded-xl border border-white/5 font-medium hover:bg-white/10 text-white">Privacy Policy</button>
                      <button className="p-3 bg-white/5 rounded-xl border border-white/5 font-medium hover:bg-white/10 text-white">Terms of Service</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
