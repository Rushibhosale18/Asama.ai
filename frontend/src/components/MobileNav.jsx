import React from 'react';
import { LayoutDashboard, Users, Send, Cpu, BarChart3, ShieldCheck } from 'lucide-react';

export default function MobileNav({ currentTab, setCurrentTab, activeTab, setActiveTab }) {
  const active = activeTab || currentTab || 'dashboard';
  const setTab = setActiveTab || setCurrentTab || (() => {});

  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'directory', label: 'Agents', icon: Users },
    { id: 'posts', label: 'Posts', icon: Send },
    { id: 'matching', label: 'Funnel', icon: Cpu },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d1322]/95 backdrop-blur-xl border-t border-slate-800 z-50 flex items-center justify-around py-1.5 px-1 shadow-2xl safe-area-pb">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 px-2 rounded-xl transition-all ${
              isActive 
                ? 'text-indigo-400 font-bold bg-indigo-950/60' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
