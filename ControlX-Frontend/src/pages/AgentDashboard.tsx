import React, { useState, useEffect } from 'react';
import AgentLayout from '../components/AgentLayout';
import { Activity, AlertCircle, MapPin, Clock, Zap, ShieldAlert, Target, Send, FileText,Wifi } from 'lucide-react';
import { getMissions, submitReport } from '../lib/api';
import { ChatWindow } from '../components/ChatWindow'; 

const AgentDashboard = () => {
  const [activeMission, setActiveMission] = useState<any>(null);
  const [newReport, setNewReport] = useState('');
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadMission();
  }, []);

  const loadMission = async () => {
    try {
      setLoading(true);
      const allMissions = await getMissions(); 
      const myActiveMissions = allMissions.filter((m: any) => 
        m.assignedAgents?.some((agent: any) => agent.id === user.id) &&
        (m.status === 'IN_PROGRESS' || m.status === 'PENDING')
      );

      if (myActiveMissions.length > 0) {
          setActiveMission(myActiveMissions[0]);
      }
    } catch (err) {
      console.error("Failed to load agent missions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.trim() || !activeMission) return;

    try {
      await submitReport(activeMission.id, user.id, newReport);
      setNewReport('');
      alert("Report transmitted successfully.");
    } catch (err) {
      alert("Comms Failure: Report not transmitted.");
    }
  };

  return (
    <AgentLayout agentName={user.codename || user.fullName}>
      <div className="p-8 h-full flex flex-col font-mono text-xs uppercase tracking-widest relative bg-[#020504]">
        
        {/* --- TOP HUD --- */}
<div className="flex justify-between items-center mb-6 bg-[#0a0f0d] border border-emerald-900/50 p-4 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-emerald-500 font-bold">
              <Activity size={16} /> <span>AGENT_ACTIVE</span>
            </div>
            <div className="h-4 w-[1px] bg-emerald-900" />
            <div className="text-emerald-700">STATUS: <span className="text-emerald-300">SECURE_LINK</span></div>
          </div>
          <div className="flex items-center gap-4 text-amber-500 font-black">
             <span>SYSTEM: ONLINE</span>
             <Wifi size={16} />
          </div>
        </div>

        {/* --- MAIN INTERFACE --- */}
        <div className="flex-1 flex gap-6 overflow-hidden z-10">
          
          {/* MIDDLE: MISSION DOSSIER */}
          <div className="flex-1 flex flex-col bg-[#010806] border-2 border-emerald-900/50 p-6 shadow-2xl relative overflow-y-auto custom-scrollbar">
            {loading ? (
               <div className="m-auto text-emerald-500 flex flex-col items-center">
                   <Target size={40} className="mb-4 animate-spin-slow" />
                   SCANNING FOR DIRECTIVES...
               </div>
            ) : activeMission ? (
              <>
                <h2 className="text-xl font-black text-emerald-100 flex items-center gap-3 tracking-widest uppercase mb-6">
                  <AlertCircle size={24} className="text-amber-500" />
                  {activeMission.title}
                </h2>
                <div className="bg-black/60 border border-emerald-900/60 p-6 flex-1">
                  <p className="text-[10px] text-emerald-500 font-black mb-4 tracking-[0.2em] border-b border-emerald-900/50 pb-2">MISSION DIRECTIVES:</p>
                  <p className="text-sm text-emerald-100 leading-relaxed font-bold whitespace-pre-wrap">{activeMission.description}</p>
                </div>
              </>
            ) : (
              <div className="m-auto text-emerald-900/50 flex flex-col items-center">
                 <ShieldAlert size={60} />
                 <h2 className="text-xl font-black tracking-widest mt-4">NO ACTIVE DIRECTIVES</h2>
              </div>
            )}
          </div>

          {/* RIGHT: CHAT & REPORTS (Tabs style) */}
          <div className="w-[450px] flex flex-col gap-4">
            
            {/* CHAT WINDOW */}
            <div className="flex-1 bg-[#010806] border border-emerald-900/50 flex flex-col overflow-hidden">
               <h3 className="text-[10px] text-emerald-700 font-black p-4 border-b border-emerald-900/50 tracking-widest">SECURE_COMM_CHANNEL</h3>
               {activeMission ? (
                  <ChatWindow 
                    currentUser={user} 
                    missionId={activeMission.id} 
                    selectedAgentId={activeMission.creatorManager?.id} 
                  />
               ) : (
                  <div className="flex-1 flex items-center justify-center text-emerald-900/30 font-black">CHANNEL OFFLINE</div>
               )}
            </div>

            {/* REPORT UPLINK */}
            <form onSubmit={handleSendReport} className="bg-[#010806] border border-amber-900/50 p-4 shrink-0">
               <h3 className="text-[10px] text-amber-700 font-black mb-3 flex items-center gap-2 tracking-widest">
                 <FileText size={12} /> SUBMIT_FIELD_REPORT
               </h3>
               <textarea 
                  value={newReport}
                  onChange={(e) => setNewReport(e.target.value)}
                  className="w-full h-24 bg-black border border-amber-900/30 p-3 text-xs text-amber-500 outline-none focus:border-amber-500 resize-none font-bold mb-2"
                  placeholder="Enter observation details..."
               />
               <button type="submit" className="w-full bg-amber-600 text-black py-2 font-black text-xs hover:bg-amber-500 transition-all">
                 TRANSMIT_REPORT
               </button>
            </form>

          </div>
        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentDashboard;