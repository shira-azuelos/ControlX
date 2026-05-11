import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Wifi, Radio, Target } from 'lucide-react';

const AgentLayout = ({ children, agentName }: { children: React.ReactNode, agentName: string }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#020504] font-mono overflow-hidden select-none">
      {/* Sidebar הטקטי */}
      <div className="w-64 border-r border-emerald-900/50 bg-black flex flex-col relative z-20">
        
        {/* Unit Status Header */}
        <div className="p-6 border-b border-emerald-900/30">
          <div className="flex items-center gap-2 text-emerald-500 mb-4">
            <Shield size={20} className="animate-pulse" />
            <span className="font-black tracking-widest text-xs uppercase">Field Unit HQ</span>
          </div>
          
          <div className="bg-emerald-950/20 border border-emerald-800 p-3 rounded-sm">
            <p className="text-[10px] text-emerald-700 font-bold uppercase mb-1">Authenticated Asset</p>
            <p className="text-sm font-black text-white uppercase tracking-tighter">
              {agentName || "Ghost Agent"}
            </p>
          </div>
        </div>

        {/* Navigation / Control */}
        <nav className="flex-1 p-4 space-y-2">
          <div className="text-[9px] text-emerald-900 font-black mb-4 tracking-[0.3em] px-2 uppercase">Systems_Active</div>
          
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border-l-2 border-emerald-500 text-emerald-400 text-xs font-black uppercase tracking-widest">
            <Target size={16} /> Current Mission
          </button>
          
          <button className="w-full flex items-center gap-3 px-4 py-3 text-emerald-800 text-xs font-bold uppercase tracking-widest hover:text-emerald-400 transition-colors">
            <Radio size={16} /> Comms Link
          </button>
        </nav>

        {/* Footer: Logout */}
        <div className="p-6 border-t border-emerald-900/30">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-950/20 border border-red-900/50 py-3 text-red-500 text-xs font-black hover:bg-red-600 hover:text-black transition-all uppercase tracking-widest"
          >
            <LogOut size={16} /> Log_Out.exe
          </button>
          
          <div className="mt-4 flex justify-between text-[8px] text-emerald-900 font-bold">
            <span className="flex items-center gap-1"><Wifi size={8} /> Crypto_Link: OK</span>
            <span>v4.0.2</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-auto custom-scrollbar">
        {/* Scanline Effect */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] z-10 opacity-10" />
        {children}
      </div>
    </div>
  );
};

export default AgentLayout;