import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import {
  Radio,
  Plus,
  Users,
  MessageSquare,
  Cpu,
  FileText,
  Globe,
  Maximize2,
  X,
  Timer,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import {
  getMissionsByManager,
  createMission,
  getAgentsByDept,
  summarizeMissionAI,
  completeMission,
  deleteMission,
} from '../lib/api';

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

type CreateMissionPayload = {
  title: string;
  description: string;
  creatorManager: { id: string | number; employee_type: 'MANAGER' };
  assignedAgents: Array<Agent & { employee_type: 'AGENT' }>;
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
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
    .toString()
    .padStart(2, '0')}`;
};

const AdminMissions = () => {
  const navigate = useNavigate();
  const manager = safeParseUser();
  const managerDept = manager.department || 'OPERATIONS';
  const managerId = manager.id;

  const [missions, setMissions] = useState<Mission[]>([]);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDescModal, setShowDescModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [missionsView, setMissionsView] = useState<MissionsView>('ACTIVE');

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

  const handleCompleteMission = async () => {
    if (!selectedMission?.id) return;
    const missionIdNum = toNumberId(selectedMission.id);
    if (missionIdNum === null) return;

    const ok = window.confirm('Are you sure you want to complete this mission?');
    if (!ok) return;

    const missionId = selectedMission.id;

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

    try {
      await completeMission(missionIdNum);
      await loadData();
    } catch {
      await loadData();
    }
  };

  const handleDeleteMission = async () => {
    if (!selectedMission?.id || isDeleting) return;

    const missionIdNum = toNumberId(selectedMission.id);
    if (missionIdNum === null) return;

    const ok = window.confirm('Delete this mission permanently? This action cannot be undone.');
    if (!ok) return;

    const missionId = selectedMission.id;
    const backup = selectedMission;

    setIsDeleting(true);
    setMissions((prev) => prev.filter((m) => m.id !== missionId));
    setSelectedMission(null);

    try {
      await deleteMission(missionIdNum);
      await loadData();
    } catch {
      setMissions((prev) => [backup, ...prev]);
      await loadData();
    } finally {
      setIsDeleting(false);
    }
  };

  const isMissionActive =
    selectedMission?.status === 'IN_PROGRESS' || selectedMission?.status === 'PENDING';

  return (
    <AdminLayout>
      <div className="h-full flex flex-col font-mono text-emerald-500 bg-[#010504] p-4 gap-4">
        <div className="flex justify-between items-center border-b border-emerald-900/60 pb-4">
          <div>
            <h1 className="text-3xl font-black tracking-widest uppercase text-emerald-300 flex items-center gap-3">
              <Globe size={30} className="opacity-60" />
              Operations Control
            </h1>
            <p className="text-xs text-emerald-600 uppercase tracking-widest mt-1">
              Missions + Full Details
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 text-black px-5 py-3 font-black flex items-center gap-2 hover:bg-emerald-400 transition-all rounded-sm uppercase"
          >
            <Plus size={18} /> New Mission
          </button>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-12 gap-4">
          <aside className="col-span-12 lg:col-span-3 bg-[#010806]/80 border border-emerald-900/40 rounded p-3 min-h-0 flex flex-col gap-3">
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

            <h2 className="text-xs font-black tracking-widest text-emerald-100 uppercase flex items-center gap-2 border-b border-emerald-500/30 pb-2">
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

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
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

                  {!!m.assignedAgents?.length && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.assignedAgents.slice(0, 3).map((a) => (
                        <span
                          key={a.id}
                          className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-800/60 text-emerald-300"
                        >
                          {a.codename}
                        </span>
                      ))}
                      {m.assignedAgents.length > 3 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-800/60 text-emerald-400">
                          +{m.assignedAgents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}

              {!loading && displayedMissions.length === 0 && (
                <div className="text-center text-emerald-700 text-xs uppercase tracking-widest py-6">
                  {missionsView === 'ACTIVE' ? 'No active operations' : 'No inactive operations'}
                </div>
              )}
            </div>
          </aside>

          <section className="col-span-12 lg:col-span-9 bg-[#010806]/80 border border-emerald-900/40 rounded p-4 min-h-0 flex flex-col">
            {!selectedMission ? (
              <div className="m-auto text-emerald-700 uppercase tracking-widest text-sm">
                Select a mission from the left panel
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3 mb-3">
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
                        onClick={handleCompleteMission}
                        className="bg-red-600 text-white px-3 py-2 text-xs font-black uppercase hover:bg-red-500"
                      >
                        Complete Mission
                      </button>
                    ) : (
                      <button
                        onClick={handleDeleteMission}
                        disabled={isDeleting}
                        className="bg-red-800 text-white px-3 py-2 text-xs font-black uppercase flex items-center gap-2 hover:bg-red-700 disabled:opacity-50"
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
                      onClick={() => navigate(`/admin/comms?missionId=${selectedMission.id}`)}
                      className="bg-cyan-600 text-black px-3 py-2 text-xs font-black uppercase flex items-center gap-2 hover:bg-cyan-400"
                    >
                      <MessageSquare size={14} /> Open Comms
                    </button>
                  </div>
                </div>

                <div className="border border-emerald-900/50 rounded p-3 bg-black/30 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                      Mission Description
                    </h4>
                    <button
                      onClick={() => setShowDescModal(true)}
                      className="text-[10px] text-emerald-500 uppercase font-bold flex items-center gap-1"
                    >
                      <Maximize2 size={12} /> Expand
                    </button>
                  </div>
                  <p className="text-sm text-emerald-100 whitespace-pre-wrap leading-6 line-clamp-3">
                    {selectedMission.description || 'No description'}
                  </p>
                </div>

                <div className="border border-emerald-900/50 rounded p-3 bg-black/20 mb-4">
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
                  <div className="col-span-12 xl:col-span-5 border border-emerald-500/70 rounded p-3 min-h-0 flex flex-col bg-[#03140f]/60 shadow-[0_0_24px_rgba(16,185,129,0.15)]">
                    <div className="flex items-center justify-between mb-2 border-b border-emerald-700/40 pb-2">
                      <h4 className="text-sm font-black text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16} /> Mission Reports
                      </h4>
                      <span className="text-[10px] px-2 py-1 rounded border border-emerald-700/60 text-emerald-300">
                        {missionReports.length} TOTAL
                      </span>
                    </div>

                    <div className="flex-1 min-h-0 pr-1 custom-scrollbar space-y-2 overflow-y-auto">
                      {missionReports.map((r, i) => (
                        <div
                          key={r.id || i}
                          className="bg-[#022018] border border-emerald-700/60 border-l-4 border-l-emerald-400 p-3 rounded"
                        >
                          <div className="flex justify-between text-[10px] text-emerald-400 mb-1">
                            <span>{r.author?.codename || r.author?.fullName || 'UNKNOWN ASSET'}</span>
                            <span>{new Date(r.timestamp || r.createdAt || 0).toLocaleString('he-IL')}</span>
                          </div>
                          <p className="text-sm text-emerald-100 whitespace-pre-wrap">
                            {r.rawText || r.text || 'No content'}
                          </p>
                        </div>
                      ))}

                      {missionReports.length === 0 && (
                        <div className="text-xs text-emerald-700 uppercase tracking-widest py-6 text-center">
                          No reports for this mission
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-12 xl:col-span-7 border border-amber-600/40 rounded p-4 min-h-0 flex flex-col bg-[#140f03]/40 shadow-[0_0_24px_rgba(245,158,11,0.15)]">
                    <div className="flex items-center justify-between mb-3 border-b border-amber-700/30 pb-2">
                      <h4 className="text-sm font-black text-amber-300 uppercase tracking-widest flex items-center gap-2">
                        <Cpu size={16} /> AI Intelligence Brief
                      </h4>
                      <button
                        onClick={() => setShowAiModal(true)}
                        className="text-[10px] text-amber-300 uppercase font-bold flex items-center gap-1"
                      >
                        <Maximize2 size={12} /> Expand
                      </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
                      <p className="text-sm text-amber-100 whitespace-pre-wrap leading-7">
                        {selectedMission.aiIntelligenceSummary || 'No AI summary yet'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        {showDescModal && selectedMission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowDescModal(false)} />
            <div className="relative bg-[#010a08] border border-emerald-600/60 w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <h2 className="text-lg font-black text-emerald-300 uppercase mb-3">Mission Description — Full Text</h2>
              <p className="text-sm text-emerald-100 whitespace-pre-wrap leading-6">
                {selectedMission.description || 'No description'}
              </p>
              <div className="flex justify-end mt-5">
                <button
                  onClick={() => setShowDescModal(false)}
                  className="px-4 py-2 bg-emerald-600 text-black font-black uppercase text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showAiModal && selectedMission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowAiModal(false)} />
            <div className="relative bg-[#010a08] border border-emerald-600/60 w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <h2 className="text-lg font-black text-emerald-300 uppercase mb-3">AI Brief — Full Text</h2>
              <p className="text-sm text-emerald-100 whitespace-pre-wrap leading-6">
                {selectedMission.aiIntelligenceSummary || 'No AI summary yet'}
              </p>
              <div className="flex justify-end mt-5">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 bg-emerald-600 text-black font-black uppercase text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showCreateModal && (
          <CreateMissionModal
            availableAgents={availableAgents}
            onClose={() => setShowCreateModal(false)}
            onAdd={async (data) => {
              await createMission(data);
              await loadData();
              setShowCreateModal(false);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
};

type CreateMissionModalProps = {
  availableAgents: Agent[];
  onClose: () => void;
  onAdd: (data: CreateMissionPayload) => Promise<void> | void;
};

const CreateMissionModal = ({ availableAgents, onClose, onAdd }: CreateMissionModalProps) => {
  const manager = safeParseUser();

  const [formData, setFormData] = useState<CreateMissionPayload>({
    title: '',
    description: '',
    creatorManager: {
      id: (manager.id ?? '') as string | number,
      employee_type: 'MANAGER',
    },
    assignedAgents: [],
  });

  const handleToggleAgent = (agent: Agent) => {
    const isSelected = formData.assignedAgents.find((a) => a.id === agent.id);

    if (isSelected) {
      setFormData({
        ...formData,
        assignedAgents: formData.assignedAgents.filter((a) => a.id !== agent.id),
      });
    } else {
      setFormData({
        ...formData,
        assignedAgents: [...formData.assignedAgents, { ...agent, employee_type: 'AGENT' }],
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="ltr">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#010a08] border-2 border-emerald-600/60 w-full max-w-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)] font-mono flex flex-col">
        <div className="bg-emerald-950/80 border-b border-emerald-600/60 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-black text-emerald-300 uppercase tracking-widest">
            DRAFT NEW OPERATION
          </h2>

          <button
            onClick={onClose}
            className="text-emerald-500 hover:text-red-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAdd(formData);
          }}
          className="p-8 space-y-6"
        >
          <div className="space-y-2">
            <label className="text-xs text-emerald-400 block uppercase font-bold tracking-widest">
              OPERATION CODENAME
            </label>

            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-black/60 border border-emerald-700/60 p-3 text-sm text-emerald-100 outline-none placeholder:text-emerald-900/50"
              placeholder="E.g. OP BLACKOUT"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-emerald-400 block uppercase font-bold tracking-widest">
              MISSION DIRECTIVES
            </label>

            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-black/60 border border-emerald-700/60 p-3 text-sm text-emerald-100 outline-none placeholder:text-emerald-900/50 custom-scrollbar"
              placeholder="Enter full mission details..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-emerald-400 block uppercase font-bold tracking-widest border-b border-emerald-900/50 pb-2 mb-2">
              ASSIGN PERSONNEL
            </label>

            <div className="max-h-40 overflow-y-auto custom-scrollbar border border-emerald-900/50 p-2 bg-black/40">
              {availableAgents.length > 0 ? (
                availableAgents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => handleToggleAgent(agent)}
                    className={`p-2 mb-1 flex justify-between items-center cursor-pointer border rounded-sm text-sm font-bold tracking-widest uppercase transition-all ${
                      formData.assignedAgents.find((a) => a.id === agent.id)
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                        : 'bg-[#020d0a] border-emerald-900/60 text-emerald-600 hover:border-emerald-600'
                    }`}
                  >
                    <span>{agent.codename}</span>
                    <span className="text-[10px]">{agent.specialty}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs font-bold text-red-500 p-4 uppercase tracking-widest">
                  NO AVAILABLE AGENTS
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-emerald-900/60">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-emerald-600 hover:text-emerald-300 border border-transparent hover:border-emerald-800 transition-colors uppercase tracking-widest"
            >
              CANCEL
            </button>

            <button
              type="submit"
              disabled={formData.assignedAgents.length === 0}
              className="bg-emerald-600 text-black px-8 py-3 text-sm font-black hover:bg-emerald-400 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              LAUNCH MISSION
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminMissions;
