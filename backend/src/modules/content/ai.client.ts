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

export async function callClaude(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  purpose: string,
  userId?: string,
  maxTokens = 4096
): Promise<{ text: string; tokensIn: number; tokensOut: number }> {
  logger.debug({ model, purpose }, 'Calling Claude API');

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const tokensIn = response.usage.input_tokens;
  const tokensOut = response.usage.output_tokens;
  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

  // Log usage for observability
  await query(
    `INSERT INTO api_usage_log (model, purpose, tokens_in, tokens_out, cache_hit, user_id)
     VALUES ($1,$2,$3,$4,false,$5)`,
    [model, purpose, tokensIn, tokensOut, userId ?? null]
  ).catch(err => logger.warn({ err }, 'Failed to log API usage'));

  logger.info({ model, purpose, tokensIn, tokensOut }, 'Claude API call complete');
  return { text, tokensIn, tokensOut };
}
