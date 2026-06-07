import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { UserPlus, UserMinus, Activity, X, Shield, Users, Lock, ChevronLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getAgentsByDept, createAgent, deleteAgent } from '../lib/api';

const SPECIALTY_MAP: Record<string, { value: string, label: string }[]> = {
  'CYBER': [
    { value: 'HACKING', label: 'Hacking' },
    { value: 'ENCRYPTION', label: 'Encryption' },
    { value: 'SIGNALS', label: 'Signals Intelligence' }
  ],
  'INTELLIGENCE': [
    { value: 'SURVEILLANCE', label: 'Surveillance' },
    { value: 'INTERROGATION', label: 'Interrogation' },
    { value: 'UNDERCOVER', label: 'Undercover' }
  ],
  'OPERATIONS': [
    { value: 'COMBAT', label: 'Combat' },
    { value: 'INFILTRATION', label: 'Infiltration' },
    { value: 'SABOTAGE', label: 'SABOTAGE' }
  ],
  'LOGISTICS': [
    { value: 'WEAPONRY', label: 'Weaponry' },
    { value: 'TRANSPORT', label: 'Transport' },
    { value: 'MEDICAL', label: 'Medical' }
  ]
};

const AdminAgents = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [showAllAgents, setShowAllAgents] = useState(false); //פתיחת רשימת הסוכנים
  const [showModal, setShowModal] = useState(false);  //הוספת סוכן
  const [loading, setLoading] = useState(true); //האם מחכים לשרת
  const [agentToDelete, setAgentToDelete] = useState<{ id: number; codename: string } | null>(null); //מחיקת סוכן

  const manager = JSON.parse(localStorage.getItem('user') || '{}');
  const managerDept = manager.department || 'OPERATIONS';

  useEffect(() => {
    loadData();
  }, [managerDept]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAgentsByDept(managerDept);
      setAgents(data);
    } catch (err) {
      console.error("Communication breakdown with central server");
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (agentToDelete) {
      await deleteAgent(agentToDelete.id);
      await loadData();
      setAgentToDelete(null);
    }
  };

  const activeAgents = agents.filter(a => a.status === 'ON_MISSION');

  return (
    <AdminLayout>
      <div className="h-full flex flex-col font-mono text-emerald-500 relative overflow-hidden bg-black">
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scrollUp {
            0% { transform: translateY(100%); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100%); opacity: 0; }
          }
          .animate-terminal-scroll {
            animation: scrollUp 2.5s linear forwards;
          }
        `}} />

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] z-0 opacity-10" />

        {/* --- הדר (Header) --- */}
        <div className="flex justify-between items-center mb-10 border-b border-emerald-900/60 pb-6 relative z-10 p-6">
          <div>
            <h1 className="text-4xl font-bold tracking-widest uppercase text-emerald-300">
              {managerDept} COMMAND
            </h1>
            <p className="text-sm font-semibold text-emerald-400 tracking-widest uppercase mt-2">
              Active Roster // Director: <span className="text-emerald-200">{manager.name || 'Director'}</span>
            </p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 text-black px-6 py-3 font-black flex items-center gap-2 hover:bg-emerald-400 hover:shadow-[0_0_20px_#10b981] transition-all rounded-sm tracking-widest uppercase"
          >
            <UserPlus size={18} /> Recruit Agent
          </button>
        </div>

        {/* --- הלוח המרכזי: סוכנים פעילים --- */}
        <div className="flex-1 overflow-auto pr-4 pl-6 mr-16 relative z-10 custom-scrollbar">
          <div className="flex items-center gap-4 mb-8">
             <Activity className="text-emerald-400 animate-pulse" size={24} />
             <h2 className="text-xl font-bold tracking-widest text-emerald-100 uppercase">Agents in Field ({activeAgents.length})</h2>
          </div>
          
          {loading ? (
             <div className="text-center py-20 animate-pulse text-emerald-600 tracking-[0.5em] font-bold">SYNCING DATABASE...</div>
          ) : activeAgents.length === 0 ? (
             <div className="border border-dashed border-emerald-900/50 bg-emerald-950/10 p-20 text-center text-emerald-600 uppercase tracking-[0.3em] font-bold rounded">
                No active {managerDept} agents deployed
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAgents.map(agent => (
                <div key={agent.id} className="bg-[#020d0a]/80 backdrop-blur-md border border-emerald-600/40 p-6 rounded-sm relative group hover:border-emerald-400 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <Shield className="absolute top-4 right-4 opacity-10 text-emerald-500" size={50} />
                  
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-xs text-emerald-300 font-bold tracking-widest bg-emerald-900/40 px-2 py-1 rounded">
                      <span className="text-emerald-600 mr-1">ID:</span>{agent.id}
                    </div>
                    <div className="text-xs text-emerald-300 font-bold tracking-widest bg-emerald-900/40 px-2 py-1 rounded">
                      <span className="text-emerald-600 mr-1">LVL:</span>{agent.clearanceLevel}
                    </div>
                  </div>

                  <div className="text-3xl font-black text-white uppercase tracking-widest mb-1">{agent.codename}</div>
                  <div className="text-sm text-emerald-400 uppercase tracking-wider font-bold">
                    <span className="text-emerald-700 mr-2">NAME:</span>{agent.fullName}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-emerald-900/50 flex justify-between items-center">
                     <span className="text-xs text-emerald-200 font-bold uppercase tracking-widest bg-emerald-950/50 px-2 py-1 rounded border border-emerald-800/50">
                       <span className="text-emerald-600 mr-1">SPEC:</span>{agent.specialty}
                     </span>
                     <span className="text-xs text-emerald-400 animate-pulse font-black tracking-widest flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-400"></div> ACTIVE
                     </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- מגירת כל הסוכנים --- */}
        <div className={`fixed top-0 right-0 h-full bg-[#010605]/95 backdrop-blur-2xl border-l-2 border-emerald-500/50 transition-all duration-300 ease-in-out z-40 shadow-[-30px_0_60px_rgba(0,0,0,0.9)] ${showAllAgents ? 'w-full md:w-[450px]' : 'w-0'}`}>
          <div className="p-6 w-full md:w-[450px] h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-emerald-500/30 pb-4">
              <h3 className="text-xl font-black flex items-center gap-3 text-emerald-300 uppercase tracking-widest">
                <Users size={22} /> All Agents
              </h3>
              <button onClick={() => setShowAllAgents(false)} className="text-emerald-600 hover:text-red-500 hover:rotate-90 transition-all"><X size={28} /></button>
            </div>
            
            <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-2">
              {agents.map(agent => (
                <div key={agent.id} className="bg-black/60 p-4 rounded-sm border border-emerald-900/60 flex justify-between items-center group hover:border-emerald-400/80 transition-all hover:bg-emerald-950/40">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${agent.status === 'ON_MISSION' ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : agent.status === 'AVAILABLE' ? 'bg-emerald-700' : 'bg-red-600'}`} />
                    <div>
                      <div className="text-lg font-black text-emerald-100 uppercase tracking-widest">{agent.codename}</div>
                      <div className="text-xs text-emerald-500 uppercase tracking-wider font-bold mt-1">
                        {agent.specialty} | <span className={agent.status === 'ON_MISSION' ? 'text-emerald-300 font-black' : ''}>{agent.status}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAgentToDelete({id: agent.id, codename: agent.codename})}
                    className="p-2 text-red-900 hover:text-red-400 hover:bg-red-950/50 rounded transition-all opacity-0 group-hover:opacity-100"
                  >
                    <UserMinus size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- כפתור פתיחת המגירה --- */}
        {!showAllAgents && (
          <button 
            onClick={() => setShowAllAgents(true)} 
            className="fixed right-0 top-1/3 bg-emerald-600 text-black border-l border-y border-emerald-400 p-4 rounded-l-md hover:bg-emerald-400 hover:scale-105 transition-all z-30 shadow-[0_0_20px_rgba(16,185,129,0.5)] group flex flex-col items-center gap-4"
          >
            <Users size={24} className="group-hover:-translate-x-1 transition-transform" />
            <span className="[writing-mode:vertical-lr] font-black tracking-[0.3em] text-[14px] uppercase">
            All Agents
            </span>
            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
        )}

        {/* --- מודל אישור מחיקה (שקוף) --- */}
        {agentToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setAgentToDelete(null)} />
            <div className="relative bg-[#020d0a]/90 border-2 border-red-900 w-full max-w-md p-8 shadow-[0_0_50px_rgba(239,68,68,0.3)] font-mono animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-4 text-red-500 mb-6 border-b border-red-900/50 pb-4">
                  <AlertTriangle size={32} />
                  <h2 className="text-xl font-black uppercase tracking-widest text-red-600">warning!!!!</h2>
              </div>
              <p className="text-sm text-emerald-100 font-bold mb-4 uppercase tracking-wider">
                  Are you sure you want to delete this agent certainly?
              </p>
              <div className="flex justify-end gap-6 pt-4 border-t border-emerald-900/40">
                  <button onClick={() => setAgentToDelete(null)} className="text-emerald-700 text-[10px] font-black uppercase hover:text-emerald-100 transition-colors">
                      [ cancel ]
                  </button>
                  <button onClick={handleConfirmDelete} className="bg-red-600 text-black px-6 py-2 text-[10px] font-black uppercase hover:bg-red-500 transition-all">
                     delete
                  </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <AddAgentModal 
            managerDept={managerDept} 
            onClose={() => setShowModal(false)} 
            onAdd={async (data: any) => {
              try {
                await createAgent(data, manager.id || 1);
                await loadData();
              } catch(e) {
                alert('System Error: Could not recruit agent.');
              }
              setShowModal(false);
            }} 
          />
        )}
      </div>
    </AdminLayout>
  );
};

const AddAgentModal = ({ managerDept, onClose, onAdd }: any) => {
  const availableSpecialties = SPECIALTY_MAP[managerDept] || SPECIALTY_MAP['OPERATIONS'];
  const manager = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success'>('idle'); //תהליך ההוספה

  const [formData, setFormData] = useState({
    fullName: '',
    codename: '',
    clearanceLevel: 'STANDARD',
    department: managerDept,
    specialty: availableSpecialties[0].value,
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setStatus('scanning');
      setTimeout(() => {
        setStatus('success');         
        setTimeout(() => {
            onAdd(formData);
        }, 1500);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={status === 'idle' ? onClose : undefined} />
      
      <div className="relative bg-[#020a07] border border-emerald-500/50 w-full max-w-2xl font-mono flex flex-col shadow-2xl overflow-hidden">
        
        <div className="border-b border-emerald-500/50 px-5 py-4 flex justify-between items-center text-emerald-400">
          <div className="flex items-center gap-2 text-xs tracking-widest font-bold uppercase">
            <span>{`>_`} SYS.RECRUIT_MODULE</span>
          </div>
          {status === 'idle' && <button onClick={onClose} className="hover:text-white transition-colors"><X size={18} /></button>}
        </div>

        <div className="p-8 pb-6 relative min-h-[400px] flex flex-col justify-center">
          {status === 'scanning' ? (
            <div className="flex flex-col items-center justify-center space-y-6 w-full">
              <div className="w-full max-w-md bg-black border border-emerald-500/30 rounded p-4 font-mono text-[10px] text-emerald-500 h-48 overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
                <div className="animate-terminal-scroll flex flex-col gap-2 font-bold uppercase">
                  <p>{`>`} Initializing recruitment protocol...</p>
                  <p>{`>`} Verifying codename: {formData.codename}...</p>
                  <p>{`>`} Encrypting personnel file...</p>
                  <p>{`>`} Linking to Director: {manager.name}...</p>
                  <p className="text-white mt-2">{`>`} UPLOADING DATA TO HQ...</p>
                </div>
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none" />
              </div>
              <div className="text-xl font-black text-emerald-400 tracking-[0.3em] uppercase animate-pulse">Processing...</div>
            </div>
          ) : status === 'success' ? (
            <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
                <CheckCircle2 size={80} className="text-emerald-400" />
                <h2 className="text-3xl font-black text-emerald-100 tracking-tighter uppercase">Recruit Synchronized</h2>
                <p className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest">Asset added to central roster</p>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-emerald-400 mb-8 tracking-widest uppercase">ADD NEW AGENT</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-emerald-400 block uppercase font-bold tracking-widest">FULL NAME</label>
                    <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-[#010504] border border-emerald-500/30 p-3 text-sm text-emerald-400 outline-none focus:border-emerald-400 transition-all placeholder:text-emerald-900/50" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-emerald-400 block uppercase font-bold tracking-widest">CODENAME</label>
                    <input required type="text" value={formData.codename} onChange={e => setFormData({...formData, codename: e.target.value.toUpperCase()})} className="w-full bg-[#010504] border border-emerald-500/30 p-3 text-sm text-emerald-400 outline-none focus:border-emerald-400 transition-all uppercase placeholder:text-emerald-900/50" placeholder="GHOST" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-emerald-400 block uppercase font-bold tracking-widest">CLEARANCE LEVEL</label>
                    <select value={formData.clearanceLevel} onChange={e => setFormData({...formData, clearanceLevel: e.target.value})} className="w-full bg-[#010504] border border-emerald-500/30 p-3 text-sm text-white font-bold outline-none focus:border-emerald-400 cursor-pointer appearance-none">
                      <option value="STANDARD">Level 1 - Standard</option>
                      <option value="CONFIDENTIAL">Level 2 - Confidential</option>
                      <option value="SECRET">Level 3 - Secret</option>
                      <option value="TOP_SECRET">Level 4 - Top Secret</option>
                      <option value="COSMIC">Level 5 - Cosmic</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-emerald-400 block uppercase font-bold tracking-widest">SPECIALTY</label>
                    <select value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} className="w-full bg-[#010504] border border-emerald-500/30 p-3 text-sm text-white font-bold outline-none focus:border-emerald-400 cursor-pointer appearance-none">
                      {availableSpecialties.map(spec => (
                        <option key={spec.value} value={spec.value}>{spec.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] text-emerald-400 block uppercase font-bold tracking-widest flex items-center gap-1.5">
                      <Lock size={12} /> DEPARTMENT (AUTO)
                    </label>
                    <div className="w-full bg-[#020f0a] border border-emerald-500/20 p-3 text-sm text-emerald-500/70 font-bold tracking-widest flex items-center">
                      {formData.department}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-emerald-400 block uppercase font-bold tracking-widest flex items-center gap-1.5">
                      <Lock size={12} /> RECRUITING DIRECTOR (AUTO)
                    </label>
                    <div className="w-full bg-[#020f0a] border border-emerald-500/20 p-3 text-sm text-emerald-500/70 font-bold tracking-widest flex items-center">
                      ID: {manager.id || 5} // {manager.name || 'רן ארגמן'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-8 mt-8 pt-6 border-t border-emerald-500/20">
                  <button type="button" onClick={onClose} className="text-xs font-bold text-emerald-500 hover:text-white uppercase tracking-widest">
                    CANCEL
                  </button>
                  <button type="submit" className="bg-emerald-500 text-black px-8 py-3 text-xs font-black uppercase hover:bg-emerald-400 transition-all tracking-widest rounded-sm">
                    AUTHORIZE
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAgents;