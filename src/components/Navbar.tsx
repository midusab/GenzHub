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
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] flex items-center gap-1 shadow-2xl shadow-black">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] transition-all duration-300 ${
                isActive 
                  ? 'bg-white text-black font-bold' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              {isActive && <span className="text-sm">{tab.label}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
