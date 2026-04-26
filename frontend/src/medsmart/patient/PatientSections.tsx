import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Search as SearchIcon, ShoppingBag, Wallet, Bell, Sparkles, ArrowRight, Loader2, ShieldAlert, Pill, X } from "lucide-react";
import { Card, StatCard, Badge, SectionHeader } from "../shared/ui";
import { useToast } from "../shared/Toast";
import { useApp } from "../AppContext";
import { medicines, alerts, purchases, diseaseReports } from "../data";
import { cn } from "@/lib/utils";

export function PatientDashboard({ go }: { go: (s: string) => void }) {
  const { user } = useApp();
  const totalSaved = purchases.reduce((s, p) => s + p.saved, 0);
  return (
    <div className="space-y-6">
      <Card className="!p-6 relative overflow-hidden">
        <div className="absolute inset-0 gradient-radial opacity-50" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Welcome back</div>
            <h2 className="text-2xl md:text-3xl font-display font-bold mt-1">Hi, {user?.name} 👋</h2>
            <p className="text-sm text-muted-foreground mt-1">You're saving smartly. Keep it up.</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Saved this month</div>
            <div className="text-3xl font-display font-bold" style={{ background: "linear-gradient(90deg, var(--success), var(--teal))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>₹{totalSaved}</div>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Savings" value={`₹${totalSaved}`} accent="success" icon={<Wallet className="w-5 h-5" />} delta="↑ 24% vs last month" />
        <StatCard label="Purchases" value={purchases.length} accent="brand" icon={<ShoppingBag className="w-5 h-5" />} />
        <StatCard label="Active Alerts" value={alerts.length} accent="amber" icon={<Bell className="w-5 h-5" />} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold">Nearby health alerts</h3>
            <button onClick={() => go("alerts")} className="text-xs text-brand hover:underline">View all →</button>
          </div>
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.id} className="p-3 rounded-xl border bg-card/40 flex items-start gap-3">
                <span className="w-2 h-2 rounded-full mt-2" style={{ background: a.severity === "high" ? "var(--danger)" : a.severity === "medium" ? "var(--amber)" : "var(--info)" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.message}</div>
                </div>
                <div className="text-[10px] text-muted-foreground">{a.time}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-display font-semibold mb-3">Quick actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <ActionTile icon={<SearchIcon className="w-5 h-5" />} title="Find generics" subtitle="Save up to 70%" onClick={() => go("search")} />
            <ActionTile icon={<Heart className="w-5 h-5" />} title="Health alerts" subtitle="Stay informed" onClick={() => go("alerts")} />
            <ActionTile icon={<ShoppingBag className="w-5 h-5" />} title="Purchase history" subtitle="Track spend" onClick={() => go("history")} />
            <ActionTile icon={<Sparkles className="w-5 h-5" />} title="Smart tips" subtitle="Personal advice" onClick={() => { }} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function ActionTile({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={onClick} className="text-left p-4 rounded-xl border bg-card/40 hover:bg-accent/40 transition group">
      <div className="w-10 h-10 rounded-lg gradient-brand grid place-items-center text-white mb-2 group-hover:shadow-glow transition">{icon}</div>
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </motion.button>
  );
}

export function HealthAlerts() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Local health intelligence" subtitle="What's happening in your zone right now" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.map(a => (
          <Card key={a.id}>
            <div className="flex items-center justify-between mb-2">
              <Badge variant={a.severity === "high" ? "danger" : a.severity === "medium" ? "amber" : "info"}>{a.severity}</Badge>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </div>
            <h3 className="font-display font-semibold">{a.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-display font-semibold mb-3">Local disease activity</h3>
          <div className="space-y-2">
            {diseaseReports.map(r => (
              <div key={r.id} className="p-3 rounded-xl border bg-card/40 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-medium">{r.disease}</div>
                  <div className="text-xs text-muted-foreground">{r.cases} active cases · {r.source}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber text-sm font-medium">+{r.growth}%</span>
                  <Badge variant={r.severity === "high" ? "danger" : r.severity === "medium" ? "amber" : "success"}>{r.severity}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="!p-5 relative overflow-hidden">
          <div className="absolute inset-0 gradient-radial opacity-40" />
          <div className="relative">
            <ShieldAlert className="w-8 h-8 text-amber" />
            <h3 className="font-display font-semibold mt-3">Stay prepared</h3>
            <p className="text-sm text-muted-foreground mt-1">Keep essential medicines, repellents and ORS at home during outbreak season.</p>
            <ul className="text-xs text-muted-foreground mt-3 space-y-1.5">
              <li>• Wash hands frequently</li>
              <li>• Avoid stagnant water</li>
              <li>• Mask up in crowded clinics</li>
              <li>• Hydrate well</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

const BACKEND_URL = "http://localhost:5000";

export function MedicineSearch() {
  const { push } = useToast();
  const [q, setQ] = useState("");
  const [scanning, setScanning] = useState(false);
  const [confirm, setConfirm] = useState<{ name: string; type: "brand" | "generic" } | null>(null);
  const [dbMeds, setDbMeds] = useState<typeof medicines | null>(null);
  const [loadingMeds, setLoadingMeds] = useState(true);

  // Fetch from backend on mount, fallback to static data
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/all-generics`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((m: any, i: number) => ({
            id: String(i + 1),
            name: m.generic || m.brand,
            brand: m.brand,
            generic: m.generic,
            category: m.category || "General",
            brandPrice: m.brandPrice,
            genericPrice: m.genericPrice,
            composition: m.composition || m.salt || m.generic, // prefer enriched field
          }));
          setDbMeds(mapped);
        }
      })
      .catch(() => { /* backend offline — use static data silently */ })
      .finally(() => setLoadingMeds(false));
  }, []);

  const allMeds = dbMeds || medicines;
  const isLive = !!dbMeds;

  const filtered = useMemo(() => {
    if (!q) return allMeds;
    return allMeds.filter(m =>
      m.name.toLowerCase().includes(q.toLowerCase()) ||
      m.brand.toLowerCase().includes(q.toLowerCase()) ||
      m.generic.toLowerCase().includes(q.toLowerCase())
    );
  }, [q, allMeds]);

  const top = filtered.slice(0, 3);

  function buy(m: typeof medicines[0], type: "brand" | "generic") {
    setScanning(true);
    setTimeout(() => { setScanning(false); setConfirm({ name: m.name, type }); }, 900);
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <SectionHeader title="Find your generic alternative" subtitle="Same composition. Same effect. Lower price." />
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${isLive ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`} style={isLive ? { color: "var(--success)" } : {}}>
          {isLive ? `✅ Live DB · ${allMeds.length} medicines` : "📦 Static data"}
        </span>
      </div>
      <Card className="!p-4">
        <div className="flex items-center gap-3">
          <SearchIcon className="w-5 h-5 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by brand, generic or composition (e.g. Crocin, Paracetamol)" className="flex-1 bg-transparent outline-none text-sm" />
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {["Crocin", "Azithral", "Pantoprazole", "Cetirizine", "Metformin"].map(p => (
            <button key={p} onClick={() => setQ(p)} className="px-3 py-1 rounded-full text-xs border hover:bg-accent transition">{p}</button>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        {top.map(m => {
          const saved = m.brandPrice - m.genericPrice;
          const pct = Math.round((saved / m.brandPrice) * 100);
          return (
            <Card key={m.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-muted-foreground">{m.composition}</div>
                  <div className="font-display font-semibold mt-0.5">{m.name}</div>
                </div>
                <Badge variant="success">Save {pct}%</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-3 rounded-lg border bg-card/40">
                  <div className="text-[10px] uppercase text-muted-foreground">Brand</div>
                  <div className="text-sm font-medium">{m.brand}</div>
                  <div className="text-lg font-display font-bold mt-1">₹{m.brandPrice}</div>
                </div>
                <div className="p-3 rounded-lg border" style={{ background: "color-mix(in oklab, var(--success) 10%, transparent)", borderColor: "color-mix(in oklab, var(--success) 30%, transparent)" }}>
                  <div className="text-[10px] uppercase text-success" style={{ color: "var(--success)" }}>Generic</div>
                  <div className="text-sm font-medium">{m.generic}</div>
                  <div className="text-lg font-display font-bold mt-1" style={{ color: "var(--success)" }}>₹{m.genericPrice}</div>
                </div>
              </div>
              <div className="text-xs text-success mb-3" style={{ color: "var(--success)" }}>You save ₹{saved} per pack</div>
              <div className="flex gap-2">
                <button onClick={() => buy(m, "generic")} className="flex-1 py-2 rounded-lg gradient-brand text-white text-sm font-medium">Buy generic</button>
                <button onClick={() => buy(m, "brand")} className="flex-1 py-2 rounded-lg border hover:bg-accent text-sm font-medium">Buy brand</button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-display font-semibold">Full medicine database</h3>
          <Badge variant="outline">{filtered.length} results</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Medicine</th>
                <th className="text-left px-4 py-2.5">Category</th>
                <th className="text-left px-4 py-2.5">Brand</th>
                <th className="text-right px-4 py-2.5">Brand ₹</th>
                <th className="text-right px-4 py-2.5">Generic ₹</th>
                <th className="text-right px-4 py-2.5">Savings</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="border-t hover:bg-accent/30 transition">
                  <td className="px-4 py-2.5 font-medium">{m.name}</td>
                  <td className="px-4 py-2.5"><Badge variant="outline">{m.category}</Badge></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{m.brand}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">₹{m.brandPrice}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: "var(--success)" }}>₹{m.genericPrice}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium" style={{ color: "var(--success)" }}>₹{m.brandPrice - m.genericPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {scanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] grid place-items-center bg-black/70 backdrop-blur">
            <div className="glass-strong rounded-2xl p-8 text-center">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-brand" style={{ color: "var(--brand)" }} />
              <div className="mt-3 font-display font-semibold">Scanning nearby pharmacies…</div>
              <div className="text-xs text-muted-foreground mt-1">Finding the best price for you</div>
            </div>
          </motion.div>
        )}
        {confirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] grid place-items-center bg-black/60 backdrop-blur p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-strong rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg grid place-items-center" style={{ background: "color-mix(in oklab, var(--amber) 20%, transparent)" }}><ShieldAlert className="w-5 h-5" style={{ color: "var(--amber)" }} /></div>
                <div>
                  <div className="font-display font-semibold">Medical Disclaimer</div>
                  <div className="text-xs text-muted-foreground">Please confirm before purchase</div>
                </div>
                <button onClick={() => setConfirm(null)} className="ml-auto w-8 h-8 rounded-lg hover:bg-accent grid place-items-center"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-sm text-muted-foreground">Generic medicines have the same active ingredients as their brand counterparts. Always consult your physician before substituting prescribed medication. MedSmart does not provide medical advice.</p>
              <div className="mt-3 p-3 rounded-lg border bg-card/40 flex items-center gap-3">
                <Pill className="w-5 h-5 text-brand" style={{ color: "var(--brand)" }} />
                <div className="text-sm">{confirm.name} — <b>{confirm.type}</b></div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { push("success", `Order placed for ${confirm.name}`); setConfirm(null); }} className="flex-1 py-2 rounded-lg gradient-brand text-white font-medium">I understand, proceed</button>
                <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-lg border hover:bg-accent">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PurchaseHistory() {
  const totalSaved = purchases.reduce((s, p) => s + p.saved, 0);
  const totalSpent = purchases.reduce((s, p) => s + p.price, 0);
  const genericCount = purchases.filter(p => p.type === "generic").length;
  const adoption = Math.round((genericCount / purchases.length) * 100);
  return (
    <div className="space-y-6">
      <SectionHeader title="Your purchase journey" subtitle="A record of every purchase and saving" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Saved" value={`₹${totalSaved}`} accent="success" icon={<Wallet className="w-5 h-5" />} />
        <StatCard label="Total Purchases" value={purchases.length} accent="brand" icon={<ShoppingBag className="w-5 h-5" />} />
        <StatCard label="Generic Adoption" value={`${adoption}%`} accent="teal" icon={<Sparkles className="w-5 h-5" />} delta={`Spent ₹${totalSpent}`} />
      </div>
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Medicine</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Saved</th>
                <th className="text-left px-4 py-3">Pharmacy</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id} className="border-t hover:bg-accent/30 transition">
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{p.date}</td>
                  <td className="px-4 py-3 font-medium">{p.medicine}</td>
                  <td className="px-4 py-3"><Badge variant={p.type === "generic" ? "success" : "amber"}>{p.type}</Badge></td>
                  <td className="px-4 py-3 text-right tabular-nums">₹{p.price}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: p.saved > 0 ? "var(--success)" : "var(--muted-foreground)" }}>{p.saved > 0 ? `₹${p.saved}` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.pharmacy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
