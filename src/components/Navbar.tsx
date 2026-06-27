import { Newspaper, ShoppingBag, Briefcase, UserCircle, Shield, MessageSquare, CreditCard, Search, X } from 'lucide-react';
import { UserProfile } from '../types';
import { translations } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  user?: UserProfile | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Navbar({ activeTab, setActiveTab, isAdmin, user, searchQuery, setSearchQuery }: NavbarProps) {
  const lang = user?.language || 'en';
  const t = translations[lang];

  const tabs = [
    { id: 'rada', label: t.nav.rada, icon: Newspaper },
    { id: 'drip', label: t.nav.drip, icon: ShoppingBag },
    { id: 'hustle', label: t.nav.hustle, icon: Briefcase },
    { id: 'chat', label: t.nav.chat, icon: MessageSquare },
    { id: 'bills', label: t.nav.bills, icon: CreditCard },
    { id: 'profile', label: t.nav.profile, icon: UserCircle },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <nav className="sticky top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('rada')}>
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-600/20 border border-white/5">
            <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white hidden sm:block">GENZHUB</span>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-white text-black font-bold shadow-lg' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'block' : 'hidden lg:block'}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 max-w-xs mx-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input 
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                <X className="w-3 h-3" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`w-10 h-10 rounded-xl overflow-hidden border transition-all ${activeTab === 'profile' ? 'border-white ring-2 ring-white/20' : 'border-white/10 hover:border-white/30'}`}
        >
          <img 
            src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'default'}`} 
            className="w-full h-full object-cover" 
            alt="Avatar"
          />
        </button>
      </div>
    </nav>
  );
}
