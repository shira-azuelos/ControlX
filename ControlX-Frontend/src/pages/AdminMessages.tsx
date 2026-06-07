import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Globe2, ShieldAlert, X, MessageSquare } from 'lucide-react';
import { getAgentsByDept, getMissionsByManager, getUnreadCount } from '../lib/api'; 
import { ChatWindow } from '../components/ChatWindow';

const AgentContactButton = ({ agent, fromMission, allMissions, selectedAgent, isGroupChat, onSelect, managerId }: any) => {
  const [unread, setUnread] = useState(0); //כמות ההודעות שלא נקראו

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        let activeMissionId = fromMission?.id;
        if (!activeMissionId) { //אם לא הגענו מתוך משימה אז מחפש שיוך של הסוכן למשימה
          const m = allMissions.find((m: any) => 
            (m.status === 'IN_PROGRESS' || m.status === 'PENDING') &&
            m.assignedAgents?.some((a: any) => a.id === agent.id)
          );
          activeMissionId = m?.id;
        }

        if (activeMissionId && managerId) {
          const count = await getUnreadCount(activeMissionId, agent.id, managerId);
          setUnread(count);
        }
      } catch (e) { console.error("Failed to fetch unread count"); }
    };

    if (selectedAgent?.id !== agent.id) {
        fetchUnread();
        const interval = setInterval(fetchUnread, 5000);
        return () => clearInterval(interval);
    } else {
        setUnread(0); 
    }
  }, [agent.id, fromMission, allMissions, managerId, selectedAgent]);

  return (
    <button
      onClick={() => onSelect(agent)}
      className={`w-full p-3 rounded-lg border-2 transition-all text-left mb-2 ${
        selectedAgent?.id === agent.id && !isGroupChat
          ? 'bg-emerald-600/50 border-emerald-300 shadow-[0_0_10px_#34d399]'
          : 'bg-emerald-900/40 border-emerald-700/40 hover:border-emerald-500/60'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${agent.status === 'ON_MISSION' ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
          <span className="text-xs font-bold text-emerald-200 uppercase truncate">{agent.codename}</span>
        </div>
        {unread > 0 && selectedAgent?.id !== agent.id && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>
      <div className="text-xs text-emerald-600 font-mono truncate">{agent.specialty}</div>
    </button>
  );
};

const AdminMessages = () => {
  const location = useLocation();
  const fromMission = location.state?.fromMission || null;

  const [agents, setAgents] = useState<any[]>([]);
  const [allMissions, setAllMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isGroupChat, setIsGroupChat] = useState<boolean>(false);

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

  const selectAgent = (agent: any) => {
    setIsGroupChat(false);
    setSelectedAgent(agent);
  };

  const selectGroupChat = () => {
    setSelectedAgent(null);
    setIsGroupChat(true);
  };

  return (
    <AdminLayout>
      <div className="h-full flex flex-col gap-4 font-mono">
        <header className="pb-4 border-b border-emerald-700/40 flex justify-between items-end shrink-0">
          <div>
            <h1 className="text-3xl font-black text-emerald-300 uppercase tracking-widest">
              {fromMission ? `CHAT: ${fromMission.title}` : 'COMMUNICATIONS CENTER'}
            </h1>
          </div>
        </header>

        <div className="flex-1 flex gap-4 overflow-hidden">
          <div className="w-64 flex flex-col bg-[#02120e]/60 border border-emerald-700/40 rounded-lg overflow-hidden shrink-0">
            <div className="flex-1 overflow-y-auto space-y-2 p-3 custom-scrollbar">
              {loading ? (
                <div className="text-center py-8 text-emerald-600 text-xs animate-pulse">LOADING...</div>
              ) : (
                <>
                  {fromMission && (
                    <button
                      onClick={selectGroupChat}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left mb-4 ${
                        isGroupChat ? 'bg-emerald-600/50 border-emerald-300' : 'bg-emerald-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-black text-emerald-100">
                        <Globe2 size={16} /> OP BROADCAST
                      </div>
                    </button>
                  )}
                  {agents.map(agent => (
                    <AgentContactButton
                      key={agent.id}
                      agent={agent}
                      fromMission={fromMission}
                      allMissions={allMissions}
                      selectedAgent={selectedAgent}
                      isGroupChat={isGroupChat}
                      onSelect={selectAgent}
                      managerId={managerId}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-[#02120e]/60 border border-emerald-700/40 rounded-lg overflow-hidden relative">
            {(selectedAgent || isGroupChat) && fromMission ? (
              <ChatWindow 
                currentUser={manager} 
                missionId={fromMission.id} 
                selectedAgentId={selectedAgent?.id || null} 
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-emerald-900/50">
                <MessageSquare size={48} className="mb-4" />
                <p>Select asset or broadcast to start</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;