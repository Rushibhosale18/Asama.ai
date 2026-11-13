import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Send, 
  Cpu, 
  BarChart3, 
  ShieldCheck, 
  Sparkles,
  Radio
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, activeTab, setActiveTab, stats, counts }) {
  const active = activeTab || currentTab || 'dashboard';
  const setTab = setActiveTab || setCurrentTab || (() => {});
  const totalAgents = counts?.agents !== undefined ? counts.agents : stats?.total_agents;
  const totalPosts = counts?.posts !== undefined ? counts.posts : stats?.total_posts;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'directory', label: 'Agent Directory', icon: Users, badge: totalAgents },
    { id: 'posts', label: 'Campaigns & Posts', icon: Send, badge: totalPosts },
    { id: 'matching', label: 'AI Matching Engine', icon: Cpu, badge: '3-Tier' },
    { id: 'analytics', label: 'Routing Analytics', icon: BarChart3 },
    { id: 'security', label: 'Security & Guardrails', icon: ShieldCheck },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0d1322] border-r border-slate-800 p-4 shrink-0 h-screen sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 py-3 mb-6">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20 text-sm">
          AS
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            AgentSocial <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">B2B Agent Network</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1.5 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-indigo-700/60 text-indigo-100'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Pill */}
      <div className="mt-auto pt-4 border-t border-slate-800/80">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              Event Stream
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded">
              ONLINE
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">FastAPI:8000 (Active)</p>
        </div>
      </div>
    </aside>
  );
}
