import { RUN_STATUS, EngineError } from './contract.js';

/**
 * OpenMythos integration stub — internal orchestration engine.
 * Handles multi-step pipeline and waterfall strategies.
 * Not customer-facing vocabulary; engine_type='openmythos' in DB.
 */
export class OpenmythosIntegration {
  constructor(engineRouter, supabase, userId) {
    this._router   = engineRouter;
    this._supabase = supabase;
    this._userId   = userId;
  }

  async createRun({ topic, project_id, steps = [] }) {
    const run_id = 'om-' + Math.random().toString(16).slice(2, 10);

    const { data, error } = await this._supabase
      .from('engine_runs')
      .insert({
        run_id,
        project_id:   project_id || null,
        engine_type:  'openmythos',
        status:       RUN_STATUS.PENDING,
        topic,
        persona_ids:  [],
        started_by:   this._userId,
        started_at:   new Date().toISOString(),
        stage_outputs: { steps },
      })
      .select()
      .single();

    if (error) throw new EngineError('Failed to create OpenMythos run', { code: 'DB_INSERT_FAIL' });
    return data;
  }

  async executePipeline(runId, steps) {
    await this._supabase.from('engine_runs').update({ status: RUN_STATUS.RUNNING }).eq('run_id', runId);

    const results = [];
    let context = '';

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const prompt = step.prompt_template.replace('{{context}}', context);

      try {
        const result = await this._router.call(
          step.provider || 'openai',
          [{ role: 'user', content: prompt }],
          step.system_prompt || 'You are a professional analyst.',
        );
        results.push({ step: i, ...result });
        context += `\nStep ${i} (${step.label}): ${result.text}`;
      } catch (err) {
        results.push({ step: i, error: err.message, is_fallback: true });
      }
    }

    await this._supabase.from('engine_runs').update({
      status:       RUN_STATUS.COMPLETED,
      stage_outputs: { results },
      completed_at: new Date().toISOString(),
    }).eq('run_id', runId);

    return results;
  }
}
