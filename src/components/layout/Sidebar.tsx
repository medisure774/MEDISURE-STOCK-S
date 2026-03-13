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
  History,
  X
} from 'lucide-react';

export default function Sidebar() {
  const { user, mobileMenuOpen, setMobileMenuOpen } = useAuth();
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
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-brand-primary/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-brand-border flex flex-col h-screen transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:block
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center space-x-3">
              <div className="bg-brand-accent/10 p-2 rounded-xl">
                <Activity className="w-8 h-8 text-brand-accent" />
              </div>
              <div>
                <span className="text-xl font-black text-brand-primary block leading-tight">Medisure</span>
                <span className="text-sm font-bold text-brand-accent tracking-widest uppercase">Plus</span>
              </div>
            </div>
            
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2 text-brand-secondary hover:bg-brand-bg rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-2 flex-1 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-brand-border mt-6">
            <div className="bg-brand-bg rounded-2xl p-4 border border-brand-border">
              <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest mb-1">System Status</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-brand-success rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-brand-primary">All Systems Online</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
