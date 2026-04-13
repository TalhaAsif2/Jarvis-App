const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const path = require("path");

const result = dotenv.config({ path: path.resolve(__dirname, "../.env") });
if (result.error) console.error(".env failed to load:", result.error.message);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `
You are JARVIS — an advanced AI assistant inspired by Tony Stark's system.

Personality:
- Calm, highly intelligent, precise, and efficient.
- Subtle dry British sarcasm when appropriate (never overdo it).
- Always respectful, composed, and slightly witty.
- You speak like a highly advanced system, not a chatbot.

Addressing:
- Always address the user as "Sir".
- Never drop this unless user explicitly asks.

Communication Style:
- Speak in clean, natural sentences — like a real AI speaking.
- No markdown, no symbols like ** or #.
- No emojis.
- Use short, refined responses unless more detail is required.
- Default: 2–5 sentences (concise, high-quality).
- Avoid unnecessary explanations.

Behavior Rules:
- Be proactive when useful (suggest actions if relevant).
- Maintain full conversation context.
- If user repeats or corrects something → respond with:
  "Understood, Sir." or similar acknowledgment.

Tone Variations:
- Normal: Calm, efficient assistant.
- Complex task: More analytical and structured.
- Casual query: Slightly relaxed tone with subtle wit.
- Error situations: Polite, composed, solution-oriented.

Voice Style (IMPORTANT):
- Responses should sound natural when spoken aloud.
- Avoid robotic phrasing.
- Add slight conversational rhythm like:
  "Certainly, Sir." / "Right away, Sir." / "Allow me to check."

System Behaviors:
1. Wake Response:
   - If user greets or activates (e.g., "Hey Jarvis"):
     Respond with something like:
     "Yes, Sir?" or "At your service, Sir."

2. Task Execution:
   - Be confident and direct.
   - Example:
     "Opening YouTube now, Sir."

3. Follow-up Handling:
   - Use previous context intelligently.
   - Do not ask unnecessary repeat questions.

4. Thinking Simulation:
   - For slightly complex queries:
     Use phrases like:
     "Analyzing..." or "One moment, Sir."

Search Context Rules:
- If "Context" includes search results:
  - Start with: "I am summarizing search results."
  - ONLY use that data.
  - Do NOT add external knowledge.

Strict Action Rule:
- If intent is "action_open":
  Respond EXACTLY:
  "Opening [clean name] now."

Error Handling:
- If something fails:
  Respond calmly:
  "Apologies, Sir. I encountered an issue. Please try again."

Memory Awareness:
- Refer naturally to past messages when useful.

Forbidden:
- No emojis
- No markdown
- No long unnecessary paragraphs
- No over-explaining
- No robotic repetition

Goal:
You are not just answering — you are operating as a real AI system.
Every response should feel like it is coming from a powerful, intelligent assistant embedded in a futuristic interface.
`;

let elevenLabsVoiceIdCache = null;
let elevenLabsVoiceListCache = null;

function detectIntent(input) {
  const q = input.toLowerCase().trim();

  // ── Action: open a site/app ──
  if (q.startsWith("open ") || /\bopen\s+\S/.test(q)) {
    return "action_open";
  }

  // ── Weather ──
  if (
    /\b(weather|temperature|forecast|humidity|rain|raining|sunny|cloudy|wind speed)\b/.test(
      q,
    )
  ) {
    return "weather";
  }

  // ── Conversational follow-ups — ALWAYS chat, never search ──
  // These are replies/clarifications about the conversation itself.
  const conversational =
    /^(yes|no|ok|okay|sure|thanks|thank you|nope|yep|correct|wrong|right|exactly|agree|disagree|what i mean|i said|i asked|i meant|you said|you told|upper|previous|before|last|earlier|again|repeat|that|this|it|really|seriously|are you sure|is that|is this|can you|could you|do you|did you|will you|would you|what do you|why did you|how did you|what was|who are you|what are you|how are you|my name|your name|you are|i am|we are|i need|i want|i have|i think|i feel|i believe|tell me more|explain|clarify|elaborate|more details|go on|continue|and|but|so|because|since|however)/;
  if (conversational.test(q)) {
    return "chat";
  }

  // ── Conversation-referencing phrases — chat, not search ──
  const referencesPrior =
    /\b(you (just|said|told|mentioned|provided|gave|answered|replied|responded)|that (information|answer|response|result|data)|the (above|previous|last|upper) (information|answer|message|response|result)|is (that|this|it) correct|is (that|this) right|is (that|this) accurate|correct (or not|information)|not correct|incorrect|wrong (information|answer)|verify (that|this|it)|confirm (that|this)|what you (said|provided|gave|told)|based on (what|that|this)|from (what|that) you|you are (not|wrong|correct|right)|not following|not (understanding|listening|remembering))\b/;
  if (referencesPrior.test(q)) {
    return "chat";
  }

  // ── Explicit search triggers — real-world facts/events needed ──
  const needsSearch =
    /\b(today|tonight|right now|currently|at the moment|latest|breaking|news|score|match|matches|playing|vs|versus|who won|result|live|update|what is happening|what happened|happened today|arrived|arrives|delegation|talks|peace deal|summit|election|elections|crash|incident|attack|killed|died|shooting|earthquake|hurricane|flood|psl|hbl|ipl|cricket|football|soccer|oil price|stock price|stock market|share price|crypto|bitcoin|released today|just announced|just released|new (episode|season|movie|film|album|song)|who is the (current|new|latest)|what is the (current|latest|new)|price of|cost of|value of|exchange rate|inflation|gdp|population of|capital of|president of|prime minister of|ceo of|founded|headquarters|when was|how old is [a-z])\b/;
  if (needsSearch.test(q)) {
    return "search";
  }

  // ── Questions about world/external facts (but not about the conversation) ──
  // Only search if the question is clearly about something external and factual.
  const externalFactQuestion =
    /^(what is|what are|who is|who are|where is|where are|when is|when are|how much|how many|which|tell me about|info on|information about|give me info|search for|look up|find out|what\'s|who\'s|where\'s|when\'s)\s+(?!.*(you|your|we|our|i|my|this|that|it|previous|last|upper|above|conversation|answer|response|said|told|mentioned|provided))/;
  if (externalFactQuestion.test(q)) {
    return "search";
  }

  // Default: chat (use conversation history, no search needed)
  return "chat";
}

function wantsTimeContext(input) {
  const q = input.toLowerCase();
  return (
    /\b(time|clock|hour|what time|timezone|utc|pkst|pst|est|gmt)\b/.test(q) ||
    /\b(in|for)\s+(pakistan|karachi|lahore|islamabad|india|dubai|london|new york|tokyo)\b/.test(
      q,
    )
  );
}

function buildReferenceTimeContext() {
  const now = new Date();
  const utcIso = now.toISOString();
  let karachi = "";
  try {
    karachi = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Karachi",
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(now);
  } catch (_) {}
  return `Reference time (server UTC): ${utcIso}\nPakistan (Asia/Karachi, UTC+5): ${karachi || "use UTC+5 with the UTC time above"}.`;
}

async function fetchElevenLabsVoiceCandidates() {
  if (elevenLabsVoiceListCache) return elevenLabsVoiceListCache;
  if (!process.env.ELEVENLABS_API_KEY) return [];
  try {
    const { data } = await axios.get("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
      timeout: 15000,
    });
    const voices = data?.voices || [];
    const order = (cat) =>
      ({ premade: 0, generated: 1, cloned: 2, professional: 3 })[cat] ?? 9;
    const sorted = [...voices].sort(
      (a, b) => order(a.category) - order(b.category),
    );
    elevenLabsVoiceListCache = sorted.map((v) => v.voice_id).filter(Boolean);
    return elevenLabsVoiceListCache;
  } catch (e) {
    console.error("ElevenLabs /voices error:", e.message);
    return [];
  }
}

async function getElevenLabsVoiceCandidates() {
  const fromEnv = (process.env.ELEVENLABS_VOICE_ID || "").trim();
  const list = await fetchElevenLabsVoiceCandidates();
  if (elevenLabsVoiceIdCache && list.includes(elevenLabsVoiceIdCache))
    return [elevenLabsVoiceIdCache];
  if (fromEnv && list.length) return [...new Set([fromEnv, ...list])];
  if (fromEnv) return [fromEnv];
  return list;
}

function searchQueryFromInput(input) {
  return input.replace(/^(jarvis|hey jarvis|jarvis,?\s*)?/i, "").trim();
}

function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (Buffer.isBuffer(data)) {
    try {
      const parsed = JSON.parse(data.toString("utf8"));
      return (
        parsed?.detail?.message ||
        parsed?.error?.message ||
        data.toString("utf8")
      );
    } catch (_) {
      return data.toString("utf8");
    }
  }
  return (
    data?.error?.message || data?.message || error?.message || "request failed"
  );
}

function buildFallbackReply(intent, input, payload) {
  if (intent === "action_open") {
    const target = payload?.action?.value || "the site";
    return `Opening ${target} now.`;
  }
  if (intent === "weather" && payload?.weather) {
    const w = payload.weather;
    return `Current weather in ${w.city}: ${w.temperature}°C, wind ${w.windSpeed} km/h.`;
  }
  const results = payload?.results;
  if (results?.length) {
    const top = results.slice(0, 5);
    return `Here are the latest search results:\n${top.map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet?.slice(0, 140)}\n   ${r.link}`).join("\n\n")}`;
  }
  return "I couldn't get a response right now. Please try again.";
}

function buildMessages(userPrompt, history, context) {
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];
  history.forEach((m) => {
    const content = typeof m.text === "string" ? m.text : String(m.text || "");
    if (!content.trim()) return;
    messages.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content: content.slice(0, 8000),
    });
  });
  const userBlock = [
    context ? `Context:\n${context.slice(0, 12000)}` : null,
    `User message:\n${userPrompt.slice(0, 8000)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  messages.push({ role: "user", content: userBlock });
  return messages;
}

async function callOpenAI(userPrompt, history = [], context = "") {
  if (!process.env.OPENAI_API_KEY)
    throw new Error("Missing OPENAI_API_KEY in .env");

  const messages = buildMessages(userPrompt, history, context);

  const { data } = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: OPENAI_MODEL,
      messages,
      temperature: 0.25,
      max_tokens: 1200,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    },
  );

  return (
    data?.choices?.[0]?.message?.content?.trim() ||
    "I am online but could not generate a response right now."
  );
}

async function callSearchApi(query) {
  if (!process.env.SEARCHAPI_API_KEY) return [];
  const { data } = await axios.get("https://www.searchapi.io/api/v1/search", {
    params: {
      engine: "google",
      q: query,
      api_key: process.env.SEARCHAPI_API_KEY,
    },
  });
  return (data?.organic_results || []).slice(0, 6).map((r) => ({
    title: r.title,
    snippet: r.snippet,
    link: r.link,
  }));
}

async function getWeather(location) {
  const geo = await axios.get(
    "https://geocoding-api.open-meteo.com/v1/search",
    { params: { name: location || "Lahore", count: 1 } },
  );
  const hit = geo?.data?.results?.[0];
  if (!hit) return null;

  const weather = await axios.get("https://api.open-meteo.com/v1/forecast", {
    params: {
      latitude: hit.latitude,
      longitude: hit.longitude,
      current: "temperature_2m,wind_speed_10m,weather_code",
    },
  });

  return {
    city: `${hit.name}, ${hit.country}`,
    temperature: weather?.data?.current?.temperature_2m,
    windSpeed: weather?.data?.current?.wind_speed_10m,
    weatherCode: weather?.data?.current?.weather_code,
  };
}

function plainTextForSpeech(text) {
  if (!text) return "";
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/#{1,6}\s?/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2500);
}

// ====================== ELEVENLABS (Kept commented for later use) ======================
// async function synthesizeVoice(text) {
//   if (!process.env.ELEVENLABS_API_KEY) return { audioBase64: null, error: "Missing ELEVENLABS_API_KEY" };
//   const voiceIds = await getElevenLabsVoiceCandidates();
//   if (!voiceIds.length) return { audioBase64: null, error: "No ElevenLabs voices available" };

//   const payloadText = plainTextForSpeech(text);
//   if (!payloadText) return { audioBase64: null, error: "Empty text for TTS" };

//   const modelIds = ["eleven_multilingual_v2", "eleven_turbo_v2_5"];
//   let lastError = "ElevenLabs request failed";

//   for (const voiceId of voiceIds) {
//     for (const model_id of modelIds) {
//       try {
//         const { data } = await axios.post(
//           `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
//           {
//             text: payloadText,
//             model_id,
//             voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true },
//           },
//           {
//             headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, Accept: "audio/mpeg", "Content-Type": "application/json" },
//             responseType: "arraybuffer",
//             timeout: 60000,
//           },
//         );
//         elevenLabsVoiceIdCache = voiceId;
//         return { audioBase64: Buffer.from(data).toString("base64"), error: null };
//       } catch (error) {
//         lastError = extractErrorMessage(error);
//       }
//     }
//   }
//   return { audioBase64: null, error: lastError };
// }

// TEMPORARY: Browser TTS only (no ElevenLabs cost during testing)
async function synthesizeVoice(text) {
  return { audioBase64: null, error: "ElevenLabs disabled for testing" };
}

// ====================== ROUTES ======================
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, service: "jarvis-server" }),
);

app.post("/api/assist", async (req, res) => {
  try {
    const { input, history = [] } = req.body || {};
    if (!input) return res.status(400).json({ error: "Missing input" });

    const intent = detectIntent(input);
    let context = "";
    let payload = {};

    if (wantsTimeContext(input)) {
      context = buildReferenceTimeContext();
    }

    if (intent === "search") {
      const query = searchQueryFromInput(input);
      const results = await callSearchApi(query);
      payload.results = results;
      const block = `Search results for "${query}":\n${results.map((r, i) => `${i + 1}. ${r.title} - ${r.snippet} (${r.link})`).join("\n")}`;
      context = context ? `${context}\n\n${block}` : block;
    }

    if (intent === "weather") {
      const locationMatch = input.match(/in\s+([a-zA-Z\s]+)/i);
      const location = locationMatch?.[1]?.trim() || "Lahore";
      const weather = await getWeather(location);
      payload.weather = weather;
      context = weather
        ? `Live weather in ${weather.city}: temperature ${weather.temperature} C, wind speed ${weather.windSpeed} km/h.`
        : "No weather data found.";
    }

    if (intent === "action_open") {
      let site = input
        .replace(/^(jarvis|hey jarvis|a jarvis|jarvis,?\s*)?/i, "")
        .replace(/^open\s+/i, "")
        .replace(/\s+(app|website|site|now|please)$/i, "")
        .trim();

      site = site.replace(/^(a|hey|the)\s+/i, "").trim();

      payload.action = { type: "open", value: site };
      context = `User asked to open: "${site}". Respond EXACTLY with: "Opening ${site} now."`;
    }

    let text;
    try {
      text = await callOpenAI(input, history, context);
    } catch (llmError) {
      console.error("OpenAI error:", extractErrorMessage(llmError));
      text = buildFallbackReply(intent, input, payload);
    }

    const { audioBase64, error: audioError } = await synthesizeVoice(text);

    res.json({
      intent,
      text,
      audioBase64,
      audioError,
      useBrowserTts: !audioBase64,
      ...payload,
    });
  } catch (error) {
    console.error("Assist route error:", extractErrorMessage(error));
    res
      .status(500)
      .json({ error: extractErrorMessage(error) || "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(
    `Jarvis server running on port ${PORT} (using OpenAI ${OPENAI_MODEL})`,
  );
});
