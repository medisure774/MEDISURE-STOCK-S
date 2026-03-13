"use client";

import React, { useState } from 'react';
import { apiRequest, API_URL } from '@/lib/api';
import { 
  FileUp, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileText,
  X,
  Database,
  RefreshCcw,
  PlusCircle,
  ChevronRight,
  Activity
} from 'lucide-react';

export default function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const token = localStorage.getItem('medisure_token');
      const response = await fetch(`${API_URL}/stock/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult({ success: true, count: data.count });
      setFile(null);
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-black text-brand-primary tracking-tight">Stock Synchronization</h1>
        <p className="text-brand-secondary text-xl">Upload your daily pharmaceutical inventory PDF for system-wide updates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Upload Section */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="bg-white rounded-[48px] p-12 shadow-premium border border-brand-border relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <FileText className="w-64 h-64 -rotate-12" />
            </div>

            <div 
              className={`border-4 border-dashed rounded-[32px] p-16 transition-premium flex flex-col items-center justify-center text-center relative z-10 ${
                file ? 'border-brand-accent bg-blue-50/30' : 'border-slate-200 bg-slate-50/50 hover:border-brand-accent hover:bg-white'
              }`}
            >
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                accept=".pdf" 
                onChange={handleFileChange} 
                title=""
              />

              {file ? (
                <div className="animate-in zoom-in-95 duration-300">
                  <div className="w-24 h-24 bg-brand-accent text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-brand-accent/30 mb-8 mx-auto rotate-3">
                    <FileText className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-black text-brand-primary mb-2">{file.name}</h3>
                  <div className="flex items-center justify-center space-x-3 text-sm font-bold text-brand-secondary">
                    <span className="bg-white px-3 py-1 rounded-full border border-brand-border">{(file.size / 1024).toFixed(2)} KB</span>
                    <span className="text-brand-accent">•</span>
                    <span className="bg-white px-3 py-1 rounded-full border border-brand-border uppercase tracking-widest">PDF Format</span>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.preventDefault(); setFile(null); }}
                    className="mt-10 flex items-center space-x-2 text-brand-danger hover:scale-105 transition-premium font-black text-sm uppercase tracking-widest"
                  >
                    <X className="w-5 h-5" />
                    <span>Cancel Selection</span>
                  </button>
                </div>
              ) : (
                <div className="group-hover:translate-y-[-4px] transition-premium">
                  <div className="w-24 h-24 bg-white text-brand-accent rounded-[24px] flex items-center justify-center mb-8 mx-auto shadow-sm border border-brand-border">
                    <Upload className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-black text-brand-primary mb-3">Drop Daily Stock List</h3>
                  <p className="text-brand-secondary font-medium max-w-sm mx-auto mb-10 text-lg">
                    Select your latest stock file to synchronize the central pharmacy warehouse.
                  </p>
                  
                  <div className="btn-primary py-4 px-10 text-lg font-black inline-flex items-center space-x-2">
                    <PlusCircle className="w-6 h-6" />
                    <span>Choose Local File</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`w-full mt-10 py-6 rounded-[24px] flex items-center justify-center space-x-4 text-2xl font-black transition-premium shadow-xl ${
                !file 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-brand-primary text-white hover:bg-brand-primary/90 shadow-brand-primary/20'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span>Parsing Medical Content...</span>
                </>
              ) : (
                <>
                  <FileUp className="w-8 h-8" />
                  <span>Execute Full Sync</span>
                </>
              )}
            </button>

            {result && (
              <div className={`mt-10 p-8 rounded-[32px] flex items-start space-x-6 animate-in slide-in-from-bottom-6 duration-500 border-2 ${
                result.success ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
              }`}>
                <div className={`p-3 rounded-2xl ${result.success ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                  {result.success ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>
                <div>
                  <h4 className={`text-xl font-black ${result.success ? 'text-emerald-900' : 'text-red-900'}`}>
                    {result.success ? 'Database Synchronized!' : 'Synchronization Error'}
                  </h4>
                  <p className={`text-lg mt-1 font-medium ${result.success ? 'text-emerald-700/80' : 'text-red-700/80'}`}>
                    {result.success 
                      ? `Successfully integrated ${result.count} medicine records. Live inventory is now updated.`
                      : result.error
                    }
                  </p>
                  {result.success && (
                    <button 
                       onClick={() => window.location.href = '/admin/orders'}
                       className="mt-6 text-emerald-800 font-black text-sm uppercase tracking-widest flex items-center space-x-2 hover:translate-x-1 transition-premium"
                    >
                        <span>Go to Dashboard</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Info Section */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[32px] p-8 shadow-premium border border-brand-border group hover:border-brand-accent/30 transition-premium">
            <div className="bg-blue-50 text-brand-accent p-4 rounded-2xl inline-block mb-6 group-hover:scale-110 transition-premium">
              <Database className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-brand-primary mb-3 leading-none">Atomic Updates</h3>
            <p className="text-brand-secondary font-medium leading-relaxed">
              Every upload triggers an atomic operation that <strong>replaces the entire inventory</strong> to ensure zero discrepancies between the PDF and the system.
            </p>
          </div>

          <div className="bg-white rounded-[32px] p-8 shadow-premium border border-brand-border group hover:border-brand-accent/30 transition-premium">
            <div className="bg-emerald-50 text-brand-success p-4 rounded-2xl inline-block mb-6 group-hover:scale-110 transition-premium">
              <RefreshCcw className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-brand-primary mb-3 leading-none">Instant Distribution</h3>
            <p className="text-brand-secondary font-medium leading-relaxed">
              Updates are broadcasted to all active terminals immediately. Staff members will receive real-time availability alerts upon successful sync.
            </p>
          </div>

          <div className="bg-brand-primary p-8 rounded-[32px] text-white shadow-xl shadow-brand-primary/20 relative overflow-hidden">
             <Activity className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10" />
             <h3 className="text-lg font-black mb-2 relative z-10">Data Integrity Tip</h3>
             <p className="text-blue-100 text-sm font-medium relative z-10">
               Ensure your PDF columns match the standard distribution format for accurate parsing.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
