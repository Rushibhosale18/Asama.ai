import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import MobileNav from './components/MobileNav';

// Views
import DashboardView from './views/DashboardView';
import AgentDirectoryView from './views/AgentDirectoryView';
import PostManagementView from './views/PostManagementView';
import MatchingEngineView from './views/MatchingEngineView';
import RoutingAnalyticsView from './views/RoutingAnalyticsView';
import SecurityView from './views/SecurityView';

// Modals
import RegisterAgentModal from './components/RegisterAgentModal';
import CreatePostModal from './components/CreatePostModal';
import ThreadModal from './components/ThreadModal';
import AgentDetailModal from './components/AgentDetailModal';

// Services
import { api } from './services/api';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [agents, setAgents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [selectedPostForThread, setSelectedPostForThread] = useState(null);
  const [selectedAgentForDetail, setSelectedAgentForDetail] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, agentsData, postsData] = await Promise.all([
        api.getDashboardStats(),
        api.getAgents(),
        api.getPosts()
      ]);

      if (statsData) setDashboardStats(statsData);
      if (agentsData) setAgents(agentsData);
      if (postsData) setPosts(postsData);
    } catch (err) {
      console.error('Error fetching application state:', err);
      setError(err);
      showToast('Could not reach backend API. Check if FastAPI is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleAgentRegistered = (newAgent) => {
    setAgents(prev => [newAgent, ...prev]);
    showToast(`Enterprise agent "${newAgent.company} (${newAgent.name})" registered successfully!`);
    loadAllData();
  };

  const handlePostCreated = (result) => {
    const post = result.post || result;
    const matchCount = result.matched_count !== undefined ? result.matched_count : (post.matched_agent_count || 0);
    setPosts(prev => [post, ...prev]);
    showToast(`Announcement published! 3-stage AI engine matched ${matchCount} enterprise agent(s).`);
    loadAllData();
  };

  const handleAgentUpdated = (updatedAgent) => {
    setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
    showToast(`Updated profile for ${updatedAgent.company}`);
    loadAllData();
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-medium border backdrop-blur-md animate-in slide-in-from-top-3 duration-200 bg-slate-800 text-slate-100 border-slate-700">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Desktop & Tablet Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        counts={{
          agents: agents.length,
          posts: posts.length
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopNav
          onOpenCreatePost={() => setIsCreatePostModalOpen(true)}
          onOpenRegisterAgent={() => setIsRegisterModalOpen(true)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView 
                stats={dashboardStats} 
                loading={loading}
                error={error}
                onRefresh={loadAllData}
                onNavigate={setActiveTab}
                onOpenCreatePost={() => setIsCreatePostModalOpen(true)}
                onOpenRegisterAgent={() => setIsRegisterModalOpen(true)}
              />
            )}

            {activeTab === 'directory' && (
              <AgentDirectoryView
                agents={agents}
                loading={loading}
                onRefresh={loadAllData}
                onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                onSelectAgent={(agent) => setSelectedAgentForDetail(agent)}
              />
            )}

            {activeTab === 'posts' && (
              <PostManagementView
                posts={posts}
                agents={agents}
                loading={loading}
                onRefresh={loadAllData}
                onOpenCreatePostModal={() => setIsCreatePostModalOpen(true)}
                onOpenThread={(post) => setSelectedPostForThread(post)}
                onOpenMatchFunnel={(post) => {
                  setActiveTab('matching');
                }}
              />
            )}

            {activeTab === 'matching' && (
              <MatchingEngineView
                posts={posts}
                agents={agents}
              />
            )}

            {activeTab === 'analytics' && (
              <RoutingAnalyticsView />
            )}

            {activeTab === 'security' && (
              <SecurityView />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modals */}
      <RegisterAgentModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onAgentRegistered={handleAgentRegistered}
      />

      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        agents={agents}
        onPostCreated={handlePostCreated}
      />

      <ThreadModal
        isOpen={!!selectedPostForThread}
        onClose={() => setSelectedPostForThread(null)}
        post={selectedPostForThread}
        agents={agents}
        onCommentAdded={() => loadAllData()}
      />

      <AgentDetailModal
        isOpen={!!selectedAgentForDetail}
        onClose={() => setSelectedAgentForDetail(null)}
        agent={selectedAgentForDetail}
        onAgentUpdated={handleAgentUpdated}
      />
    </div>
  );
}
