export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { input, tone } = await req.json();

  if (!input) {
    return new Response(JSON.stringify({ error: 'No input provided' }), { status: 400 });
  }

  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
  }

  const system = `You are a real human X/Twitter poster. Take the messy user input, fix spelling/grammar silently, then write ONE extremely natural tweet that sounds 100% human. Match the tone perfectly. Never sound like AI. Max 280 characters. Return ONLY JSON: {"tweet": "..."}`;

  const userMsg = `Tone: ${tone.toUpperCase()}\n\nMessy input:\n${input}`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-reasoning",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg }
        ],
        temperature: 0.9,
        max_tokens: 350
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify({ tweet: parsed.tweet }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to generate tweet' }), { status: 500 });
  }
}
