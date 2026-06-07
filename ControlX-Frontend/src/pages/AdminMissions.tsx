import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import {Radio,Plus,Users,MessageSquare,Cpu,FileText,Globe,Maximize2,X,Timer,CheckCircle,Trash2,Activity,AlertOctagon} from 'lucide-react';
import { getMissionsByManager,createMission,getAgentsByDept,summarizeMissionAI,completeMission,deleteMission,} from '../lib/api';

type MissionsView = 'ACTIVE' | 'INACTIVE';

type Manager = {
  id?: string | number;
  department?: string;
};

type Agent = {
  id: string | number;
  codename: string;
  specialty?: string;
  status?: string;
  employee_type?: 'AGENT';
  [key: string]: unknown;
};

type Report = {
  id?: string | number;
  timestamp?: string;
  createdAt?: string;
  rawText?: string;
  text?: string;
  author?: {
    codename?: string;
    fullName?: string;
  };
};

type Mission = {
  id: string | number;
  title: string;
  description?: string;
  status: 'IN_PROGRESS' | 'PENDING' | 'COMPLETED' | 'ABORTED' | string;
  startedAt?: string;
  completedAt?: string;
  aiIntelligenceSummary?: string;
  assignedAgents?: Agent[];
  reports?: Report[];
  [key: string]: unknown;
};

const safeParseUser = (): Manager => {
  try {
    const parsed = JSON.parse(localStorage.getItem('user') || '{}') as Manager;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const toNumberId = (value: string | number | undefined | null): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const sortByDateDesc = (arr: Report[]) =>
  (arr || [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.timestamp || b.createdAt || 0).getTime() -
        new Date(a.timestamp || a.createdAt || 0).getTime()
    );

const formatTime = (seconds: number) => {
  const d = Math.floor(seconds / (3600 * 24)); 
  const h = Math.floor((seconds % (3600 * 24)) / 3600); 
  const m = Math.floor((seconds % 3600) / 60); 
  const s = seconds % 60; 
  const formattedH = h.toString().padStart(2, '0');
  const formattedM = m.toString().padStart(2, '0');
  const formattedS = s.toString().padStart(2, '0');
  if (d > 0) {
    return `${d}d ${formattedH}:${formattedM}:${formattedS}`;
  }  
  return `${formattedH}:${formattedM}:${formattedS}`;
};

const AdminMissions = () => {
  const navigate = useNavigate();
  const manager = safeParseUser();
  const managerDept = manager.department || 'OPERATIONS';
  const managerId = manager.id;

  const [missions, setMissions] = useState<Mission[]>([]);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);  //הסוכנים הפנויים
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null); //לראות את פרטי המשימה
  const [showCreateModal, setShowCreateModal] = useState(false);  //יצירת משימה
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false); 
  const [isDeleting, setIsDeleting] = useState(false); //מחיקת משימה
  const [showDescModal, setShowDescModal] = useState(false); //תיאור המשימה
  const [showAiModal, setShowAiModal] = useState(false); // חלון סיכום AI
  const [showReportsModal, setShowReportsModal] = useState(false); //חלון כל הדיווחים
  const [elapsedTime, setElapsedTime] = useState(0); //הזמן שעבר מתחילת המשימה
  const [missionsView, setMissionsView] = useState<MissionsView>('ACTIVE');
  
  const [showCompleteConfirm, setShowCompleteConfirm] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const activeMissions = useMemo(
    () => missions.filter((m) => m.status === 'IN_PROGRESS' || m.status === 'PENDING'),
    [missions]
  );

  const completedMissions = useMemo(
    () => missions.filter((m) => m.status === 'COMPLETED' || m.status === 'ABORTED'),
    [missions]
  );

  const displayedMissions = useMemo(
    () => (missionsView === 'ACTIVE' ? activeMissions : completedMissions),
    [missionsView, activeMissions, completedMissions]
  );

  const missionReports = useMemo(
    () => sortByDateDesc(selectedMission?.reports || []),
    [selectedMission]
  );

  const loadData = useCallback(async () => {
    const managerIdNum = toNumberId(managerId);
    if (managerIdNum === null) return;

    try {
      setLoading(true);

      const missionsData = (await getMissionsByManager(managerIdNum)) as Mission[] | null;
      const safeMissions = missionsData || [];
      setMissions(safeMissions);

      const agentsData = (await getAgentsByDept(managerDept)) as Agent[] | null;
      setAvailableAgents((agentsData || []).filter((a) => a.status === 'AVAILABLE'));

      setSelectedMission((prev) => {
        if (!prev) return prev;
        return safeMissions.find((m) => m.id === prev.id) || null;
      });
    } catch {
      console.error('Failed to load operations data');
    } finally {
      setLoading(false);
    }
  }, [managerId, managerDept]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setShowDescModal(false);
    setShowAiModal(false);
    setShowReportsModal(false);
    setShowCompleteConfirm(null);
    setShowDeleteConfirm(null);
  }, [selectedMission?.id]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    const isActive =
      selectedMission?.status === 'IN_PROGRESS' || selectedMission?.status === 'PENDING';

    if (isActive && selectedMission?.startedAt) {
      const tick = () => {
        const start = new Date(selectedMission.startedAt as string).getTime();
        const now = Date.now();
        setElapsedTime(Math.max(0, Math.floor((now - start) / 1000)));
      };

      tick();
      interval = setInterval(tick, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedMission?.id, selectedMission?.status, selectedMission?.startedAt]);

  const handleGenerateAI = async () => {
    const missionIdNum = toNumberId(selectedMission?.id);
    if (missionIdNum === null || isGenerating) return;

    try {
      setIsGenerating(true);
      await summarizeMissionAI(missionIdNum);
      await loadData();
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerCompleteMission = () => {
    if (!selectedMission?.id) return;
    const missionIdNum = toNumberId(selectedMission.id);
    if (missionIdNum !== null) {
      setShowCompleteConfirm(missionIdNum);
    }
  };

  const confirmCompleteMission = async () => {
    if (showCompleteConfirm === null) return;
    const missionIdNum = showCompleteConfirm;
    const missionId = selectedMission?.id;

    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId
          ? {
              ...m,
              status: 'COMPLETED',
              completedAt: m.completedAt || new Date().toISOString(),
            }
          : m
      )
    );

    setSelectedMission((prev) =>
      prev
        ? {
            ...prev,
            status: 'COMPLETED',
            completedAt: prev.completedAt || new Date().toISOString(),
          }
        : prev
    );

    if (missionsView === 'ACTIVE') {
      setSelectedMission(null);
    }

    setShowCompleteConfirm(null); 

    try {
      await completeMission(missionIdNum);
      await loadData();
    } catch {
      await loadData();
    }
  };

  const triggerDeleteMission = () => {
    if (!selectedMission?.id || isDeleting) return;
    const missionIdNum = toNumberId(selectedMission.id);
    if (missionIdNum !== null) {
      setShowDeleteConfirm(missionIdNum);
    }
  };

  const confirmDeleteMission = async () => {
    if (showDeleteConfirm === null) return;
    
    const missionIdNum = showDeleteConfirm;
    const missionId = selectedMission?.id;
    const backup = selectedMission;

    setIsDeleting(true);
    setShowDeleteConfirm(null); 
    
    setMissions((prev) => prev.filter((m) => m.id !== missionId));
    setSelectedMission(null);

    try {
      await deleteMission(missionIdNum);
      await loadData();
    } catch {
      if(backup) {
         setMissions((prev) => [backup, ...prev]);
      }
      await loadData();
    } finally {
      setIsDeleting(false);
    }
  };

  const isMissionActive =
    selectedMission?.status === 'IN_PROGRESS' || selectedMission?.status === 'PENDING';

  return (
    <AdminLayout>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow { 100% { transform: rotate(360deg); } }
        .radar-sweep { background: conic-gradient(from 0deg, rgba(16, 185, 129, 0.4) 0%, transparent 30%); animation: spin-slow 4s linear infinite; border-radius: 50%; }
      `}} />
      <div className="h-[calc(100vh-60px)] flex flex-col font-mono text-emerald-500 bg-[#010504] relative p-4 overflow-hidden" dir="ltr">
        
        <div className="flex justify-between items-center mb-4 border-b border-emerald-900/60 pb-4 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-widest uppercase text-emerald-300 flex items-center gap-4">
              <Globe className="text-emerald-500 opacity-50" size={28} /> Operations Control
            </h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 text-black px-6 py-3 font-black hover:bg-emerald-400 transition-all rounded-sm uppercase tracking-widest text-sm"
          >
            <Plus size={18} /> LAUNCH NEW OPERATION
          </button>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 overflow-hidden">
          <aside className="col-span-3 bg-[#010806]/80 border border-emerald-900/40 rounded p-3 flex flex-col gap-2 overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMissionsView('ACTIVE')}
                className={`px-2 py-2 text-[11px] font-black uppercase tracking-widest border rounded flex items-center justify-center gap-1 ${
                  missionsView === 'ACTIVE'
                    ? 'bg-emerald-700 text-black border-emerald-500'
                    : 'bg-[#02120e] text-emerald-300 border-emerald-900/60 hover:border-emerald-700'
                }`}
              >
                <Radio size={12} /> Active ({activeMissions.length})
              </button>

              <button
                onClick={() => setMissionsView('INACTIVE')}
                className={`px-2 py-2 text-[11px] font-black uppercase tracking-widest border rounded flex items-center justify-center gap-1 ${
                  missionsView === 'INACTIVE'
                    ? 'bg-emerald-700 text-black border-emerald-500'
                    : 'bg-[#010a08] text-emerald-400 border-emerald-900/60 hover:border-emerald-700'
                }`}
              >
                <CheckCircle size={12} /> Inactive ({completedMissions.length})
              </button>
            </div>

            <h2 className="text-xs font-black tracking-widest text-emerald-100 uppercase flex items-center gap-2 border-b border-emerald-500/30 pb-2 mt-2">
              {missionsView === 'ACTIVE' ? (
                <>
                  <Radio className="animate-pulse text-emerald-400" size={14} />
                  Active Missions
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  Inactive Missions
                </>
              )}
            </h2>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 mt-1">
              {displayedMissions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMission(m)}
                  className={`w-full text-left p-2.5 border rounded transition-all ${
                    selectedMission?.id === m.id
                      ? 'bg-emerald-900/30 border-emerald-500 text-emerald-100'
                      : missionsView === 'ACTIVE'
                      ? 'bg-[#02120e] border-emerald-900/60 hover:border-emerald-600 text-emerald-300'
                      : 'bg-[#010a08] border-emerald-900/60 hover:border-emerald-700 text-emerald-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest">OP-{m.id}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-800/50">
                      {m.status}
                    </span>
                  </div>

                  <div className="mt-1 text-sm font-black uppercase truncate">{m.title}</div>

                  <div className="mt-1.5 text-[10px] text-emerald-600 flex items-center gap-2">
                    <Users size={11} /> {m.assignedAgents?.length || 0} assets
                  </div>
                </button>
              ))}

              {!loading && displayedMissions.length === 0 && (
                <div className="text-center text-emerald-700 text-xs uppercase tracking-widest py-6">
                  {missionsView === 'ACTIVE' ? 'No active operations' : 'No inactive operations'}
                </div>
              )}
            </div>
          </aside>

          <section className="col-span-9 bg-[#010806]/80 border border-emerald-900/40 rounded p-4 h-full flex flex-col shadow-2xl overflow-hidden backdrop-blur-sm">
            {!selectedMission ? (
              <div className="m-auto text-emerald-700 uppercase tracking-widest text-sm">
                Select a mission from the left panel
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3 mb-3 shrink-0">
                  <div>
                    <h3 className="text-2xl font-black text-emerald-100 uppercase tracking-widest">
                      {selectedMission.title}
                    </h3>
                    <div className="text-xs text-emerald-600 mt-1 flex items-center gap-3">
                      <span>Status: {selectedMission.status}</span>
                      {isMissionActive && selectedMission.startedAt && (
                        <span className="text-amber-400 font-black flex items-center gap-1">
                          <Timer size={13} /> {formatTime(elapsedTime)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isMissionActive ? (
                      <button
                        onClick={triggerCompleteMission}
                        className="bg-red-600 text-white px-3 py-2 text-xs font-black uppercase hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all"
                      >
                        Complete Mission
                      </button>
                    ) : (
                      <button
                        onClick={triggerDeleteMission}
                        disabled={isDeleting}
                        className="bg-red-900/80 text-red-200 px-3 py-2 text-xs font-black uppercase flex items-center gap-2 hover:bg-red-800 disabled:opacity-50 border border-red-800/50"
                      >
                        <Trash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete Mission'}
                      </button>
                    )}

                    <button
                      onClick={handleGenerateAI}
                      disabled={isGenerating}
                      className="bg-emerald-600 text-black px-3 py-2 text-xs font-black uppercase flex items-center gap-2 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      <Cpu size={14} /> {isGenerating ? 'Processing...' : 'AI Summary'}
                    </button>

                    <button
                      /* התיקון כאן: מעבירים את נתוני המשימה בתור state בתוך ה-navigate */
                      onClick={() => navigate(`/admin/comms?missionId=${selectedMission.id}`, { state: { fromMission: selectedMission } })}
                      className="bg-cyan-600 text-black px-3 py-2 text-xs font-black uppercase flex items-center gap-2 hover:bg-cyan-400"
                    >
                      <MessageSquare size={14} /> Open Chat
                    </button>
                  </div>
                </div>

                <div className="border border-emerald-900/50 rounded p-3 bg-black/30 mb-3 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                      Mission Description
                    </h4>
                    <button
                      onClick={() => setShowDescModal(true)}
                      className="text-[10px] text-emerald-500 uppercase font-bold flex items-center gap-1 hover:text-emerald-300"
                    >
                      <Maximize2 size={12} /> Expand
                    </button>
                  </div>
                  <p className="text-sm text-emerald-100 whitespace-pre-wrap leading-6 line-clamp-1">
                    {selectedMission.description || 'No description'}
                  </p>
                </div>

                <div className="border border-emerald-900/50 rounded p-3 bg-black/20 mb-4 shrink-0">
                  <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">
                    Assigned Agents
                  </h4>
                  {selectedMission.assignedAgents && selectedMission.assignedAgents.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedMission.assignedAgents.map((agent) => (
                        <div
                          key={agent.id}
                          className="px-2.5 py-1.5 rounded border border-emerald-800/60 bg-[#03140f] text-emerald-200 text-xs"
                        >
                          <span className="font-black">{agent.codename}</span>
                          {agent.specialty ? (
                            <span className="text-emerald-500"> • {agent.specialty}</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-700 uppercase tracking-widest">
                      No agents assigned
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
                  
                  <div className="col-span-5 border border-emerald-500/70 rounded p-5 h-full flex flex-col bg-[#03140f]/60 shadow-[0_0_24px_rgba(16,185,129,0.15)] overflow-hidden">
                    <div className="flex items-center justify-between mb-2 border-b border-emerald-700/40 pb-2 shrink-0">
                      <h4 className="text-sm font-black text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16} /> Reports
                      </h4>
                      <button
                        onClick={() => setShowReportsModal(true)}
                        className="text-[10px] text-emerald-500 uppercase font-bold flex items-center gap-1 hover:text-emerald-300"
                      >
                        <Maximize2 size={12} /> Expand
                      </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-start">
                      {missionReports.slice(0, 1).map((r, i) => (
                        <div
                          key={r.id || i}
                          className="bg-[#022018] border border-emerald-700/60 border-l-4 border-l-emerald-400 p-4 rounded"
                        >
                          <div className="flex justify-between text-[11px] text-emerald-400 mb-2">
                            <span className="font-bold">[{r.author?.codename || r.author?.fullName || 'UNKNOWN ASSET'}]</span>
                            <span>{new Date(r.timestamp || r.createdAt || 0).toLocaleTimeString('he-IL')}</span>
                          </div>
                          <p className="text-sm text-emerald-100 whitespace-pre-wrap leading-relaxed line-clamp-2">
                            {r.rawText || r.text || 'No content'}
                          </p>
                        </div>
                      ))}

                      {missionReports.length === 0 && (
                        <div className="text-xs text-emerald-700 uppercase tracking-widest py-6 text-center my-auto">
                          No reports for this mission
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-7 border border-amber-600/40 rounded p-5 h-full flex flex-col bg-[#140f03]/40 shadow-[0_0_24px_rgba(245,158,11,0.15)] overflow-hidden">
                    <div className="flex items-center justify-between mb-2 border-b border-amber-700/30 pb-2 shrink-0">
                      <h4 className="text-sm font-black text-amber-300 uppercase tracking-widest flex items-center gap-2">
                        <Cpu size={16} /> AI Brief
                      </h4>
                      <button
                        onClick={() => setShowAiModal(true)}
                        className="text-[10px] text-amber-300 uppercase font-bold flex items-center gap-1 hover:text-amber-100"
                      >
                        <Maximize2 size={12} /> Expand
                      </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden">
                      <p className="text-sm text-amber-100 whitespace-pre-wrap leading-7 font-bold line-clamp-3">
                        {selectedMission.aiIntelligenceSummary || 'No AI summary yet'}
                      </p>
                    </div>
                  </div>

                </div>
              </>
            )}
          </section>
        </div>

        {showCompleteConfirm !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCompleteConfirm(null)} />
            <div className="relative bg-[#0a0202]/70 backdrop-blur-md border border-red-600/80 w-full max-w-md p-6 shadow-[0_0_50px_rgba(220,38,38,0.3)] font-mono animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-950/40 rounded-full border border-red-500/50 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                  <AlertOctagon size={32} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-red-500 uppercase tracking-widest mb-2">TERMINATE MISSION?</h2>
                <p className="text-sm text-red-200/90 mb-8 uppercase tracking-wider font-bold">
                  Are you absolutely sure you want to end this operation? All deployed agents will be extracted.
                </p>
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setShowCompleteConfirm(null)}
                    className="flex-1 bg-transparent border border-red-900/50 text-red-400 py-3 uppercase tracking-widest font-black text-xs hover:bg-red-950/50 transition-all backdrop-blur-sm"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={confirmCompleteMission}
                    className="flex-1 bg-red-600/90 backdrop-blur-sm text-white py-3 uppercase tracking-widest font-black text-xs hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all"
                  >
                    CONFIRM TERMINATION
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
            <div className="relative bg-[#100303]/80 backdrop-blur-md border border-red-800 w-full max-w-md p-6 shadow-[0_0_50px_rgba(185,28,28,0.4)] font-mono animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-950/60 rounded-full border border-red-700/50 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(185,28,28,0.6)]">
                  <Trash2 size={32} className="text-red-600 animate-pulse" />
                </div>
                <h2 className="text-xl font-black text-red-600 uppercase tracking-widest mb-2">PERMANENT DELETION</h2>
                <p className="text-xs text-red-300/80 mb-8 uppercase tracking-wider font-bold">
                  Warning: You are about to permanently erase all records, logs, and AI briefs for <span className="text-white">OP-{showDeleteConfirm}</span>. This action cannot be reversed.
                </p>
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 bg-transparent border border-red-900/50 text-red-400 py-3 uppercase tracking-widest font-black text-xs hover:bg-red-950/50 transition-all backdrop-blur-sm"
                  >
                    ABORT
                  </button>
                  <button 
                    onClick={confirmDeleteMission}
                    className="flex-1 bg-red-700/90 backdrop-blur-sm text-black py-3 uppercase tracking-widest font-black text-xs hover:bg-red-500 shadow-[0_0_15px_rgba(185,28,28,0.5)] transition-all"
                  >
                    PURGE RECORD
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDescModal && selectedMission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowDescModal(false)} />
            <div className="relative bg-[#010a08] border border-emerald-600/60 w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <h2 className="text-lg font-black text-emerald-300 uppercase mb-3">Mission Description — Full Text</h2>
              <p className="text-sm text-emerald-100 whitespace-pre-wrap leading-6">
                {selectedMission.description || 'No description'}
              </p>
              <div className="flex justify-end mt-5">
                <button onClick={() => setShowDescModal(false)} className="px-4 py-2 bg-emerald-600 text-black font-black uppercase text-xs">Close</button>
              </div>
            </div>
          </div>
        )}

        {showReportsModal && selectedMission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowReportsModal(false)} />
            <div className="relative bg-[#010a08] border border-emerald-600/60 w-full max-w-3xl p-6 max-h-[80vh] flex flex-col">
              <h2 className="text-lg font-black text-emerald-300 uppercase mb-3 shrink-0">Mission Reports — Full Log</h2>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {missionReports.map((r, i) => (
                  <div
                    key={r.id || i}
                    className="bg-[#022018] border border-emerald-700/60 border-l-4 border-l-emerald-400 p-4 rounded"
                  >
                    <div className="flex justify-between text-xs text-emerald-400 mb-1">
                      <span className="font-black">[{r.author?.codename || r.author?.fullName || 'UNKNOWN ASSET'}]</span>
                      <span>{new Date(r.timestamp || r.createdAt || 0).toLocaleString('he-IL')}</span>
                    </div>
                    <p className="text-sm text-emerald-100 whitespace-pre-wrap leading-relaxed">
                      {r.rawText || r.text || 'No content'}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-5 shrink-0">
                <button onClick={() => setShowReportsModal(false)} className="px-4 py-2 bg-emerald-600 text-black font-black uppercase text-xs">Close</button>
              </div>
            </div>
          </div>
        )}

        {showAiModal && selectedMission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowAiModal(false)} />
            <div className="relative bg-[#010a08] border border-emerald-600/60 w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <h2 className="text-lg font-black text-emerald-300 uppercase mb-3">AI Brief — Full Text</h2>
              <p className="text-sm text-amber-100 whitespace-pre-wrap leading-6">
                {selectedMission.aiIntelligenceSummary || 'No AI summary yet'}
              </p>
              <div className="flex justify-end mt-5">
                <button onClick={() => setShowAiModal(false)} className="px-4 py-2 bg-emerald-600 text-black font-black uppercase text-xs">Close</button>
              </div>
            </div>
          </div>
        )}

        {showCreateModal && (
          <CreateMissionModal
            availableAgents={availableAgents}
            onClose={() => setShowCreateModal(false)}
            onAdd={async (data: any) => {
              await createMission(data);
              await loadData();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
};

const CreateMissionModal = ({ availableAgents, onClose, onAdd }: any) => {
  const manager = JSON.parse(localStorage.getItem("user") || "{}");
  const [modalStatus, setModalStatus] = useState<'form' | 'scanning' | 'success'>('form');
  const [logMessage, setLogMessage] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    creatorManager: { id: manager.id, employee_type: "MANAGER" },
    assignedAgents: [] as any[],
  });

  const handleToggleAgent = (agent: any) => {
    const isSelected = formData.assignedAgents.find((a: any) => a.id === agent.id);
    if (isSelected) {
      setFormData({
        ...formData,
        assignedAgents: formData.assignedAgents.filter((a: any) => a.id !== agent.id),
      });
    } else {
      setFormData({
        ...formData,
        assignedAgents: [...formData.assignedAgents, { ...agent, employee_type: "AGENT" }],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalStatus('scanning');

    const pseudoLogs = [
      "ESTABLISHING SECURE SAT-LINK TO SECTOR...",
      "UPLOADING ENCRYPTED MISSION DIRECTIVES...",
      "SYNCING PERSONNEL FREQUENCIES TO SECURE MESH...",
      "BROADCASTING CHANNELS ON SECURE LINK...",
      "OPERATION COMPLETED SUCCESSFULLY."
    ];

    try {
      await onAdd(formData);
    } catch (err) {
      console.error(err);
    }

    for (let i = 0; i < pseudoLogs.length; i++) {
      setLogMessage(pseudoLogs[i]);
      await new Promise(res => setTimeout(res, 500));
    }

    setModalStatus('success');
  };

  if (modalStatus === 'scanning') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="ltr">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
        <div className="relative bg-[#010a08] border-2 border-emerald-500 w-full max-w-md p-8 font-mono text-center flex flex-col items-center justify-center gap-6 shadow-[0_0_50px_rgba(16,185,129,0.4)]">
          <div className="relative w-32 h-32 border border-emerald-500/40 rounded-full flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 radar-sweep opacity-60" />
            <Activity size={32} className="text-emerald-400 animate-pulse" />
          </div>
          <div className="space-y-2 w-full">
            <h3 className="text-emerald-400 font-black tracking-widest text-sm uppercase animate-pulse">TRANSMITTING DIRECTIVES...</h3>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider h-6 truncate">{logMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  if (modalStatus === 'success') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="ltr">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
        <div className="relative bg-[#010a08] border-2 border-emerald-400 w-full max-w-md p-8 font-mono text-center flex flex-col items-center justify-center gap-6 shadow-[0_0_60px_rgba(52,211,153,0.3)] animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full border-2 border-emerald-400 flex items-center justify-center bg-emerald-950/30 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
            <CheckCircle size={36} className="text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-widest">OPERATION LAUNCHED</h3>
            <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">NEW CHANNELS PROVISIONED. ASSETS DEPLOYED.</p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 hover:bg-emerald-400 text-black py-3 font-black uppercase text-xs tracking-widest transition-all shadow-[0_0_15px_#10b981]"
          >
            RETURN TO CONTROL
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="ltr">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#010a08] border-2 border-emerald-600/60 w-full max-w-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)] font-mono flex flex-col">
        <div className="bg-emerald-950/80 border-b border-emerald-600/60 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-black text-emerald-300 uppercase tracking-widest">DRAFT NEW OPERATION</h2>
          <button onClick={onClose} className="text-emerald-500 hover:text-red-400 transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs text-emerald-400 block uppercase font-bold tracking-widest">OPERATION CODENAME</label>
            <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-black/60 border border-emerald-700/60 p-3 text-sm text-emerald-100 outline-none placeholder:text-emerald-900/50" placeholder="E.g. OP BLACKOUT" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-emerald-400 block uppercase font-bold tracking-widest">MISSION DIRECTIVES</label>
            <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black/60 border border-emerald-700/60 p-3 text-sm text-emerald-100 outline-none placeholder:text-emerald-900/50 custom-scrollbar" placeholder="Enter full mission details..." />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-emerald-400 block uppercase font-bold tracking-widest border-b border-emerald-900/50 pb-2 mb-2">ASSIGN PERSONNEL</label>
            <div className="max-h-40 overflow-y-auto custom-scrollbar border border-emerald-900/50 p-2 bg-black/40">
              {availableAgents.length > 0 ? (
                availableAgents.map((agent: any) => (
                  <div
                    key={agent.id}
                    onClick={() => handleToggleAgent(agent)}
                    className={`p-2 mb-1 flex justify-between items-center cursor-pointer border rounded-sm text-sm font-bold tracking-widest uppercase transition-all ${
                      formData.assignedAgents.find((a: any) => a.id === agent.id)
                        ? "bg-emerald-600/30 border-emerald-500 text-emerald-200"
                        : "bg-[#020d0a] border-emerald-900/60 text-emerald-600 hover:border-emerald-600"
                    }`}
                  >
                    <span>{agent.codename}</span>
                    <span className="text-[10px]">{agent.specialty}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs font-bold text-red-500 p-4 uppercase tracking-widest">NO AVAILABLE AGENTS</div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-6 border-t border-emerald-900/60">
            <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-emerald-600 hover:text-emerald-300 border border-transparent hover:border-emerald-800 transition-colors uppercase tracking-widest">CANCEL</button>
            <button type="submit" disabled={formData.assignedAgents.length === 0} className="bg-emerald-600 text-black px-8 py-3 text-sm font-black hover:bg-emerald-400 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed">LAUNCH MISSION</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminMissions;