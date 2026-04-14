/**
 * PlatFormula.One — Decentralized Builder (React/Firebase)
 *
 * FIXES applied vs original Manus canvas version:
 * 1. Removed __firebase_config, __initial_auth_token, __app_id globals
 *    → replaced with standard environment variable pattern (VITE_ prefix for Vite projects)
 * 2. Added getApps() guard to prevent duplicate Firebase init on HMR
 * 3. Replaced animate-in/zoom-in/slide-in-from-bottom Tailwind classes
 *    → requires tailwindcss-animate plugin (see setup note)
 * 4. Replaced scrollbar-thin/scrollbar-thumb classes
 *    → requires @tailwindcss/scrollbar plugin (see setup note)
 * 5. Fixed React.cloneElement usage → pass size via className on wrapper
 * 6. Added missing import for React (needed for JSX in some configs)
 *
 * SETUP:
 *   npm install firebase lucide-react tailwindcss @tailwindcss/scrollbar tailwindcss-animate
 *
 *   Create .env:
 *     VITE_FIREBASE_API_KEY=...
 *     VITE_FIREBASE_AUTH_DOMAIN=...
 *     VITE_FIREBASE_PROJECT_ID=...
 *     VITE_APP_ID=platformula-one-builder
 *
 *   tailwind.config.js plugins: [require('tailwindcss-animate'), require('@tailwindcss/scrollbar')]
 */

import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';
import {
  Brain, Database, GitBranch, Zap, Shield, Cpu,
  Info, Terminal, Play, CheckCircle, Globe, Layers,
  Search, UserPlus, BarChart3, Network, Settings,
  Activity, ArrowRight, Filter
} from 'lucide-react';

// ── Firebase init ──────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db   = getFirestore(app);
const APP_ID = import.meta.env.VITE_APP_ID || 'decentralized-builder-v1';

// ── Score map ─────────────────────────────────────
const SCORE_MAP = {
  DIRECT_INTRO: 20, INMAIL_REPLY: 15, MEETING: 10,
  ENGAGEMENT: 5,    NO_RESPONSE: -10, REFERRAL_MADE: 18,
  UNSUBSCRIBE: -15, EVENT_ATTEND: 12, CONTENT_SHARE: 8
};

// ── Default DAC code ──────────────────────────────
const DEFAULT_DAC = `// PlatFormula.ONE Capital-Routing Logic
// Autonomous Sales Navigator Ingestion

ingest("sales_nav_search") {
  source: "PhantomBuster",
  target_role: ["GP", "Partner"],
  keywords: ["AI", "Infra"],
  frequency: "6h"
}

enrich("crunchbase") {
  fields: ["fund_size", "check_size", "last_raise"],
  priority_weight: 0.8
}

route("warm_path") {
  max_hops: 2,
  min_strength: 0.6,
  operators: ["Johannes Rott", "Ed Dua"]
}`;

// ── Sub-components ────────────────────────────────
function ChainTrioVisual() {
  return (
    <div className="flex justify-around items-center p-6 bg-black/40 rounded-xl border border-white/10 my-4">
      {[
        { icon: Brain,     label: 'Cognitive',  color: 'text-cyan-400' },
        { icon: Database,  label: 'Persistent', color: 'text-purple-500' },
        { icon: GitBranch, label: 'Versioned',  color: 'text-emerald-400' },
      ].map(({ icon: Icon, label, color }) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <div className={`p-4 rounded-full bg-white/5 border border-white/20 ${color} animate-pulse`}>
            <Icon size={24} />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main App ──────────────────────────────────────
export default function DecentralizedBuilder() {
  const [user,        setUser]        = useState(null);
  const [activeTab,   setActiveTab]   = useState('pipeline');
  const [isProcessing,setIsProcessing]= useState(false);
  const [logs,        setLogs]        = useState([]);
  const [nodes,       setNodes]       = useState([]);
  const [dacCode,     setDacCode]     = useState(DEFAULT_DAC);
  const [stats,       setStats]       = useState({
    totalNodes: 0, warmPaths: 0, outreachActive: 0
  });

  const addLog = useCallback((msg) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15));
  }, []);

  // Auth
  useEffect(() => {
    const init = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        addLog(`AUTH_FAILURE: ${err.message}`);
      }
    };
    init();
    return onAuthStateChanged(auth, setUser);
  }, [addLog]);

  // Firestore sync
  useEffect(() => {
    if (!user) return;
    addLog('MEMBRAIN: Initializing graph persistence layer...');

    const col = collection(db, 'artifacts', APP_ID, 'public', 'data', 'membrain_nodes');
    const q   = query(col, limit(50));

    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNodes(data);
      setStats({
        totalNodes:     data.length,
        warmPaths:      data.filter(n => Number(n.path_strength) >= 0.6).length,
        outreachActive: data.filter(n => n.status === 'OUTREACH').length,
      });
      addLog(`MEMBRAIN: Synced (${data.length} nodes).`);
    }, (err) => addLog(`SYNC_ERROR: ${err.message}`));
  }, [user, addLog]);

  // Trigger assembly
  const triggerAssembly = async () => {
    if (!user) return;
    setIsProcessing(true);
    addLog('ASSEMBLY: Initiating decentralized builder stack...');

    try {
      addLog('PIPELINE: Sales Navigator lead capture...');
      await delay(800);
      addLog('ENRICHMENT: Crunchbase / FactSet fetch...');
      await delay(1000);
      addLog('ROUTING: Computing warm-paths via Trio Chain...');

      const sampleNames = [
        'Andrej Karpathy', 'Sarah Tavel', 'Naval Ravikant', 'Keith Rabois', 'Laila Ahmadi'
      ];
      const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const col  = collection(db, 'artifacts', APP_ID, 'public', 'data', 'membrain_nodes');

      await addDoc(col, {
        name,
        external_id:    `linkedin:${name.toLowerCase().replace(/\s+/g, '-')}`,
        organization:   'Venture Alpha',
        role:           'GP',
        status:         'NEW',
        priority_score: Math.floor(Math.random() * 40) + 60,
        path_strength:  parseFloat((Math.random() * 0.4 + 0.5).toFixed(2)),
        timestamp:      serverTimestamp(),
        source:         'SalesNav_Automated',
      });

      addLog(`SYSTEM: Node assembled [${name}].`);
      setActiveTab('monitor');
    } catch (err) {
      addLog(`EXECUTION_ERROR: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-slate-300 font-sans p-4 md:p-10">

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 border-b border-white/5 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tighter">PLATFORMULA.ONE</h1>
              <span className="text-[10px] bg-cyan-500 text-black px-2 py-0.5 rounded font-black uppercase tracking-tight">
                Decentralized Builder
              </span>
            </div>
            <p className="mt-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-widest">
              Autonomous Capital-Routing Stack
            </p>
            <p className="mt-3 text-slate-500 max-w-3xl text-sm leading-relaxed">
              Real-time ingestion from{' '}
              <span className="text-slate-300">Sales Navigator</span> to{' '}
              <span className="text-slate-300">MemBrain</span>. Automates lead capture, enrichment, and
              deterministic outreach prioritization via the{' '}
              <span className="text-slate-300">Chain Trio</span>.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <Activity size={12} className="text-emerald-500" />
              BUILD_ENGINE: {user ? 'ACTIVE' : 'CONNECTING'}
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <Globe size={12} className="text-cyan-400" />
              UID: {user ? user.uid.slice(0, 8) + '...' : '—'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/10">
            <h3 className="flex items-center gap-2 text-white font-bold text-[10px] uppercase tracking-widest mb-4">
              <Info size={14} className="text-cyan-400" /> Operating Manual
            </h3>
            <ol className="space-y-4 list-none">
              {[
                'Define target Sales Navigator keywords in the DAC Editor.',
                "Click 'Assemble Stack' to trigger autonomous ingestion.",
                'Monitor MemBrain for real-time lead enrichment.',
                'Review Warm-Path strengths in the Trio Engine.',
              ].map((text, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                    {i + 1}
                  </span>
                  <p className="text-[11px] leading-tight text-slate-500 uppercase font-bold tracking-tight">{text}</p>
                </li>
              ))}
            </ol>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'pipeline', icon: Cpu,     label: 'Assembly Line' },
              { id: 'monitor',  icon: Network,  label: 'MemBrain Graph' },
              { id: 'trio',     icon: Shield,   label: 'Trio Logic' },
              { id: 'telemetry',icon: Terminal, label: 'Kernel Logs' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all border ${
                  activeTab === id
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                    : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-500 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Icon size={16} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
                </div>
                {activeTab === id && <ArrowRight size={14} />}
              </button>
            ))}
          </nav>

          <div className="p-6 bg-[#111118] rounded-2xl border border-white/5 grid grid-cols-2 gap-4">
            <div><p className="text-[10px] text-slate-500">Nodes</p><p className="text-xl font-bold text-white">{stats.totalNodes}</p></div>
            <div><p className="text-[10px] text-slate-500">Warm</p><p className="text-xl font-bold text-cyan-400">{stats.warmPaths}</p></div>
            <div><p className="text-[10px] text-slate-500">Outreach</p><p className="text-xl font-bold text-amber-400">{stats.outreachActive}</p></div>
          </div>
        </aside>

        {/* Main workspace */}
        <section className="lg:col-span-9 space-y-6">

          {/* Pipeline / DAC Editor */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              <div className="bg-[#0A0A0F] rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
                <div className="p-4 bg-white/[0.02] border-b border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                      DAC_CONFIG: capital_routing.dac
                    </span>
                  </div>
                  <button
                    onClick={triggerAssembly}
                    disabled={isProcessing || !user}
                    className="bg-white text-black px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight hover:bg-cyan-400 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 shadow-lg"
                  >
                    {isProcessing ? <Zap size={14} className="animate-spin" /> : <Play size={14} />}
                    {isProcessing ? 'Assembling…' : 'Assemble Stack'}
                  </button>
                </div>
                <textarea
                  value={dacCode}
                  onChange={(e) => setDacCode(e.target.value)}
                  className="flex-grow bg-transparent p-8 font-mono text-sm text-cyan-200 outline-none resize-none leading-relaxed min-h-[320px]"
                  spellCheck={false}
                />
                <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> VALIDATED</span>
                    <span className="flex items-center gap-1"><Shield size={12} className="text-cyan-400" /> ENCRYPTED</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-700 italic">v2.5_DEPLOY_READY</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Search,   label: 'Capture',  desc: 'SalesNav → PB' },
                  { icon: BarChart3,label: 'Enrich',   desc: 'Crunchbase + FS' },
                  { icon: UserPlus, label: 'Outreach', desc: 'Warm-Path Queue' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="bg-white/[0.02] p-6 rounded-2xl border border-white/10 flex items-center gap-4 group hover:border-cyan-500/30 transition-all">
                    <div className="p-3 rounded-xl bg-white/5 text-slate-400 group-hover:text-cyan-400 transition-colors">
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase">{label}</p>
                      <p className="text-[10px] text-slate-500 font-mono uppercase">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MemBrain node explorer */}
          {activeTab === 'monitor' && (
            <div className="bg-[#0A0A0F] rounded-2xl border border-white/10 overflow-hidden h-[600px] flex flex-col">
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.01]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                  <Layers size={16} className="text-cyan-400" /> MemBrain Lead Explorer
                </h3>
                <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono flex items-center gap-2">
                  <Filter size={12} /> Priority &gt; 60
                </div>
              </div>
              <div className="flex-grow overflow-y-auto">
                <table className="w-full text-left text-[11px] font-mono border-collapse">
                  <thead className="bg-black/40 text-slate-500 uppercase sticky top-0">
                    <tr>
                      {['Lead / Org', 'Role', 'Priority', 'Warm-Path', 'Status'].map(h => (
                        <th key={h} className="p-4 border-b border-white/5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nodes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-20 text-center text-slate-700 italic">
                          Awaiting lead ingestion — click Assemble Stack
                        </td>
                      </tr>
                    ) : (
                      nodes.map((node) => {
                        const strength = Number(node.path_strength);
                        return (
                          <tr key={node.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                            <td className="p-4">
                              <div className="text-white font-bold">{node.name}</div>
                              <div className="text-slate-600 text-[10px]">{node.organization}</div>
                            </td>
                            <td className="p-4 text-slate-400">{node.role}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-cyan-500" style={{ width: `${node.priority_score}%` }} />
                                </div>
                                <span className="text-cyan-400">{node.priority_score}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] border ${
                                strength >= 0.7
                                  ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                                  : 'border-slate-800 text-slate-600'
                              }`}>
                                {(strength * 100).toFixed(0)}% S-Index
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-transparent">
                                {node.status || 'SYNCED'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trio logic */}
          {activeTab === 'trio' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 p-8 rounded-2xl border border-white/10">
                <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-2">Chain Trio Architecture</h2>
                <p className="text-sm text-slate-400 max-w-xl mb-4">
                  Deterministic lead scoring and capital routing — memory that never forgets.
                </p>
                <ChainTrioVisual />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                  <h4 className="text-sm font-bold mb-4 uppercase tracking-tight text-slate-400">Execution Guardrails</h4>
                  {[
                    ['Rate-Limit (SalesNav)',  '100 / Day',  'text-emerald-400'],
                    ['SLA Propagation',        '< 200ms',    'text-cyan-400'],
                    ['Warm-Path Minimum',      '0.60 Alpha', 'text-purple-400'],
                    ['Follow-Up SLA',          '48 Hours',   'text-amber-400'],
                    ['Max Outreach Attempts',  '3 / Node',   'text-slate-400'],
                  ].map(([label, val, color]) => (
                    <div key={label} className="flex justify-between items-center text-[11px] font-mono py-2 border-b border-white/5 last:border-0">
                      <span className="text-slate-400">{label}</span>
                      <span className={color}>{val}</span>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                  <h4 className="text-sm font-bold mb-4 uppercase tracking-tight text-slate-400">Score Event Map</h4>
                  {Object.entries(SCORE_MAP).map(([event, delta]) => (
                    <div key={event} className="flex justify-between items-center text-[11px] font-mono py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-slate-500">{event}</span>
                      <span className={delta > 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {delta > 0 ? '+' : ''}{delta}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Kernel logs */}
          {activeTab === 'telemetry' && (
            <div className="bg-[#09090D] rounded-2xl border border-white/10 p-6 h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Terminal size={14} /> System Kernel Logs
                </h3>
                <button
                  onClick={() => setLogs([])}
                  className="text-[10px] text-slate-600 hover:text-white uppercase tracking-widest transition-colors font-mono"
                >
                  Reset Buffer
                </button>
              </div>
              <div className="flex-grow overflow-y-auto space-y-1.5 pr-2">
                {logs.length === 0 && (
                  <p className="text-slate-800 font-mono text-xs italic">Awaiting telemetry...</p>
                )}
                {logs.map((log, i) => (
                  <p key={i} className="font-mono text-[11px] leading-tight">
                    <span className="text-slate-700 mr-2">{String(i).padStart(3, '0')}</span>
                    <span className={
                      log.includes('FAILURE') || log.includes('ERROR')
                        ? 'text-red-400'
                        : log.includes('SUCCESS') || log.includes('MEMBRAIN') || log.includes('SYSTEM')
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                    }>
                      {log}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          )}

        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] text-slate-700 font-mono uppercase tracking-widest">
          © 2026 PlatFormula.ONE · Autonomous Capital-Routing SDK
        </p>
        <div className="flex gap-6 text-[10px] text-slate-700 font-mono">
          <span>NEXUS_CORE_ALPHA</span>
          <span>JB_STRICT_OS</span>
          <span>MONOREPO_v1.2</span>
        </div>
      </footer>
    </div>
  );
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
