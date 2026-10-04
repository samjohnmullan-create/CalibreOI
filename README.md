# Calibre & Co.

Phone bench app. Jobs stay on the phone. The assistant already receives the open job.

## ChatGPT

Pages call `ask()` in `js/ai.js`. That file posts the job brief to the endpoint saved in Settings.

The endpoint is `api/ai.js`. Set `OPENAI_API_KEY` on that host. Optional `OPENAI_MODEL`, default `gpt-4.1`. It calls `https://api.openai.com/v1/responses`. The phone never sees the key.

ChatGPT Plus does not pay for this. API use is billed separately.

Until the endpoint is set, Assistant can copy the job brief.
