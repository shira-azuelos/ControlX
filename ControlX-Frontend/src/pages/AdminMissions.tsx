import React, { useState, useEffect } from "react";

import AdminLayout from "../components/AdminLayout";

import {
  Radio,
  Cpu,
  Plus,
  X,
  Users,
  CheckCircle,
  FileText,
  AlertTriangle,
  Trash2,
  Timer,
  ShieldAlert,
  Globe,
  Activity,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  List,
  Send,
  Globe2,
} from "lucide-react";

import {
  getMissionsByManager,
  createMission,
  getAgentsByDept,
  completeMission,
  summarizeMissionAI,
  deleteMission,
} from "../lib/api";

import { ChatWindow } from "../components/ChatWindow";

const AdminMissions = () => {
  const [missions, setMissions] = useState<any[]>([]);

  const [availableAgents, setAvailableAgents] = useState<any[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [selectedMission, setSelectedMission] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);

  const manager = JSON.parse(localStorage.getItem("user") || "{}");

  const managerDept = manager.department || "OPERATIONS";

  const managerId = manager.id;

  const loadData = async () => {
    if (!managerId) return;

    try {
      setLoading(true);

      const missionsData = await getMissionsByManager(managerId);

      setMissions(missionsData);

      const agentsData = await getAgentsByDept(managerDept);

      setAvailableAgents(
        agentsData.filter((a: any) => a.status === "AVAILABLE"),
      );

      if (selectedMission) {
        const updatedMission = missionsData.find(
          (m: any) => m.id === selectedMission.id,
        );

        if (updatedMission) setSelectedMission(updatedMission);
      }
    } catch (err) {
      console.error("Failed to load operations data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [managerId]);

  const handleDelete = async (e: any, id: number) => {
    e.stopPropagation();

    if (
      window.confirm(
        "Delete this mission permanently? This action cannot be undone.",
      )
    ) {
      await deleteMission(id);

      loadData();
    }
  };

  const activeMissions = missions.filter(
    (m) => m.status === "IN_PROGRESS" || m.status === "PENDING",
  );

  const completedMissions = missions.filter(
    (m) => m.status === "COMPLETED" || m.status === "ABORTED",
  );

  return (
    <AdminLayout>
      <div
        className="h-full flex flex-col font-mono text-emerald-500 relative bg-[#010504]"
        dir="ltr"
      >
        {/* Scanline Effect */}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] z-0 opacity-10" />

        <div className="flex justify-between items-center mb-8 border-b border-emerald-900/60 pb-6 relative z-10 shrink-0 p-4">
          <div>
            <h1 className="text-4xl font-bold tracking-widest uppercase text-emerald-300 flex items-center gap-4">
              <Globe className="text-emerald-500 opacity-50" size={36} />
              Operations Control
            </h1>

            <p className="text-sm font-semibold text-emerald-400 tracking-widest uppercase mt-2">
              Mission Management & Live Intel
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 text-black px-8 py-4 font-black flex items-center gap-3 hover:bg-emerald-400 hover:shadow-[0_0_20px_#10b981] transition-all rounded-sm tracking-widest uppercase text-lg"
          >
            <Plus size={24} /> LAUNCH NEW OPERATION
          </button>
        </div>

        <div className="flex-1 flex gap-8 overflow-hidden relative z-10 pb-4 px-4">
          <div className="w-1/2 flex flex-col h-full bg-[#010806]/80 rounded-md border border-emerald-900/40 p-5 shadow-2xl backdrop-blur-sm">
            <h2 className="text-xl font-bold tracking-widest text-emerald-100 uppercase flex items-center gap-3 border-b border-emerald-500/30 pb-3 mb-4 shrink-0">
              <Radio className="animate-pulse text-emerald-400" /> Active
              Deployments ({activeMissions.length})
            </h2>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
              {activeMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onClick={() => setSelectedMission(mission)}
                />
              ))}

              {activeMissions.length === 0 && !loading && (
                <div className="p-10 border border-dashed border-emerald-900/50 text-center text-emerald-700 font-bold uppercase tracking-widest">
                  NO ACTIVE OPERATIONS
                </div>
              )}
            </div>
          </div>

          <div className="w-1/2 flex flex-col h-full bg-[#010806]/80 rounded-md border border-emerald-900/40 p-5 shadow-2xl backdrop-blur-sm">
            <h2 className="text-xl font-bold tracking-widest text-emerald-700 uppercase flex items-center gap-3 border-b border-emerald-900/50 pb-3 mb-4 shrink-0">
              <CheckCircle size={20} /> Mission Archive (
              {completedMissions.length})
            </h2>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 opacity-80 hover:opacity-100 transition-opacity">
              {completedMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onClick={() => setSelectedMission(mission)}
                  onDelete={handleDelete}
                />
              ))}

              {completedMissions.length === 0 && !loading && (
                <div className="p-10 border border-dashed border-emerald-900/50 text-center text-emerald-700 font-bold uppercase tracking-widest">
                  ARCHIVE IS EMPTY
                </div>
              )}
            </div>
          </div>
        </div>

        {showCreateModal && (
          <CreateMissionModal
            availableAgents={availableAgents}
            onClose={() => setShowCreateModal(false)}
            onAdd={async (data: any) => {
              await createMission(data);

              loadData();

              setShowCreateModal(false);
            }}
          />
        )}

        {selectedMission && (
          <MissionDossier
            mission={selectedMission}
            onClose={() => setSelectedMission(null)}
            onRefresh={loadData}
          />
        )}
      </div>
    </AdminLayout>
  );
};

const MissionCard = ({ mission, onClick, onDelete }: any) => {
  const isCompleted =
    mission.status === "COMPLETED" || mission.status === "ABORTED";

  return (
    <div
      onClick={onClick}
      className={`p-5 border cursor-pointer transition-all rounded-sm shadow-md group relative ${isCompleted ? "bg-[#010a08] border-emerald-900/40 hover:border-emerald-700" : "bg-[#02120e] border-emerald-600/50 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2">
          <span className="bg-emerald-900/50 px-2 py-0.5 border border-emerald-700/50">
            OP-ID: {mission.id}
          </span>

          {!isCompleted && (
            <span className="text-amber-500 animate-pulse flex items-center gap-1">
              <Activity size={10} /> LIVE
            </span>
          )}
        </div>

        {isCompleted && onDelete && (
          <button
            onClick={(e) => onDelete(e, mission.id)}
            className="text-emerald-900 hover:text-red-500 hover:bg-red-950/30 p-1.5 rounded transition-all opacity-0 group-hover:opacity-100"
            title="Delete Mission"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <h3
        className={`text-xl font-black uppercase tracking-widest mb-2 pr-6 ${isCompleted ? "text-emerald-700" : "text-emerald-100 group-hover:text-white"}`}
      >
        {mission.title}
      </h3>

      <div className="flex items-center justify-between mt-4 border-t border-emerald-900/40 pt-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
          <Users size={14} /> Assigned Assets:{" "}
          {mission.assignedAgents?.length || 0}
        </div>

        <div
          className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${!isCompleted ? "bg-emerald-900/50 text-emerald-400 border border-emerald-500/30" : "bg-emerald-950 text-emerald-700"}`}
        >
          {mission.status.replace("_", " ")}
        </div>
      </div>
    </div>
  );
};

// --- MISSION DOSSIER ---

const MissionDossier = ({ mission, onClose, onRefresh }: any) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const [elapsedTime, setElapsedTime] = useState(0);

  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Chat Overlay State

  const [showChatOverlay, setShowChatOverlay] = useState(false);

  const [selectedChatAgentId, setSelectedChatAgentId] = useState<
    number | "ALL"
  >("ALL"); // 'ALL' means group chat

  const isCompleted =
    mission.status === "COMPLETED" || mission.status === "ABORTED";

  const hasReports = mission.reports && mission.reports.length > 0;

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    let interval: any;

    if (!isCompleted && mission.startedAt) {
      const calculateElapsed = () => {
        const start = new Date(mission.startedAt).getTime();

        const now = new Date().getTime();

        return Math.max(0, Math.floor((now - start) / 1000));
      };

      setElapsedTime(calculateElapsed());

      interval = setInterval(() => {
        setElapsedTime(calculateElapsed());
      }, 1000);
    } else if (isCompleted) {
      setElapsedTime(0);
    }

    return () => clearInterval(interval);
  }, [isCompleted, mission.startedAt]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);

    const m = Math.floor((seconds % 3600) / 60);

    const s = seconds % 60;

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleEndMission = async () => {
    if (
      window.confirm(
        "Are you sure you want to terminate this mission? Agents will be extracted.",
      )
    ) {
      await completeMission(mission.id);

      await onRefresh();
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);

    await summarizeMissionAI(mission.id);

    await onRefresh();

    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 text-left">
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
        onClick={onClose}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `

        @keyframes spin-slow { 100% { transform: rotate(360deg); } }

        .radar-sweep { background: conic-gradient(from 0deg, rgba(16, 185, 129, 0.4) 0%, transparent 30%); animation: spin-slow 4s linear infinite; border-radius: 50%; }

      `,
        }}
      />

      <div className="relative bg-[#020a08] border-2 border-emerald-500 w-full max-w-7xl h-[95vh] flex flex-col font-mono shadow-[0_0_100px_rgba(16,185,129,0.3)] overflow-hidden">
        {/* --- HEADER --- */}

        <div className="bg-black border-b-2 border-emerald-500 px-8 py-6 flex justify-between items-center shrink-0">
          <div className="flex flex-col gap-3">
            <span className="text-emerald-500 text-[10px] font-black tracking-[0.4em] uppercase opacity-70 flex items-center gap-2">
              <ShieldAlert size={14} /> Classified Dossier
            </span>

            <div className="flex items-center gap-6">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter border-r-2 border-emerald-900 pr-6 mr-6">
                {mission.title}
              </h2>

              {!isCompleted ? (
                <button
                  onClick={handleEndMission}
                  className="group relative flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-sm transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                >
                  <X
                    size={24}
                    className="group-hover:rotate-90 transition-transform"
                  />

                  <div className="flex flex-col items-start">
                    <span className="font-black text-sm uppercase tracking-widest">
                      TERMINATE & EXTRACT
                    </span>

                    <span className="text-[9px] opacity-80 uppercase tracking-wider">
                      Click to complete operation
                    </span>
                  </div>
                </button>
              ) : (
                <div className="text-sm font-black bg-emerald-950/20 px-4 py-2 border border-emerald-900/30 text-emerald-800 uppercase tracking-widest">
                  STATUS: ARCHIVED
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-8">
            {!isCompleted && (
              <div className="bg-emerald-950/20 border border-emerald-800/50 p-3 rounded-sm flex flex-col items-center min-w-[150px]">
                <span className="text-[10px] text-emerald-600 font-black uppercase mb-1">
                  Time in Sector
                </span>

                <div className="text-2xl text-amber-500 font-black tracking-tighter flex items-center gap-2">
                  <Timer size={20} className="animate-pulse" />{" "}
                  {formatTime(elapsedTime)}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="flex flex-col items-center justify-center bg-emerald-900/20 hover:bg-red-600 hover:text-white text-emerald-500 p-4 border border-emerald-800 transition-all min-w-[80px]"
            >
              <X size={28} />

              <span className="text-[10px] font-black mt-2 uppercase text-center tracking-widest">
                CLOSE
              </span>
            </button>
          </div>
        </div>

        {/* --- MAIN CONTENT (When Chat Overlay is OFF) --- */}

        <div className="flex-1 overflow-hidden flex relative">
          {/* LEFT SIDE: Directives & Agents */}

          <div className="w-[40%] border-r-2 border-emerald-900/50 p-6 flex flex-col gap-6 bg-[#010806] overflow-y-auto custom-scrollbar">
            {/* MISSION DIRECTIVES */}

            <div className="flex flex-col relative shrink-0">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                  <FileText size={16} /> MISSION DIRECTIVES
                </h3>
              </div>

              <div className="relative bg-emerald-950/10 border border-emerald-900/50 p-4 shadow-inner">
                <p
                  className={`text-sm text-emerald-100 font-bold leading-relaxed whitespace-pre-wrap transition-all duration-300 ${!isDescExpanded ? "line-clamp-4" : ""}`}
                >
                  {mission.description}
                </p>
              </div>

              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="w-full bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-500 font-black text-[10px] uppercase py-2 tracking-widest flex items-center justify-center gap-2 border border-t-0 border-emerald-900/50 transition-colors"
              >
                {isDescExpanded ? "COLLAPSE" : "EXPAND DIRECTIVES"}{" "}
                {isDescExpanded ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
            </div>

            {/* DEPLOYED ASSETS (Just info) */}

            <div className="flex flex-col">
              <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Users size={16} /> DEPLOYED ASSETS
              </h3>

              <div className="grid grid-cols-1 gap-2">
                {mission.assignedAgents?.map((agent: any) => (
                  <div
                    key={agent.id}
                    className="bg-black/40 border border-emerald-800 p-3 flex items-center justify-between rounded-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>

                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>

                      <span className="font-black text-emerald-100 uppercase tracking-widest text-sm">
                        {agent.codename}
                      </span>
                    </div>

                    <span className="text-[9px] bg-emerald-900/30 px-2 py-1 text-emerald-500 font-bold border border-emerald-800 uppercase">
                      {agent.specialty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Reports, AI, Radar, and the BIG CHAT BUTTON */}

          <div className="w-[60%] flex flex-col bg-[#010504]">
            {/* TOP HALF: RAW REPORTS & RADAR */}

            <div className="h-[45%] flex border-b-2 border-emerald-900/50">
              {/* Reports Feed */}

              <div className="w-[65%] p-6 flex flex-col border-r-2 border-emerald-900/50 bg-[#010806]">
                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <List size={16} /> RAW FIELD REPORTS
                </h3>

                <div className="flex-1 bg-black/60 border border-emerald-900/50 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                  {mission.reports?.length > 0 ? (
                    mission.reports.map((rep: any, i: number) => (
                      <div
                        key={i}
                        className="text-[10px] border-b border-emerald-900/30 pb-2 last:border-0"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-emerald-500 font-black uppercase">
                            [{rep.author?.codename || "AGENT"}]
                          </span>

                          <span className="text-emerald-700 font-bold">
                            {new Date(rep.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",

                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <span className="text-emerald-100 text-xs font-bold leading-relaxed">
                          {rep.rawText}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="m-auto flex flex-col items-center gap-2 text-emerald-900 opacity-60">
                      <List size={30} />

                      <span className="text-[10px] font-black uppercase tracking-widest">
                        NO FIELD REPORTS FILED YET
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Radar & Comms Button */}

              <div className="w-[35%] flex flex-col">
                <div className="flex-1 relative bg-[#010806] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 radar-sweep opacity-30" />

                  <div className="absolute w-full h-[1px] bg-emerald-700/40" />

                  <div className="absolute h-full w-[1px] bg-emerald-700/40" />

                  <div className="absolute w-20 h-20 border border-emerald-700/30 rounded-full" />

                  <div className="absolute w-32 h-32 border border-emerald-700/30 rounded-full" />

                  {!isCompleted &&
                    mission.assignedAgents?.map((agent: any, i: number) => (
                      <div
                        key={i}
                        className="absolute flex flex-col items-center gap-1"
                        style={{
                          top: `${30 + i * 20}%`,

                          left: `${40 + i * 10}%`,
                        }}
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>

                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      </div>
                    ))}
                </div>

                {/* THE GIANT CHAT BUTTON */}

                <button
                  onClick={() => setShowChatOverlay(true)}
                  className="bg-emerald-600 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-sm py-6 border-t-2 border-emerald-900 transition-all flex flex-col items-center gap-2 group shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  <MessageSquare
                    size={24}
                    className="group-hover:scale-110 transition-transform"
                  />
                  INITIATE SECURE CHAT
                </button>
              </div>
            </div>

            {/* BOTTOM HALF: AI SYNTHESIS */}

            <div className="flex-1 p-6 flex flex-col bg-[#010806]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Cpu size={20} /> AI INTELLIGENCE SYNTHESIS
                </h3>

                <button
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !hasReports}
                  className="bg-amber-600 hover:bg-amber-500 disabled:bg-emerald-950 disabled:border disabled:border-emerald-900 disabled:text-emerald-800 text-black px-6 py-2 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  {isGenerating ? (
                    <Activity className="animate-spin" size={16} />
                  ) : (
                    <Cpu size={16} />
                  )}

                  <span className="font-black uppercase text-xs tracking-widest">
                    {isGenerating ? "PROCESSING..." : "GENERATE BRIEF"}
                  </span>
                </button>
              </div>

              <div className="flex-1 bg-black border-2 border-emerald-900 p-6 relative overflow-hidden flex flex-col">
                {mission.aiIntelligenceSummary ? (
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                    <p className="text-[15px] text-amber-100/90 leading-relaxed font-bold whitespace-pre-wrap">
                      {mission.aiIntelligenceSummary}
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-emerald-900 opacity-50">
                    <AlertTriangle size={36} className="mb-3" />

                    <span className="text-sm font-black uppercase tracking-widest">
                      AWAITING RAW DATA FOR ANALYSIS
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================== */}

          {/* THE WHATSAPP-STYLE CHAT OVERLAY                                */}

          {/* ============================================================== */}

          {showChatOverlay && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in zoom-in duration-200">
              <div className="w-full max-w-5xl h-full bg-[#111b21] rounded-lg shadow-2xl flex overflow-hidden border border-emerald-900/50">
                {/* ====================================================== */}

                {/* LEFT SIDEBAR                                           */}

                {/* ====================================================== */}

                <div className="w-[30%] bg-[#111b21] border-r border-[#222d34] flex flex-col min-h-0">
                  {/* Sidebar Header */}

                  <div className="bg-[#202c33] p-4 flex items-center justify-between text-[#d1d7db] shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-100 font-bold uppercase">
                        {currentUser.fullName
                          ? currentUser.fullName.charAt(0)
                          : "HQ"}
                      </div>

                      <span className="font-bold">Command (You)</span>
                    </div>

                    <button
                      onClick={() => setShowChatOverlay(false)}
                      className="text-[#aebac1] hover:text-white transition-colors"
                      title="Close Chat"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Search */}

                  <div className="bg-[#111b21] p-2 border-b border-[#222d34] shrink-0">
                    <div className="bg-[#202c33] rounded-lg p-2 px-4 flex items-center gap-4 text-[#aebac1]">
                      <List size={18} />

                      <span className="text-sm">Agents on OP {mission.id}</span>
                    </div>
                  </div>

                  {/* Contacts */}

                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#111b21] min-h-0">
                    {/* Broadcast */}

                    <div
                      onClick={() => setSelectedChatAgentId("ALL")}
                      className={`p-3 pr-4 flex items-center gap-4 cursor-pointer hover:bg-[#202c33] transition-colors ${
                        selectedChatAgentId === "ALL" ? "bg-[#2a3942]" : ""
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                        <Globe2 className="text-emerald-100" size={24} />
                      </div>

                      <div className="flex-1 border-b border-[#222d34] pb-3 flex flex-col justify-center">
                        <span className="text-[#e9edef] text-[17px]">
                          Operation Broadcast
                        </span>

                        <span className="text-[#8696a0] text-[13px] truncate">
                          Message all deployed agents
                        </span>
                      </div>
                    </div>

                    {/* Agents */}

                    {mission.assignedAgents?.map((agent: any) => (
                      <div
                        key={agent.id}
                        onClick={() => setSelectedChatAgentId(agent.id)}
                        className={`p-3 pr-4 flex items-center gap-4 cursor-pointer hover:bg-[#202c33] transition-colors ${
                          selectedChatAgentId === agent.id ? "bg-[#2a3942]" : ""
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-[#6b7c85] flex items-center justify-center text-white font-bold text-xl uppercase shrink-0">
                          {agent.codename.charAt(0)}
                        </div>

                        <div className="flex-1 border-b border-[#222d34] pb-3 flex flex-col justify-center">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[#e9edef] text-[17px] capitalize">
                              {agent.codename.toLowerCase()}
                            </span>

                            <span className="text-[#25d366] text-xs font-bold uppercase">
                              {agent.specialty}
                            </span>
                          </div>

                          <span className="text-[#8696a0] text-[13px] flex items-center gap-1 truncate">
                            <Activity size={12} className="text-[#25d366]" />
                            Secure channel open
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ====================================================== */}

                {/* RIGHT CHAT AREA                                        */}

                {/* ====================================================== */}

                <div
                  className="flex-1 bg-[#0b141a] flex flex-col relative overflow-hidden min-h-0"
                  style={{
                    backgroundImage:
                      'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',

                    backgroundRepeat: "repeat",
                  }}
                >
                  {/* Header */}

                  <div className="bg-[#202c33] p-3 px-4 flex items-center gap-4 z-10 shrink-0 border-b border-[#2a3942]">
                    <div className="w-10 h-10 rounded-full bg-[#6b7c85] flex items-center justify-center text-white font-bold shrink-0">
                      {selectedChatAgentId === "ALL" ? (
                        <Globe2 size={20} />
                      ) : (
                        mission.assignedAgents

                          ?.find((a: any) => a.id === selectedChatAgentId)

                          ?.codename.charAt(0)
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[#e9edef] font-medium text-[16px] capitalize">
                        {selectedChatAgentId === "ALL"
                          ? "Operation Broadcast"
                          : mission.assignedAgents

                              ?.find((a: any) => a.id === selectedChatAgentId)

                              ?.codename.toLowerCase()}
                      </span>

                      <span className="text-[#8696a0] text-[13px]">
                        {selectedChatAgentId === "ALL"
                          ? `${mission.assignedAgents?.length} participants`
                          : "Online"}
                      </span>
                    </div>
                  </div>

                  {/* Chat Container */}

                  <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-4">
                    <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-[#222d34] bg-[#0b141a]/70">
                      <ChatWindow
                        currentUser={currentUser}
                        missionId={mission.id}
                        selectedAgentId={
                          selectedChatAgentId === "ALL"
                            ? null
                            : selectedChatAgentId
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateMissionModal = ({ availableAgents, onClose, onAdd }: any) => {
  const manager = JSON.parse(localStorage.getItem("user") || "{}");

  const [formData, setFormData] = useState({
    title: "",

    description: "",

    creatorManager: { id: manager.id, employee_type: "MANAGER" },

    assignedAgents: [] as any[],
  });

  const handleToggleAgent = (agent: any) => {
    const isSelected = formData.assignedAgents.find(
      (a: any) => a.id === agent.id,
    );

    if (isSelected) {
      setFormData({
        ...formData,

        assignedAgents: formData.assignedAgents.filter(
          (a: any) => a.id !== agent.id,
        ),
      });
    } else {
      setFormData({
        ...formData,

        assignedAgents: [
          ...formData.assignedAgents,

          { ...agent, employee_type: "AGENT" },
        ],
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      dir="ltr"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

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
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
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
                availableAgents.map((agent: any) => (
                  <div
                    key={agent.id}
                    onClick={() => handleToggleAgent(agent)}
                    className={`p-2 mb-1 flex justify-between items-center cursor-pointer border rounded-sm text-sm font-bold tracking-widest uppercase transition-all ${formData.assignedAgents.find((a: any) => a.id === agent.id) ? "bg-emerald-600/30 border-emerald-500 text-emerald-200" : "bg-[#020d0a] border-emerald-900/60 text-emerald-600 hover:border-emerald-600"}`}
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
