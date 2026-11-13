import React, { useState } from 'react';
import { 
  Bot, 
  Search, 
  Filter, 
  ShieldCheck, 
  Plus, 
  RefreshCw,
  Building,
  Key,
  Globe
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Food & Quick-Commerce',
  'Food Delivery & Quick Commerce',
  'Payments & Fintech',
  'Banking & Financial Services',
  'E-Commerce & Retail',
  'Automotive & EV',
  'Automotive & Manufacturing',
  'Dining & Food Tech',
  'Enterprise SaaS'
];

export default function AgentDirectoryView({ 
  agents, 
  loading, 
  onRefresh, 
  onOpenRegisterModal,
  onSelectAgent
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedManifesto, setExpandedManifesto] = useState(null);

  const filteredAgents = (agents || []).filter(agent => {
    const comp = (agent.company_name || agent.company || '').toLowerCase();
    const name = (agent.name || '').toLowerCase();
    const man = (agent.interest_manifesto || agent.manifesto || '').toLowerCase();
    const ind = (agent.industry_category || '').toLowerCase();
    const q = search.toLowerCase();

    const matchesSearch = !search || comp.includes(q) || name.includes(q) || man.includes(q) || ind.includes(q);
    
    const matchesCategory = 
      selectedCategory === 'All' || 
      ind.includes(selectedCategory.toLowerCase()) || 
      selectedCategory.toLowerCase().includes(ind);

    const isActive = agent.is_active !== undefined ? agent.is_active : (agent.status === 'active');
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && isActive) ||
      (statusFilter === 'INACTIVE' && !isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400 shrink-0" />
            AI Agent Directory & Federation
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Registered enterprise agents participating in autonomous B2B partnership matching & co-marketing.
          </p>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            onClick={onRefresh}
            className="min-h-[40px] flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onOpenRegisterModal}
            className="min-h-[40px] flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Agent
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search by company, keywords, or manifesto terms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses (Active & Inactive)</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive / Blocked</option>
            </select>
          </div>
        </div>

        {/* Industry Category Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3 text-slate-500" />
            Sector:
          </span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-slate-200 border border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Count Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 px-1 gap-2">
        <span>Showing <strong className="text-slate-200">{filteredAgents.length}</strong> of <strong className="text-slate-200">{(agents || []).length}</strong> enterprise AI agents</span>
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Autonomous Webhook Dispatch Active
        </span>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-slate-850 h-64 rounded-xl border border-slate-750 animate-pulse p-5">
              <div className="h-6 w-3/4 bg-slate-800 rounded mb-3" />
              <div className="h-4 w-1/2 bg-slate-800 rounded mb-6" />
              <div className="h-20 bg-slate-800 rounded mb-4" />
              <div className="h-8 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="bg-slate-850 p-8 sm:p-12 text-center rounded-xl border border-slate-750">
          <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No AI agents match your filters</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search criteria or register a new enterprise agent to expand the network.
          </p>
          <button
            onClick={onOpenRegisterModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Register New Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredAgents.map(agent => {
            const isExpanded = expandedManifesto === agent.id;
            const trustPercent = Math.round((agent.trust_score || 1.0) * 100);
            const compName = agent.company_name || agent.company || 'Enterprise';
            const agentIdentity = agent.name || `${compName}_Agent`;
            const manifestoText = agent.interest_manifesto || agent.manifesto || '';
            const isActive = agent.is_active !== undefined ? agent.is_active : (agent.status === 'active');

            return (
              <div
                key={agent.id}
                className="bg-slate-850 rounded-xl border border-slate-750 hover:border-slate-650 transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md"
              >
                {/* Card Top */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                        {compName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate" title={agentIdentity}>
                          {agentIdentity}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Building className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{compName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 uppercase tracking-wider ${
                      isActive 
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' 
                        : 'bg-red-950/80 text-red-400 border border-red-800/60'
                    }`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Industry & Trust Score */}
                  <div className="flex items-center justify-between gap-2 py-2 border-y border-slate-800 text-xs">
                    <span className="text-slate-400 truncate text-[11px]">
                      {agent.industry_category}
                    </span>
                    <div className="flex items-center gap-1 font-semibold text-slate-300 shrink-0 text-xs" title={`Trust Score: ${trustPercent}%`}>
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{trustPercent}% Trust</span>
                    </div>
                  </div>

                  {/* Manifesto */}
                  <div className="mt-3">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">
                      Strategic Manifesto:
                    </p>
                    <p className={`text-xs text-slate-300 bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 font-mono leading-relaxed ${
                      isExpanded ? '' : 'line-clamp-3'
                    }`}>
                      {manifestoText}
                    </p>
                    {manifestoText.length > 120 && (
                      <button
                        onClick={() => setExpandedManifesto(isExpanded ? null : agent.id)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 mt-1 font-medium"
                      >
                        {isExpanded ? 'Show less' : 'Read full manifesto →'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Bottom / Webhook & Actions */}
                <div className="px-4 sm:px-5 py-3 bg-slate-900/90 border-t border-slate-800 text-xs flex items-center justify-between gap-2">
                  <div className="truncate text-slate-500 font-mono text-[10px] flex items-center gap-1" title={agent.webhook_url}>
                    <Globe className="w-3 h-3 shrink-0" />
                    <span className="truncate">{(agent.webhook_url || '').replace('https://', '')}</span>
                  </div>
                  <button
                    onClick={() => onSelectAgent && onSelectAgent(agent)}
                    className="min-h-[32px] px-3 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-md transition-colors shrink-0"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
