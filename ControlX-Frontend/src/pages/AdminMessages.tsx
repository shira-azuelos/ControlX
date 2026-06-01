import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Send, Users, MessageSquare, Plus, X } from 'lucide-react';
import { getAgentsByDept, getChatHistory, sendChatMessage, broadcastMessage } from '../lib/api';

const AdminMessages = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  const manager = JSON.parse(localStorage.getItem('user') || '{}');
  const managerDept = manager.department || 'OPERATIONS';
  const managerId = manager.id;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const agentsData = await getAgentsByDept(managerDept);
        setAgents(agentsData);
      } catch (err) {
        console.error("Failed to load agents", err);
      } finally {
        setLoading(false);
      }
    };

    if (managerId) loadData();
  }, [managerDept, managerId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedAgent) return;
    
    setChatMessages([...chatMessages, {
      sender: 'You',
      text: messageText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      direction: 'sent'
    }]);
    setMessageText('');

    // Simulate agent response
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        sender: selectedAgent.codename,
        text: 'Message received. Standing by for further instructions.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        direction: 'received'
      }]);
    }, 500);
  };

  const handleBroadcastMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    
    // Simulate broadcast to all agents
    alert(`✓ Message broadcast to all ${agents.length} agents:\n\n"${broadcastMessage}"`);
    setBroadcastMessage('');
    setShowBroadcastModal(false);
  };

  const selectAgent = (agent: any) => {
    setSelectedAgent(agent);
    setChatMessages([
      {
        sender: agent.codename,
        text: `Agent ${agent.codename} online and ready for communications.`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        direction: 'received'
      }
    ]);
  };

  return (
    <AdminLayout>
      <div className="h-full flex flex-col gap-4 font-mono">
        {/* HEADER */}
        <header className="pb-4 border-b border-emerald-700/40">
          <h1 className="text-3xl font-black text-emerald-300 uppercase tracking-widest">COMMUNICATIONS CENTER</h1>
          <p className="text-sm text-emerald-600 mt-1">Direct agent contact • Broadcast messaging • Secure channels</p>
        </header>

        {/* MAIN LAYOUT */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          
          {/* LEFT SIDEBAR - AGENTS LIST */}
          <div className="w-64 flex flex-col bg-[#02120e]/60 border border-emerald-700/40 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-emerald-700/40">
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2 rounded font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <Users size={16} />
                Broadcast to All
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 p-3">
              {loading ? (
                <div className="text-center py-8 text-emerald-600 text-xs animate-pulse">LOADING AGENTS...</div>
              ) : agents.length === 0 ? (
                <div className="text-center py-8 text-emerald-700 text-xs">NO AGENTS AVAILABLE</div>
              ) : (
                agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => selectAgent(agent)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedAgent?.id === agent.id
                        ? 'bg-emerald-600/50 border-emerald-300 shadow-[0_0_10px_#34d399]'
                        : 'bg-emerald-900/40 border-emerald-700/40 hover:border-emerald-500/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${agent.status === 'ON_MISSION' ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
                      <span className="text-xs font-bold text-emerald-200 uppercase truncate">{agent.codename}</span>
                    </div>
                    <div className="text-xs text-emerald-600 font-mono truncate">{agent.specialty}</div>
                    <div className="text-[10px] text-emerald-700 mt-1">
                      {agent.status === 'ON_MISSION' ? '🔴 IN_FIELD' : '🟡 STANDBY'}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT SIDE - CHAT WINDOW */}
          <div className="flex-1 flex flex-col bg-[#02120e]/60 border border-emerald-700/40 rounded-lg overflow-hidden">
            {selectedAgent ? (
              <>
                {/* AGENT HEADER */}
                <div className="p-4 border-b border-emerald-700/40 bg-[#02120e]/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${selectedAgent.status === 'ON_MISSION' ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
                    <div>
                      <div className="text-sm font-bold text-emerald-300 uppercase tracking-wider">{selectedAgent.codename}</div>
                      <div className="text-xs text-emerald-600 font-mono">{selectedAgent.fullName}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAgent(null);
                      setChatMessages([]);
                    }}
                    className="text-emerald-600 hover:text-red-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* MESSAGES AREA */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#010806]/40">
                  {chatMessages.map((msg, idx) => (
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

                {/* MESSAGE INPUT */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-emerald-700/40 bg-[#02120e]/80 flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-emerald-900/40 border border-emerald-700/60 rounded-lg px-3 py-2 text-sm text-emerald-100 placeholder-emerald-600/50 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-400/30"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <MessageSquare className="mx-auto text-emerald-700 mb-4 opacity-50" size={48} />
                  <p className="text-emerald-600 font-bold uppercase tracking-wider">Select an agent to start chatting</p>
                  <p className="text-emerald-700 text-xs mt-2">Or use Broadcast to send a message to all agents</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BROADCAST MODAL */}
        {showBroadcastModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-[#02120e] border-2 border-emerald-600 rounded-lg p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                  <Users size={20} />
                  Broadcast Message
                </h3>
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  className="text-emerald-600 hover:text-red-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleBroadcastMessage} className="space-y-4">
                <div>
                  <label className="block text-sm text-emerald-300 uppercase tracking-wider font-bold mb-2">
                    Message for all {agents.length} agents:
                  </label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Type your broadcast message..."
                    className="w-full bg-emerald-900/40 border border-emerald-700/60 rounded-lg px-3 py-2 text-sm text-emerald-100 placeholder-emerald-600/50 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-400/30 h-32 resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="px-4 py-2 rounded-lg border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/40 transition-colors uppercase text-sm font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black transition-colors uppercase text-sm font-bold flex items-center gap-2"
                  >
                    <Send size={16} />
                    Send to All
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;
