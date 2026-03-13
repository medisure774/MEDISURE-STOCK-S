"use client";

import { useAuth } from '@/context/AuthContext';
import { 
  LogOut, 
  User as UserIcon,
  Bell,
  Search,
  Menu
} from 'lucide-react';

export default function Header() {
  const { user, logout, setMobileMenuOpen } = useAuth();

  if (!user) return null;

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-brand-border px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center lg:hidden">
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -ml-2 text-brand-secondary hover:bg-brand-bg rounded-xl transition-premium"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="relative w-96 hidden lg:block">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-brand-secondary" />
        </div>
        <input
          type="text"
          className="pl-10 w-full bg-brand-bg/50 border-transparent hover:border-brand-border/50 text-sm py-2"
          placeholder="Quick search across Medisure..."
        />
      </div>

      <div className="flex items-center space-x-6">
        <button className="p-2 text-brand-secondary hover:bg-brand-bg rounded-xl transition-premium relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-danger rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-brand-border"></div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-brand-primary leading-none">{user.name}</p>
            <p className="text-[10px] font-bold text-brand-accent uppercase tracking-widest mt-1">
              {user.role} Account
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center border border-brand-accent/20">
              <UserIcon className="w-6 h-6 text-brand-accent" />
            </div>
            
            <button 
              onClick={logout}
              className="p-2 text-brand-secondary hover:text-brand-danger hover:bg-red-50 rounded-xl transition-premium"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
