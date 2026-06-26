import { Newspaper, ShoppingBag, Briefcase, UserCircle, Shield, MessageSquare } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  user?: UserProfile | null;
}

export default function Navbar({ activeTab, setActiveTab, isAdmin, user }: NavbarProps) {
  const tabs = [
    { id: 'rada', label: 'Rada', icon: Newspaper },
    { id: 'drip', label: 'Drip', icon: ShoppingBag },
    { id: 'hustle', label: 'Hustle', icon: Briefcase },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <nav className="sticky top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('rada')}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-600/20">Z</div>
          <span className="text-xl font-black tracking-tighter text-white hidden sm:block">GENZHUB</span>
        </div>

        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
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
