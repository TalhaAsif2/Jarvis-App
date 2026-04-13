import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  LoaderCircle,
  Mic,
  Power,
  Sparkles,
  Keyboard,
} from "lucide-react";

// ── Injected global styles ──────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --cyan:    #00d4ff;
      --cyan-dim: #0099bb;
      --cyan-glow: rgba(0,212,255,0.35);
      --blue:    #1a6fff;
      --gold:    #f5a623;
      --red:     #ff3b5c;
      --bg:      #020b14;
      --panel:   rgba(4, 20, 38, 0.85);
      --border:  rgba(0, 212, 255, 0.18);
      --border-bright: rgba(0, 212, 255, 0.55);
      --text:    #c8eaf5;
      --text-dim: #4d7a96;
      --font-hud: 'Orbitron', monospace;
      --font-mono: 'Share Tech Mono', monospace;
      --font-body: 'Exo 2', sans-serif;
    }

    html, body, #root {
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-body);
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--cyan-dim); border-radius: 2px; }

    /* Scanline overlay */
    body::before {
      content: '';
      pointer-events: none;
      position: fixed;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.06) 2px,
        rgba(0,0,0,0.06) 4px
      );
      z-index: 9999;
    }

    /* Animated grid background */
    .hud-bg {
      background:
        radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,100,180,0.12), transparent),
        radial-gradient(ellipse 60% 80% at 80% 80%, rgba(0,50,120,0.08), transparent),
        linear-gradient(180deg, #020b14 0%, #030f1c 100%);
      position: relative;
    }
    .hud-bg::after {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px);
      background-size: 60px 60px;
      mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, black, transparent);
      z-index: 0;
    }

    /* Panel glass */
    .panel {
      background: var(--panel);
      border: 1px solid var(--border);
      backdrop-filter: blur(20px) saturate(1.4);
      position: relative;
      overflow: hidden;
    }
    .panel::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(0,212,255,0.04) 0%, transparent 50%);
      pointer-events: none;
    }

    /* Corner brackets */
    .bracket::before, .bracket::after,
    .bracket > .inner::before, .bracket > .inner::after {
      content: '';
      position: absolute;
      width: 16px; height: 16px;
      border-color: var(--cyan);
      border-style: solid;
      pointer-events: none;
      z-index: 2;
    }
    .bracket::before  { top: -1px; left: -1px;  border-width: 2px 0 0 2px; }
    .bracket::after   { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
    .bracket > .inner::before { bottom: -1px; left: -1px;  border-width: 0 0 2px 2px; }
    .bracket > .inner::after  { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

    /* HUD label */
    .hud-label {
      font-family: var(--font-hud);
      font-size: 9px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--cyan-dim);
    }

    /* Blinking cursor */
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    .blink { animation: blink 1.1s step-end infinite; }

    /* Pulse ring */
    @keyframes pulseRing {
      0%   { transform: scale(1);   opacity: 0.6; }
      100% { transform: scale(1.9); opacity: 0; }
    }

    /* Data sweep */
    @keyframes sweep {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Flicker */
    @keyframes flicker {
      0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.7} 94%{opacity:1} 97%{opacity:0.85} 98%{opacity:1}
    }

    /* Status ticker */
    @keyframes ticker {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    .arc-glow {
      filter: drop-shadow(0 0 8px var(--cyan)) drop-shadow(0 0 20px rgba(0,212,255,0.4));
    }

    .btn-hud {
      font-family: var(--font-hud);
      font-size: 10px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      overflow: hidden;
    }
    .btn-hud::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.06), transparent);
      pointer-events: none;
    }
    .btn-hud:active { transform: scale(0.97); }

    .msg-bubble {
      animation: fadeSlideIn 0.3s ease forwards;
    }
    @keyframes fadeSlideIn {
      from { opacity:0; transform: translateY(8px); }
      to   { opacity:1; transform: translateY(0); }
    }

    .thinking-dot {
      animation: thinkPulse 1.2s ease-in-out infinite;
    }
    .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
    .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes thinkPulse {
      0%,100%{opacity:0.2; transform:scale(0.8)} 50%{opacity:1; transform:scale(1.2)}
    }

    input[type=text] {
      font-family: var(--font-mono);
      font-size: 13px;
      background: rgba(0,20,40,0.9);
      border: 1px solid var(--border);
      color: var(--text);
      outline: none;
      caret-color: var(--cyan);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input[type=text]:focus {
      border-color: var(--cyan-dim);
      box-shadow: 0 0 0 1px rgba(0,212,255,0.15), inset 0 0 20px rgba(0,212,255,0.04);
    }
    input[type=text]::placeholder { color: var(--text-dim); }
  `}</style>
);

// ── Arc Reactor Core ─────────────────────────────────────────────────────────
function ArcReactor({ active, phase }) {
  const rings = [92, 72, 54, 36];
  const isSpeaking = phase === "speaking";
  const isThinking = phase === "thinking";
  const isAwake = phase === "awake";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: active
            ? "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,100,200,0.18), transparent 70%)"
            : "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,50,100,0.1), transparent 70%)",
          transition: "background 1s",
        }}
      />

      {/* Hex grid faint bg */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.07,
        }}
        viewBox="0 0 400 420"
      >
        {[...Array(8)].map((_, r) =>
          [...Array(9)].map((_, c) => {
            const x = c * 48 + (r % 2) * 24 - 20;
            const y = r * 42 - 10;
            const pts = [0, 1, 2, 3, 4, 5]
              .map((i) => {
                const a = (Math.PI / 180) * (60 * i - 30);
                return `${x + 20 * Math.cos(a)},${y + 20 * Math.sin(a)}`;
              })
              .join(" ");
            return (
              <polygon
                key={`${r}-${c}`}
                points={pts}
                fill="none"
                stroke="#00d4ff"
                strokeWidth="0.7"
              />
            );
          }),
        )}
      </svg>

      {/* Rotating outer rings */}
      {rings.map((r, i) => (
        <motion.div
          key={r}
          style={{
            position: "absolute",
            width: r * 2 + "%",
            height: r * 2 + "%",
            borderRadius: "50%",
            border: `${i === 0 ? "1.5px" : "1px"} solid rgba(0,212,255,${0.12 + i * 0.06})`,
            boxShadow: active
              ? `0 0 ${6 + i * 4}px rgba(0,212,255,${0.1 + i * 0.05})`
              : "none",
          }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 8 + i * 6, repeat: Infinity, ease: "linear" }}
        />
      ))}

      {/* Radar sweep */}
      <motion.div
        style={{
          position: "absolute",
          width: "72%",
          height: "72%",
          borderRadius: "50%",
          overflow: "hidden",
          opacity: active ? 0.6 : 0.15,
        }}
      >
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(0,212,255,0.35) 40deg, transparent 40deg)",
            borderRadius: "50%",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: isThinking ? 1.2 : 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>

      {/* Tick marks on outermost ring */}
      <svg
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: 0.4,
        }}
        viewBox="0 0 200 200"
      >
        {[...Array(24)].map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const r0 = 88,
            r1 = i % 6 === 0 ? 78 : 83;
          return (
            <line
              key={i}
              x1={100 + r0 * Math.cos(a)}
              y1={100 + r0 * Math.sin(a)}
              x2={100 + r1 * Math.cos(a)}
              y2={100 + r1 * Math.sin(a)}
              stroke="#00d4ff"
              strokeWidth={i % 6 === 0 ? "1.5" : "0.8"}
            />
          );
        })}
      </svg>

      {/* Pulse rings when active */}
      {active &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              width: "40%",
              height: "40%",
              borderRadius: "50%",
              border: "1px solid rgba(0,212,255,0.6)",
            }}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.2 + i * 0.4, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.65,
              ease: "easeOut",
            }}
          />
        ))}

      {/* Core */}
      <motion.div
        style={{
          position: "relative",
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: active
            ? "radial-gradient(circle, rgba(180,240,255,0.95) 0%, rgba(0,180,255,0.8) 40%, rgba(0,80,200,0.6) 100%)"
            : "radial-gradient(circle, rgba(60,120,160,0.8) 0%, rgba(20,60,100,0.6) 100%)",
          boxShadow: active
            ? "0 0 30px rgba(0,212,255,0.9), 0 0 60px rgba(0,150,255,0.5), 0 0 100px rgba(0,100,200,0.3), inset 0 0 20px rgba(255,255,255,0.3)"
            : "0 0 10px rgba(0,100,160,0.4), inset 0 0 10px rgba(0,80,130,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.5s",
          zIndex: 2,
        }}
        animate={{
          scale: isSpeaking ? [1, 1.08, 1] : isAwake ? [1, 1.04, 1] : 1,
        }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className={active ? "arc-glow" : ""}
      >
        {/* Inner hex */}
        <svg width="36" height="36" viewBox="0 0 36 36">
          <polygon
            points="18,3 31,10.5 31,25.5 18,33 5,25.5 5,10.5"
            fill="none"
            stroke={active ? "rgba(255,255,255,0.9)" : "rgba(100,180,220,0.5)"}
            strokeWidth="1.5"
          />
          <circle
            cx="18"
            cy="18"
            r="5"
            fill={active ? "rgba(255,255,255,0.95)" : "rgba(80,150,200,0.6)"}
          />
        </svg>
      </motion.div>

      {/* Corner HUD decorations */}
      {[
        ["top-3", "left-4"],
        ["top-3", "right-4"],
        ["bottom-3", "left-4"],
        ["bottom-3", "right-4"],
      ].map(([v, h], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            [v.split("-")[0]]: v.split("-")[1] + "px",
            [h.split("-")[0]]: h.split("-")[1] + "px",
            opacity: 0.5,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path
              d={
                i === 0
                  ? "M0,8 L0,0 L8,0"
                  : i === 1
                    ? "M12,0 L20,0 L20,8"
                    : i === 2
                      ? "M0,12 L0,20 L8,20"
                      : "M12,20 L20,20 L20,12"
              }
              fill="none"
              stroke="#00d4ff"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      ))}

      {/* Bottom data readout */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 16,
        }}
      >
        {["SYS", "NET", "AI"].map((l, i) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-hud)",
                fontSize: 7,
                color: "var(--cyan-dim)",
                letterSpacing: "0.2em",
              }}
            >
              {l}
            </div>
            <motion.div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                color: active ? "var(--cyan)" : "var(--text-dim)",
              }}
              animate={{ opacity: active ? [1, 0.5, 1] : 1 }}
              transition={{
                duration: 1.5 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            >
              {active ? ["98%", "LIVE", "ON"][i] : ["--", "--", "--"][i]}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Wave bars ────────────────────────────────────────────────────────────────
function SpeakingWave({ active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 28 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            background: `linear-gradient(to top, var(--blue), var(--cyan))`,
            boxShadow: active ? "0 0 4px var(--cyan)" : "none",
          }}
          animate={{ height: active ? [4, 6 + (i % 5) * 5, 4] : 4 }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.04,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Ticker strip ─────────────────────────────────────────────────────────────
function TickerStrip({ phase }) {
  const msgs = [
    "STARK INDUSTRIES · JARVIS v7.2.1 · AI CORE ONLINE",
    "NEURAL NET ACTIVE · VOICE RECOGNITION ENABLED",
    "SECURITY CLEARANCE: LEVEL 5 · SYSTEM NOMINAL",
    "ARC REACTOR: 100% · ALL SYSTEMS OPERATIONAL",
    "AWAITING COMMAND · SAY HEY JARVIS TO ACTIVATE",
  ];
  const full = msgs.join("  ◆  ") + "  ◆  " + msgs.join("  ◆  ");
  return (
    <div
      style={{
        overflow: "hidden",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        background: "rgba(0,20,40,0.5)",
        padding: "5px 0",
      }}
    >
      <div
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--cyan-dim)",
          letterSpacing: "0.1em",
          animation: "ticker 40s linear infinite",
        }}
      >
        {full}
      </div>
    </div>
  );
}

// ── Stat badge ───────────────────────────────────────────────────────────────
function StatBadge({ label, value, active }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "8px 14px",
        border: "1px solid var(--border)",
        borderRadius: 4,
        background: "rgba(0,20,40,0.6)",
        minWidth: 64,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-hud)",
          fontSize: 7,
          color: "var(--text-dim)",
          letterSpacing: "0.25em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <motion.div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: active ? "var(--cyan)" : "var(--text-dim)",
        }}
        animate={{ opacity: active ? [1, 0.6, 1] : 0.5 }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {value}
      </motion.div>
    </div>
  );
}

// ── Normalize site ───────────────────────────────────────────────────────────
function normalizeSite(text) {
  const lower = text.toLowerCase().trim();
  if (lower.includes("youtube")) return "https://youtube.com";
  if (lower.includes("google")) return "https://google.com";
  if (lower.includes("github")) return "https://github.com";
  if (lower.includes("linkedin")) return "https://linkedin.com";
  if (lower.includes("facebook")) return "https://facebook.com";
  if (lower.includes("instagram")) return "https://instagram.com";
  if (lower.includes("twitter") || lower.includes("x.com"))
    return "https://x.com";
  if (lower.includes("whatsapp")) return "https://web.whatsapp.com";
  if (lower.includes("calendar")) return "https://calendar.google.com";
  if (lower.includes("issb")) return "http://issb.gov.pk";
  if (lower.includes("pinterest")) return "https://pinterest.com";
  if (lower.startsWith("http")) return lower;
  let clean = lower.replace(/\s+/g, "").replace(/[^a-z0-9.-]/g, "");
  return `https://${clean}.com`;
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const speechSupported = Boolean(
    window.SpeechRecognition || window.webkitSpeechRecognition,
  );

  const [isListening, setIsListening] = useState(false);
  const [isAwake, setIsAwake] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState(
    "SYSTEM READY — ENABLE LISTENING TO ACTIVATE",
  );
  const [phase, setPhase] = useState("standby");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [uptime, setUptime] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const messagesEndRef = useRef(null);

  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const awaitingCommandRef = useRef(false);
  const isThinkingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const conversationHistoryRef = useRef([]);
  const wakeTimeoutRef = useRef(null);
  const restartingRef = useRef(false);

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Uptime counter
  useEffect(() => {
    const t = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Warm up voices
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const warm = () => window.speechSynthesis.getVoices();
    warm();
    window.speechSynthesis.onvoiceschanged = warm;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const fmtUptime = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const playActivationBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [740, 920].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.04, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * 0.1 + 0.15,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.15);
      });
    } catch (_) {}
  };

  const stopSpeech = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  };

  const speakWithBrowser = (text) => {
    if (!text || !window.speechSynthesis) return;
    try {
      stopSpeech();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 2000));
      const voices = window.speechSynthesis.getVoices();
      const jarvisVoice =
        voices.find(
          (v) =>
            v.lang === "en-GB" &&
            (v.name.includes("Google") ||
              v.name.includes("Microsoft") ||
              v.name.includes("Male")),
        ) ||
        voices.find((v) => v.lang === "en-GB") ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];
      utterance.voice = jarvisVoice;
      utterance.rate = 0.88;
      utterance.pitch = 0.75;
      utterance.volume = 1;
      utterance.text = text.replace(/\./g, "... ").replace(/,/g, ", ");
      utterance.onstart = () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
        setPhase("speaking");
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        setPhase(isListening ? "ready" : "standby");
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      };
      speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("TTS:", err);
      setIsSpeaking(false);
    }
  };

  const handleIntentAction = (intent, action) => {
    if (intent === "action_open" && action?.value)
      window.open(normalizeSite(action.value.toLowerCase()), "_blank");
  };

  const sendToJarvis = async (input) => {
    if (!input.trim()) return;
    stopSpeech();
    awaitingCommandRef.current = false;
    isThinkingRef.current = true;
    setIsThinking(true);
    setPhase("thinking");
    setStatus("PROCESSING REQUEST...");
    setMsgCount((c) => c + 1);

    setMessages((prev) => {
      const next = [...prev, { role: "user", text: input }];
      conversationHistoryRef.current = next;
      return next;
    });

    try {
      const history = conversationHistoryRef.current.slice(-10);
      const { data } = await axios.post(`${apiBaseUrl}/api/assist`, {
        input,
        history,
      });

      setMessages((prev) => {
        const next = [...prev, { role: "assistant", text: data.text }];
        conversationHistoryRef.current = next;
        return next;
      });

      setPhase("ready");
      setStatus("COMMAND EXECUTED — AWAITING NEXT ORDER, SIR");
      speakWithBrowser(data.text.replace(/\n/g, ". "));
      handleIntentAction(data.intent, data.action);
    } catch (error) {
      const errorMessage = error?.response?.data?.error || "Request failed";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Connection issue: ${errorMessage}` },
      ]);
      setStatus("ERROR DETECTED");
      setPhase("error");
    } finally {
      isThinkingRef.current = false;
      setIsThinking(false);
      setIsAwake(false);
      awaitingCommandRef.current = false;
      if (listeningRef.current)
        setTimeout(
          () => setStatus('LISTENING · SAY "HEY JARVIS" TO ACTIVATE'),
          800,
        );
    }
  };

  // ── Speech recognition ──────────────────────────────────────────────────
  const createRecognition = () => {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (!transcript) return;
      const lower = transcript.toLowerCase();
      const wakeHit = /\b(hey\s+)?jarvis\b/i.test(lower);

      if (wakeHit) {
        if (isThinkingRef.current) return;
        if (isSpeakingRef.current) stopSpeech();
        const inlineCommand = transcript
          .replace(/\b(hey\s+)?jarvis\b[:,]?\s*/gi, "")
          .trim();
        const hasRealCommand =
          inlineCommand.split(/\s+/).filter(Boolean).length >= 2;

        if (!awaitingCommandRef.current) {
          awaitingCommandRef.current = true;
          setIsAwake(true);
          setPhase("awake");
          setStatus("WAKE SIGNAL DETECTED · LISTENING FOR COMMAND...");
          playActivationBeep();
          if (wakeTimeoutRef.current) clearTimeout(wakeTimeoutRef.current);
          wakeTimeoutRef.current = setTimeout(() => {
            if (awaitingCommandRef.current && !isThinkingRef.current) {
              awaitingCommandRef.current = false;
              setIsAwake(false);
              setPhase("ready");
              setStatus('TIMEOUT · LISTENING FOR "HEY JARVIS"...');
            }
          }, 12000);
        }
        if (hasRealCommand) {
          if (wakeTimeoutRef.current) clearTimeout(wakeTimeoutRef.current);
          sendToJarvis(inlineCommand);
        }
        return;
      }

      if (awaitingCommandRef.current && !isThinkingRef.current) {
        const clean = transcript
          .replace(/\b(hey\s+)?jarvis\b[:,]?\s*/gi, "")
          .trim();
        if (clean) {
          if (wakeTimeoutRef.current) clearTimeout(wakeTimeoutRef.current);
          sendToJarvis(clean);
        }
      }
    };

    recognition.onerror = (event) => {
      if (["no-speech", "aborted"].includes(event.error)) return;
      if (event.error === "not-allowed") {
        setStatus("MICROPHONE ACCESS DENIED");
        listeningRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (!listeningRef.current) return;
      if (restartingRef.current) return;
      restartingRef.current = true;
      setTimeout(() => {
        restartingRef.current = false;
        if (!listeningRef.current) return;
        recognitionRef.current = null;
        const fresh = createRecognition();
        recognitionRef.current = fresh;
        try {
          fresh.start();
        } catch (_) {}
      }, 150);
    };

    return recognition;
  };

  useEffect(() => {
    if (!speechSupported) setStatus("SPEECH RECOGNITION NOT SUPPORTED");
  }, [speechSupported]);

  const startListening = () => {
    if (!speechSupported) return;
    listeningRef.current = true;
    restartingRef.current = false;
    setIsListening(true);
    setPhase("ready");
    setStatus('LISTENING · SAY "HEY JARVIS" TO ACTIVATE');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    const fresh = createRecognition();
    recognitionRef.current = fresh;
    try {
      fresh.start();
    } catch (_) {}
  };

  const stopListening = () => {
    listeningRef.current = false;
    awaitingCommandRef.current = false;
    restartingRef.current = false;
    stopSpeech();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsAwake(false);
    setPhase("standby");
    setStatus("SYSTEM STANDBY — ENABLE LISTENING TO RESUME");
  };

  const sendTextMessage = () => {
    if (textInput.trim()) {
      sendToJarvis(textInput.trim());
      setTextInput("");
      setShowTextInput(false);
    }
  };

  // ── Derived display values ──────────────────────────────────────────────
  const phaseColor =
    {
      standby: "#4d7a96",
      ready: "#00d4ff",
      awake: "#f5a623",
      thinking: "#1a6fff",
      speaking: "#00d4ff",
      error: "#ff3b5c",
    }[phase] || "#4d7a96";

  const corePhase = isThinking
    ? "thinking"
    : isSpeaking
      ? "speaking"
      : isAwake
        ? "awake"
        : "standby";

  return (
    <>
      <GlobalStyles />
      <div
        className="hud-bg"
        style={{
          minHeight: "100vh",
          padding: "20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Top header bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            padding: "8px 16px",
            borderBottom: "1px solid var(--border)",
            fontFamily: "var(--font-hud)",
            fontSize: 10,
            letterSpacing: "0.25em",
            color: "var(--text-dim)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ color: "var(--cyan)", fontWeight: 700 }}>
              ◆ STARK INDUSTRIES
            </span>
            <span>J.A.R.V.I.S · v7.2.1</span>
            <span>BUILD 20240115</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span>SESSION · {fmtUptime(uptime)}</span>
            <span>MSGS · {String(msgCount).padStart(4, "0")}</span>
            <motion.span
              style={{ color: isListening ? "var(--cyan)" : "var(--text-dim)" }}
              animate={{ opacity: isListening ? [1, 0.3, 1] : 1 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {isListening ? "● LIVE" : "○ OFFLINE"}
            </motion.span>
          </div>
        </div>

        {/* Main grid */}
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
        >
          {/* ── LEFT PANEL ── */}
          <div className="panel bracket" style={{ borderRadius: 6 }}>
            <div className="inner">
              {/* Panel header */}
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div className="hud-label" style={{ marginBottom: 4 }}>
                    STARK INDUSTRIES · AI DIVISION
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-hud)",
                      fontSize: 28,
                      fontWeight: 900,
                      color: "var(--cyan)",
                      letterSpacing: "0.15em",
                      lineHeight: 1,
                    }}
                  >
                    J.A.R.V.I.S
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--text-dim)",
                      marginTop: 4,
                    }}
                  >
                    Just A Rather Very Intelligent System
                  </div>
                </div>
                {/* Phase badge */}
                <div style={{ textAlign: "right" }}>
                  <div className="hud-label" style={{ marginBottom: 6 }}>
                    STATUS
                  </div>
                  <motion.div
                    style={{
                      fontFamily: "var(--font-hud)",
                      fontSize: 11,
                      fontWeight: 700,
                      color: phaseColor,
                      padding: "5px 12px",
                      border: `1px solid ${phaseColor}`,
                      borderRadius: 3,
                      background: `${phaseColor}18`,
                      letterSpacing: "0.2em",
                      boxShadow: `0 0 12px ${phaseColor}40`,
                    }}
                    animate={{
                      boxShadow: [
                        `0 0 8px ${phaseColor}30`,
                        `0 0 20px ${phaseColor}60`,
                        `0 0 8px ${phaseColor}30`,
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {phase.toUpperCase()}
                  </motion.div>
                </div>
              </div>

              {/* Arc Reactor */}
              <div
                style={{
                  height: 380,
                  position: "relative",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <ArcReactor
                  active={isAwake || isThinking || isSpeaking}
                  phase={corePhase}
                />
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <StatBadge
                  label="ARC PWR"
                  value={isListening ? "100%" : "---"}
                  active={isListening}
                />
                <StatBadge
                  label="NEURAL"
                  value={isThinking ? "PROC" : "IDLE"}
                  active={isThinking}
                />
                <StatBadge
                  label="VOICE"
                  value={isSpeaking ? "OUT" : "IN"}
                  active={isSpeaking || isAwake}
                />
                <StatBadge label="SECURE" value="LVL·5" active={true} />
              </div>

              {/* Controls */}
              <div
                style={{
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {/* Primary mic button */}
                  <motion.button
                    className="btn-hud"
                    onClick={isListening ? stopListening : startListening}
                    style={{
                      padding: "13px 10px",
                      borderRadius: 4,
                      border: `1px solid ${isListening ? "var(--cyan)" : "var(--border-bright)"}`,
                      background: isListening
                        ? "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,80,160,0.3))"
                        : "rgba(0,30,60,0.8)",
                      color: isListening ? "var(--cyan)" : "var(--text)",
                      boxShadow: isListening
                        ? "0 0 20px rgba(0,212,255,0.3)"
                        : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                    whileHover={{ boxShadow: "0 0 20px rgba(0,212,255,0.25)" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <motion.div
                      animate={{ scale: isListening ? [1, 1.3, 1] : 1 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Mic size={16} />
                    </motion.div>
                    {isListening ? "DISABLE MIC" : "ENABLE MIC"}
                  </motion.button>

                  {/* Stop speech / text mode */}
                  {isSpeaking ? (
                    <motion.button
                      className="btn-hud"
                      onClick={stopSpeech}
                      style={{
                        padding: "13px 10px",
                        borderRadius: 4,
                        border: "1px solid var(--red)",
                        background: "rgba(255,59,92,0.15)",
                        color: "var(--red)",
                        boxShadow: "0 0 16px rgba(255,59,92,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Power size={16} /> INTERRUPT
                    </motion.button>
                  ) : (
                    <motion.button
                      className="btn-hud"
                      onClick={() => setShowTextInput((s) => !s)}
                      style={{
                        padding: "13px 10px",
                        borderRadius: 4,
                        border: "1px solid var(--border-bright)",
                        background: showTextInput
                          ? "rgba(0,212,255,0.1)"
                          : "rgba(0,30,60,0.8)",
                        color: showTextInput ? "var(--cyan)" : "var(--text)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                      whileHover={{
                        boxShadow: "0 0 16px rgba(0,212,255,0.15)",
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Keyboard size={16} /> TEXT INPUT
                    </motion.button>
                  )}
                </div>

                {/* Text input */}
                <AnimatePresence>
                  {showTextInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ display: "flex", gap: 8, paddingTop: 2 }}>
                        <input
                          type="text"
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && sendTextMessage()
                          }
                          placeholder="ENTER COMMAND..."
                          style={{
                            flex: 1,
                            padding: "10px 14px",
                            borderRadius: 4,
                            letterSpacing: "0.05em",
                          }}
                        />
                        <motion.button
                          className="btn-hud"
                          onClick={sendTextMessage}
                          style={{
                            padding: "10px 18px",
                            borderRadius: 4,
                            background:
                              "linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,80,200,0.3))",
                            border: "1px solid var(--cyan-dim)",
                            color: "var(--cyan)",
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          SEND
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Status line */}
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: phaseColor,
                    padding: "8px 12px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(0,212,255,0.08)",
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {isListening && (
                    <motion.span
                      style={{
                        display: "inline-block",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: phaseColor,
                        flexShrink: 0,
                      }}
                      animate={{
                        opacity: [1, 0.2, 1],
                        boxShadow: [
                          `0 0 4px ${phaseColor}`,
                          `0 0 12px ${phaseColor}`,
                          `0 0 4px ${phaseColor}`,
                        ],
                      }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                  <span>{status}</span>
                  {isSpeaking && (
                    <span
                      style={{ color: "var(--text-dim)", marginLeft: "auto" }}
                    >
                      [SAY "HEY JARVIS" TO INTERRUPT]
                    </span>
                  )}
                </div>

                {/* Speaking wave */}
                {isSpeaking && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      paddingTop: 2,
                    }}
                  >
                    <SpeakingWave active={isSpeaking} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div
            className="panel bracket"
            style={{
              borderRadius: 6,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="inner"
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}
              >
                <div>
                  <div className="hud-label" style={{ marginBottom: 4 }}>
                    COMMUNICATIONS LOG
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-hud)",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--text)",
                      letterSpacing: "0.15em",
                    }}
                  >
                    DIALOGUE STREAM
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--text-dim)",
                    }}
                  >
                    {messages.length} ENTRIES
                  </div>
                  <motion.div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: isListening
                        ? "var(--cyan)"
                        : "var(--text-dim)",
                      boxShadow: isListening ? "0 0 8px var(--cyan)" : "none",
                    }}
                    animate={{ opacity: isListening ? [1, 0.3, 1] : 1 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              </div>

              {/* Ticker */}
              <div style={{ flexShrink: 0 }}>
                <TickerStrip phase={phase} />
              </div>

              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {messages.length === 0 && (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 16,
                      opacity: 0.35,
                    }}
                  >
                    <svg width="60" height="60" viewBox="0 0 60 60">
                      <polygon
                        points="30,5 53,17.5 53,42.5 30,55 7,42.5 7,17.5"
                        fill="none"
                        stroke="#00d4ff"
                        strokeWidth="1"
                      />
                      <polygon
                        points="30,15 43,22.5 43,37.5 30,45 17,37.5 17,22.5"
                        fill="none"
                        stroke="#00d4ff"
                        strokeWidth="0.7"
                      />
                      <circle
                        cx="30"
                        cy="30"
                        r="6"
                        fill="none"
                        stroke="#00d4ff"
                        strokeWidth="1"
                      />
                    </svg>
                    <div
                      style={{
                        fontFamily: "var(--font-hud)",
                        fontSize: 10,
                        color: "var(--text-dim)",
                        letterSpacing: "0.3em",
                        textAlign: "center",
                      }}
                    >
                      NO COMMUNICATIONS LOGGED
                      <br />
                      ACTIVATE SYSTEM TO BEGIN
                    </div>
                  </div>
                )}

                {messages.map((m, idx) => (
                  <div
                    key={`${m.role}-${idx}`}
                    className="msg-bubble"
                    style={{
                      display: "flex",
                      flexDirection: m.role === "user" ? "row-reverse" : "row",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 3,
                        flexShrink: 0,
                        border: `1px solid ${m.role === "user" ? "rgba(0,212,255,0.4)" : "rgba(26,111,255,0.4)"}`,
                        background:
                          m.role === "user"
                            ? "rgba(0,212,255,0.1)"
                            : "rgba(26,111,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-hud)",
                        fontSize: 7,
                        color:
                          m.role === "user" ? "var(--cyan)" : "var(--blue)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {m.role === "user" ? "SIR" : "AI"}
                    </div>

                    {/* Bubble */}
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "10px 14px",
                        borderRadius: 4,
                        border: `1px solid ${m.role === "user" ? "rgba(0,212,255,0.2)" : "rgba(26,111,255,0.2)"}`,
                        background:
                          m.role === "user"
                            ? "linear-gradient(135deg, rgba(0,212,255,0.07), rgba(0,60,120,0.2))"
                            : "linear-gradient(135deg, rgba(26,111,255,0.07), rgba(0,30,80,0.2))",
                        borderLeft:
                          m.role === "assistant"
                            ? "2px solid rgba(26,111,255,0.6)"
                            : "none",
                        borderRight:
                          m.role === "user"
                            ? "2px solid rgba(0,212,255,0.6)"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-hud)",
                          fontSize: 8,
                          color:
                            m.role === "user" ? "var(--cyan-dim)" : "#1a6fff",
                          letterSpacing: "0.25em",
                          marginBottom: 6,
                        }}
                      >
                        {m.role === "user"
                          ? "YOU · COMMAND INPUT"
                          : "JARVIS · RESPONSE"}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 13,
                          lineHeight: 1.65,
                          color: "var(--text)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Thinking indicator */}
                {isThinking && (
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 3,
                        flexShrink: 0,
                        border: "1px solid rgba(26,111,255,0.4)",
                        background: "rgba(26,111,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-hud)",
                        fontSize: 7,
                        color: "var(--blue)",
                      }}
                    >
                      AI
                    </div>
                    <div
                      style={{
                        padding: "14px 18px",
                        border: "1px solid rgba(26,111,255,0.2)",
                        borderLeft: "2px solid rgba(26,111,255,0.6)",
                        background:
                          "linear-gradient(135deg, rgba(26,111,255,0.07), rgba(0,30,80,0.2))",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", gap: 5 }}>
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="thinking-dot"
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "var(--blue)",
                              boxShadow: "0 0 6px var(--blue)",
                              animationDelay: `${i * 0.2}s`,
                            }}
                          />
                        ))}
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--text-dim)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        PROCESSING REQUEST...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Bottom hint */}
              <div
                style={{
                  padding: "10px 16px",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <Bot size={12} style={{ color: "var(--text-dim)" }} />
                <Sparkles size={12} style={{ color: "var(--text-dim)" }} />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--text-dim)",
                    letterSpacing: "0.08em",
                  }}
                >
                  ENABLE LISTENING → SAY "HEY JARVIS" → ISSUE COMMAND
                </span>
                <span
                  className="blink"
                  style={{
                    marginLeft: "auto",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--cyan-dim)",
                  }}
                >
                  _
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
