import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';
import { query } from '../../db/client';
import { logger } from '../../config/logger';

export const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export const MODEL = {
  FAST: 'claude-haiku-4-5-20251001',   // MCQ eval, simple tasks
  BALANCED: 'claude-sonnet-4-6',        // Teaching content, essay eval
  POWERFUL: 'claude-opus-4-6',          // Complex reasoning (used sparingly)
} as const;

const API_TIMEOUT_MS = 55_000; // 55s — frontend shows warning at 25s, gives up at 60s

export async function callClaude(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  purpose: string,
  userId?: string,
  maxTokens = 2048
): Promise<{ text: string; tokensIn: number; tokensOut: number }> {
  logger.debug({ model, purpose }, 'Calling Claude API');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await anthropic.messages.create(
      {
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      },
      { signal: controller.signal }
    );

    const tokensIn = response.usage.input_tokens;
    const tokensOut = response.usage.output_tokens;
    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

    await query(
      `INSERT INTO api_usage_log (model, purpose, tokens_in, tokens_out, cache_hit, user_id)
       VALUES ($1,$2,$3,$4,false,$5)`,
      [model, purpose, tokensIn, tokensOut, userId ?? null]
    ).catch(err => logger.warn({ err }, 'Failed to log API usage'));

    logger.info({ model, purpose, tokensIn, tokensOut }, 'Claude API call complete');
    return { text, tokensIn, tokensOut };
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw Object.assign(new Error('AI request timed out after 55 seconds'), { code: 'AI_TIMEOUT' });
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
