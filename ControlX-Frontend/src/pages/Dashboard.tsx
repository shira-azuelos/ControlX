import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { Activity, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { getMissions, getAgentsByDept } from '../lib/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    activeAgents: 0,
    activeMissions: 0,
    completedMissions: 0,
    successRate: 0,
    systemLoad: 0,
    recentAlerts: [] as any[]
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.employee_type === 'AGENT' ? 'agent' : 'admin';
  const managerId = user.id;
  const dept = user.department || 'OPERATIONS';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const missions = await getMissions();
      const agents = await getAgentsByDept(dept).catch(() => []);

      const activeAgents = agents.filter((a: any) => a.status === 'ON_MISSION' || a.status === 'ACTIVE').length;
      const activeMissions = missions.filter((m: any) => m.status === 'IN_PROGRESS' || m.status === 'PENDING').length;
      const completedMissions = missions.filter((m: any) => m.status === 'COMPLETED').length;
      const successRate = missions.length > 0 ? Math.round((completedMissions / missions.length) * 100) : 0;
      const systemLoad = Math.min(Math.max(activeAgents * 8 + activeMissions * 5, 10), 95);

      // Recent alerts (mock data)
      const recentAlerts = [
        { id: 1, type: 'success', title: 'Operation Vanguard', agent: 'APEX-7', time: '2 hours ago' },
        { id: 2, type: 'alert', title: 'Breach Detected', agent: 'CIPHER-3', time: '45 min ago' },
        { id: 3, type: 'success', title: 'Route Secured', agent: 'RECON-2', time: '1 hour ago' },
        { id: 4, type: 'warning', title: 'Anomaly Found', agent: 'SHADOW-1', time: '30 min ago' },
      ];

      setDashboardData({
        activeAgents,
        activeMissions,
        completedMissions,
        successRate,
        systemLoad,
        recentAlerts
      });
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout userRole={userRole}>
        <div className="p-8 flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-emerald-500 animate-pulse text-lg font-black mb-4">INITIALIZING SYSTEM...</div>
            <div className="animate-spin">⟳</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userRole={userRole}>
      <div className="p-8 h-full font-mono text-xs uppercase tracking-widest relative bg-slate-950">
        
        {/* --- MAIN STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Active Agents */}
          <div className="bg-gradient-to-br from-emerald-950/40 to-emerald-950/20 border-2 border-emerald-500/40 p-6 rounded-lg hover:border-emerald-400/60 transition-all shadow-xl hover:shadow-emerald-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-emerald-700 tracking-wider">ACTIVE AGENTS</span>
              <Activity size={18} className="text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-300 mb-2">{dashboardData.activeAgents}</div>
            <div className="text-[9px] text-emerald-600">Units operational</div>
            <div className="mt-2 h-1 bg-emerald-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${(dashboardData.activeAgents / 10) * 100}%` }} />
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-gradient-to-br from-emerald-950/40 to-emerald-950/20 border-2 border-emerald-500/40 p-6 rounded-lg hover:border-emerald-400/60 transition-all shadow-xl hover:shadow-emerald-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-emerald-700 tracking-wider">SUCCESS RATE</span>
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-300 mb-2">{dashboardData.successRate}%</div>
            <div className="text-[9px] text-emerald-600">Mission completion</div>
            <div className="mt-2 h-1 bg-emerald-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${dashboardData.successRate}%` }} />
            </div>
          </div>

          {/* Active Missions */}
          <div className="bg-gradient-to-br from-amber-950/40 to-amber-950/20 border-2 border-amber-500/40 p-6 rounded-lg hover:border-amber-400/60 transition-all shadow-xl hover:shadow-amber-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-amber-700 tracking-wider">ACTIVE MISSIONS</span>
              <Clock size={18} className="text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-300 mb-2">{dashboardData.activeMissions}</div>
            <div className="text-[9px] text-amber-600">In progress</div>
            <div className="mt-2 h-1 bg-amber-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${(dashboardData.activeMissions / 20) * 100}%` }} />
            </div>
          </div>

          {/* System Load */}
          <div className="bg-gradient-to-br from-blue-950/40 to-blue-950/20 border-2 border-blue-500/40 p-6 rounded-lg hover:border-blue-400/60 transition-all shadow-xl hover:shadow-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-blue-700 tracking-wider">SYSTEM LOAD</span>
              <AlertCircle size={18} className="text-blue-400" />
            </div>
            <div className="text-3xl font-black text-blue-300 mb-2">{dashboardData.systemLoad}%</div>
            <div className="text-[9px] text-blue-600">CPU utilization</div>
            <div className="mt-2 h-1 bg-blue-900/30 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  dashboardData.systemLoad > 80 ? 'bg-red-500' :
                  dashboardData.systemLoad > 50 ? 'bg-yellow-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${dashboardData.systemLoad}%` }}
              />
            </div>
          </div>
        </div>

        {/* --- RECENT ALERTS & OPERATIONS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Alerts */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-emerald-900/50 p-6 rounded-lg shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle size={20} className="text-emerald-400" />
              <h3 className="text-sm font-black text-emerald-300 tracking-wider">RECENT OPERATIONS</h3>
            </div>
            
            <div className="space-y-3">
              {dashboardData.recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
                    alert.type === 'success' 
                      ? 'bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-400/60'
                      : alert.type === 'alert'
                      ? 'bg-red-500/10 border-red-500/40 hover:border-red-400/60'
                      : 'bg-yellow-500/10 border-yellow-500/40 hover:border-yellow-400/60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {alert.type === 'success' && <CheckCircle size={16} className="text-emerald-400" />}
                      {alert.type === 'alert' && <AlertCircle size={16} className="text-red-400" />}
                      {alert.type === 'warning' && <AlertCircle size={16} className="text-yellow-400" />}
                      <span className="font-black text-emerald-300">{alert.title}</span>
                    </div>
                    <span className="text-[9px] text-emerald-600">{alert.time}</span>
                  </div>
                  <div className="text-[10px] text-emerald-500 ml-6">{alert.agent}</div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-emerald-900/50 p-6 rounded-lg shadow-xl">
            <h3 className="text-sm font-black text-emerald-300 tracking-wider mb-4">SYSTEM STATUS</h3>
            
            <div className="space-y-3">
              <div className="bg-emerald-500/10 p-3 rounded border border-emerald-500/40">
                <div className="text-[9px] text-emerald-700 font-black mb-1">OPERATIONAL</div>
                <div className="text-sm font-black text-emerald-400">ONLINE</div>
              </div>
              
              <div className="bg-emerald-500/10 p-3 rounded border border-emerald-500/40">
                <div className="text-[9px] text-emerald-700 font-black mb-1">CONNECTIVITY</div>
                <div className="text-sm font-black text-emerald-400">STABLE</div>
              </div>
              
              <div className="bg-emerald-500/10 p-3 rounded border border-emerald-500/40">
                <div className="text-[9px] text-emerald-700 font-black mb-1">ENCRYPTION</div>
                <div className="text-sm font-black text-emerald-400">SECURED</div>
              </div>
              
              <div className="bg-emerald-500/10 p-3 rounded border border-emerald-500/40">
                <div className="text-[9px] text-emerald-700 font-black mb-1">LAST UPDATE</div>
                <div className="text-sm font-black text-emerald-400">REAL-TIME</div>
              </div>
            </div>

            <button
              onClick={loadDashboardData}
              className="w-full mt-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-[10px] font-black rounded-lg uppercase tracking-widest transition-all"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
