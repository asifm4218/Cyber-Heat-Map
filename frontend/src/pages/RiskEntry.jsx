import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AlertTriangle, Upload, Eye, Check, RefreshCw, HelpCircle, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

const RiskEntry = () => {
  const { token, user, API_URL } = useContext(AuthContext);
  const [risks, setRisks] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [selectedAsset, setSelectedAsset] = useState('');
  const [threatCategory, setThreatCategory] = useState('');
  const [vulnerability, setVulnerability] = useState('');
  const [likelihood, setLikelihood] = useState(3);
  const [impact, setImpact] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  // File states for CSV Upload
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Auto-calculated risk score preview
  const previewScore = likelihood * impact;
  const getScoreColorClass = (score) => {
    if (score <= 5) return 'text-green-400 border-green-500/20 bg-green-500/5 glow-green/5';
    if (score <= 12) return 'text-amber-400 border-amber-500/20 bg-amber-500/5 glow-amber/5';
    return 'text-red-400 border-red-500/20 bg-red-500/5 glow-red/5';
  };
  const getScoreBadgeClass = (score) => {
    if (score <= 5) return 'bg-green-500/10 text-green-400 border border-green-500/30';
    if (score <= 12) return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
    return 'bg-red-500/10 text-red-400 border border-red-500/30';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Assets Catalog
      const assetRes = await fetch(`${API_URL}/assets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const assetData = await assetRes.json();
      if (assetData.success) {
        setAssets(assetData.data);
        if (assetData.data.length > 0) {
          setSelectedAsset(assetData.data[0].name);
        }
      }
      setAssetsLoading(false);

      // Fetch Risk Entries
      const riskRes = await fetch(`${API_URL}/risks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const riskData = await riskRes.json();
      if (riskData.success) {
        setRisks(riskData.data);
      }
    } catch (err) {
      setError('System scan error: Could not query network databanks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSubmitRisk = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (!selectedAsset || !threatCategory || !vulnerability) {
      setError('Please fill in all required operational logs.');
      setSubmitting(false);
      return;
    }

    // Find full asset object to get type/department info
    const assetObj = assets.find((a) => a.name === selectedAsset);

    try {
      const res = await fetch(`${API_URL}/risks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assetName: selectedAsset,
          assetType: assetObj ? assetObj.type : 'Other',
          department: assetObj ? assetObj.department : 'General',
          threatCategory,
          vulnerability,
          likelihood: Number(likelihood),
          impact: Number(impact),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Risk telemetry successfully logged into central core.');
        setThreatCategory('');
        setVulnerability('');
        setLikelihood(3);
        setImpact(3);
        // Refresh risks list
        const riskRes = await fetch(`${API_URL}/risks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const riskData = await riskRes.json();
        if (riskData.success) {
          setRisks(riskData.data);
        }
      } else {
        setError(data.message || 'Log injection failed');
      }
    } catch (err) {
      setError('Network communication link failed during injection');
    } finally {
      setSubmitting(false);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setError('');
    setSuccess('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/risks/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        let msg = `Successfully imported ${data.count} risk records.`;
        if (data.errors && data.errors.length > 0) {
          msg += ` Warning: ${data.errors.length} records failed validation.`;
        }
        setSuccess(msg);
        setFile(null);
        // Refresh risks list
        const riskRes = await fetch(`${API_URL}/risks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const riskData = await riskRes.json();
        if (riskData.success) {
          setRisks(riskData.data);
        }
      } else {
        setError(data.message || 'Failed to parse batch manifest');
      }
    } catch (err) {
      setError('Network transmission failure uploading CSV data.');
    } finally {
      setUploading(false);
    }
  };

  const handleApproveRisk = async (id, status) => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/risks/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();

      if (data.success) {
        setRisks(risks.map((r) => (r._id === id ? { ...r, status: data.data.status } : r)));
      } else {
        setError(data.message || 'Failed to authorize command');
      }
    } catch (err) {
      setError('Network validation failed for approval query');
    }
  };

  const isAdmin = user && user.role === 'admin';

  return (
    <div className="p-6 space-y-6 w-full">
      <div>
        <h1 className="font-mono text-2xl font-black text-slate-100 tracking-wide flex items-center gap-2">
          <AlertTriangle className="text-cyan-400" />
          RISK TELEMETRY CONSOLE
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-1 uppercase">
          // Submit risk diagnostics and load batch telemetry
        </p>
      </div>

      {(error || success) && (
        <div className="space-y-2">
          {error && (
            <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-mono flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-lg bg-green-950/40 border border-green-500/30 text-green-400 text-xs font-mono flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>
      )}

      {/* Split Column Panel: Form entry + CSV upload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Form Panel */}
        <div className="lg:col-span-2 glass-panel rounded-xl border border-slate-800 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase text-slate-200 tracking-wider">
              [Manual Diagnostic Report]
            </span>
          </div>

          {assetsLoading ? (
            <div className="text-center py-6 font-mono text-xs text-slate-500">// BUFFERING ASSET MATRICES...</div>
          ) : assets.length === 0 ? (
            <div className="text-center py-6 font-mono text-xs text-red-400">
              // NO SYSTEM ASSETS FOUND. REGISTER ASSETS BEFORE SUBMITTING RISKS.
            </div>
          ) : (
            <form onSubmit={handleSubmitRisk} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                    Target Node Asset
                  </label>
                  <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-slate-300 font-mono text-xs"
                  >
                    {assets.map((asset) => (
                      <option key={asset._id} value={asset.name}>
                        {asset.name} ({asset.type} - {asset.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                    Threat Category
                  </label>
                  <input
                    type="text"
                    value={threatCategory}
                    onChange={(e) => setThreatCategory(e.target.value)}
                    required
                    placeholder="e.g. Outdated Firmware, SQL Injection"
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-slate-200 placeholder-slate-600 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5">
                  Vulnerability Details
                </label>
                <textarea
                  value={vulnerability}
                  onChange={(e) => setVulnerability(e.target.value)}
                  required
                  rows="3"
                  placeholder="Describe the detected security gap, exploits, or structural misconfigurations..."
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-slate-200 placeholder-slate-600 font-mono text-xs resize-none"
                />
              </div>

              {/* Slider / Matrix Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-slate-900/40 border border-slate-800/80">
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-slate-400 uppercase tracking-widest text-[10px]">Threat Likelihood</span>
                    <span className="text-cyan-400 font-semibold">{likelihood} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={likelihood}
                    onChange={(e) => setLikelihood(Number(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer h-1.5"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-600 uppercase">
                    <span>Rare (1)</span>
                    <span>Frequent (5)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-slate-400 uppercase tracking-widest text-[10px]">Operational Impact</span>
                    <span className="text-cyan-400 font-semibold">{impact} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={impact}
                    onChange={(e) => setImpact(Number(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer h-1.5"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-600 uppercase">
                    <span>Low (1)</span>
                    <span>Critical (5)</span>
                  </div>
                </div>
              </div>

              {/* Score Display Card */}
              <div className={`p-4 rounded-lg border font-mono flex items-center justify-between transition-all duration-300 ${getScoreColorClass(previewScore)}`}>
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">// Computed Severity Metric</div>
                  <div className="text-xs text-slate-300">Formula: Likelihood ({likelihood}) × Impact ({impact})</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black">{previewScore}</div>
                  <div className="text-[10px] uppercase tracking-widest">
                    {previewScore <= 5 ? 'Low Severity' : previewScore <= 12 ? 'Medium Severity' : 'High Severity'}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-100 border border-cyan-400/30 font-mono text-xs font-semibold hover:glow-cyan transition-all duration-200 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                  <span>{submitting ? 'LOGGING TELEMETRY...' : 'LOG RISK TELEMETRY'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* CSV Upload Panel */}
        <div className="glass-panel rounded-xl border border-slate-800 p-6 flex flex-col justify-between h-full space-y-4">
          <div className="space-y-2">
            <span className="font-mono text-xs font-bold uppercase text-slate-200 tracking-wider block">
              [Batch Manifest Upload]
            </span>
            <p className="text-[11px] font-mono text-slate-500 leading-relaxed">
              Upload formatted CSV documents containing risk matrices. Required headers:
              <span className="block mt-1 font-bold text-slate-400">
                Asset Name, Asset Type, Department, Threat Category, Vulnerability, Likelihood, Impact
              </span>
            </p>
          </div>

          <form onSubmit={handleFileUpload} className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-950/20 text-cyan-400'
                  : 'border-slate-800 bg-slate-950/40 text-slate-500 hover:border-slate-700 hover:text-slate-400'
              }`}
            >
              <Upload className="w-8 h-8 mb-2 animate-bounce" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-center">
                {file ? file.name : 'Drag & Drop CSV Manifest'}
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="mt-3 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] uppercase border border-slate-700 pointer-events-auto cursor-pointer"
              >
                Browse Disk
              </label>
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-semibold tracking-wider hover:glow-cyan transition-all border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {uploading ? 'PARSING CSV...' : 'UPLOAD BATCH MANIFEST'}
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Table: Log History */}
      <div className="space-y-3">
        <h3 className="font-mono text-xs font-bold uppercase text-slate-200 tracking-wider">
          [Telemetry Archive Logs]
        </h3>

        {loading ? (
          <div className="text-center py-6 font-mono text-xs text-slate-500">// READING ARCHIVES...</div>
        ) : risks.length === 0 ? (
          <div className="text-center py-6 font-mono text-xs text-slate-500">// NO TELEMETRY DATA LOGGED IN ARCHIVE</div>
        ) : (
          <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-[11px] text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-widest text-[9px]">
                    <th className="p-3">Asset</th>
                    <th className="p-3">Threat</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 text-center">Score</th>
                    <th className="p-3">Reported By</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Status</th>
                    {isAdmin && <th className="p-3 text-center">Security Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {risks.map((risk) => (
                    <tr key={risk._id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="p-3 font-semibold text-slate-200">
                        {risk.assetName}
                        <span className="block text-[9px] font-normal text-slate-500">{risk.assetType}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-100 font-semibold">{risk.threatCategory}</span>
                        <span className="block text-[9px] text-slate-500 truncate max-w-xs" title={risk.vulnerability}>
                          {risk.vulnerability}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{risk.department}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${getScoreBadgeClass(risk.riskScore)}`}>
                          {risk.riskScore}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{risk.reportedBy ? risk.reportedBy.username : 'Unknown'}</td>
                      <td className="p-3 text-slate-500">{new Date(risk.dateReported).toLocaleDateString()}</td>
                      <td className="p-3">
                        {risk.status === 'Approved' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-green-950/40 border border-green-500/30 text-green-400 font-bold uppercase tracking-widest">
                            Approved
                          </span>
                        ) : risk.status === 'Mitigated' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 font-bold uppercase tracking-widest">
                            Mitigated
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-950/40 border border-amber-500/30 text-amber-400 font-bold uppercase tracking-widest animate-pulse">
                            Pending
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="p-3 text-center flex items-center justify-center space-x-1.5">
                          {risk.status === 'Pending' && (
                            <button
                              onClick={() => handleApproveRisk(risk._id, 'Approved')}
                              className="px-2 py-1 bg-green-800 hover:bg-green-700 text-slate-100 rounded text-[9px] font-bold border border-green-600/30 cursor-pointer flex items-center space-x-0.5"
                              title="Approve Risk"
                            >
                              <Check className="w-3 h-3" />
                              <span>APPROVE</span>
                            </button>
                          )}
                          {risk.status === 'Approved' && (
                            <button
                              onClick={() => handleApproveRisk(risk._id, 'Mitigated')}
                              className="px-2 py-1 bg-cyan-800 hover:bg-cyan-700 text-slate-100 rounded text-[9px] font-bold border border-cyan-600/30 cursor-pointer flex items-center space-x-0.5"
                              title="Mark Mitigated"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>MITIGATE</span>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskEntry;
