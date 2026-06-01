import React, { useState, useEffect } from 'react';
import AgentLayout from '../components/AgentLayout';
import { Activity, AlertCircle, MapPin, Clock, Zap, ShieldAlert, Target } from 'lucide-react';
import { getMissions } from '../lib/api';
import { ChatWindow } from '../components/ChatWindow'; 

const AgentDashboard = () => {
  const [activeMission, setActiveMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // שליפת המשתמש (הסוכן) המחובר
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadMission();
  }, []);

  const loadMission = async () => {
    try {
      setLoading(true);
      const allMissions = await getMissions(); 
      
      // סינון: מציג רק משימות שהסוכן הזה משובץ אליהן, ושהן עדיין פעילות
      const myActiveMissions = allMissions.filter((m: any) => 
        m.assignedAgents?.some((agent: any) => agent.id === user.id) &&
        (m.status === 'IN_PROGRESS' || m.status === 'PENDING')
      );

      // ניקח את המשימה הפעילה הראשונה (לרוב לסוכן יש משימה אחת פעילה בכל רגע)
      if (myActiveMissions.length > 0) {
          setActiveMission(myActiveMissions[0]);
      }
    } catch (err) {
      console.error("Failed to load agent missions", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AgentLayout agentName={user.codename || user.fullName}>
      <div className="p-8 h-full flex flex-col font-mono text-xs uppercase tracking-widest relative bg-[#020504]">
        
        {/* --- TOP HUD (Status Bar) --- */}
        <div className="flex justify-between items-center mb-8 bg-black/80 border-b-2 border-emerald-900/50 pb-4 shadow-lg shrink-0">
          <div className="flex gap-10">
            <div className="flex flex-col">
              <span className="text-[9px] text-emerald-800 font-black mb-1">AGENT_VITALS</span>
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-emerald-400 animate-pulse" />
                <div className="w-24 h-1.5 bg-emerald-900/30 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-emerald-500" />
                </div>
              </div>
            </div>
            <div className="flex flex-col border-l border-emerald-900/30 pl-10">
              <span className="text-[9px] text-emerald-800 font-black mb-1">ENCRYPTION_KEY</span>
              <span className="text-emerald-200 font-black">SECURE-UPLINK-V2</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-right">
                <span className="text-[9px] text-amber-800 font-black">SYSTEM_STATUS</span>
                <div className="text-amber-500 font-black text-sm">ONLINE & READY</div>
             </div>
             <Zap size={20} className="text-amber-500 animate-bounce" />
          </div>
        </div>

        {/* --- MAIN INTERFACE --- */}
        <div className="flex-1 flex gap-8 overflow-hidden z-10">
          
          {/* LEFT: MISSION DOSSIER */}
          <div className="flex-1 flex flex-col bg-[#010806] border-2 border-emerald-900/50 p-8 shadow-2xl relative overflow-y-auto custom-scrollbar">
            {/* Tactical Corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-500" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-500" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500" />

            {loading ? (
               <div className="m-auto text-emerald-500 animate-pulse flex flex-col items-center">
                   <Target size={40} className="mb-4 animate-spin-slow" />
                   SCANNING FOR DIRECTIVES...
               </div>
            ) : activeMission ? (
              <>
                <div className="flex justify-between items-start mb-8">
                  <h2 className="text-2xl font-black text-emerald-100 flex items-center gap-3 tracking-widest uppercase">
                    <AlertCircle size={28} className="text-amber-500" />
                    {activeMission.title}
                  </h2>
                  <span className="bg-amber-950 border border-amber-500/50 text-amber-500 px-4 py-1.5 font-black text-[10px] animate-pulse">
                    ACTIVE_OPERATION
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-emerald-950/20 border border-emerald-900/50 p-5">
                      <p className="text-[10px] text-emerald-600 font-black mb-2 flex items-center gap-2"><MapPin size={12}/> SECTOR</p>
                      <p className="text-emerald-300 font-bold text-sm">CLASSIFIED ZONE</p>
                    </div>
                    <div className="bg-emerald-950/20 border border-emerald-900/50 p-5">
                      <p className="text-[10px] text-emerald-600 font-black mb-2 flex items-center gap-2"><Clock size={12}/> STATUS</p>
                      <p className="text-emerald-300 font-bold text-sm">{activeMission.status.replace('_', ' ')}</p>
                    </div>
                  </div>

                  <div className="bg-black/60 border border-emerald-900/60 p-6 flex-1">
                    <p className="text-[10px] text-emerald-500 font-black mb-4 tracking-[0.2em] border-b border-emerald-900/50 pb-2">
                      MISSION_DIRECTIVES:
                    </p>
                    <p className="text-sm text-emerald-100 leading-relaxed font-bold whitespace-pre-wrap">
                      {activeMission.description}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="m-auto flex flex-col items-center text-emerald-900/50 space-y-4">
                 <ShieldAlert size={60} />
                 <h2 className="text-xl font-black tracking-widest">NO ACTIVE DIRECTIVES</h2>
                 <p className="text-xs">AWAITING ORDERS FROM COMMAND</p>
              </div>
            )}
          </div>

          {/* RIGHT: WEBSOCKET CHAT */}
          <div className="w-[400px] flex flex-col gap-4">
            
            <div className="flex-1 flex flex-col overflow-hidden">
               {activeMission && activeMission.creatorManager ? (
                  // פה אנחנו משתילים את הצ'אט! 
                  // הסוכן (currentUser) מדבר עם המנהל שיצר את המשימה (selectedAgentId)
                  <ChatWindow 
                    currentUser={user} 
                    missionId={activeMission.id} 
                    selectedAgentId={activeMission.creatorManager.id} 
                  />
               ) : (
                 <div className="flex-1 bg-[#010806] border border-dashed border-emerald-900/50 flex flex-col items-center justify-center p-6 text-center text-emerald-900/50">
                    <ShieldAlert size={40} className="mb-4 opacity-50" />
                    <span className="font-black uppercase tracking-[0.2em]">SECURE UPLINK OFFLINE</span>
                    <span className="text-[9px] mt-2">REQUIRES ACTIVE MISSION</span>
                 </div>
               )}
            </div>

            {/* Tactical Card */}
            <div className="bg-[#010806] border border-emerald-900/50 p-4 text-[9px] text-emerald-700 space-y-1 font-black tracking-widest shrink-0">
                <p className="flex justify-between"><span>CONNECTION:</span> <span className="text-emerald-500">ENCRYPTED</span></p>
                <p className="flex justify-between"><span>LATENCY:</span> <span className="text-emerald-500">12ms</span></p>
                <p className="flex justify-between"><span>LOCATION_TRACKING:</span> <span className="text-emerald-500">ENABLED</span></p>
            </div>
          </div>

        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentDashboard;