"use client";

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

interface Order {
  id: string | number;
  product_name: string;
  quantity: number | string;
  status: string;
  created_at: string;
  price: number | string;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const data = await apiRequest('/orders');
        setOrders(data);
      } catch (err: any) {
        console.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyOrders();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-brand-primary tracking-tight">Access History</h1>
          <p className="text-brand-secondary text-lg">Monitor your pharmaceutical requisitions and fulfillment status.</p>
        </div>
        
        <div className="flex items-center space-x-4">
           <div className="bg-white p-4 rounded-[20px] border border-brand-border shadow-sm flex items-center space-x-3">
              <div className="bg-brand-accent/10 p-2 rounded-lg text-brand-accent">
                 <Package className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Orders</p>
                 <p className="text-lg font-black text-brand-primary">{orders.length}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[40px] border border-brand-border">
            <Loader2 className="w-16 h-16 text-brand-accent animate-spin mb-4" />
            <p className="text-brand-secondary font-black uppercase tracking-widest text-sm">Synchronizing your records...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-brand-border rounded-[40px] p-24 text-center shadow-premium">
            <div className="bg-brand-bg w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-brand-border">
              <Package className="w-12 h-12 text-brand-secondary/40" />
            </div>
            <h3 className="text-3xl font-black text-brand-primary tracking-tight">No Order History</h3>
            <p className="text-brand-secondary text-lg mt-2 max-w-sm mx-auto">Your medical requisition log is currently empty. Visit the stock list to initiate a request.</p>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="mt-8 btn-primary px-10 py-4 rounded-2xl text-lg font-black shadow-lg shadow-brand-accent/30"
            >
              Request Stock Now
            </button>
          </div>
        ) : (
          orders.map((order, idx) => (
            <div 
              key={order.id} 
              className="bg-white rounded-[32px] p-8 shadow-premium border border-brand-border flex flex-col md:flex-row md:items-center justify-between hover:border-brand-accent/30 transition-premium group relative overflow-hidden"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-center space-x-8">
                <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center shadow-inner-soft border transition-premium group-hover:scale-110 ${
                  order.status.toLowerCase() === 'completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' :
                  order.status.toLowerCase() === 'approved' ? 'bg-blue-50 border-blue-100 text-blue-500' :
                  'bg-amber-50 border-amber-100 text-amber-500'
                }`}>
                  {order.status.toLowerCase() === 'completed' ? (
                    <CheckCircle2 className="w-10 h-10" />
                  ) : order.status.toLowerCase() === 'approved' ? (
                    <Clock className="w-10 h-10" />
                  ) : (
                    <AlertCircle className="w-10 h-10" />
                  )}
                </div>
                
                <div className="space-y-2">
                   <div className="flex items-center space-x-3">
                      <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest bg-brand-accent/5 px-2 py-0.5 rounded border border-brand-accent/10">#{order.id.toString().slice(-6)}</span>
                      <span className="text-xs font-bold text-brand-secondary">REC: {new Date(order.created_at).toLocaleString()}</span>
                   </div>
                   <h3 className="text-2xl font-black text-brand-primary tracking-tight leading-none">{order.product_name}</h3>
                   <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1.5 text-sm font-bold text-brand-secondary">
                        <Package className="w-4 h-4" />
                        <span>{order.quantity} Units</span>
                      </div>
                      <span className="text-slate-300">|</span>
                      <div className="text-brand-accent font-black text-base">₹{(Number(order.price) * Number(order.quantity)).toFixed(2)}</div>
                   </div>
                </div>
              </div>

              <div className="flex items-center space-x-10 mt-6 md:mt-0">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fulfillment</p>
                  <div className={`inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border shadow-sm ${
                    order.status.toLowerCase() === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    order.status.toLowerCase() === 'approved' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      order.status.toLowerCase() === 'completed' ? 'bg-emerald-500' :
                      order.status.toLowerCase() === 'approved' ? 'bg-blue-500' :
                      'bg-amber-500 animation-pulse'
                    }`}></div>
                    <span>{order.status}</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-secondary group-hover:bg-brand-accent group-hover:text-white transition-premium border border-brand-border group-hover:border-transparent">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
