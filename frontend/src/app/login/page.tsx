"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import { 
  LogIn, 
  Lock, 
  User, 
  Activity, 
  AlertCircle, 
  Loader2,
  ArrowRight 
} from 'lucide-react';

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // In a real scenario, this matches the backend URL
      // We'll use a local fetch or a mock for now
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-[#0a0f1d]">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-accent/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-24 relative z-10">
        
        {/* Left: Branding & Value Prop */}
        <div className="flex-1 space-y-12 text-center lg:text-left">
           <div className="flex items-center justify-center lg:justify-start space-x-4 mb-2">
              <div className="bg-brand-accent p-3 rounded-2xl shadow-xl shadow-brand-accent/40 animate-bounce">
                <Activity className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">Medisure <span className="text-brand-accent italic">Plus</span></h1>
           </div>

           <div className="space-y-6">
              <h2 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tighter">
                Precision <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-emerald-400">
                  Inventory
                </span> <br />
                Solutions.
              </h2>
              <p className="text-slate-400 text-xl font-medium max-w-lg mx-auto lg:mx-0">
                The leading edge in pharmaceutical distribution management. Fast, reliable, and secure.
              </p>
           </div>

           <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto lg:mx-0">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl text-center">
                 <p className="text-brand-accent text-2xl font-black">10K+</p>
                 <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Daily SKU's</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl text-center">
                 <p className="text-emerald-400 text-2xl font-black">99.9%</p>
                 <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Accuracy</p>
              </div>
           </div>
        </div>

        {/* Right: Login Card */}
        <div className="w-full lg:w-[480px]">
          <div className="glass rounded-[48px] p-12 shadow-2xl border border-white/10 relative overflow-hidden group animate-in slide-in-from-right-12 duration-700">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-accent via-blue-400 to-emerald-500"></div>
            
            <div className="mb-12">
              <h3 className="text-3xl font-black text-brand-primary dark:text-white mb-2 tracking-tight">Access Terminal</h3>
              <p className="text-brand-secondary font-medium">Verify credentials to synchronize data.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center space-x-3 text-red-400 animate-in shake duration-500">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-bold">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div className="group space-y-2">
                  <label className="text-xs font-black text-brand-secondary uppercase tracking-[0.2em] ml-1">Personnel ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-secondary group-focus-within:text-brand-accent transition-colors">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      className="w-full bg-slate-900/40 border-slate-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:ring-4 focus:ring-brand-accent/20 focus:border-brand-accent transition-premium placeholder-slate-600"
                      placeholder="Enter Employee ID"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="group space-y-2">
                  <label className="text-xs font-black text-brand-secondary uppercase tracking-[0.2em] ml-1">Access Token</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-secondary group-focus-within:text-brand-accent transition-colors">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      className="w-full bg-slate-900/40 border-slate-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:ring-4 focus:ring-brand-accent/20 focus:border-brand-accent transition-premium placeholder-slate-600"
                      placeholder="Enter Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center space-x-2 cursor-pointer group">
                   <div className="w-5 h-5 rounded-md border border-slate-700 bg-slate-800 group-hover:border-brand-accent transition-premium"></div>
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Remember Terminal</span>
                </label>
                <a href="#" className="text-xs font-bold text-brand-accent uppercase tracking-widest hover:underline">Support?</a>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white py-5 rounded-3xl text-xl font-black shadow-xl shadow-brand-accent/30 hover:shadow-brand-accent/50 transition-premium flex items-center justify-center space-x-3 group active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <span>Initialize Session</span>
                    <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-premium" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 text-center">
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                 Restricted Medical Access System
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
