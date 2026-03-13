"use client";

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  User, 
  Loader2,
  Search,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  role: string;
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New Employee Form State
  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    password: '',
    role: 'employee'
  });

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/auth/employees');
      setEmployees(data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest('/auth/add-employee', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setSuccess('Employee added successfully!');
      setFormData({
        employee_id: '',
        name: '',
        password: '',
        role: 'employee'
      });
      fetchEmployees();
      setTimeout(() => setIsModalOpen(false), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;

    try {
      await apiRequest(`/auth/employees/${id}`, {
        method: 'DELETE'
      });
      setEmployees(employees.filter(e => e.id !== id));
    } catch (err: any) {
      alert('Failed to delete employee: ' + err.message);
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-brand-primary tracking-tight">Personnel Directory</h1>
          <p className="text-brand-secondary text-lg">Administrate staff credentials and system access levels.</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center space-x-3 py-4 px-8 shadow-xl shadow-brand-accent/30 group"
        >
          <UserPlus className="w-6 h-6 group-hover:scale-110 transition-premium" />
          <span className="font-black">Provision New Staff</span>
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Registered Personnel', value: employees.length, icon: Users, bg: 'bg-blue-50', text: 'text-brand-accent' },
          { label: 'Administrative Level', value: employees.filter(e => e.role === 'admin').length, icon: Shield, bg: 'bg-indigo-50', text: 'text-indigo-600' },
          { label: 'Active Distribution Staff', value: employees.filter(e => e.role === 'employee').length, icon: User, bg: 'bg-emerald-50', text: 'text-brand-success' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-[24px] border border-brand-border shadow-premium flex items-center space-x-4 transition-premium hover:border-brand-accent/20">
            <div className={`${stat.bg} ${stat.text} p-3 rounded-2xl`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-brand-primary">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Utility Bar */}
      <div className="bg-white rounded-[24px] p-2 border border-brand-border shadow-premium flex items-center max-w-2xl">
        <div className="relative flex-grow group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-secondary group-focus-within:text-brand-accent transition-colors">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 w-full bg-transparent border-none focus:ring-0 text-sm font-bold placeholder-slate-400 py-4 shadow-none"
            placeholder="Search by personnel name or ID..."
          />
        </div>
      </div>

      {/* Personnel Table */}
      <div className="bg-white rounded-[32px] border border-brand-border shadow-premium overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-brand-border">
                <th className="px-8 py-5 text-xs font-black text-brand-secondary uppercase tracking-widest sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10">Staff Profile</th>
                <th className="px-6 py-5 text-xs font-black text-brand-secondary uppercase tracking-widest sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 text-center">Reference ID</th>
                <th className="px-6 py-5 text-xs font-black text-brand-secondary uppercase tracking-widest sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 text-center">Permissions</th>
                <th className="px-8 py-5 text-xs font-black text-brand-secondary uppercase tracking-widest sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 text-right">Operations</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && employees.length === 0 ? (
                <tr>
                   <td colSpan={4} className="py-32">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-12 h-12 text-brand-accent animate-spin mb-4" />
                      <p className="text-brand-secondary font-bold">Retrieving personnel registry...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-32">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="bg-brand-bg p-6 rounded-full mb-4">
                        <Users className="w-16 h-16 text-brand-secondary/30" />
                      </div>
                      <h3 className="text-2xl font-black text-brand-primary">No Personnel Found</h3>
                      <p className="text-brand-secondary mt-1">Refine your search parameters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, idx) => (
                  <tr 
                    key={emp.id} 
                    className={`group transition-colors border-b border-brand-border hover:bg-brand-bg/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/10'}`}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center border border-brand-border group-hover:scale-110 transition-premium shadow-sm">
                           <User className="w-6 h-6 text-brand-secondary" />
                        </div>
                        <div>
                           <p className="font-black text-brand-primary text-base leading-none">{emp.name}</p>
                           <p className="text-[10px] font-bold text-brand-accent uppercase tracking-widest mt-1.5">{emp.role} Level Access</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="font-black text-sm bg-brand-bg px-4 py-2 rounded-xl border border-brand-secondary/10 text-brand-secondary tracking-tighter">
                        {emp.employee_id}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">
                       <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white border border-brand-border shadow-sm">
                          <div className={`w-2 h-2 rounded-full ${emp.role === 'admin' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                          <span className={emp.role === 'admin' ? 'text-indigo-600' : 'text-emerald-600'}>{emp.role}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button 
                        onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                        className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-premium shadow-sm border border-red-100/50"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provisioning Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-primary/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-400 border border-white/50">
            <div className="p-10">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center space-x-4">
                  <div className="bg-brand-accent/10 p-4 rounded-[20px]">
                    <UserPlus className="w-8 h-8 text-brand-accent" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-brand-primary tracking-tight leading-none mb-1">Provision Staff</h2>
                    <p className="text-brand-secondary font-medium">Issue new credentials for medical personnel.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-12 h-12 bg-brand-bg rounded-[16px] flex items-center justify-center text-brand-secondary hover:bg-brand-danger hover:text-white transition-premium group"
                >
                  <X className="w-6 h-6 group-hover:rotate-180 transition-premium" />
                </button>
              </div>

              <form onSubmit={handleAddEmployee} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] ml-1">Staff ID Code</label>
                      <input 
                        type="text" 
                        required
                        placeholder="EMP-XXX"
                        value={formData.employee_id}
                        onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                        className="w-full"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] ml-1">Account Role</label>
                      <select 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full"
                      >
                        <option value="employee">Standard Personnel</option>
                        <option value="admin">Systems Administrator</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] ml-1">Full Legal Name</label>
                   <input 
                    type="text" 
                    required
                    placeholder="Enter personnel name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] ml-1">Secure Access Token</label>
                   <input 
                    type="password" 
                    required
                    placeholder="Define initial password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full"
                  />
                </div>

                {(error || success) && (
                   <div className={`p-6 rounded-[24px] border flex items-center space-x-4 animate-in slide-in-from-top-4 ${
                     success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                   }`}>
                      {success ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
                      <span className="font-black text-sm uppercase tracking-widest">{success || error}</span>
                   </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full btn-primary py-5 rounded-[24px] text-xl font-black shadow-xl shadow-brand-accent/30 flex items-center justify-center space-x-3 group active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-7 h-7 group-hover:scale-110 transition-premium" />
                      <span>Execute Provisioning</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
