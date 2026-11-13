import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Activity,
  Filter,
  Clock
} from 'lucide-react';
import { api } from '../services/api';

export default function RoutingAnalyticsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getRoutingLogs(statusFilter, search);
      const list = Array.isArray(data) ? data : (data.logs || []);
      setLogs(list);
    } catch (err) {
      console.error('Failed to load routing logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    const pid = (log.post_id || '').toLowerCase();
    const tid = (log.target_agent_id || log.agent_id || '').toLowerCase();
    const ptitle = (log.post_title || '').toLowerCase();
    const tcomp = (log.target_company || '').toLowerCase();
    const acomp = (log.author_company || '').toLowerCase();
    const rat = (log.rationale || log.explanation || '').toLowerCase();
    return pid.includes(q) || tid.includes(q) || ptitle.includes(q) || tcomp.includes(q) || acomp.includes(q) || rat.includes(q);
  });

  const total = logs.length;
  const notified = logs.filter(l => l.status === 'NOTIFIED' || l.status === 'ENGAGED').length;
  const engaged = logs.filter(l => l.status === 'ENGAGED').length;
  const conversionRate = notified > 0 ? ((engaged / notified) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400 shrink-0" />
            Routing Telemetry & Delivery Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time telemetry of autonomous webhook notifications, HMAC signatures, and cross-enterprise engagements.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="min-h-[40px] flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Telemetry
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Candidate Pairs</span>
          <div className="text-xl sm:text-2xl font-bold text-slate-100 mt-1 font-mono">{total}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Evaluated through 3 stages</span>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750">
          <span className="text-[11px] text-emerald-400 font-medium uppercase tracking-wider block">Notified (Score ≥ 0.75)</span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1 font-mono">{notified}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Signed webhooks dispatched</span>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750">
          <span className="text-[11px] text-indigo-400 font-medium uppercase tracking-wider block">Engaged Responses</span>
          <div className="text-xl sm:text-2xl font-bold text-indigo-400 mt-1 font-mono">{engaged}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Autonomous counter-offers</span>
        </div>

        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750">
          <span className="text-[11px] text-purple-400 font-medium uppercase tracking-wider block">Conversion Rate</span>
          <div className="text-xl sm:text-2xl font-bold text-purple-400 mt-1 font-mono">{conversionRate}%</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Notification-to-Response</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search telemetry by company, Post ID, or explanation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="sm:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Delivery Statuses</option>
            <option value="ENGAGED">ENGAGED (Responded)</option>
            <option value="NOTIFIED">NOTIFIED (Dispatched)</option>
            <option value="DROPPED">DROPPED (Below 0.75)</option>
          </select>
        </div>
      </div>

      {/* Telemetry Table Container */}
      <div className="bg-slate-850 rounded-xl border border-slate-750 overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-750 text-slate-400 text-[11px] uppercase font-mono tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Partnership Pair</th>
                <th className="py-3 px-4">Stage 2 (Vector)</th>
                <th className="py-3 px-4">Stage 3 (Rerank)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">AI Matching Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading routing telemetry...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 text-xs">
                    No routing telemetry found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isEngaged = log.status === 'ENGAGED';
                  const isNotified = log.status === 'NOTIFIED';
                  const isDropped = log.status === 'DROPPED';
                  const rationale = log.rationale || log.explanation || '';
                  const targetCompany = log.target_company || (log.target_agent_id ? log.target_agent_id.slice(0, 10) : 'Target');
                  const authorCompany = log.author_company || 'Publisher';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap text-[11px]">
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'N/A'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">
                          {authorCompany} → {targetCompany}
                        </div>
                        <div className="font-mono text-slate-500 text-[10px] truncate max-w-xs" title={log.post_title}>
                          "{log.post_title || log.post_id}"
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-indigo-400">
                        {(log.vector_score || 0).toFixed(4)}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold">
                        <span className={(log.rerank_score || 0) >= 0.75 ? 'text-emerald-400' : 'text-amber-400'}>
                          {(log.rerank_score || 0).toFixed(4)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                          isEngaged 
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : isNotified
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {isEngaged && <CheckCircle2 className="w-3 h-3" />}
                          {isNotified && <Activity className="w-3 h-3" />}
                          {isDropped && <XCircle className="w-3 h-3" />}
                          {log.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300 max-w-xs sm:max-w-md truncate text-[11px]" title={rationale}>
                        {rationale}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
