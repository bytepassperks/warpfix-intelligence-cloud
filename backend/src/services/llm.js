const { logger } = require('../utils/logger');

async function callLLM({ system, user, maxTokens = 2000 }) {
  const apiKey = process.env.PAGEGRID_API_KEY;
  const apiUrl = process.env.PAGEGRID_API_URL || 'https://pagegrid.in/api/v1';

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
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('LLM API error', { status: response.status, error });
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    logger.error('LLM call failed', { error: err.message });
    throw err;
  }
}

module.exports = { callLLM };
