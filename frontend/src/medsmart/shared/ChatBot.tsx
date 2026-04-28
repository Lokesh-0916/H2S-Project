import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, Loader2, ChevronDown } from "lucide-react";
import { useApp } from "@/medsmart/AppContext";

type ChatRole = "user" | "assistant";
interface Msg { role: ChatRole; content: string; ts: number; }

const BACKEND = "http://localhost:5000";

// Greetings per context
const greet = {
  public:  "👋 Hi! I'm the **PharmaLink** support assistant. Ask me anything — features for pharmacies or patients, or how to get started!",
  patient: (name: string) => `👋 Hi ${name}! I'm your **PharmaLink** assistant. I can help with your purchase history, generic medicine alternatives, health alerts, and more. What can I help you with?`,
  store:   (name: string) => `👋 Hi ${name}! I'm your **PharmaLink** pharmacy assistant. Ask me about your inventory, stock alerts, demand forecasts, or anything else!`,
};

export default function ChatBot() {
  const { user } = useApp();
  const [open,        setOpen]        = useState(false);
  const [messages,    setMessages]    = useState<Msg[]>([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [userData,    setUserData]    = useState<Record<string, any>>({});
  const [dataReady,   setDataReady]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const context = user ? (user.role === "store" ? "store" : "patient") : "public";

  // Fetch extra data + show greeting when chat opens (only once)
  const init = useCallback(async () => {
    if (dataReady) return;
    setDataReady(true);

    if (!user) {
      setMessages([{ role: "assistant", content: greet.public, ts: Date.now() }]);
      return;
    }

    const base: Record<string, any> = {
      name: user.name, email: user.email, age: user.age,
      gender: user.gender, address: user.address,
      storeName: user.pharmacyName, storeId: (user as any).storeId,
    };

    try {
      if (user.role === "patient") {
        const [pRes, aRes] = await Promise.all([
          fetch(`${BACKEND}/api/purchases`, { headers: user.token ? { Authorization: `Bearer ${user.token}` } : {} }),
          fetch(`${BACKEND}/api/patient-alerts`),
        ]);
        base.purchases = pRes.ok ? await pRes.json() : [];
        base.alerts    = aRes.ok ? await aRes.json() : [];
        setMessages([{ role: "assistant", content: greet.patient(user.name || "there"), ts: Date.now() }]);
      } else {
        const sid = (user as any).storeId || "PH001";
        const [iRes, sRes] = await Promise.all([
          fetch(`${BACKEND}/api/inventory/${sid}`),
          fetch(`${BACKEND}/api/stock-alerts`),
        ]);
        base.inventory = iRes.ok ? await iRes.json() : [];
        const sa       = sRes.ok ? await sRes.json() : {};
        base.alerts    = sa.alerts || [];
        setMessages([{ role: "assistant", content: greet.store(user.pharmacyName || "there"), ts: Date.now() }]);
      }
    } catch {
      const msg = user.role === "patient" ? greet.patient(user.name || "there") : greet.store(user.pharmacyName || "there");
      setMessages([{ role: "assistant", content: msg, ts: Date.now() }]);
    }

    setUserData(base);
  }, [user, dataReady]);

  useEffect(() => { if (open) { init(); setTimeout(() => inputRef.current?.focus(), 300); } }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const allMsgs = [...messages, userMsg];
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMsgs.map(m => ({ role: m.role === "assistant" ? "model" : "user", content: m.content })),
          context,
          userData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessages(prev => [...prev, { role: "assistant", content: data.reply, ts: Date.now() }]);
    } catch (e: any) {
      setError("AI Assistant is temporarily unavailable due to service limitations. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  // Simple markdown bold renderer
  function renderContent(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    );
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        id="pharmalink-chatbot-btn"
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-full gradient-brand shadow-glow grid place-items-center text-white"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x"  initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}><X className="w-6 h-6" /></motion.div>
            : <motion.div key="mc" initial={{ scale: 0 }}              animate={{ scale: 1 }}             exit={{ scale: 0 }}><MessageCircle className="w-6 h-6" /></motion.div>
          }
        </AnimatePresence>
        {!open && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-background animate-pulse" />}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="pharmalink-chatbot-panel"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed bottom-24 right-6 z-[200] w-[370px] max-w-[calc(100vw-24px)] glass-strong rounded-2xl shadow-glow flex flex-col overflow-hidden"
            style={{ height: 520 }}
          >
            {/* Header */}
            <div className="gradient-brand px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white/20 grid place-items-center shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm leading-tight">PharmaLink Assistant</div>
                <div className="text-[11px] text-white/70">
                  {context === "public" ? "Customer Support" : context === "patient" ? "Patient Support" : "Pharmacy Support"}
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-white/20 grid place-items-center transition">
                <ChevronDown className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin min-h-0">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full gradient-brand grid place-items-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "user"
                      ? "gradient-brand text-white rounded-tr-sm"
                      : "bg-card border text-foreground rounded-tl-sm"
                  }`}>
                    {renderContent(msg.content)}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full gradient-brand grid place-items-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-card border rounded-2xl rounded-tl-sm px-3 py-3 flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground block"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="text-xs rounded-lg px-3 py-2 border" style={{ color: "var(--danger)", background: "color-mix(in srgb, var(--danger) 10%, transparent)", borderColor: "color-mix(in srgb, var(--danger) 25%, transparent)" }}>
                  ⚠️ {error}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="shrink-0 p-3 border-t bg-card/60 backdrop-blur flex gap-2 items-center">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Ask me anything…"
                disabled={loading}
                className="flex-1 bg-background/60 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 placeholder:text-muted-foreground"
                style={{ "--tw-ring-color": "color-mix(in srgb, var(--brand) 40%, transparent)" } as any}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-xl gradient-brand grid place-items-center text-white disabled:opacity-40 transition shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
