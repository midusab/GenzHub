import { Newspaper, ShoppingBag, Briefcase, UserCircle, Settings } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
}

export default function Navbar({ activeTab, setActiveTab, isAdmin }: NavbarProps) {
  const tabs = [
    { id: 'rada', label: '#Rada', icon: Newspaper },
    { id: 'drip', label: '#Drip', icon: ShoppingBag },
    { id: 'hustle', label: '#Hustle', icon: Briefcase },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: 'Admin', icon: Settings });
  }

  return (
    <nav className="sticky top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl italic text-white shadow-lg shadow-blue-600/20">Z</div>
          <span className="text-xl font-black italic tracking-tighter text-white hidden sm:block">GENZHUB</span>
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
                <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'block' : 'hidden md:block'}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="w-10 hidden sm:block" /> {/* Spacer for balance */}
      </div>
    </nav>
  );
}
