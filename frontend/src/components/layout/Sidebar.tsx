"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  ClipboardList, 
  PlusCircle, 
  Users, 
  Package,
  Activity,
  History
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const navItems = isAdmin 
    ? [
        { label: 'Dashboard', href: '/admin/orders', icon: LayoutDashboard },
        { label: 'Upload Stock', href: '/admin/upload', icon: PlusCircle },
        { label: 'Employees', href: '/admin/employees', icon: Users },
      ]
    : [
        { label: 'Stock List', href: '/dashboard', icon: Package },
        { label: 'My Orders', href: '/orders', icon: History },
      ];

  return (
    <aside className="w-72 bg-white border-r border-brand-border flex flex-col h-screen sticky top-0 z-40">
      <div className="p-8">
        <div className="flex items-center space-x-3 mb-10">
          <div className="bg-brand-accent/10 p-2 rounded-xl">
            <Activity className="w-8 h-8 text-brand-accent" />
          </div>
          <div>
            <span className="text-xl font-black text-brand-primary block leading-tight">Medisure</span>
            <span className="text-sm font-bold text-brand-accent tracking-widest uppercase">Plus</span>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="bg-brand-bg rounded-2xl p-4 border border-brand-border">
          <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest mb-1">System Status</p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-brand-success rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-brand-primary">All Systems Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
