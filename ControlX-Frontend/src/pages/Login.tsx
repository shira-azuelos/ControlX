import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, Lock, Shield, User, AlertCircle } from 'lucide-react';
import { loginWithPasskey } from '../lib/api.ts';
import MatrixRain from '../components/MatrixRain.tsx';

const Login = () => {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setError('');

    setTimeout(async () => {
      try {
        const user = await loginWithPasskey(passkey);
        localStorage.setItem('user', JSON.stringify(user));
        navigate(user.employeeType === 'DeskManager' ? '/admin' : '/agent');
      } catch (err) {
        setError('ACCESS DENIED');
        setIsScanning(false);
      }
    }, 2000);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <MatrixRain />

      {/* --- Hack לביטול הרקע הלבן של המילוי האוטומטי --- */}
      <style dangerouslySetInnerHTML={{__html: `
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px rgba(0, 0, 0, 0.8) inset !important;
            -webkit-text-fill-color: #34d399 !important;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}} />

      {/* הקופסה המרכזית */}
      <div className="z-10 w-full max-w-sm bg-black/80 border border-emerald-900 rounded-lg p-8 backdrop-blur-sm shadow-[0_0_40px_rgba(5,150,105,0.2)]">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2 text-emerald-400">
            <Shield className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-[0.3em]">CONTROLX</h1>
          </div>
          <p className="text-[10px] text-emerald-700 tracking-widest">COMMAND INTERFACE</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8 text-emerald-500 uppercase text-[10px]">
          
          {/* סורק טביעת אצבע */}
          <div className="relative mx-auto w-44 h-44 border border-emerald-900/50 rounded flex items-center justify-center bg-emerald-950/10">
            <div className="relative">
              <Fingerprint className={`w-20 h-20 transition-all duration-1000 ${isScanning ? 'text-emerald-400 opacity-100' : 'text-emerald-950 opacity-40'}`} />
              
              {/* הלייזר שזז הלוך-חזור */}
              {isScanning && (
                <div className="absolute -top-4 left-0 w-full h-1 bg-emerald-400 shadow-[0_0_15px_#34d399] animate-scan" />
              )}
            </div>
            {/* פינות עיצוביות */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-emerald-500" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-emerald-500" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-emerald-500" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-emerald-500" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-emerald-700 font-bold"><User size={12} /> Access Key</label>
              
              {/* --- שדה הקלט המתוקן --- */}
              <input
                type="password"
                value={passkey}
                autoComplete="new-password" 
                spellCheck={false} 
                onChange={(e) => setPasskey(e.target.value)}
                className="w-full bg-black/60 border border-emerald-900 p-3 rounded text-emerald-400 outline-none focus:border-emerald-500 text-center tracking-widest"
                placeholder="••••"
              />
            </div>

            {error && <div className="text-red-600 text-center animate-pulse">{error}</div>}
          </div>

          <button
            type="submit"
            disabled={isScanning}
            className={`w-full py-4 font-bold border transition-all ${isScanning ? 'border-emerald-950 text-emerald-900' : 'border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black shadow-[0_0_20px_rgba(5,150,105,0.3)]'}`}
          >
            {isScanning ? 'AUTHENTICATING...' : 'DECRYPT & ENTER'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;