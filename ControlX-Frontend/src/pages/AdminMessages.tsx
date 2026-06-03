import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Send, Users, MessageSquare, X, Globe2, ShieldAlert } from 'lucide-react';
// מושכים גם את המשימות כדי שנוכל למצוא את המשימה של הסוכן כשאנחנו בראשי
import { getAgentsByDept, getMissionsByManager } from '../lib/api'; 
import { ChatWindow } from '../components/ChatWindow';

const AdminMessages = () => {
  const location = useLocation();
  const fromMission = location.state?.fromMission || null;

  const [agents, setAgents] = useState<any[]>([]);
  const [allMissions, setAllMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [agentActiveMission, setAgentActiveMission] = useState<any>(null); // שומר את המשימה של הסוכן הספציפי

  const [isGroupChat, setIsGroupChat] = useState<boolean>(false);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');

  const manager = JSON.parse(localStorage.getItem('user') || '{}');
  const managerDept = manager.department || 'OPERATIONS';
  const managerId = manager.id;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [agentsData, missionsData] = await Promise.all([
          getAgentsByDept(managerDept),
          getMissionsByManager(managerId)
        ]);
        
        setAllMissions(missionsData || []);

        if (fromMission && fromMission.assignedAgents) {
          const missionAgentIds = fromMission.assignedAgents.map((a: any) => a.id);
          const filteredAgents = agentsData.filter((a: any) => missionAgentIds.includes(a.id));
          setAgents(filteredAgents);
        } else {
          setAgents(agentsData);
        }
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };

    if (managerId) loadData();
  }, [managerDept, managerId, fromMission]);

  // הפונקציה הזו רצה כשאת בוחרת סוכן (מהראשי או מהמשימה)
  const selectAgent = (agent: any) => {
    setIsGroupChat(false);
    setSelectedAgent(agent);

    // אם הגענו מהראשי (בלי משימה), אנחנו מחפשים מה המשימה הפעילה של הסוכן כרגע!
    if (!fromMission) {
      const activeMission = allMissions.find((m: any) => 
        (m.status === 'IN_PROGRESS' || m.status === 'PENDING') &&
        m.assignedAgents?.some((a: any) => a.id === agent.id)
      );
      setAgentActiveMission(activeMission || null);
    }
  };

  const selectGroupChat = () => {
    setSelectedAgent(null);
    setIsGroupChat(true);
    if (groupMessages.length === 0) {
      setGroupMessages([
        {
          sender: 'SYSTEM',
          text: `Secure Broadcast Channel for OP-${fromMission?.id} opened. All assigned agents are listening.`,
          timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          direction: 'received'
        }
      ]);
    }
  };

  const handleGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    const newMsg = {
      sender: 'You',
      text: messageText,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      direction: 'sent'
    };

    setGroupMessages(prev => [...prev, newMsg]);
    setMessageText('');
  };

  return (
    <AdminLayout>
      <div className="h-full flex flex-col gap-4 font-mono">
        <header className="pb-4 border-b border-emerald-700/40 flex justify-between items-end shrink-0">
          <div>
            <h1 className="text-3xl font-black text-emerald-300 uppercase tracking-widest">
              {fromMission ? `COMMS: ${fromMission.title}` : 'COMMUNICATIONS CENTER'}
            </h1>
            <p className="text-sm text-emerald-600 mt-1">
              {fromMission ? `Secure channel for OP-${fromMission.id}` : 'Direct agent contact channels'}
            </p>
          </div>
          {fromMission && (
            <div className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-300 px-3 py-1 text-xs font-bold tracking-widest rounded uppercase">
              FILTERED BY MISSION
            </div>
          )}
        </header>

        <div className="flex-1 flex gap-4 overflow-hidden">
          
          <div className="w-64 flex flex-col bg-[#02120e]/60 border border-emerald-700/40 rounded-lg overflow-hidden shrink-0">
            <div className="flex-1 overflow-y-auto space-y-2 p-3 custom-scrollbar">
              {loading ? (
                <div className="text-center py-8 text-emerald-600 text-xs animate-pulse">LOADING ASSETS...</div>
              ) : agents.length === 0 ? (
                <div className="text-center py-8 text-emerald-700 text-xs">NO ASSETS AVAILABLE</div>
              ) : (
                <>
                  {fromMission && (
                    <button
                      onClick={selectGroupChat}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left mb-4 ${
                        isGroupChat
                          ? 'bg-emerald-600/50 border-emerald-300 shadow-[0_0_10px_#34d399]'
                          : 'bg-emerald-900/40 border-emerald-700/40 hover:border-emerald-500/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Globe2 size={16} className="text-emerald-400" />
                        <span className="text-sm font-black text-emerald-100 uppercase tracking-widest">OP BROADCAST</span>
                      </div>
                      <div className="text-[10px] text-emerald-500 mt-1">
                        Message all {agents.length} assigned agents
                      </div>
                    </button>
                  )}

                  {agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => selectAgent(agent)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedAgent?.id === agent.id && !isGroupChat
                          ? 'bg-emerald-600/50 border-emerald-300 shadow-[0_0_10px_#34d399]'
                          : 'bg-emerald-900/40 border-emerald-700/40 hover:border-emerald-500/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${agent.status === 'ON_MISSION' ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
                        <span className="text-xs font-bold text-emerald-200 uppercase truncate">{agent.codename}</span>
                      </div>
                      <div className="text-xs text-emerald-600 font-mono truncate">{agent.specialty}</div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-[#02120e]/60 border border-emerald-700/40 rounded-lg overflow-hidden relative">
            {selectedAgent ? (
              
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-emerald-700/40 bg-[#02120e]/80 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${selectedAgent.status === 'ON_MISSION' ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
                    <div>
                      <div className="text-sm font-bold text-emerald-300 uppercase tracking-wider">{selectedAgent.codename}</div>
                      <div className="text-xs text-emerald-600 font-mono">
                        {fromMission ? `OP-${fromMission.id}` : agentActiveMission ? `OP-${agentActiveMission.id}` : 'STANDBY'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className="text-emerald-600 hover:text-red-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-hidden relative flex flex-col">
                  {/* אם יש משימה (מהכפתור) או שלסוכן יש משימה פעילה (מהראשי) -> נציג את הצ'אט האמיתי! */}
                  {fromMission ? (
                    <ChatWindow 
                      currentUser={manager} 
                      missionId={fromMission.id} 
                      selectedAgentId={selectedAgent.id} 
                    />
                  ) : agentActiveMission ? (
                    <ChatWindow 
                      currentUser={manager} 
                      missionId={agentActiveMission.id} 
                      selectedAgentId={selectedAgent.id} 
                    />
                  ) : (
                    // אם הגענו מהראשי ולסוכן **אין** משימה פעילה -> השרת יקרוס, לכן נציג לו מסך שגיאה טקטי!
                    <div className="flex-1 bg-[#010806] flex flex-col items-center justify-center p-6 text-center text-emerald-900/50 h-full">
                      <ShieldAlert size={60} className="mb-4 opacity-50" />
                      <span className="font-black uppercase tracking-[0.2em] text-lg">SECURE UPLINK OFFLINE</span>
                      <span className="text-xs mt-2 font-bold tracking-widest text-emerald-700">It is not possible to correspond with an agent who is not part of the mission</span>
                    </div>
                  )}
                </div>
              </div>

            ) : isGroupChat ? (
              
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-emerald-700/40 bg-[#02120e]/80 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <Globe2 size={24} className="text-emerald-400" />
                    <div>
                      <div className="text-sm font-black text-emerald-300 uppercase tracking-widest">OP-{fromMission?.id} BROADCAST</div>
                      <div className="text-xs text-emerald-600 font-mono">{agents.length} Assets Listening</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsGroupChat(false)}
                    className="text-emerald-600 hover:text-red-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#010806]/40 custom-scrollbar">
                  {groupMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs p-3 rounded-lg text-sm ${
                        msg.direction === 'sent'
                          ? 'bg-emerald-600/40 border border-emerald-500/60 text-emerald-100'
                          : 'bg-cyan-600/40 border border-cyan-500/60 text-cyan-100'
                      }`}>
                        <div className="font-bold text-xs uppercase tracking-wider mb-1">{msg.sender}</div>
                        <div className="text-xs break-words">{msg.text}</div>
                        <div className={`text-[10px] mt-1 ${msg.direction === 'sent' ? 'text-emerald-600' : 'text-cyan-600'}`}>
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleGroupMessage} className="p-4 border-t border-emerald-700/40 bg-[#02120e]/80 flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type broadcast to team..."
                    className="flex-1 bg-emerald-900/40 border border-emerald-700/60 rounded-lg px-3 py-2 text-sm text-emerald-100 placeholder-emerald-600/50 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-400/30"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>

            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <MessageSquare className="mx-auto text-emerald-700 mb-4 opacity-50" size={48} />
                  <p className="text-emerald-600 font-bold uppercase tracking-wider">
                    {fromMission ? 'Select an asset or broadcast to team' : 'Select an agent to start chatting'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;