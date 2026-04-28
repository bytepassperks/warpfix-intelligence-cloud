const { logger } = require('../utils/logger');

async function callLLM({ system, user, maxTokens = 2000 }) {
  const apiKey = process.env.PAGEGRID_API_KEY;
  const apiUrl = process.env.PAGEGRID_API_URL || 'https://api.pagegrid.in';
  const model = process.env.PAGEGRID_MODEL || 'claude-sonnet-4-6';

  if (!apiKey) {
    logger.warn('PAGEGRID_API_KEY not set, returning mock response');
    return JSON.stringify({
      errorMessage: 'Mock LLM response - configure PAGEGRID_API_KEY',
      stackTrace: '',
      rootCause: 'LLM not configured',
      affectedFiles: [],
      type: 'unknown',
      summary: 'LLM not configured',
      severity: 'medium',
    });
  }

  try {
    const response = await fetch(`${apiUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        system,
        messages: [
          { role: 'user', content: user },
        ],
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('LLM API error', { status: response.status, error });
      throw new Error(`LLM API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    if (!text) {
      logger.warn('LLM returned empty response', { data });
    }

    return text;
  } catch (err) {
    logger.error('LLM call failed', { error: err.message });
    throw err;
  }
}

module.exports = { callLLM };
