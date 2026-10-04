/* AI adapter. Pages call ask() — they do not know whether the model is Grok, OpenAI, or a proxy. */
const KEY = "calibre-ai-settings";
export const DEFAULTS = {
  mode: "proxy",
  baseUrl: "https://api.x.ai/v1",
  model: "grok-4",
  apiKey: "",
  proxyPath: "/api/ai"
};
export function loadSettings(){
  try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || "{}")); }
  catch { return { ...DEFAULTS }; }
}
export function saveSettings(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
export function systemPrompt(brief, page){
  return [
    "You are the bench assistant for Calibre & Co., a one-person workshop restoring antique pocket watches and vintage watches in Hobart.",
    "Write like a careful watchmaker: short, specific, no fluff. Prefer measurements, sequence, and what to check next.",
    "Do not invent serials, parts numbers, or timing figures that are not in the job brief. Say when a photo or measurement is missing.",
    "Amplitude from a phone mic is an estimate. Rate is only as good as the signal.",
    page ? `The watchmaker is on the ${page} page.` : "",
    "Job brief:\n" + (brief || "No job loaded.")
  ].filter(Boolean).join("\n");
}
export async function ask({ messages, brief, page, settings }){
  const cfg = settings || loadSettings();
  const payload = {
    model: cfg.model || DEFAULTS.model,
    temperature: 0.3,
    messages: [{ role:"system", content: systemPrompt(brief, page) }, ...messages]
  };
  if (cfg.mode === "proxy"){
    const res = await fetch(cfg.proxyPath || "/api/ai", {
      method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Proxy ${res.status}`);
    return data.text || data.choices?.[0]?.message?.content || "";
  }
  if (!cfg.apiKey) throw new Error("No API key on this device. Add one in Settings, or switch to the server proxy.");
  const root = (cfg.baseUrl || DEFAULTS.baseUrl).replace(/\/$/, "");
  const res = await fetch(root + "/chat/completions", {
    method:"POST",
    headers:{ "Content-Type":"application/json", Authorization: "Bearer " + cfg.apiKey },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || data.error || `Model ${res.status}`);
  return data.choices?.[0]?.message?.content || "";
}
export function readyLabel(){
  const s = loadSettings();
  if (s.mode === "proxy") return "AI via server proxy";
  return s.apiKey ? `AI direct · ${s.model}` : "AI not connected";
}
