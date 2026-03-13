"use client";

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { 
  Search, 
  Package, 
  ShoppingCart, 
  AlertCircle,
  Loader2,
  Filter,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  X
} from 'lucide-react';

interface Medicine {
  id: string | number;
  product_name: string;
  quantity: number | string;
  price: number | string;
  company: string;
  pack_size: string;
  status: string;
}

export default function StockDashboard() {
  const [stock, setStock] = useState<Medicine[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOrdering, setIsOrdering] = useState<Medicine | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const fetchStock = async (searchTerm = '') => {
    setIsLoading(true);
    try {
      const data = await apiRequest(`/stock?search=${searchTerm}`);
      setStock(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStock(search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handlePlaceOrder = async () => {
    if (!isOrdering) return;
    setIsSubmittingOrder(true);
    try {
      await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: [{
            product_name: isOrdering.product_name,
            company: isOrdering.company,
            pack_size: isOrdering.pack_size,
            price: isOrdering.price,
            qty_requested: orderQty
          }],
          notes: ''
        })
      });
      setOrderSuccess(true);
      setTimeout(() => {
        setIsOrdering(null);
        setOrderSuccess(false);
        setOrderQty(1);
      }, 2000);
    } catch (err: any) {
      alert('Order failed: ' + err.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-brand-primary tracking-tight">Medicine Stock</h1>
          <p className="text-brand-secondary text-lg">Browse, search, and request pharmaceutical inventory.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none group-focus-within:text-brand-accent transition-colors">
              <Search className="h-5 w-5 text-brand-secondary" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 w-full text-sm font-medium"
              placeholder="Search by name, company..."
            />
          </div>
          <button 
            onClick={() => fetchStock(search)}
            className="p-3 bg-white border border-brand-border rounded-xl hover:bg-brand-bg transition-premium text-brand-secondary hover:text-brand-accent shadow-sm"
            title="Refresh Stock"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-brand-border shadow-premium flex items-center space-x-4">
          <div className="bg-blue-50 p-3 rounded-2xl text-brand-accent">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-secondary uppercase tracking-widest leading-none mb-1">Total Items</p>
            <p className="text-2xl font-black text-brand-primary">{stock.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-brand-border shadow-premium flex items-center space-x-4 text-brand-success">
          <div className="bg-emerald-50 p-3 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Available</p>
            <p className="text-2xl font-black text-brand-primary">
              {stock.filter(s => Number(s.quantity) > 0).length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-brand-border shadow-premium flex items-center space-x-4 text-brand-warning">
          <div className="bg-amber-50 p-3 rounded-2xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Low Stock</p>
            <p className="text-2xl font-black text-brand-primary">
              {stock.filter(s => Number(s.quantity) > 0 && Number(s.quantity) <= 10).length}
            </p>
          </div>
        </div>
      </div>

      {/* Stock Table Section */}
      <div className="bg-white rounded-[32px] border border-brand-border shadow-premium overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead className="hidden lg:table-header-group">
              <tr className="bg-slate-50/50 border-b border-brand-border">
                <th className="px-8 py-5 text-xs font-black text-brand-secondary uppercase tracking-widest sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10">Product Details</th>
                <th className="px-6 py-5 text-xs font-black text-brand-secondary uppercase tracking-widest sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 text-center">Company</th>
                <th className="px-6 py-5 text-xs font-black text-brand-secondary uppercase tracking-widest sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 text-center">Price</th>
                <th className="px-6 py-5 text-xs font-black text-brand-secondary uppercase tracking-widest sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 text-center">Status</th>
                <th className="px-8 py-5 text-xs font-black text-brand-secondary uppercase tracking-widest sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && stock.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-12 h-12 text-brand-accent animate-spin mb-4" />
                      <p className="text-brand-secondary font-bold">Synchronizing medical data...</p>
                    </div>
                  </td>
                </tr>
              ) : stock.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="bg-brand-bg p-6 rounded-full mb-4">
                        <Package className="w-16 h-16 text-brand-secondary/30" />
                      </div>
                      <h3 className="text-2xl font-black text-brand-primary">No Inventory Found</h3>
                      <p className="text-brand-secondary mt-1">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                stock.map((item, idx) => (
                  <tr 
                    key={item.id} 
                    className={`flex flex-col lg:table-row transition-colors border-b border-brand-border hover:bg-brand-bg/50 px-4 py-6 lg:px-0 lg:py-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/10'} relative group`}
                  >
                    <td className="lg:px-8 lg:py-6 p-0 mb-4 lg:mb-0">
                      <div className="flex items-center space-x-4">
                        <div className="bg-brand-bg w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-brand-accent border border-brand-border group-hover:scale-110 transition-premium">
                          {item.product_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-brand-primary text-base lg:text-lg line-clamp-1">{item.product_name}</p>
                          <p className="text-xs font-bold text-brand-secondary uppercase">{item.pack_size || 'Standard Pack'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="lg:px-6 lg:py-6 lg:text-center text-left mb-2 lg:mb-0">
                      <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Company</span>
                      <span className="text-sm font-bold text-brand-secondary">{item.company || 'N/A'}</span>
                    </td>
                    <td className="lg:px-6 lg:py-6 lg:text-center text-left mb-4 lg:mb-0">
                      <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Price</span>
                      <span className="font-black text-brand-primary text-lg lg:text-base">₹{Number(item.price)?.toFixed(2) || '0.00'}</span>
                    </td>
                    <td className="lg:px-6 lg:py-6 lg:text-center text-left mb-6 lg:mb-0">
                      <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Inventory status</span>
                      <div className="flex flex-col">
                        <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-tighter w-fit flex items-center space-x-1.5 ${
                          Number(item.quantity) > 10 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : Number(item.quantity) > 0 
                              ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                              : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${Number(item.quantity) > 10 ? 'bg-emerald-500' : Number(item.quantity) > 0 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                          <span>{Number(item.quantity) > 0 ? `${item.quantity} Units` : 'Out of Stock'}</span>
                        </span>
                      </div>
                    </td>
                    <td className="lg:px-8 lg:py-6 p-0 text-right lg:static mt-auto">
                      <button 
                        onClick={() => setIsOrdering(item)}
                        disabled={Number(item.quantity) <= 0}
                        className={`w-full lg:w-auto inline-flex items-center justify-center space-x-2 px-6 py-4 lg:py-3 rounded-2xl font-black text-sm lg:text-xs transition-premium shadow-lg lg:shadow-md ${
                          Number(item.quantity) > 0 
                            ? 'bg-brand-accent text-white hover:bg-brand-accent/90 shadow-brand-accent/20' 
                            : 'bg-brand-bg text-brand-secondary cursor-not-allowed border border-brand-border shadow-none'
                        }`}
                      >
                        <ShoppingCart className="w-5 h-5 lg:w-4 lg:h-4 mr-1" />
                        <span>Place Order</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Modal - Enhanced */}
      {isOrdering && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-primary/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-400 border border-white/50">
            <div className="p-10">
              {orderSuccess ? (
                <div className="text-center py-12 animate-in slide-in-from-top-4 duration-500">
                  <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-lg">
                    <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                  </div>
                  <h3 className="text-3xl font-black text-brand-primary leading-none mb-3">Order Confirmed!</h3>
                  <p className="text-brand-secondary text-lg">Your pharmaceutical request has been initiated.</p>
                  <p className="text-xs font-bold text-brand-accent uppercase tracking-widest mt-6">Redirecting to inventory...</p>
                </div>
              ) : (
                <div className="space-y-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-3xl font-black text-brand-primary tracking-tight mb-2">Initialize Order</h3>
                      <p className="text-brand-secondary font-medium">Verify your pharmaceutical request details.</p>
                    </div>
                    <button 
                      onClick={() => setIsOrdering(null)}
                      className="w-12 h-12 bg-brand-bg rounded-2xl flex items-center justify-center text-brand-secondary hover:bg-brand-danger hover:text-white transition-premium group"
                    >
                      <X className="w-6 h-6 group-hover:rotate-180 transition-premium" />
                    </button>
                  </div>

                  <div className="bg-brand-bg/80 border border-brand-border rounded-[28px] p-6 space-y-4 shadow-inner-soft">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-brand-border shadow-sm">
                        <Package className="w-8 h-8 text-brand-accent" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-brand-secondary uppercase tracking-widest leading-none mb-1">Medicine</p>
                        <p className="text-xl font-black text-brand-primary leading-tight">{isOrdering.product_name}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 h-16">
                      <div className="bg-white/50 rounded-2xl p-3 border border-brand-border/30">
                        <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest">Company</p>
                        <p className="text-sm font-bold text-brand-primary">{isOrdering.company || 'N/A'}</p>
                      </div>
                      <div className="bg-white/50 rounded-2xl p-3 border border-brand-border/30">
                        <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest">Rate</p>
                        <p className="text-sm font-black text-brand-accent">₹{Number(isOrdering.price).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <label className="text-lg font-black text-brand-primary">Set Order Quantity</label>
                       <span className="text-xs font-bold text-brand-secondary">MAX {isOrdering.quantity} AVAILABLE</span>
                    </div>

                    <div className="flex items-center space-x-8">
                       <div className="flex-grow flex items-center justify-between bg-brand-bg border border-brand-border rounded-[24px] p-2 h-20 shadow-inner-soft">
                          <button 
                            onClick={() => setOrderQty(Math.max(1, orderQty - 1))}
                            className="w-14 h-14 bg-white hover:bg-brand-danger hover:text-white rounded-2xl flex items-center justify-center shadow-sm text-2xl font-black text-brand-primary transition-premium"
                          >-</button>
                          <input 
                            type="number" 
                            value={orderQty}
                            readOnly
                            className="w-24 text-center bg-transparent border-none text-3xl font-black text-brand-primary"
                          />
                          <button 
                            onClick={() => setOrderQty(Math.min(Number(isOrdering.quantity), orderQty + 1))}
                            className="w-14 h-14 bg-white hover:bg-brand-success hover:text-white rounded-2xl flex items-center justify-center shadow-sm text-2xl font-black text-brand-primary transition-premium"
                          >+</button>
                       </div>

                       <div className="text-right min-w-32">
                          <p className="text-xs font-bold text-brand-secondary uppercase tracking-widest mb-1">Final Total</p>
                          <p className="text-3xl font-black text-brand-accent">₹{(Number(isOrdering.price) * orderQty).toFixed(2)}</p>
                       </div>
                    </div>
                  </div>

                  <button 
                    onClick={handlePlaceOrder}
                    disabled={isSubmittingOrder}
                    className="w-full btn-primary py-5 rounded-[24px] text-xl font-black flex items-center justify-center space-x-3 shadow-xl shadow-brand-accent/30 hover:shadow-brand-accent/50 group"
                  >
                    {isSubmittingOrder ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-7 h-7 group-hover:scale-110 transition-premium" />
                        <span>Place Official Order</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
