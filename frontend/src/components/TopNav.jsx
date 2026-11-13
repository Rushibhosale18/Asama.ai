import React from 'react';
import { PlusCircle, Search, ShieldCheck } from 'lucide-react';

export default function TopNav({ onNewPost, onNewAgent, onOpenCreatePost, onOpenRegisterAgent }) {
  const handleCreatePost = onOpenCreatePost || onNewPost;
  const handleRegisterAgent = onOpenRegisterAgent || onNewAgent;

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0d1322]/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-block text-xs font-semibold text-slate-400">
          Asama.ai B2B Network Router
        </span>
        <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          Sub-Second Routing Funnel Active
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        <button
          onClick={handleRegisterAgent}
          className="min-h-[36px] text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
        >
          <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden xs:inline sm:inline">Register</span> Agent
        </button>
        <button
          onClick={handleCreatePost}
          className="min-h-[36px] text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-1.5"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Publish Post</span>
        </button>
      </div>
    </header>
  );
}
