import React, { useEffect } from 'react';
import { LayoutDashboard, Users, FileText, LogOut, Shield, MessageSquare, BellRing } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client'; // <--- הוספנו את זה!

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user || !user.id) return;

    const stompClient = new Client({
      // כאן הקסם: אנחנו משתמשים ב-SockJS ובכתובת המקורית שלך!
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-chat'),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Global Admin Listener Connected');
        
        stompClient.subscribe(`/topic/notifications/user/${user.id}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          
          const senderId = receivedMessage.sender?.id || receivedMessage.senderId;
          const senderName = receivedMessage.sender?.codename || receivedMessage.sender?.fullName || 'UNKNOWN ASSET';
          const textContent = receivedMessage.text || receivedMessage.content || 'Encrypted Payload';
          
          if (senderId !== user.id && senderName !== 'SYSTEM') {
            showTacticalToast({ senderName, textContent });
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
      },
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [user.id]);

  const showTacticalToast = (msg: { senderName: string; textContent: string }) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-[#02120e] border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] rounded pointer-events-auto flex flex-col font-mono uppercase tracking-widest text-xs z-50`}
      >
        <div className="bg-emerald-900/40 px-4 py-2 border-b border-emerald-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-black">
            <BellRing size={14} className="animate-pulse" />
            <span>INCOMING TRANSMISSION</span>
          </div>
          <span className="text-[9px] text-emerald-600">
            {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="p-4">
          <p className="text-[10px] text-emerald-600 font-bold mb-1">
            SENDER: <span className="text-emerald-300">{msg.senderName}</span>
          </p>
          <p className="text-emerald-100 font-medium leading-relaxed truncate">
            {msg.textContent}
          </p>
        </div>
      </div>
    ), { duration: 5000, position: 'top-right' });
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'OVERVIEW', path: '/admin' },
    { icon: <Users size={20} />, label: 'AGENTS', path: '/admin/personnel' },
    { icon: <FileText size={20} />, label: 'MISSIONS', path: '/admin/missions' },
    { icon: <MessageSquare size={20} />, label: 'CHAT', path: '/admin/comms' },
  ];

  return (
    <div className="min-h-screen bg-[#010806] flex text-emerald-500 font-mono">
      <Toaster />

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

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
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

        <main className="flex-1 overflow-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;