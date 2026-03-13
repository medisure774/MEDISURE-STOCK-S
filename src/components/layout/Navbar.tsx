"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  PlusCircle, 
  LayoutDashboard, 
  ClipboardList, 
  LogOut, 
  User, 
  Activity, 
  Package,
  Users
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const navItems = isAdmin 
    ? [
        { label: 'Orders', href: '/admin/orders', icon: ClipboardList },
        { label: 'Upload Stock', href: '/admin/upload', icon: PlusCircle },
        { label: 'Employees', href: '/admin/employees', icon: Users },
      ]
    : [
        { label: 'Stock List', href: '/dashboard', icon: LayoutDashboard },
        { label: 'My Orders', href: '/orders', icon: Package },
      ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-brand-border px-4 py-3 shadow-premium">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-8 h-8 text-brand-accent animate-pulse" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-accent">
            Medisure Plus
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center space-x-1.5 font-medium transition-premium hover:text-brand-accent ${
                  isActive ? 'text-brand-accent translate-y-[-1px]' : 'text-brand-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-brand-bg rounded-full border border-brand-border md:flex hidden">
            <User className="w-4 h-4 text-brand-secondary" />
            <span className="text-xs font-semibold text-brand-primary">{user.name}</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 bg-brand-accent/10 text-brand-accent rounded font-bold">
              {user.role}
            </span>
          </div>

          <button 
            onClick={logout}
            className="p-2 text-brand-secondary hover:text-red-500 transition-premium hover:rotate-12"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
