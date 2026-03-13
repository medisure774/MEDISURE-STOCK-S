"use client";

import React, { useState, useEffect } from 'react';
import { apiRequest, API_URL } from '@/lib/api';
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  User, 
  Package, 
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Search
} from 'lucide-react';

interface Order {
  id: string | number;
  employee_name: string;
  product_name: string;
  quantity: number | string;
  status: string;
  created_at: string;
  price: number | string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/orders');
      setOrders(data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string | number, newStatus: string) => {
    try {
      await apiRequest(`/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const filteredOrders = orders.filter(o => 
    (filterStatus === 'all' || o.status.toLowerCase() === filterStatus.toLowerCase()) &&
    (o.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     o.employee_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-brand-primary">Order Management</h1>
          <p className="text-brand-secondary mt-1">Review and process employee stock requests</p>
        </div>

        <div className="flex items-center space-x-3">
          <a 
            href={`${API_URL}/orders/export`} 
            target="_blank"
            className="btn-outline flex items-center space-x-2 py-2.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filters Card */}
      <div className="glass rounded-[32px] p-6 shadow-premium border border-white/40 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-secondary" />
            <input 
              type="text" 
              placeholder="Search by product or employee..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-brand-secondary" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-brand-accent animate-spin mb-4" />
            <p className="text-brand-secondary font-bold">Fetching latest orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-brand-border rounded-[32px] p-20 text-center">
            <ClipboardList className="w-16 h-16 text-brand-secondary/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-brand-primary">No orders found</h3>
            <p className="text-brand-secondary">Try changing your filters or search term.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="glass rounded-[24px] p-6 shadow-premium border border-white/40 group hover:border-brand-accent/30 transition-premium"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-brand-bg p-3 rounded-2xl">
                    <User className="w-6 h-6 text-brand-secondary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-brand-primary">{order.employee_name}</h3>
                    <p className="text-xs font-bold text-brand-secondary uppercase tracking-tighter">
                      Requested {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex-grow max-w-md">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-brand-accent" />
                    <span className="font-bold text-brand-primary text-lg">{order.product_name}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm font-bold text-brand-secondary mt-1">
                    <span>{order.quantity} Units</span>
                    <span>•</span>
                    <span className="text-brand-accent">₹{(Number(order.price) * Number(order.quantity)).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-right">Fulfillment</p>
                    <div className={`inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border shadow-sm ${
                      order.status.toLowerCase() === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      order.status.toLowerCase() === 'approved' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        order.status.toLowerCase() === 'completed' ? 'bg-emerald-500' :
                        order.status.toLowerCase() === 'approved' ? 'bg-blue-500' :
                        'bg-amber-500 animate-pulse'
                      }`}></div>
                      <span>{order.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {order.status.toLowerCase() === 'pending' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'approved')}
                        className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-premium shadow-sm border border-blue-100"
                        title="Approve Order"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    {(order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'approved') && (
                      <button 
                        onClick={() => updateStatus(order.id, 'completed')}
                        className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-premium shadow-sm border border-emerald-100"
                        title="Mark Completed"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                    <button className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-200 rounded-xl transition-premium border border-slate-200">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
