import { Newspaper, ShoppingBag, Briefcase, UserCircle, Shield, MessageSquare, CreditCard, Sparkles, LogOut, Search, X } from 'lucide-react';
import { UserProfile } from '../types';
import { translations } from '../lib/i18n';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  user: UserProfile;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab, isAdmin, user, searchQuery, setSearchQuery }: SidebarProps) {
  const lang = user?.language || 'en';
  const t = translations[lang];

  const menuItems = [
    { id: 'rada', label: t.nav.rada, icon: Newspaper, color: 'text-blue-500' },
    { id: 'drip', label: t.nav.drip, icon: ShoppingBag, color: 'text-pink-500' },
    { id: 'hustle', label: t.nav.hustle, icon: Briefcase, color: 'text-green-500' },
    { id: 'chat', label: t.nav.chat, icon: MessageSquare, color: 'text-white' },
    { id: 'bills', label: t.nav.bills, icon: CreditCard, color: 'text-yellow-500' },
    { id: 'profile', label: t.nav.profile, icon: UserCircle, color: 'text-purple-500' },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: Shield, color: 'text-red-500' });
  }

  return (
    <aside className="hidden md:flex flex-col w-72 bg-[#050505] border-r border-white/5 h-screen sticky top-0 z-[70]">
      {/* Brand */}
      <div className="p-8">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setActiveTab('rada')}>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-white/10">
              <img src="/logo.png" className="w-full h-full object-cover" alt="GenZHub Logo" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl blur opacity-10 group-hover:opacity-30 transition-opacity" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter text-white font-display">GENZHUB</span>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/80">Premium Hub</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 mb-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text"
            placeholder="Global search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="px-4 mb-4">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Dashboard</p>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative ${
                isActive 
                  ? 'bg-white shadow-[0_10px_30px_rgba(255,255,255,0.1)]' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-black text-white' : 'bg-white/5 group-hover:bg-white/10 group-hover:scale-110'}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
              </div>
              <span className={`text-xs uppercase tracking-widest font-black ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}`}>
                {item.label}
              </span>
              
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active-indicator"
                  className="ml-auto w-1.5 h-1.5 bg-black rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User & Footer */}
      <div className="p-6 mt-auto">
        <div className="bg-white/[0.03] backdrop-blur-md rounded-[2rem] p-4 border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                className="w-11 h-11 rounded-2xl object-cover border-2 border-white/10 group-hover:border-blue-500/50 transition-colors"
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-[3px] border-[#0a0a0a]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate uppercase tracking-tight font-display">{user.displayName}</p>
              <div className="flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-blue-400" />
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
             <button 
                onClick={() => setActiveTab('profile')}
                className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl transition-all group border border-white/5"
                title="Settings"
             >
                <UserCircle className="w-4 h-4 text-gray-400 group-hover:text-white mx-auto" />
             </button>
             <button 
                onClick={() => signOut(auth)}
                className="flex-1 bg-red-500/5 hover:bg-red-500/10 py-3 rounded-xl transition-all group border border-red-500/10"
                title="Logout"
             >
                <LogOut className="w-4 h-4 text-red-500/60 group-hover:text-red-500 mx-auto" />
             </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
