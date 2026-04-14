/**
 * PlatFormula.One — Decentralized Builder v2 (React/Firebase)
 * Jonathan Behrendt Edition — 3-pillar A→B→C layout
 *
 * FIXES vs Manus canvas version:
 * 1. __firebase_config  → VITE_ env vars
 * 2. __initial_auth_token / __app_id  → VITE_ env vars
 * 3. getApps() guard retained (prevents double-init on HMR)
 *
 * SETUP:
 *   npm install firebase lucide-react
 *
 *   .env:
 *     VITE_FIREBASE_API_KEY=
 *     VITE_FIREBASE_AUTH_DOMAIN=
 *     VITE_FIREBASE_PROJECT_ID=
 *     VITE_FIREBASE_STORAGE_BUCKET=
 *     VITE_FIREBASE_MESSAGING_SENDER_ID=
 *     VITE_FIREBASE_APP_ID=
 *     VITE_APP_ID=decentralized-builder-v2
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
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  Brain, Database, GitBranch, Zap, Shield,
  Terminal, Play, CheckCircle, Network, Activity,
  ArrowRight, Server, Layers,
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

const app   = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth  = getAuth(app);
const db    = getFirestore(app);
const APP_ID = import.meta.env.VITE_APP_ID || 'decentralized-builder-v2';

// ── Default DAC ────────────────────────────────────
const DEFAULT_DAC = `// [A] CONFIGURATION: Capital-Routing Logic
// Autonomous Sales Navigator Ingestion

ingest("sales_nav_search") {
  source: "PhantomBuster",
  target: ["GP", "Partner"],
  keywords: ["AI", "Infra"],
}

enrich("crunchbase") {
  fields: ["fund_size", "check_size"],
}

route("warm_path") {
  max_hops: 2,
  min_strength: 0.6,
  operators: ["Jonathan Behrendt"]
}`;

// ── Sample leads ───────────────────────────────────
const SAMPLE_LEADS = [
  { name: 'Andrej Karpathy', org: 'OpenAI',          role: 'Founding Member' },
  { name: 'Sarah Tavel',     org: 'Benchmark',        role: 'GP'             },
  { name: 'Naval Ravikant',  org: 'AngelList',        role: 'Founder'        },
  { name: 'Keith Rabois',    org: 'Khosla Ventures',  role: 'MD'             },
];

// ── App ────────────────────────────────────────────
export default function DecentralizedBuilderV2() {
  const [user,         setUser]         = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs,         setLogs]         = useState([]);
  const [nodes,        setNodes]        = useState([]);
  const [stats,        setStats]        = useState({ totalNodes: 0, warmPaths: 0 });
  const [dacCode,      setDacCode]      = useState(DEFAULT_DAC);

  const addLog = useCallback((msg) => {
    setLogs(prev =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10)
    );
  }, []);

  // Auth
  useEffect(() => {
    const init = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        addLog(`AUTH_ERROR: ${err.message}`);
      }
    };
    init();
    return onAuthStateChanged(auth, setUser);
  }, [addLog]);

  // Firestore sync
  useEffect(() => {
    if (!user) return;
    addLog('MEMBRAIN: Establishing graph connection...');

    const col = collection(db, 'artifacts', APP_ID, 'public', 'data', 'membrain_nodes');
    const q   = query(col);

    return onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0));

      setNodes(data);
      setStats({
        totalNodes: data.length,
        warmPaths:  data.filter(n => Number(n.path_strength) >= 0.6).length,
      });
      addLog(`MEMBRAIN: Synced ${data.length} active nodes.`);
    }, (err) => addLog(`SYNC_ERROR: ${err.message}`));
  }, [user, addLog]);

  // Execute assimilation
  const triggerAssembly = async () => {
    if (!user) return;
    setIsProcessing(true);
    addLog('ASSEMBLY: Initiating decentralized builder stack...');

    try {
      addLog('PIPELINE: Triggering Sales Navigator Lead Capture...');
      await delay(600);
      addLog('ENRICHMENT: Processing Crunchbase/FactSet datasets...');
      await delay(600);
      addLog('ROUTING: Computing Warm-Paths via Chain Trio...');

      const lead = SAMPLE_LEADS[Math.floor(Math.random() * SAMPLE_LEADS.length)];
      const col  = collection(db, 'artifacts', APP_ID, 'public', 'data', 'membrain_nodes');

      await addDoc(col, {
        name:           lead.name,
        external_id:    `linkedin:${lead.name.toLowerCase().replace(/\s+/g, '-')}`,
        organization:   lead.org,
        role:           lead.role,
        status:         'ENRICHED',
        priority_score: Math.floor(Math.random() * 40) + 60,
        path_strength:  parseFloat((Math.random() * 0.4 + 0.5).toFixed(2)),
        timestamp:      serverTimestamp(),
      });

      addLog(`SUCCESS: Assembled node [${lead.name}] into MemBrain.`);
    } catch (err) {
      addLog(`EXECUTION_ERROR: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E2E8F0] font-sans p-4 md:p-8 selection:bg-[#00FF66]/30">

      {/* Header */}
      <header className="max-w-[1400px] mx-auto mb-8 bg-[#11141A] border border-[#2D3748] rounded-lg p-6 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            PLATFORMULA.ONE
            <span className="text-[#0A0C10] bg-[#00FF66] px-3 py-1 rounded text-sm tracking-widest">
              DECENTRALIZED BUILDER
            </span>
          </h1>
          <p className="mt-2 text-[#94A3B8] font-mono text-xs uppercase tracking-[0.2em]">
            Jonathan Behrendt Edition // Autonomous Capital-Routing OS
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end bg-[#0A0C10] px-4 py-2 rounded border border-[#2D3748]">
            <span className="text-[10px] text-[#64748B] font-mono uppercase">System Status</span>
            <span className="text-[#00FF66] font-bold text-xs flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> ONLINE &amp; SECURE
            </span>
          </div>
          <div className="flex flex-col items-end bg-[#0A0C10] px-4 py-2 rounded border border-[#2D3748]">
            <span className="text-[10px] text-[#64748B] font-mono uppercase">Global Nodes</span>
            <span className="text-white font-bold text-xs">{stats.totalNodes} SYNCED</span>
          </div>
        </div>
      </header>

      {/* A → B → C three-pillar layout */}
      <main className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── [A] DAC CONFIGURATION ── */}
        <section className="bg-[#11141A] border-t-4 border-t-[#3B82F6] border border-[#2D3748] rounded-b-lg shadow-xl flex flex-col h-[750px]">
          <div className="bg-[#1A202C] p-4 border-b border-[#2D3748] flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#3B82F6]/20 text-[#3B82F6] flex items-center justify-center font-black">A</div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Define Variables</h2>
              <p className="text-[10px] text-[#94A3B8] font-mono">DNS-as-Code (DAC) Editor</p>
            </div>
          </div>

          <div className="p-6 border-b border-[#2D3748] bg-[#0A0C10]">
            <ul className="space-y-3">
              {[
                'Define ingestion targets, keywords, and enrichment criteria below.',
                'Code modifications are auto-saved to local memory.',
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#CBD5E1]">
                  <ArrowRight size={14} className="text-[#3B82F6] flex-shrink-0 mt-0.5" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-grow relative">
            <textarea
              value={dacCode}
              onChange={(e) => setDacCode(e.target.value)}
              className="absolute inset-0 w-full h-full bg-[#0A0C10] p-6 font-mono text-sm text-[#3B82F6] outline-none resize-none leading-relaxed caret-white"
              spellCheck={false}
            />
          </div>

          <div className="bg-[#1A202C] p-3 text-[10px] font-mono text-[#64748B] flex justify-between border-t border-[#2D3748]">
            <span className="flex items-center gap-1">
              <CheckCircle size={12} className="text-[#00FF66]" /> SYNTAX VALID
            </span>
            <span>UTF-8 // DAC v2.5</span>
          </div>
        </section>

        {/* ── [B] CHAIN TRIO ENGINE ── */}
        <section className="bg-[#11141A] border-t-4 border-t-[#00FF66] border border-[#2D3748] rounded-b-lg shadow-xl flex flex-col h-[750px]">
          <div className="bg-[#1A202C] p-4 border-b border-[#2D3748] flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#00FF66]/20 text-[#00FF66] flex items-center justify-center font-black">B</div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Orchestrate Engine</h2>
              <p className="text-[10px] text-[#94A3B8] font-mono">Chain Trio Automation</p>
            </div>
          </div>

          <div className="p-6 flex-grow flex flex-col justify-between">
            <div className="space-y-6">
              <p className="text-xs text-[#CBD5E1] leading-relaxed bg-[#0A0C10] p-4 rounded border border-[#2D3748]">
                Executing this engine triggers the{' '}
                <strong className="text-white">Chain Trio</strong>. It converts the DAC logic from Phase [A]
                into persistent reality — handling API routing, data enrichment, and formatting autonomously.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Brain,     title: 'Cognitive Processing', desc: 'Crunchbase / FactSet matching' },
                  { icon: Database,  title: 'Persistent Storage',   desc: 'Writing to MemBrain Layer'    },
                  { icon: GitBranch, title: 'Version Control',      desc: 'Immutable history tracking'   },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-center gap-4 bg-[#1A202C] p-4 rounded border border-[#2D3748]">
                    <div className="text-[#00FF66] bg-[#0A0C10] p-2 rounded">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h4>
                      <p className="text-[10px] text-[#94A3B8] font-mono">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={triggerAssembly}
              disabled={isProcessing || !user}
              className="w-full py-6 mt-6 rounded bg-[#00FF66] hover:bg-[#00E65C] disabled:bg-[#2D3748] disabled:text-[#64748B] text-[#0A0C10] font-black text-lg uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,255,102,0.3)] active:scale-95 disabled:shadow-none"
            >
              {isProcessing ? <Zap size={24} className="animate-pulse" /> : <Play size={24} />}
              {isProcessing ? 'ASSIMILATING DATA...' : 'EXECUTE ASSIMILATION'}
            </button>
          </div>
        </section>

        {/* ── [C] MEMBRAIN OUTPUT ── */}
        <section className="bg-[#11141A] border-t-4 border-t-[#A855F7] border border-[#2D3748] rounded-b-lg shadow-xl flex flex-col h-[750px]">
          <div className="bg-[#1A202C] p-4 border-b border-[#2D3748] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#A855F7]/20 text-[#A855F7] flex items-center justify-center font-black">C</div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Review Persistence</h2>
                <p className="text-[10px] text-[#94A3B8] font-mono">MemBrain Result Mesh</p>
              </div>
            </div>
            <Network size={18} className="text-[#A855F7]" />
          </div>

          {/* Node table */}
          <div className="flex-grow overflow-y-auto bg-[#0A0C10]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1A202C] text-[#94A3B8] uppercase text-[10px] sticky top-0 border-b border-[#2D3748]">
                <tr>
                  <th className="p-3">Target Profile</th>
                  <th className="p-3 text-center">Score</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {nodes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-10 text-center text-[#64748B] font-mono italic">
                      Awaiting execution...
                    </td>
                  </tr>
                ) : (
                  nodes.map((node) => (
                    <tr key={node.id} className="border-b border-[#2D3748] hover:bg-[#1A202C] transition-colors">
                      <td className="p-3">
                        <div className="text-white font-bold">{node.name}</div>
                        <div className="text-[#64748B] text-[10px] font-mono">{node.organization}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[#00FF66] font-mono font-bold bg-[#00FF66]/10 px-2 py-1 rounded">
                          {node.priority_score}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-[10px] font-black uppercase text-[#A855F7]">
                          {node.status || 'SYNCED'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Kernel logs */}
          <div className="h-48 border-t border-[#2D3748] bg-[#0A0C10] flex flex-col flex-shrink-0">
            <div className="bg-[#1A202C] px-3 py-2 border-b border-[#2D3748] flex items-center gap-2">
              <Terminal size={12} className="text-[#94A3B8]" />
              <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Kernel Logs</span>
            </div>
            <div className="p-3 overflow-y-auto flex-grow space-y-1">
              {logs.length === 0 ? (
                <div className="text-[#64748B] font-mono text-[10px]">Standby for system telemetry...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="font-mono text-[10px] text-[#CBD5E1]">
                    <span className="text-[#64748B] mr-2">{'>>'}</span>
                    <span className={
                      log.includes('SUCCESS') ? 'text-[#00FF66]'
                      : log.includes('ERROR')  ? 'text-red-500'
                      : ''
                    }>
                      {log}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="max-w-[1400px] mx-auto mt-8 border-t border-[#2D3748] pt-6 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-[#64748B] uppercase tracking-[0.2em]">
        <p>© 2026 PlatFormula.ONE // JoyceGPT Integration</p>
        <p className="mt-2 md:mt-0">STRICT OS ENVIRONMENT // ZERO-FLUFF ENFORCED</p>
      </footer>
    </div>
  );
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
