import React, { useState, useEffect } from 'react';
import AgentLayout from '../components/AgentLayout';
import { Activity, Send, AlertCircle, MapPin, Clock, Terminal, Zap } from 'lucide-react';
import { getMissions, submitReport } from '../lib/api';

const AgentDashboard = () => {
  const [mission, setMission] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [newReport, setNewReport] = useState('');
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadMission();
  }, []);

  const loadMission = async () => {
    try {
      setLoading(true);
      // כאן אנחנו מניחים שהסרביס מחזיר את המשימה שהסוכן משובץ אליה
      const data = await getMissions(); // במציאות תרצי פילטר לפי הסוכן
      const activeOne = data.find((m: any) => m.status === 'IN_PROGRESS');
      setMission(activeOne);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.trim() || !mission) return;

    try {
      await submitReport(mission.id, user.id, newReport);
      setNewReport('');
      // כאן תרצי לרענן את רשימת הדיווחים
    } catch (err) {
      alert("Comms Failure: Report not transmitted.");
    }
  };

  return (
    <AgentLayout agentName={user.codename || user.fullName}>
      <div className="p-8 h-full flex flex-col font-mono text-xs uppercase tracking-widest relative">
        
        {/* --- TOP HUD (Status Bar) --- */}
        <div className="flex justify-between items-center mb-8 bg-[#0a0f0d] border border-emerald-900/50 p-4 shadow-lg">
          <div className="flex gap-10">
            <div className="flex flex-col">
              <span className="text-[9px] text-emerald-800 font-black mb-1">Agent_Vitals</span>
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-emerald-400 animate-pulse" />
                <div className="w-24 h-1.5 bg-emerald-900/30 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-emerald-500" />
                </div>
              </div>
            </div>
            <div className="flex flex-col border-l border-emerald-900/30 pl-10">
              <span className="text-[9px] text-emerald-800 font-black mb-1">Encryption_Key</span>
              <span className="text-emerald-200 font-black">X-99-ALPHA-SECURE</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-right">
                <span className="text-[9px] text-amber-800 font-black">Mission_Clock</span>
                <div className="text-amber-500 font-black text-sm">00:44:12:09</div>
             </div>
             <Zap size={20} className="text-amber-500 animate-bounce" />
          </div>
        </div>

        {/* --- MAIN INTERFACE --- */}
        <div className="flex-1 flex gap-8 overflow-hidden">
          
          {/* LEFT: MISSION DOSSIER (The BIG screen) */}
          <div className="flex-1 flex flex-col bg-[#050807] border-2 border-emerald-500/20 p-8 shadow-2xl relative">
            {/* Tactical Corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-500" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-500" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500" />

            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-black text-emerald-100 flex items-center gap-3">
                <AlertCircle size={24} className="text-amber-500" />
                {mission ? mission.title : "STANDBY: NO ACTIVE MISSION"}
              </h2>
              <span className="bg-amber-600 text-black px-3 py-1 font-black text-[10px]">ACTIVE_OPERATION</span>
            </div>

            {mission && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-emerald-950/10 border border-emerald-900/50 p-4">
                    <p className="text-[9px] text-emerald-700 font-bold mb-2 flex items-center gap-2"><MapPin size={10}/> Sector_Area</p>
                    <p className="text-emerald-300 font-bold">Classified Zone-9</p>
                  </div>
                  <div className="bg-emerald-950/10 border border-emerald-900/50 p-4">
                    <p className="text-[9px] text-emerald-700 font-bold mb-2 flex items-center gap-2"><Clock size={10}/> Objective_ETA</p>
                    <p className="text-emerald-300 font-bold">Immediate</p>
                  </div>
                </div>

                <div className="bg-black/40 border border-emerald-900 p-6 flex-1 min-h-[150px]">
                  <p className="text-[10px] text-emerald-800 font-black mb-4 tracking-widest border-b border-emerald-900/30 pb-2">Mission_Objectives_Directive:</p>
                  <p className="text-sm text-emerald-100 leading-relaxed font-bold lowercase first-letter:uppercase">
                    {mission.description}
                  </p>
                </div>
              </div>
            )}

            {/* Simulated Tactical Map / Grid */}
            <div className="mt-auto h-40 border border-emerald-900/30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] relative opacity-40">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-[1px] bg-emerald-500/20" />
                    <div className="h-full w-[1px] bg-emerald-500/20 absolute" />
                    <span className="text-[8px] text-emerald-900">RADAR_SWEEP_ACTIVE</span>
                </div>
            </div>
          </div>

          {/* RIGHT: REPORT UPLINK (The Feed) */}
          <div className="w-[400px] flex flex-col gap-6">
            
            {/* Uplink Console */}
            <div className="flex-1 bg-[#0a0a0a] border border-amber-900/40 p-6 flex flex-col shadow-xl">
               <h3 className="text-amber-500 font-black mb-4 flex items-center gap-2 tracking-[0.2em]">
                 <Terminal size={16} /> Report_Feed
               </h3>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4 text-[10px]">
                  {/* כאן תבוא רשימת הדיווחים */}
                  <div className="border-l border-amber-900/50 pl-3">
                    <p className="text-amber-700">14:22:01 // HQ</p>
                    <p className="text-emerald-500/80">Awaiting your field assessment.</p>
                  </div>
                  <div className="border-l border-emerald-500/50 pl-3">
                    <p className="text-emerald-700">14:25:30 // YOU</p>
                    <p className="text-emerald-100">Asset in position. Visual contact confirmed.</p>
                  </div>
               </div>

               <form onSubmit={handleSendReport} className="mt-auto space-y-4">
                  <div className="relative">
                    <textarea 
                        value={newReport}
                        onChange={(e) => setNewReport(e.target.value)}
                        placeholder="Type field report here..."
                        className="w-full h-32 bg-black border border-amber-900/60 p-4 text-xs text-amber-500 outline-none focus:border-amber-400 placeholder:text-amber-950 resize-none font-bold"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-amber-600 text-black py-3 font-black text-xs uppercase flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  >
                    <Send size={16} /> Transmit_Uplink
                  </button>
               </form>
            </div>

            {/* Tactical Card */}
            <div className="bg-emerald-900/10 border border-emerald-900/30 p-4 text-[9px] text-emerald-800 space-y-1">
                <p>CONNECTION: ENCRYPTED</p>
                <p>LATENCY: 12ms</p>
                <p>LOCATION_TRACKING: ENABLED</p>
            </div>
          </div>
        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentDashboard;