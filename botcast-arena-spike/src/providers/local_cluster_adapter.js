/**
 * BotCast Arena · Local Cluster Adapter
 * Routes persona assignments to specific Ollama nodes (e.g., two Tiiny AI Pocket Lab units).
 * TALON Control Plane addresses each inference node by network endpoint.
 *
 * Topology:
 *   ASUS TALON (Control Plane) → orchestrates TurnSignal + Debate Graph
 *   Tiiny Node A (baseUrl A)   → Debater 1 persona
 *   Tiiny Node B (baseUrl B)   → Debater 2 persona
 */

import { OllamaAdapter } from './ollama_adapter.js';

/**
 * NodeDefinition — a single Ollama inference node in the cluster
 */
export class InferenceNode {
  constructor({ nodeId, baseUrl, label, assignedPersonaIds = [] }) {
    this.nodeId = nodeId;
    this.baseUrl = baseUrl;
    this.label = label;
    this.assignedPersonaIds = new Set(assignedPersonaIds);
    this._adapter = new OllamaAdapter(baseUrl);
    this.status = 'unknown'; // unknown | online | offline
    this.lastPingMs = null;
  }

  async probe() {
    const available = await this._adapter.isAvailable();
    this.status = available ? 'online' : 'offline';
    this.lastPingMs = Date.now();
    return available;
  }

  async listModels() {
    return this._adapter.listModels();
  }

  async call(params) {
    return this._adapter.call(params);
  }

  toJSON() {
    return {
      nodeId: this.nodeId,
      label: this.label,
      baseUrl: this.baseUrl,
      status: this.status,
      assignedPersonaIds: [...this.assignedPersonaIds],
      lastPingMs: this.lastPingMs,
    };
  }
}

/**
 * LocalClusterAdapter
 * Manages a cluster of Ollama inference nodes.
 * Maps persona IDs → specific node endpoints.
 * Falls back to round-robin if a node is offline.
 *
 * Engineering Mule default:
 *   Node A: http://tiiny-a.local:11434  (or IP)
 *   Node B: http://tiiny-b.local:11434  (or IP)
 *   TALON:  http://localhost:11434       (fallback)
 */
export class LocalClusterAdapter {
  constructor(nodes = []) {
    this.nodes = nodes.map(n => new InferenceNode(n));
    this._personaMap = {}; // personaId → nodeId

    for (const node of this.nodes) {
      for (const personaId of node.assignedPersonaIds) {
        this._personaMap[personaId] = node.nodeId;
      }
    }

    this.provider = 'local_cluster';
    this._roundRobinIdx = 0;
  }

  async probeAll() {
    const results = await Promise.allSettled(this.nodes.map(n => n.probe()));
    return this.nodes.map((n, i) => ({
      nodeId: n.nodeId,
      label: n.label,
      status: n.status,
      error: results[i].status === 'rejected' ? results[i].reason?.message : null,
    }));
  }

  getNodeForPersona(personaId) {
    const nodeId = this._personaMap[personaId];
    const node = nodeId ? this.nodes.find(n => n.nodeId === nodeId) : null;
    if (node?.status === 'online') return node;

    // Fallback: find any online node
    const online = this.nodes.filter(n => n.status === 'online');
    if (online.length === 0) return null;

    // Round-robin among online nodes
    const fallback = online[this._roundRobinIdx % online.length];
    this._roundRobinIdx++;
    return fallback;
  }

  async call({ personaId, model, messages, maxTokens, temperature }) {
    const node = this.getNodeForPersona(personaId);
    if (!node) throw new Error(`No online node available for persona ${personaId}`);

    const result = await node.call({ model, messages, maxTokens, temperature });
    return {
      ...result,
      provider: `local_cluster:${node.nodeId}`,
      node_id: node.nodeId,
      node_label: node.label,
    };
  }

  getClusterStatus() {
    return {
      total: this.nodes.length,
      online: this.nodes.filter(n => n.status === 'online').length,
      offline: this.nodes.filter(n => n.status === 'offline').length,
      unknown: this.nodes.filter(n => n.status === 'unknown').length,
      nodes: this.nodes.map(n => n.toJSON()),
    };
  }
}

/**
 * Factory: build the standard "Engineering Mule" 3-node cluster
 * (ASUS TALON Control Plane + 2x Tiiny AI Pocket Lab isolated debater nodes)
 *
 * ARCHITECTURE NOTE: Tiiny nodes are ISOLATED inference compartments — not pooled memory.
 * Each Tiiny (80GB LPDDR5X, ~190 TOPS NPU) runs its own model independently.
 * Memory does NOT pool across nodes. This is the correct topology for BotCast Arena:
 * debaters are physically separated, which is architecturally desirable.
 *
 * Phase gating:
 *   Phase 1 — use cloud adapters (OpenAI, Anthropic, Gemini). No Tiiny required.
 *   Phase 2 — add ONE Tiiny. Validate headless mode, SSH, local API, LAN inference.
 *   Phase 3 — add second Tiiny after Phase 2 stability is confirmed.
 *
 * Tiiny pre-buy checklist (validate before purchase):
 *   1. Headless mode works           → OllamaAdapter.isAvailable()
 *   2. SSH / admin shell exists      → manual verification
 *   3. Local API endpoint exists     → OllamaAdapter.isAvailable()
 *   4. OpenAI-compatible endpoint    → Ollama /v1/chat/completions
 *   5. LAN inference supported       → configurable baseUrl below
 *   6. Docker / service deployment   → manual verification
 *   7. Model formats documented      → OllamaAdapter.listModels()
 *   8. Independent multi-node orchestration → LocalClusterAdapter design
 *
 * @param {object} opts
 * @param {string} opts.tiinyA   - Tiiny Node A LAN endpoint (default: http://192.168.1.101:11434)
 * @param {string} opts.tiinyB   - Tiiny Node B LAN endpoint (default: http://192.168.1.102:11434)
 * @param {string} opts.talon    - TALON local endpoint      (default: http://localhost:11434)
 */
export function buildEngineeringMuleCluster({
  tiinyA = 'http://192.168.1.101:11434',
  tiinyB = 'http://192.168.1.102:11434',
  talon  = 'http://localhost:11434',
} = {}) {
  return new LocalClusterAdapter([
    {
      nodeId: 'tiiny-a',
      baseUrl: tiinyA,
      label: 'Tiiny Node A · Debater 1',
      assignedPersonaIds: ['claude-skeptic', 'local-redteam'],
    },
    {
      nodeId: 'tiiny-b',
      baseUrl: tiinyB,
      label: 'Tiiny Node B · Debater 2',
      assignedPersonaIds: ['venture-bull', 'technical-bear', 'market-analyst'],
    },
    {
      nodeId: 'talon-local',
      baseUrl: talon,
      label: 'ASUS TALON · Fallback + TALON Moderator',
      assignedPersonaIds: ['talon-moderator'],
    },
  ]);
}
