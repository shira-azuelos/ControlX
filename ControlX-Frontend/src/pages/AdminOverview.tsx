import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Activity, Users, Radio, BellRing, MessageSquare, Clock3 } from 'lucide-react';
import { getAgentsByDept, getMissionsByManager } from '../lib/api';

type ReportSeverity = 'low' | 'medium' | 'high';

type ReportItem = {
  id: string;
  title: string;
  severity: ReportSeverity;
  createdAt: string;
  author?: string;
  missionTitle?: string;
};

type OverviewData = {
  activeAgents: number;
  availableAgents: number;
  activeMissions: number;
  latestReports: ReportItem[];
  missionTrend: number[];
};

type MissionApi = {
  id: number;
  title?: string;
  status?: 'IN_PROGRESS' | 'PENDING' | 'COMPLETED' | 'ABORTED' | string;
  reports?: Array<{
    id: number;
    rawText?: string;
    timestamp?: string;
    createdAt?: string;
    severity?: string;
    author?: { codename?: string; fullName?: string };
  }>;
};

type AgentApi = {
  id: number;
  status?: 'ON_MISSION' | 'AVAILABLE' | string;
};

const FALLBACK_DATA: OverviewData = {
  activeAgents: 0,
  availableAgents: 0,
  activeMissions: 0,
  latestReports: [],
  missionTrend: Array.from({ length: 24 }, () => 0),
};

const AdminOverview = () => {
  const [data, setData] = useState<OverviewData>(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);

  const manager = JSON.parse(localStorage.getItem('user') || '{}');
  const managerDept = manager.department || 'OPERATIONS';
  const managerId = manager.id;

  useEffect(() => {
    let mounted = true;

    const loadOverview = async () => {
      if (!managerId) {
        if (mounted) {
          setData(FALLBACK_DATA);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        const [missionsData, agentsData] = await Promise.all([
          getMissionsByManager(managerId),
          getAgentsByDept(managerDept),
        ]);

        const next = buildOverviewFromExistingApis(missionsData || [], agentsData || []);
        if (mounted) setData(next);
      } catch (err) {
        console.error('Failed to load overview data', err);
        if (mounted) setData(FALLBACK_DATA);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOverview();
    const interval = setInterval(loadOverview, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [managerId, managerDept]);

  const graphPath = useMemo(() => buildSparklinePath(data.missionTrend, 900, 220), [data.missionTrend]);

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in duration-700 font-mono">
        <header className="border-b border-emerald-900/60 pb-5">
          <h1 className="text-3xl font-black text-emerald-300 tracking-widest uppercase">Operations Overview</h1>
          <p className="text-[10px] text-emerald-600 tracking-[0.2em] uppercase mt-2">
            Real-time snapshot // {managerDept} command
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={<Users />} label="סוכנים פעילים" value={String(data.activeAgents)} color="text-emerald-300" />
          <StatCard icon={<Radio />} label="סוכנים זמינים" value={String(data.availableAgents)} color="text-cyan-300" />
          <StatCard icon={<Activity />} label="משימות פעילות" value={String(data.activeMissions)} color="text-amber-300" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-[#031a14]/60 border border-emerald-700/40 rounded p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-emerald-200 tracking-[0.2em] uppercase">Intel Activity 24h</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-500">{loading ? 'SYNCING...' : 'LIVE'}</span>
              </div>
            </div>

            <div className="relative h-56 rounded bg-[#02120e]/50 border border-emerald-900/30 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.06)_1px,transparent_1px)] bg-[size:24px_24px]" />
              <svg viewBox="0 0 900 220" className="absolute inset-0 w-full h-full">
                <path d={graphPath} fill="none" stroke="rgba(94,234,212,0.95)" strokeWidth="3" />
                <path d={graphPath} fill="none" stroke="rgba(16,185,129,0.22)" strokeWidth="10" />
              </svg>
              <div className="absolute bottom-2 right-3 text-[10px] text-emerald-500 uppercase tracking-widest">last 24 hours</div>
            </div>
          </section>

          <section className="bg-[#031a14]/60 border border-emerald-700/40 rounded p-4 md:p-6">
            <h3 className="text-xs font-black mb-3 border-b border-emerald-800/40 pb-2 text-emerald-200 flex items-center gap-2 tracking-[0.15em] uppercase">
              <BellRing size={14} />
              Latest Reports (10)
            </h3>

            <div className="space-y-3 max-h-72 overflow-auto pr-1 custom-scrollbar">
              {data.latestReports.map((report, i) => (
                <article
                  key={report.id}
                  className="relative rounded-xl border border-emerald-700/40 bg-[#021812] px-3 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.45)] hover:border-emerald-400/60 transition-all"
                  style={{ animation: `fadeInUp 260ms ease ${i * 45}ms both` }}
                >
                  <div className="absolute -left-1 top-3 h-10 w-1 rounded bg-emerald-400/80" />
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare size={13} className="text-emerald-400 shrink-0" />
                      <span className="text-[10px] text-emerald-300 font-black uppercase tracking-wider truncate">
                        {report.author || 'UNKNOWN ASSET'}
                      </span>
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider font-black ${severityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                  </div>

                  <p className="text-[12px] text-emerald-100 leading-5 whitespace-pre-wrap break-words">{report.title}</p>

                  <div className="mt-2 pt-2 border-t border-emerald-900/50 flex items-center justify-between text-[10px] text-emerald-600">
                    <span className="truncate">{report.missionTitle || 'MISSION'}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock3 size={11} />
                      {formatTime(report.createdAt)}
                    </span>
                  </div>
                </article>
              ))}

              {!data.latestReports.length && (
                <p className="text-[10px] text-emerald-700 uppercase tracking-widest">{`> No reports available`}</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AdminLayout>
  );
};

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
};

const StatCard = ({ icon, label, value, color }: StatCardProps) => (
  <div className="bg-[#031a14]/70 border border-emerald-800/40 p-4 rounded-lg hover:border-emerald-400/50 transition-all group">
    <div className="flex items-center gap-3 mb-2">
      <div className={`${color} opacity-80 group-hover:opacity-100 transition-opacity`}>{icon}</div>
      <span className="text-[10px] text-emerald-500 uppercase tracking-widest">{label}</span>
    </div>
    <div className={`text-2xl font-black ${color}`}>{value}</div>
  </div>
);

function buildOverviewFromExistingApis(missions: MissionApi[], agents: AgentApi[]): OverviewData {
  const allMissions = Array.isArray(missions) ? missions : [];
  const allAgents = Array.isArray(agents) ? agents : [];

  const activeMissions = allMissions.filter((m) => m.status === 'IN_PROGRESS' || m.status === 'PENDING').length;

  const activeAgents = allAgents.filter((a) => a.status === 'ON_MISSION').length;
  const availableByStatus = allAgents.filter((a) => a.status === 'AVAILABLE').length;
  const availableAgents = availableByStatus > 0 ? availableByStatus : Math.max(allAgents.length - activeAgents, 0);

  const latestReports: ReportItem[] = allMissions
    .flatMap((mission) =>
      (mission.reports ?? []).map((r) => ({
        id: `${mission.id}-${r.id}`,
        title: r.rawText?.trim() || 'דיווח ללא תוכן',
        severity: normalizeSeverity(r.severity),
        createdAt: r.timestamp || r.createdAt || '',
        author: r.author?.codename || r.author?.fullName || 'UNKNOWN ASSET',
        missionTitle: mission.title || `Mission #${mission.id}`,
      }))
    )
    .filter((r) => Number.isFinite(new Date(r.createdAt).getTime()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const missionTrend = buildReportTrend(
    allMissions.flatMap((m) => m.reports ?? []),
    24
  );

  return {
    activeAgents,
    availableAgents,
    activeMissions,
    latestReports,
    missionTrend,
  };
}

function buildReportTrend(reports: Array<{ timestamp?: string; createdAt?: string }>, hours: number) {
  const now = Date.now();
  const buckets = Array.from({ length: hours }, () => 0);

  reports.forEach((r) => {
    const t = new Date(r.timestamp || r.createdAt || '').getTime();
    if (!Number.isFinite(t)) return;
    const diffHours = Math.floor((now - t) / (1000 * 60 * 60));
    if (diffHours >= 0 && diffHours < hours) buckets[hours - 1 - diffHours] += 1;
  });

  return buckets;
}

function normalizeSeverity(value?: string): ReportSeverity {
  const v = (value || '').toLowerCase();
  if (v === 'high') return 'high';
  if (v === 'medium') return 'medium';
  return 'low';
}

function severityColor(severity: ReportSeverity) {
  if (severity === 'high') return 'text-red-300';
  if (severity === 'medium') return 'text-amber-300';
  return 'text-emerald-300';
}

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

function buildSparklinePath(data: number[], width: number, height: number) {
  if (!data.length) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);

  return data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 20) - 10;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

export default AdminOverview;