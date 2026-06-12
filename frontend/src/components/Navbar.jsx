import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Shield, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="glass-panel border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
        <div>
          <span className="font-mono text-xl font-black tracking-widest bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
            CYBER SHIELD
          </span>
          <span className="hidden sm:inline-block ml-2 text-xs font-mono uppercase text-slate-400 tracking-wider">
            // Heat Map System
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {user && (
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-200">{user.username}</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                {user.role}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-slate-400 hover:text-red-400 transition-colors duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline text-sm">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
