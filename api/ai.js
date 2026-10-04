export default async function handler(req, res){
  if (req.method !== "POST"){ res.status(405).json({ error:"POST only" }); return; }
  const key = process.env.XAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!key){ res.status(500).json({ error:"Set XAI_API_KEY on the server. The browser never sees it." }); return; }
  const base = (process.env.AI_BASE_URL || "https://api.x.ai/v1").replace(/\/$/, "");
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const upstream = await fetch(base + "/chat/completions", {
    method:"POST",
    headers:{ "Content-Type":"application/json", Authorization:"Bearer " + key },
    body: JSON.stringify({ model: body.model || process.env.AI_MODEL || "grok-4", temperature: 0.3, messages: body.messages })
  });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok){ res.status(upstream.status).json({ error: data.error?.message || "Upstream error" }); return; }
  res.status(200).json({ text: data.choices?.[0]?.message?.content || "" });
}
