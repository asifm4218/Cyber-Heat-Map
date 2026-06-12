import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Server, AlertTriangle } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Asset Inventory',
      path: '/assets',
      icon: Server,
    },
    {
      name: 'Risk Entry',
      path: '/risks',
      icon: AlertTriangle,
    },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 min-h-[calc(100vh-73px)] hidden md:block">
      <div className="p-6">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
          Main Console
        </span>
        <nav className="mt-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg border font-mono text-sm tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-800/80 text-cyan-400 border-cyan-500/30 glow-cyan/10'
                      : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/40'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-6 left-6 right-6">
        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-[11px] font-mono text-slate-500 leading-relaxed">
          <div>// SYSTEM ACTIVE</div>
          <div>// ENCRYPTION: AES-256</div>
          <div>// NODE VERSION: v18+</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
