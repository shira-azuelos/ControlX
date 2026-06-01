import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Shield, ChevronRight, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { getMissionsByManager, getAgentsByDept, getMissions } from '../lib/api';

const MainLayout = ({ children, userRole }: { children: React.ReactNode, userRole: 'agent' | 'admin' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState({
    activeAgents: 0,
    successRate: 0,
    totalMissions: 0,
    recentReports: [] as any[]
  });
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const missions = await getMissions();
      const managerId = user.id;
      const dept = user.department || 'OPERATIONS';

      // Get agents
      const agents = await getAgentsByDept(dept).catch(() => []);
      const activeAgents = agents.filter((a: any) => a.status === 'ON_MISSION' || a.status === 'ACTIVE').length;

      // Calculate success rate
      const completedMissions = missions.filter((m: any) => m.status === 'COMPLETED').length;
      const successRate = missions.length > 0 ? Math.round((completedMissions / missions.length) * 100) : 0;

      // Recent reports (mock)
      const recentReports = [
        { id: 1, title: 'Operation Complete', agent: 'APEX-7', time: '2 hours ago', icon: 'success' },
        { id: 2, title: 'Breach Detected', agent: 'CIPHER-3', time: '45 minutes ago', icon: 'alert' },
        { id: 3, title: 'Route Secured', agent: 'RECON-2', time: '1 hour ago', icon: 'success' },
        { id: 4, title: 'Anomaly Alert', agent: 'SHADOW-1', time: '30 minutes ago', icon: 'warning' },
      ];

      setStats({
        activeAgents,
        successRate,
        totalMissions: missions.length,
        recentReports
      });
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const adminMenuItems = [
    { icon: '📊', label: 'OVERVIEW', path: '/admin' },
    { icon: '👥', label: 'AGENTS', path: '/admin/personnel' },
    { icon: '🎯', label: 'MISSIONS', path: '/admin/missions' },
    { icon: '💬', label: 'MESSAGES', path: '/admin/messages' },
  ];

  const agentMenuItems = [
    { icon: '🎯', label: 'MISSION', path: '/agent' },
    { icon: '💬', label: 'COMMS', path: '/agent' },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : agentMenuItems;

  return (
    <div className="min-h-screen flex font-mono overflow-hidden bg-slate-950">
      {/* --- SIDEBAR --- */}
      <div className="relative flex">
        {/* Main Sidebar */}
        <div className="w-20 border-r border-emerald-900/50 bg-gradient-to-b from-black to-slate-900 flex flex-col items-center z-50 shadow-2xl">
          
          {/* CONTROLX Branding */}
          <div 
            onClick={() => setShowStats(!showStats)}
            className="w-full py-6 border-b border-emerald-900/50 flex flex-col items-center cursor-pointer hover:bg-emerald-500/10 transition-colors group relative"
          >
            <Shield size={28} className="text-emerald-400 group-hover:text-emerald-300 transition-colors mb-2" />
            <span className="text-[10px] font-black text-emerald-500 group-hover:text-emerald-400 tracking-[0.2em] uppercase text-center">
              CTL<br/>X
            </span>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight size={16} className="text-emerald-400" />
            </div>
          </div>

          {/* Navigation Icons */}
          <nav className="flex-1 flex flex-col gap-2 py-6">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 text-lg tooltip relative group ${
                  location.pathname === item.path
                    ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-400 border border-transparent hover:border-emerald-400/30'
                }`}
                title={item.label}
              >
                {item.icon}
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 border border-emerald-500/50 rounded text-xs font-bold text-emerald-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {item.label}
                </div>
              </button>
            ))}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-12 h-12 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-400/30 transition-all duration-200 mb-4 group relative"
            title="LOG_OUT"
          >
            🚪
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 border border-red-500/50 rounded text-xs font-bold text-red-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              LOG_OUT
            </div>
          </button>
        </div>

        {/* Expandable Stats Panel */}
        {showStats && (
          <div className="w-80 border-r border-emerald-900/50 bg-gradient-to-b from-slate-900 via-black to-slate-950 flex flex-col overflow-y-auto shadow-2xl shadow-emerald-950/50">
            {/* Header */}
            <div className="p-6 border-b border-emerald-900/40 bg-emerald-950/30">
              <h3 className="text-xs font-black text-emerald-400 tracking-widest uppercase mb-1">System Status</h3>
              <h2 className="text-xl font-black text-emerald-300 tracking-wider drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                CONTROLX
              </h2>
              <p className="text-[10px] text-emerald-700 tracking-widest mt-2">OPERATIONAL STATUS: ONLINE</p>
            </div>

            {/* Stats Cards */}
            <div className="flex-1 p-6 space-y-4">
              {/* Active Agents */}
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-lg hover:border-emerald-400/60 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={14} className="text-emerald-400" />
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Active Agents</span>
                </div>
                <div className="text-2xl font-black text-emerald-300 mb-1">{stats.activeAgents}</div>
                <div className="text-[9px] text-emerald-600">Units in operational status</div>
              </div>

              {/* Success Rate */}
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-lg hover:border-emerald-400/60 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Success Rate</span>
                </div>
                <div className="text-2xl font-black text-emerald-300 mb-1">{stats.successRate}%</div>
                <div className="w-full h-1.5 bg-emerald-900/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    style={{ width: `${stats.successRate}%` }}
                  />
                </div>
                <div className="text-[9px] text-emerald-600 mt-2">Mission completion ratio</div>
              </div>

              {/* Total Missions */}
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-lg hover:border-emerald-400/60 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={14} className="text-amber-400" />
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Total Missions</span>
                </div>
                <div className="text-2xl font-black text-emerald-300">{stats.totalMissions}</div>
                <div className="text-[9px] text-emerald-600 mt-2">Operations tracked</div>
              </div>
            </div>

            {/* Recent Reports */}
            <div className="border-t border-emerald-900/40 p-6">
              <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3">Recent Alerts</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats.recentReports.map((report) => (
                  <div key={report.id} className="bg-slate-800/50 border border-emerald-900/30 p-2.5 rounded text-[9px] hover:border-emerald-500/40 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-emerald-300">{report.title}</span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded ${
                        report.icon === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                        report.icon === 'alert' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {report.icon.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-emerald-600">{report.agent}</div>
                    <div className="text-emerald-700 mt-1">{report.time}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Refresh Button */}
            <div className="p-4 border-t border-emerald-900/40">
              <button
                onClick={loadStats}
                disabled={loading}
                className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-[10px] font-black rounded uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {loading ? 'SYNCING...' : 'REFRESH_DATA'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-emerald-900/30 bg-slate-900/80 backdrop-blur-md flex justify-between items-center px-8 shrink-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-600 tracking-widest font-bold">SECURE_CONNECTION_ESTABLISHED</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-4 bg-emerald-900/10 px-5 py-2 rounded-lg border border-emerald-500/20 hover:bg-emerald-900/20 hover:border-emerald-400/40 transition-all cursor-default">
            <div className="text-right">
              <div className="text-xs text-emerald-600 uppercase font-bold tracking-widest">
                {userRole.toUpperCase()} // {user.department || 'COMMAND'}
              </div>
              <div className="text-sm text-emerald-300 font-bold tracking-wider uppercase">
                {user.name || user.fullName || 'UNKNOWN USER'}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <Shield size={16} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
