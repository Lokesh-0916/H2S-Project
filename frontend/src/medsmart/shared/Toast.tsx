import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface ToastItem { id: number; type: ToastType; message: string; }
interface Ctx { push: (t: ToastType, m: string) => void; }
const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setItems(s => [...s, { id, type, message }]);
    setTimeout(() => setItems(s => s.filter(i => i.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        <AnimatePresence>
          {items.map(t => {
            const Icon = t.type === "success" ? CheckCircle2 : t.type === "error" ? AlertCircle : Info;
            const color = t.type === "success" ? "var(--success)" : t.type === "error" ? "var(--danger)" : "var(--info)";
            return (
              <motion.div key={t.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                className="glass-strong rounded-xl p-3 flex items-start gap-3 shadow-lg">
                <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color }} />
                <div className="text-sm flex-1">{t.message}</div>
                <button onClick={() => setItems(s => s.filter(i => i.id !== t.id))} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
export function useToast() {
  const c = useContext(ToastCtx);
  if (!c) throw new Error("ToastProvider missing");
  return c;
}
