import React from 'react';
import { Users, ShieldCheck } from 'lucide-react';

import defaultLogo from '../assets/logo.png';

interface LoginPageProps {
  onLogin: (e: React.FormEvent) => void;
  loginError: string | null;
  isLoggingIn: boolean;
  dbStatus: 'connected' | 'disconnected';
  barangayLogo: string;
}

export default function LoginPage({
  onLogin,
  loginError,
  isLoggingIn,
  dbStatus,
  barangayLogo,
}: LoginPageProps) {
  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex items-center justify-center p-4 selection:bg-primary selection:text-on-primary relative overflow-hidden">
      {/* Background Atmospheric Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-secondary/5 blur-[120px]"></div>
      </div>
      
      <main className="relative w-full max-w-md">
        {/* Login Container */}
        <div className="glass-panel glow-accent rounded-xl p-8 md:p-10 flex flex-col items-center">
          {/* Branding Header */}
          <div className="mb-8 text-center">
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center mb-1 mx-auto">
              {/* Outer CORUM Logo Frame */}
              <img 
                src={defaultLogo} 
                alt="CORUM Logo Frame" 
                className="w-full h-full object-contain z-10"
              />
              {/* Inner Barangay Logo Overlay */}
              {barangayLogo && barangayLogo !== defaultLogo && (
                <img 
                  src={barangayLogo} 
                  alt="Barangay Logo" 
                  className="absolute w-[44%] h-[44%] rounded-full object-cover z-0"
                  style={{
                    top: '28%',
                    left: '28%'
                  }}
                />
              )}
            </div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              CORUM
            </h1>
            <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant mt-2 font-semibold text-secondary">
              Youth Information System
            </p>
            <p className="text-[10px] italic text-on-surface-variant/70 mt-1 max-w-[280px] mx-auto">
              "Kabataang Magkakaugnay. Pamayanang Maunlad."
            </p>
          </div>



          {/* Login Form */}
          <form onSubmit={onLogin} className="w-full space-y-4">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg p-3 text-center">
                {loginError}
              </div>
            )}
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="font-label text-xs font-medium text-on-surface-variant px-1" htmlFor="identifier">
                Email or Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <input 
                  className="w-full bg-surface-container-highest border-none rounded-lg py-3 pl-10 pr-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/50 transition-all duration-200 font-body text-sm" 
                  id="identifier" 
                  name="identifier" 
                  required
                  placeholder="officer_id@sk.gov" 
                  type="text"
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="font-label text-xs font-medium text-on-surface-variant" htmlFor="password">
                  Security Passkey
                </label>
                <a className="font-label text-[11px] text-primary hover:text-primary-fixed-dim transition-colors" href="#">
                  Forgot Access?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input 
                  className="w-full bg-surface-container-highest border-none rounded-lg py-3 pl-10 pr-10 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/50 transition-all duration-200 font-body text-sm" 
                  id="password" 
                  name="password" 
                  required
                  placeholder="••••••••••••" 
                  type="password"
                />
              </div>
            </div>
            
            {/* Login Button */}
            <div className="pt-4">
              <button 
                className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-headline font-bold py-3.5 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50" 
                type="submit"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Verifying...' : 'Login'}
              </button>
            </div>
          </form>
          
          {/* Footer Compliance */}
          <div className="mt-8 pt-4 border-t border-outline-variant/10 w-full text-center">
            <p className="font-label text-[10px] text-on-surface-variant/60 leading-relaxed uppercase tracking-tighter">
              Authorized Personnel Only. <br/>
              Secure encrypted channel active.
            </p>
          </div>
        </div>
        
        {/* System Status Bar */}
        <div className="mt-6 flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            {dbStatus === 'connected' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-label text-[10px] text-on-surface-variant/40">Database: Connected</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span className="font-label text-[10px] text-on-surface-variant/40">Database: Not Connected</span>
              </>
            )}
          </div>
          <div className="flex gap-4">
            <a className="font-label text-[10px] text-on-surface-variant/40 hover:text-primary" href="#">Privacy Policy & Terms</a>
          </div>
        </div>
      </main>
    </div>
  );
}
