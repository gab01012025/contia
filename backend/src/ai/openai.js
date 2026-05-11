const OpenAI = require('openai');

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

let client = null;
function getClient() {
  if (!client) {
    if (!apiKey) throw new Error('OPENAI_API_KEY no configurada');
    client = new OpenAI({ apiKey });
  }
  return client;
}

async function redactar({ system, user, maxTokens = 1500 }) {
  const c = getClient();
  const completion = await c.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.4,
    max_tokens: maxTokens,
  });
  return completion.choices?.[0]?.message?.content?.trim() || '';
}

module.exports = { redactar };
