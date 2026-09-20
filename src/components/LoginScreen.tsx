import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, AlertCircle, Heart } from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter your secure access code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      });
      const data = await res.json();

      if (data.success && data.user) {
        onLogin(data.user);
      } else {
        setError('Access Denied. Invalid security code.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 mb-4 text-white">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Private Secure Portal</h1>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sahiti & Ajazzz Encrypted Channel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
              Enter Access Code
            </label>
            <input
              type="password"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-700"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Secure Chat</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
            Strictly private • Sahiti <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Ajazzz
          </p>
        </div>
      </div>
    </div>
  );
}
