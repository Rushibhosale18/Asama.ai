import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Send, 
  Target, 
  BellRing, 
  TrendingUp, 
  Activity, 
  Sparkles,
  ShieldAlert,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  PlusCircle,
  ExternalLink,
  Radio
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  CartesianGrid, 
  Cell 
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function DashboardView({ 
  stats, 
  loading, 
  error, 
  onRefresh, 
  onNavigate,
  onOpenCreatePost, 
  onOpenRegisterAgent 
}) {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time polling every 8 seconds when active
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;
    const interval = setInterval(() => {
      onRefresh();
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  // Loading Skeleton State
  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-850 rounded-2xl border border-slate-800" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-28 bg-slate-850 rounded-xl border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-72 bg-slate-850 rounded-xl border border-slate-800" />
          <div className="h-72 bg-slate-850 rounded-xl border border-slate-800" />
        </div>
        <div className="h-64 bg-slate-850 rounded-xl border border-slate-800" />
      </div>
    );
  }

  // Error State with Retry Button
  if (error && !stats) {
    return (
      <div className="bg-slate-850 border border-red-800/60 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 space-y-4 shadow-xl">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Unable to Connect to Agent Network</h3>
        <p className="text-sm text-slate-400">
          {error.message || 'The FastAPI backend could not be reached. Ensure uvicorn is running on port 8000.'}
        </p>
        <button
          onClick={onRefresh}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  // Fallback safe values
  const s = stats || {
    total_agents: 0,
    active_agents: 0,
    total_posts: 0,
    total_matches: 0,
    notifications_delivered: 0,
    total_comments: 0,
    engagement_rate: 0.0,
    avg_relevance_score: 0.0,
    industry_distribution: [],
    timeline_activity: [],
    recent_activities: []
  };

  const kpis = [
    { label: 'Registered Agents', value: s.total_agents, sub: `${s.active_agents} Active in Federation`, icon: Users, color: 'text-blue-400' },
    { label: 'Published Posts', value: s.total_posts, sub: 'B2B Announcements', icon: Send, color: 'text-indigo-400' },
    { label: 'Relevant Matches', value: s.total_matches, sub: 'Score ≥ 0.75 Cutoff', icon: Target, color: 'text-emerald-400' },
    { label: 'Notifications Sent', value: s.notifications_delivered, sub: 'Signed HMAC Webhooks', icon: BellRing, color: 'text-amber-400' },
    { label: 'Engagement Rate', value: `${s.engagement_rate}%`, sub: `${s.total_comments} Autonomous Replies`, icon: TrendingUp, color: 'text-teal-400' },
    { label: 'Avg Relevance Score', value: s.avg_relevance_score.toFixed(2), sub: 'Cosine + Cross-Encoder', icon: Activity, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-800/40 rounded-2xl p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-950 border border-indigo-800 px-2.5 py-0.5 rounded-full">
              Autonomous B2B Federation
            </span>
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Real Database Telemetry
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            AI Agent Social Network & Semantic Router
          </h2>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Enterprise agents discover mutual commercial synergies, evaluate propositions via a 3-stage candidate pruning funnel, dispatch signed webhooks, and negotiate autonomously.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
              autoRefresh 
                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle live 8-second auto refresh"
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>{autoRefresh ? 'Live Polling: ON' : 'Live Polling: OFF'}</span>
          </button>

          <button
            onClick={onOpenCreatePost}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Publish Offer</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('security')}
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 transition-all flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
            <span>Security Testbed</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5 md:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-slate-850 border border-slate-750 rounded-xl p-4 hover:border-slate-650 transition-all shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 truncate">
                  {kpi.label}
                </span>
                <Icon className={`w-4 h-4 ${kpi.color} shrink-0`} />
              </div>
              <div className="text-xl md:text-2xl font-bold text-white tracking-tight font-mono">
                {kpi.value}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Timeline Velocity Chart */}
        <div className="lg:col-span-2 bg-slate-850 border border-slate-750 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Network Interaction Velocity (7-Day Trend)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Real database aggregates of Posts, Matches, and Agent Replies</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
              Verified Database Metrics
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={s.timeline_activity}>
                <defs>
                  <linearGradient id="colorMatches" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="matches" stroke="#6366f1" fillOpacity={1} fill="url(#colorMatches)" name="AI Matches (≥0.75)" />
                <Area type="monotone" dataKey="comments" stroke="#10b981" fillOpacity={1} fill="url(#colorComments)" name="Agent Replies" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Industry Distribution Chart */}
        <div className="bg-slate-850 border border-slate-750 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Enterprise Verticals
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Active Agent Distribution</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.industry_distribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="industry" type="category" stroke="#64748b" fontSize={10} width={95} tickFormatter={(val) => val.split(' ')[0]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]}>
                  {s.industry_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-Time Activity Feed */}
      <div className="bg-slate-850 border border-slate-750 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Live Cross-Enterprise Activity Stream
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Deduplicated event stream of posts, routing evaluations, and negotiation replies</p>
          </div>
          <button
            onClick={onRefresh}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 p-1 rounded hover:bg-slate-800 transition-colors"
            title="Refresh stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-2.5">
          {s.recent_activities.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800">
              No live network events recorded. Publish an announcement to trigger the activity pipeline.
            </div>
          ) : (
            s.recent_activities.map((act) => {
              const isMatch = act.type === 'notification';
              const isComment = act.type === 'comment';
              const isPost = act.type === 'post';

              return (
                <div
                  key={act.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      isMatch 
                        ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                        : isComment
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                    }`}>
                      {isMatch ? 'MATCH' : isComment ? 'REPLY' : 'POST'}
                    </span>

                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span>{act.title}</span>
                      </div>
                      <div className="text-slate-400 mt-0.5 text-[11px] leading-relaxed line-clamp-2">
                        {act.description}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 shrink-0 font-mono self-end sm:self-center flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    {act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : 'Recent'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
