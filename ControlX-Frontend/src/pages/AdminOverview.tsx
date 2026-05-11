import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Activity, ShieldAlert, Users, Target } from 'lucide-react';

const AdminOverview = () => {
  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in duration-1000">
        <header>
          <h1 className="text-3xl font-bold text-emerald-400 tracking-tighter">OPERATIONAL OVERVIEW</h1>
          <p className="text-[10px] text-emerald-800">Real-time intelligence stream active</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={<Users />} label="Active Personnel" value="12" color="text-emerald-500" />
          <StatCard icon={<Target />} label="Live Missions" value="04" color="text-emerald-400" />
          <StatCard icon={<Activity />} label="System Load" value="24%" color="text-blue-500" />
          <StatCard icon={<ShieldAlert />} label="Threat Level" value="LOW" color="text-emerald-600" />
        </div>

        {/* Big Dashboard Box */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 bg-[#02120e]/40 border border-emerald-900/30 rounded p-6 h-64 flex items-center justify-center">
              <span className="text-emerald-900 text-xs tracking-[0.5em]">SYSTEM_MAP_INITIALIZING...</span>
           </div>
           <div className="bg-[#02120e]/40 border border-emerald-900/30 rounded p-6">
              <h3 className="text-xs font-bold mb-4 border-b border-emerald-900/20 pb-2">RECENT_LOGS</h3>
              <div className="space-y-2 text-[10px] text-emerald-700">
                <p>{`> USER_ID_1 AUTHENTICATED`}</p>
                <p>{`> SYSTEM_SCAN_COMPLETED`}</p>
                <p className="animate-pulse">{`> AWAITING_COMMAND...`}</p>
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// רכיב עזר לכרטיסי הסטטיסטיקה
const StatCard = ({ icon, label, value, color }: any) => (
  <div className="bg-[#02120e]/60 border border-emerald-900/20 p-4 rounded-lg hover:border-emerald-500/30 transition-all group">
    <div className="flex items-center gap-3 mb-2">
      <div className={`${color} opacity-50 group-hover:opacity-100 transition-opacity`}>{icon}</div>
      <span className="text-[9px] text-emerald-800 uppercase tracking-widest">{label}</span>
    </div>
    <div className={`text-2xl font-bold ${color} drop-shadow-[0_0_5px_rgba(52,211,153,0.2)]`}>{value}</div>
  </div>
);

export default AdminOverview;