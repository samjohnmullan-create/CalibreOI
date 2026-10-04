/* Bench assistant. Pages call ask(). The phone never sees the OpenAI key. */
const KEY = "calibre-ai-settings";
export const DEFAULTS = {
  endpoint: ""
};
export function loadSettings(){
  try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || "{}")); }
  catch { return { ...DEFAULTS }; }
}
export function saveSettings(s){ localStorage.setItem(KEY, JSON.stringify({ endpoint: (s.endpoint || "").trim() })); }
export function systemPrompt(brief, page){
  return [
    "You are the bench assistant for Calibre & Co., a one-person workshop restoring antique pocket watches and vintage watches in Hobart.",
    "You already have this job. Do not ask the watchmaker to repeat the maker, calibre, stage, or timing if it is in the brief.",
    "Write like a careful watchmaker: short, specific, no fluff. Prefer sequence, what to check next, and what a bad reading looks like.",
    "Do not invent serials, part numbers, or timing figures that are not in the brief. Say when a photo or measurement is missing.",
    "Amplitude from a phone mic is an estimate. Rate is only as good as the signal. Do not suggest a regulation move if confidence is under 50.",
    page ? `The watchmaker is on the ${page} page.` : "",
    "Job brief:\n" + (brief || "No job loaded.")
  ].filter(Boolean).join("\n");
}
export async function ask({ messages, brief, page, images }){
  const cfg = loadSettings();
  if (!cfg.endpoint) throw new Error("ChatGPT is not connected. Settings needs the secure endpoint. Until then, copy the job brief from Assistant.");
  const res = await fetch(cfg.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brief, page, messages, images: images || [] })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Assistant ${res.status}`);
  return data.text || "";
}
export function readyLabel(){
  return loadSettings().endpoint ? "ChatGPT connected" : "ChatGPT not connected";
}
