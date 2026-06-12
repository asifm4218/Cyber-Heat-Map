import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Shield, ShieldAlert, Cpu, AlertTriangle, ShieldCheck, ListCollapse, Play, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { token, API_URL } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalRisks: 0,
    highRisks: 0,
    pendingRisks: 0,
  });
  const [recentRisks, setRecentRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch Assets
        const assetsRes = await fetch(`${API_URL}/assets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const assetsData = await assetsRes.json();
        
        // Fetch Risks
        const risksRes = await fetch(`${API_URL}/risks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const risksData = await risksRes.json();

        if (assetsData.success && risksData.success) {
          const totalAssets = assetsData.count;
          const totalRisks = risksData.count;
          const highRisks = risksData.data.filter((r) => r.riskScore >= 13).length;
          const pendingRisks = risksData.data.filter((r) => r.status === 'Pending').length;

          setStats({
            totalAssets,
            totalRisks,
            highRisks,
            pendingRisks,
          });

          setRecentRisks(risksData.data.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const widgets = [
    {
      title: 'TOTAL ASSETS ONLINE',
      value: stats.totalAssets,
      desc: '// Active hardware/software nodes',
      icon: Cpu,
      colorClass: 'text-cyan-400',
      borderClass: 'border-cyan-500/20',
      bgGlow: 'glow-cyan/5',
    },
    {
      title: 'TOTAL LOGGED RISKS',
      value: stats.totalRisks,
      desc: '// Threat matrices tracked in DB',
      icon: AlertTriangle,
      colorClass: 'text-blue-400',
      borderClass: 'border-blue-500/20',
      bgGlow: 'glow-blue/5',
    },
    {
      title: 'CRITICAL HIGH RISKS',
      value: stats.highRisks,
      desc: '// Risk score between 13 - 25',
      icon: ShieldAlert,
      colorClass: 'text-red-400',
      borderClass: 'border-red-500/20',
      bgGlow: 'glow-red/5',
    },
    {
      title: 'PENDING ACTION ITEMS',
      value: stats.pendingRisks,
      desc: '// Awaiting Admin audit clearance',
      icon: ShieldCheck,
      colorClass: 'text-amber-400',
      borderClass: 'border-amber-500/20',
      bgGlow: 'glow-amber/5',
    },
  ];

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="font-mono text-2xl font-black text-slate-100 tracking-wide flex items-center gap-2">
          <Shield className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
          SECURITY COMMAND CENTRE
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-1 uppercase">
          // Enterprise Security Intelligence Console
        </p>
      </div>

      {/* Stats Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.map((w, idx) => {
          const Icon = w.icon;
          return (
            <div
              key={idx}
              className={`glass-panel p-6 rounded-xl border ${w.borderClass} ${w.bgGlow} flex flex-col justify-between space-y-4`}
            >
              <div className="flex justify-between items-start">
                <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-slate-400 leading-tight">
                  {w.title}
                </span>
                <Icon className={`w-5 h-5 ${w.colorClass}`} />
              </div>
              <div>
                <span className="font-mono text-3xl font-black text-slate-100">{loading ? '...' : w.value}</span>
                <span className="block font-mono text-[9px] text-slate-500 uppercase mt-1">
                  {w.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Split Console: Recent Alerts & System Modules Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Alerts Log */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <span className="font-mono text-xs font-bold uppercase text-slate-200 tracking-wider">
              [Recent Risk Alerts]
            </span>
            <Link to="/risks" className="font-mono text-[10px] text-cyan-400 hover:underline">
              View All Logs →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 font-mono text-xs text-slate-500">// COMPILING LOGS...</div>
          ) : recentRisks.length === 0 ? (
            <div className="text-center py-8 font-mono text-xs text-slate-500">// ALL SYSTEMS OPERATING WITHIN PARMS</div>
          ) : (
            <div className="space-y-3">
              {recentRisks.map((risk) => (
                <div
                  key={risk._id}
                  className="p-3.5 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center justify-between font-mono text-xs hover:border-slate-700/80 transition-colors"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-slate-200">{risk.assetName}</span>
                    <span className="text-slate-500 mx-2">|</span>
                    <span className="text-slate-400">{risk.threatCategory}</span>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{risk.vulnerability}</p>
                  </div>
                  <div className="text-right flex items-center space-x-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        risk.riskScore <= 5
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : risk.riskScore <= 12
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      SCORE {risk.riskScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Project Scope Roadmap & Development Plan */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="font-mono text-xs font-bold uppercase text-slate-200 tracking-wider">
              [System Roadmap Status]
            </span>
          </div>

          <div className="space-y-3 font-mono text-[11px] leading-relaxed">
            <div className="p-3 rounded bg-green-950/20 border border-green-500/20 text-slate-300">
              <div className="flex items-center justify-between font-bold text-green-400 text-xs">
                <span>UNIT I: DATA INGESTION</span>
                <span className="px-1.5 py-0.5 bg-green-500/10 rounded text-[9px] font-normal border border-green-500/30">
                  ONLINE
                </span>
              </div>
              <p className="mt-1 text-slate-400 text-[10px]">
                Authentication, Role definitions, Asset registry, Risk collection forms, and CSV bulk import engine.
              </p>
            </div>

            <div className="p-3 rounded bg-slate-900/40 border border-slate-800 text-slate-500">
              <div className="flex items-center justify-between font-bold text-slate-400 text-xs">
                <span>UNIT II: NETWORK MONITORING</span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] font-normal border border-slate-700">
                  ROADMAP
                </span>
              </div>
              <p className="mt-1 text-[10px]">
                Tracking network configurations, scanning open ports (SSH, RDP), and automatic port risk alerts.
              </p>
            </div>

            <div className="p-3 rounded bg-slate-900/40 border border-slate-800 text-slate-500">
              <div className="flex items-center justify-between font-bold text-slate-400 text-xs">
                <span>UNIT III: OWASP CVE ASSIGNER</span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] font-normal border border-slate-700">
                  ROADMAP
                </span>
              </div>
              <p className="mt-1 text-[10px]">
                Mapping application assets to standard OWASP Top 10 vulnerabilities and logging active CVE records.
              </p>
            </div>

            <div className="p-3 rounded bg-slate-900/40 border border-slate-800 text-slate-500">
              <div className="flex items-center justify-between font-bold text-slate-400 text-xs">
                <span>UNIT IV-V: HEAT MAP MATRICES</span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] font-normal border border-slate-700">
                  ROADMAP
                </span>
              </div>
              <p className="mt-1 text-[10px]">
                Likelihood vs Impact visual grid matrix, Recharts incidence trend graphs, and reactive filtering.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
