import React from 'react';
import { LayoutDashboard, Users, FileText, LogOut, Shield, MessageSquare } from 'lucide-react'; // הוספנו את MessageSquare
import { useNavigate, useLocation } from 'react-router-dom';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'OVERVIEW', path: '/admin' },
    { icon: <Users size={20} />, label: 'AGENTS', path: '/admin/personnel' },
    { icon: <FileText size={20} />, label: 'MISSIONS', path: '/admin/missions' },
    { icon: <MessageSquare size={20} />, label: 'CHAT', path: '/admin/comms' },
  ];

  return (
    <div className="min-h-screen bg-[#010806] flex text-emerald-500 font-mono">
      
      {/* --- תפריט צד (Sidebar) --- */}
      <div className="w-64 border-r border-emerald-900/30 bg-[#02120e]/50 flex flex-col z-50">
        <div className="p-6 border-b border-emerald-900/20 text-center bg-black/20">
          <Shield className="mx-auto mb-2 text-emerald-400" size={32} />
          <h2 className="text-xl font-black text-emerald-400 tracking-widest">CONTROL-X</h2>
          <p className="text-[9px] text-emerald-700 tracking-[0.2em] mt-1">COMMAND CENTER</p>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-4">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 p-3 rounded transition-all ${
                location.pathname === item.path
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : 'hover:bg-emerald-500/10 text-emerald-700 hover:text-emerald-500'
              }`}
            >
              {item.icon}
              <span className="text-xs font-bold tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* כפתור התנתקות */}
        <button 
          onClick={() => {
            localStorage.removeItem('user');
            navigate('/');
          }} 
          className="flex items-center justify-center gap-3 p-4 text-red-900 hover:text-red-500 hover:bg-red-900/10 border-t border-emerald-900/10 transition-all font-bold text-xs tracking-widest"
        >
          <LogOut size={18} />
          LOG_OUT
        </button>
      </div>

      {/* --- אזור התוכן המרכזי --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* === הסרגל העליון (Header) === */}
        <header className="h-16 border-b border-emerald-900/30 bg-[#020a08]/80 backdrop-blur-md flex justify-between items-center px-8 shrink-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-800 tracking-widest font-bold">SECURE_CONNECTION_ESTABLISHED</span>
          </div>

          <div className="flex items-center gap-4 bg-emerald-950/30 px-5 py-1.5 rounded-full border border-emerald-900/50 hover:bg-emerald-900/20 transition-colors cursor-default">
            <div className="text-right">
              <div className="text-[9px] text-emerald-700 uppercase font-bold tracking-widest">
                {user.department || 'COMMAND'} // DIRECTOR
              </div>
              <div className="text-xs text-emerald-400 font-black tracking-wider uppercase">
                {user.name || 'UNKNOWN ADMIN'}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-900/40 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <Shield size={14} />
            </div>
          </div>
        </header>

        {/* --- התוכן המשתנה של הדף --- */}
        <main className="flex-1 overflow-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;