import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Plus, Server, CheckCircle2, XCircle, Trash2, Cpu, Tag, MapPin, Radio, ShieldAlert } from 'lucide-react';

const Assets = () => {
  const { token, user, API_URL } = useContext(AuthContext);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Server');
  const [department, setDepartment] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState('Active');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/assets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAssets(data.data);
      } else {
        setError(data.message || 'Failed to fetch assets');
      }
    } catch (err) {
      setError('Network error: Could not fetch asset catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [token]);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!name || !department) {
      setError('Asset Name and Department are required.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          type,
          department,
          ipAddress: ipAddress || 'N/A',
          owner: owner || 'Unassigned',
          status,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setAssets([data.data, ...assets]);
        setShowModal(false);
        // Clear fields
        setName('');
        setDepartment('');
        setIpAddress('');
        setOwner('');
        setStatus('Active');
      } else {
        setError(data.message || 'Failed to add asset');
      }
    } catch (err) {
      setError('Network error: Failed to upload asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Are you sure you want to decommission this asset?')) return;
    setError('');

    try {
      const res = await fetch(`${API_URL}/assets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setAssets(assets.filter((a) => a._id !== id));
      } else {
        setError(data.message || 'Failed to remove asset');
      }
    } catch (err) {
      setError('Network error: Failed to send delete command');
    }
  };

  const isAdmin = user && user.role === 'admin';

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-black text-slate-100 tracking-wide flex items-center gap-2">
            <Cpu className="text-cyan-400" />
            ASSET INVENTORY
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase">
            // Registered enterprise assets & system nodes
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-100 border border-cyan-400/30 font-mono text-xs font-semibold cursor-pointer hover:glow-cyan transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>ADD SYSTEM NODE</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-mono flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 font-mono text-xs text-slate-500">// SCANNING SYSTEM NODE CONFIGURATIONS...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12 font-mono text-xs text-slate-500">// NO SYSTEM NODES REGISTERED IN CONSOLE</div>
      ) : (
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-widest text-[10px]">
                  <th className="p-4">Node Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4">System Custodian</th>
                  <th className="p-4">Status</th>
                  {isAdmin && <th className="p-4 text-center">Decommission</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {assets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-slate-800/20 transition-colors duration-150">
                    <td className="p-4 font-semibold text-slate-100">{asset.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] uppercase font-semibold">
                        {asset.type}
                      </span>
                    </td>
                    <td className="p-4">{asset.department}</td>
                    <td className="p-4 text-slate-400">{asset.ipAddress}</td>
                    <td className="p-4 text-slate-400">{asset.owner}</td>
                    <td className="p-4">
                      {asset.status === 'Active' ? (
                        <span className="flex items-center text-green-400 text-[10px] uppercase font-semibold gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Online
                        </span>
                      ) : (
                        <span className="flex items-center text-slate-500 text-[10px] uppercase font-semibold gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          Offline
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteAsset(asset._id)}
                          className="text-slate-500 hover:text-red-400 transition-colors duration-150 cursor-pointer"
                          title="Decommission Node"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Backdrop & Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                <Radio className="text-cyan-400 animate-pulse" />
                Register New Node
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 font-mono text-xs uppercase"
              >
                [Esc Close]
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                  Asset / Node Name *
                </label>
                <div className="relative">
                  <Cpu className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Core-Router-B"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-slate-200 placeholder-slate-600 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                    Asset Classification *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-slate-300 font-mono text-xs"
                  >
                    <option value="Server">Server</option>
                    <option value="Database">Database</option>
                    <option value="Network Device">Network Device</option>
                    <option value="Application">Application</option>
                    <option value="Workstation">Workstation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                    Department Unit *
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      placeholder="e.g. IT SecOps"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-slate-200 placeholder-slate-600 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                    IP Address Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      placeholder="e.g. 10.150.0.1"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-slate-200 placeholder-slate-600 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                    System Owner Custodian
                  </label>
                  <div className="relative">
                    <Cpu className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      placeholder="e.g. SEC-OPERATIONS"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-slate-200 placeholder-slate-600 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                  Initial Node Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-slate-300 font-mono text-xs"
                >
                  <option value="Active">Active / Online</option>
                  <option value="Inactive">Inactive / Offline</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-xs font-semibold cursor-pointer"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-100 border border-cyan-400/30 font-mono text-xs font-semibold hover:glow-cyan transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'COMMITTING NODE...' : 'COMMIT NODE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
