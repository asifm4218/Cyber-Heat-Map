import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Shield, User, Mail, Lock, ShieldAlert } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    if (!username || !email || !password) {
      setErrorMsg('All fields are required');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      setIsSubmitting(false);
      return;
    }

    try {
      await register(username, email, password, role);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cyber-grid min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-max-w-md p-8 rounded-2xl border border-slate-800 glow-cyan/10 max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center mb-4 glow-cyan/10">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="font-mono text-2xl font-black tracking-widest text-slate-100">
            INITIALIZE PROTOTYPE
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
            // Register new access credentials
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-mono flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Operator01"
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 placeholder-slate-600 transition-all font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@cybershield.net"
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 placeholder-slate-600 transition-all font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
              Access Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-slate-200 placeholder-slate-600 transition-all font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
              Security Level (Role)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-slate-300 transition-all font-mono text-sm"
            >
              <option value="user">USER (Standard Operator)</option>
              <option value="admin">ADMIN (Root Access)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-100 font-mono text-sm font-semibold tracking-wider hover:glow-cyan transition-all duration-200 flex items-center justify-center space-x-2 border border-cyan-400/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>SECURING CONNECTION...</span>
            ) : (
              <span>ESTABLISH ACCESS</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs font-mono text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="text-cyan-400 hover:underline">
              Bypass Auth Screen
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
