import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { Activity, AlertTriangle, Users, TrendingUp, Plus, Brain, Sparkles, Package, Edit2, Save, X, ArrowRight, Check, RefreshCw, Wand2 } from "lucide-react";
import { Card, StatCard, Badge, ProgressBar, SectionHeader } from "../shared/ui";
import { useToast } from "../shared/Toast";
import { useApp } from "../AppContext";
import { trendData, demandDonut, initialInventory, diseaseReports as initialDiseases, initialTransfers, pharmacies, medicines } from "../data";
import type { InventoryItem, DiseaseReport, Transfer } from "../types";
import { cn } from "@/lib/utils";

const axisColor = "color-mix(in oklab, var(--foreground) 50%, transparent)";
const gridColor = "color-mix(in oklab, var(--foreground) 10%, transparent)";
const BACKEND_URL = "http://localhost:5000";

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg p-2 text-xs shadow-lg">
      {label && <div className="font-medium mb-1">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span><span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function StoreDashboard() {
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [liveTrend, setLiveTrend] = useState<any[]>(trendData);
  const [liveDonut, setLiveDonut] = useState<any[]>(demandDonut);
  const [platformStats, setPlatformStats] = useState({ pharmacies: 120, criticalAlerts: 0, totalPurchases: 0 });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [stockRes, trendRes, donutRes, statsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/stock-alerts`),
          fetch(`${BACKEND_URL}/api/live-trend-data`),
          fetch(`${BACKEND_URL}/api/demand-distribution`),
          fetch(`${BACKEND_URL}/api/platform-stats`),
        ]);
        const stock = stockRes.ok ? await stockRes.json() : {};
        const trend = trendRes.ok ? await trendRes.json() : [];
        const donut = donutRes.ok ? await donutRes.json() : [];
        const stats = statsRes.ok ? await statsRes.json() : {};
        if (!alive) return;
        if (stock.alerts) setLowStock(stock.alerts);
        if (Array.isArray(trend) && trend.length) setLiveTrend(trend);
        if (Array.isArray(donut) && donut.length) setLiveDonut(donut);
        if (stats.pharmacies !== undefined) setPlatformStats(stats);
      } catch {
        // Keep current UI state if network/live data is unavailable.
      }
    };

    load();
    const id = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader title="Operations Overview" subtitle="Live snapshot of your network and demand signals" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Connected Pharmacies" value={platformStats.pharmacies} accent="brand" icon={<Activity className="w-5 h-5" />} />
        <StatCard label="Critical Alerts" value={lowStock.filter(a => a.severity === "CRITICAL").length || platformStats.criticalAlerts} accent="danger" icon={<AlertTriangle className="w-5 h-5" />} />
        <StatCard label="Purchases Logged" value={platformStats.totalPurchases} accent="teal" icon={<Users className="w-5 h-5" />} />
        <StatCard label="Forecast Accuracy" value="94%" accent="success" icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">7-Day Disease Trend</h3>
              <p className="text-xs text-muted-foreground">Cases reported in your zone</p>
            </div>
            <Badge variant="brand">Live</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={liveTrend}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="flu" name="Flu" stroke="var(--brand)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="dengue" name="Dengue" stroke="var(--amber)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="malaria" name="Malaria" stroke="var(--teal)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="cholera" name="Cholera" stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-display font-semibold mb-1">Demand Distribution</h3>
          <p className="text-xs text-muted-foreground mb-3">By category this week</p>
          <div className="h-60">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={liveDonut} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {liveDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {liveDonut.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.name}</div>
                <span className="font-medium">{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">Low Stock — Network Alerts</h3>
          <Badge variant="danger">{lowStock.length} items</Badge>
        </div>
        <div className="space-y-3">
          {lowStock.length === 0 && <p className="text-sm text-muted-foreground">Loading stock alerts…</p>}
          {lowStock.map((item, idx) => {
            const pct = (item.stock / item.threshold) * 100;
            const accent = pct < 30 ? "danger" : pct < 60 ? "amber" : "success";
            return (
              <div key={idx} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium truncate">{item.medicine} <span className="text-muted-foreground text-xs">({item.pharmacy})</span></span>
                    <span className="text-muted-foreground tabular-nums">{item.stock}/{item.threshold}</span>
                  </div>
                  <ProgressBar value={pct} accent={accent} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export function DiseaseMonitor() {
  const { push } = useToast();
  const [reports, setReports] = useState<DiseaseReport[]>(initialDiseases);
  const [liveTrend, setLiveTrend] = useState<any[]>([]);
  const [form, setForm] = useState({ disease: "", cases: "", source: "" });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [reportsRes, trendRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/live-disease-reports`),
          fetch(`${BACKEND_URL}/api/live-trend-data`),
        ]);
        const reportsData = reportsRes.ok ? await reportsRes.json() : [];
        const trendData = trendRes.ok ? await trendRes.json() : [];
        if (!alive) return;
        if (Array.isArray(reportsData) && reportsData.length) setReports(reportsData);
        if (Array.isArray(trendData) && trendData.length) setLiveTrend(trendData);
      } catch {
        // Keep existing fallback data on network/API failure
      }
    };

    load();
    const id = setInterval(load, 30000); // near-real-time refresh
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  function add() {
    if (!form.disease || !form.cases) return push("error", "Disease and case count required");
    const cases = parseInt(form.cases) || 0;
    const sev: DiseaseReport["severity"] = cases > 100 ? "high" : cases > 40 ? "medium" : "low";
    setReports(r => [{ id: "d" + Date.now(), disease: form.disease, cases, growth: Math.floor(Math.random() * 25), severity: sev, source: form.source || "Manual entry", date: new Date().toISOString().slice(0, 10) }, ...r]);
    setForm({ disease: "", cases: "", source: "" });
    push("success", "Disease report added");
  }
  return (
    <div className="space-y-6">
      <SectionHeader title="Outbreak tracking" subtitle="Monitor disease activity across Bengaluru zone" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reports.map(r => (
          <Card key={r.id} className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="font-display font-semibold">{r.disease}</div>
              <Badge variant={r.severity === "high" ? "danger" : r.severity === "medium" ? "amber" : "success"}>{r.severity}</Badge>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-display font-bold">{r.cases}</div>
                  <div className="text-xs text-muted-foreground">reported activity</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-amber">{r.growth > 0 ? `+${r.growth}%` : `${r.growth}%`}</div>
                <div className="text-[10px] text-muted-foreground">vs 7-day baseline</div>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground border-t pt-2">{r.source}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-display font-semibold mb-3">Case Growth Trend</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={liveTrend}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="covid" name="COVID-19" stroke="var(--brand)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="flu" name="Flu" stroke="var(--teal)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="dengue" name="Dengue" stroke="var(--amber)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="malaria" name="Malaria" stroke="#a78bfa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cold" name="Common Cold" stroke="#22d3ee" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="font-display font-semibold mb-3">Log new report</h3>
          <div className="space-y-3">
            <Input label="Disease" v={form.disease} on={v => setForm({ ...form, disease: v })} />
            <Input label="New cases" v={form.cases} on={v => setForm({ ...form, cases: v })} type="number" />
            <Input label="Source" v={form.source} on={v => setForm({ ...form, source: v })} />
            <button onClick={add} className="w-full py-2 rounded-lg gradient-brand text-white font-medium flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Submit report</button>
          </div>
        </Card>
      </div>
    </div>
  );
}


export function DemandForecast() {
  const { push } = useToast();
  const [disease, setDisease] = useState("Flu/Influenza");
  const [cases, setCases] = useState(124);
  const [growth, setGrowth] = useState(18);
  const [windowWk, setWindowWk] = useState(2);
  const [loading, setLoading] = useState(false);
  const [backendResult, setBackendResult] = useState<any>(null);

  // Local fallback forecast
  const localForecast = useMemo(() => {
    const arr = [];
    let c = cases;
    for (let w = 1; w <= windowWk; w++) {
      c = Math.round(c * (1 + growth / 100));
      arr.push({ week: `Week ${w}`, predicted: c });
    }
    return arr;
  }, [cases, growth, windowWk]);

  const forecast = backendResult
    ? backendResult.predictions.map((_: any, i: number) => ({
        week: `Week ${i + 1}`,
        predicted: Math.round(backendResult.predictedCases * Math.pow(1 + growth / 100, i + 1) / windowWk),
      }))
    : localForecast;

  const peak = backendResult?.predictedCases || (localForecast[localForecast.length - 1]?.predicted ?? cases);
  const risk = backendResult
    ? backendResult.riskLevel.toLowerCase() as "high" | "medium" | "low"
    : peak > 250 ? "high" : peak > 120 ? "medium" : "low";
  const stockNeeded = Math.round(peak * 1.4);

  async function runForecast() {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/predict-demand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disease, cases, growthRate: growth, days: windowWk * 7 }),
      });
      if (!res.ok) {
        const err = await res.json();
        push("error", err.error || "Prediction failed");
        setBackendResult(null);
      } else {
        const data = await res.json();
        setBackendResult(data);
        push("success", `AI forecast complete — Risk: ${data.riskLevel}`);
      }
    } catch {
      push("info", "Backend offline — showing local estimate");
      setBackendResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Predictive forecasting" subtitle="Plan your stock with AI-driven projections" />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <h3 className="font-display font-semibold mb-4">Parameters</h3>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Disease</div>
              <select value={disease} onChange={e => { setDisease(e.target.value); setBackendResult(null); }} className="w-full bg-card border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40">
                {["Flu/Influenza","Dengue","Malaria","COVID-19","Cholera","Typhoid"].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <Input label="Current cases" v={cases.toString()} on={v => { setCases(parseInt(v) || 0); setBackendResult(null); }} type="number" />
            <div>
              <div className="text-xs text-muted-foreground mb-1">Growth rate: {growth}%</div>
              <input type="range" min={0} max={100} value={growth} onChange={e => { setGrowth(parseInt(e.target.value)); setBackendResult(null); }} className="w-full accent-[var(--brand)]" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Forecast window: {windowWk} weeks</div>
              <input type="range" min={1} max={8} value={windowWk} onChange={e => { setWindowWk(parseInt(e.target.value)); setBackendResult(null); }} className="w-full accent-[var(--brand)]" />
            </div>
            <div className="p-3 rounded-lg border bg-card/60 flex items-center justify-between">
              <span className="text-sm">Risk level</span>
              <Badge variant={risk === "high" ? "danger" : risk === "medium" ? "amber" : "success"}>{risk.toUpperCase()}</Badge>
            </div>
            <button onClick={runForecast} disabled={loading} className="w-full py-2 rounded-lg gradient-brand text-white font-medium flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <><RefreshCw className="w-4 h-4 animate-spin" />Running AI forecast…</> : <><Brain className="w-4 h-4" />Run AI Forecast</>}
            </button>
            {backendResult && <div className="text-xs text-success text-center">✅ Powered by backend ML engine</div>}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <h3 className="font-display font-semibold mb-3">Predicted cases</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={forecast}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "color-mix(in oklab, var(--foreground) 5%, transparent)" }} />
                <Bar dataKey="predicted" fill="var(--brand)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {backendResult && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {backendResult.predictions.map((p: any) => (
                <div key={p.medicine} className="p-2 rounded-lg border bg-card/40 text-center">
                  <div className="text-xs text-muted-foreground truncate">{p.medicine}</div>
                  <div className="text-lg font-bold font-display">{p.unitsNeeded.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">units needed</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">Recommended stock per pharmacy</h3>
          <Badge variant="teal">~{stockNeeded} units total</Badge>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pharmacies.map(p => (
            <div key={p.id} className="p-3 rounded-lg border bg-card/40 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-[10px] text-muted-foreground">{p.city}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-display font-bold tabular-nums">{Math.round(stockNeeded / pharmacies.length)}</div>
                <div className="text-[10px] text-muted-foreground">units</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AISuggestions() {
  const [recs, setRecs] = useState<any[]>([]);
  const [stats, setStats] = useState({ trend: "Loading", velocity: "…", criticalItems: 0, confidence: 94 });
  const [purchaseTrend, setPurchaseTrend] = useState([
    { m: "Jan", v: 320 }, { m: "Feb", v: 380 }, { m: "Mar", v: 430 }, { m: "Apr", v: 510 }, { m: "May", v: 600 },
  ]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/ai-suggestions`)
      .then(r => r.json())
      .then(d => {
        if (d.suggestions) setRecs(d.suggestions);
        if (d.stats)       setStats(d.stats);
      })
      .catch(() => {});
    // Build purchase trend from purchases collection
    fetch(`${BACKEND_URL}/api/purchases`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        // Count by month
        const byMonth: Record<string, number> = {};
        data.forEach(p => {
          const month = new Date(p.date).toLocaleString("default", { month: "short" });
          byMonth[month] = (byMonth[month] || 0) + p.price;
        });
        const trend = Object.entries(byMonth).map(([m, v]) => ({ m, v }));
        if (trend.length > 0) setPurchaseTrend(trend);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader title="AI Restock Recommendations" subtitle="Intelligent suggestions based on real-time signals" />
      <Card className="!p-0 overflow-hidden">
        <div className="grid sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x">
          {[
            { l: "Trend",         v: stats.trend,              c: "amber" },
            { l: "Velocity",      v: stats.velocity,           c: "brand" },
            { l: "Critical items",v: String(stats.criticalItems), c: "danger" },
            { l: "AI confidence", v: `${stats.confidence}%`,   c: "success" },
          ].map(s => (
            <div key={s.l} className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
              <div className={cn("text-xl font-display font-bold mt-1")} style={{ color: `var(--${s.c})` }}>{s.v}</div>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {recs.length === 0 && <p className="text-sm text-muted-foreground">Loading AI recommendations…</p>}
          {recs.map(r => (
            <motion.div key={r.id} whileHover={{ y: -2 }} className="glass rounded-2xl p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl gradient-brand grid place-items-center shrink-0"><Sparkles className="w-5 h-5 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-display font-semibold">{r.name}</div>
                    <Badge variant={r.urgency > 85 ? "danger" : r.urgency > 70 ? "amber" : "info"}>Urgency {r.urgency}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{r.reason}</div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-sm">Suggested qty: <span className="font-bold">{r.qty}</span></span>
                    <button className="ml-auto px-3 py-1.5 text-xs rounded-lg gradient-brand text-white">Approve restock</button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="space-y-6">
          <Card>
            <h3 className="font-display font-semibold mb-3">Purchase trend</h3>
            <div className="h-44">
              <ResponsiveContainer>
                <LineChart data={purchaseTrend}>
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="m" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="v" stroke="var(--teal)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--teal)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><Brain className="w-4 h-4 text-brand" />How it works</h3>
            <ol className="space-y-2 text-xs text-muted-foreground">
              {["Aggregate disease signals from clinics, pharmacies, public bulletins.", "Correlate with historical purchase velocity per medicine.", "Project demand for next 1–4 weeks per SKU.", "Rank restock urgency and route to inventory."].map((s, i) => (
                <li key={i} className="flex gap-2"><span className="w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold text-white shrink-0 gradient-brand">{i + 1}</span>{s}</li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function Inventory() {
  const { push } = useToast();
  const { user } = useApp();
  const [items, setItems] = useState<InventoryItem[]>(initialInventory);
  const [loadingInv, setLoadingInv] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(0);
  const [restocking, setRestocking] = useState<string | null>(null);
  const total = items.reduce((s, i) => s + i.stock, 0);
  const critical = items.filter(i => i.stock < i.threshold * 0.3).length;
  const low = items.filter(i => i.stock >= i.threshold * 0.3 && i.stock < i.threshold).length;
  const healthy = items.filter(i => i.stock >= i.threshold).length;

  // Fetch live inventory from backend on mount
  useEffect(() => {
    const pharmacyId = (() => {
      if (!user?.token) return "PH001";
      try {
        const p = JSON.parse(atob(user.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return p.storeId || "PH001";
      } catch { return "PH001"; }
    })();
    fetch(`${BACKEND_URL}/api/inventory/${pharmacyId}`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: InventoryItem[] = data.map((d, idx) => ({
            id: String(idx + 1),
            medicineId: String(idx + 1),
            name: d.medicine,
            stock: d.stock,
            threshold: d.threshold,
          }));
          setItems(mapped);
        }
      })
      .catch(() => { /* backend offline — keep static fallback */ })
      .finally(() => setLoadingInv(false));
  }, [user?.token]);
  function startEdit(i: InventoryItem) { setEditing(i.id); setDraft(i.stock); }
  function save(id: string) { setItems(s => s.map(i => i.id === id ? { ...i, stock: draft } : i)); setEditing(null); push("success", "Stock updated"); }

  // Derive pharmacyId from logged-in user token
  function getPharmacyId(): string {
    if (!user?.token) return "PH001";
    try {
      const payload = JSON.parse(atob(user.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.storeId || "PH001";
    } catch { return "PH001"; }
  }

  async function restock(i: InventoryItem) {
    const addQty = i.threshold + 50 - i.stock;
    const pharmacyId = getPharmacyId();
    setRestocking(i.id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/inventory/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pharmacyId, medicine: i.name, quantity: addQty }),
      });
      if (res.ok) {
        setItems(s => s.map(x => x.id === i.id ? { ...x, stock: i.threshold + 50 } : x));
        push("success", `Restocked ${i.name} — saved to database ✅`);
      } else {
        // Backend responded but with error (item not seeded yet) — update locally
        setItems(s => s.map(x => x.id === i.id ? { ...x, stock: i.threshold + 50 } : x));
        push("info", `Restocked ${i.name} locally (seed DB to persist)`);
      }
    } catch {
      // Backend offline — update locally
      setItems(s => s.map(x => x.id === i.id ? { ...x, stock: i.threshold + 50 } : x));
      push("info", `Restocked ${i.name} (backend offline — local only)`);
    } finally {
      setRestocking(null);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <SectionHeader title="Inventory management" subtitle="Track every SKU, edit stock, trigger restock" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Units" value={total.toLocaleString()} accent="brand" icon={<Package className="w-5 h-5" />} />
        <StatCard label="Critical" value={critical} accent="danger" icon={<AlertTriangle className="w-5 h-5" />} />
        <StatCard label="Low" value={low} accent="amber" icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard label="Healthy" value={healthy} accent="success" icon={<Check className="w-5 h-5" />} />
      </div>
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Medicine</th>
                <th className="text-left px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Threshold</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3 w-1/4">Health</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => {
                const pct = Math.min(100, (i.stock / i.threshold) * 100);
                const status = pct < 30 ? "Critical" : pct < 100 ? "Low" : "Healthy";
                const variant = pct < 30 ? "danger" : pct < 100 ? "amber" : "success";
                return (
                  <tr key={i.id} className="border-t hover:bg-accent/30 transition">
                    <td className="px-4 py-3 font-medium">{i.name}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {editing === i.id ? <input type="number" value={draft} onChange={e => setDraft(parseInt(e.target.value) || 0)} className="w-20 bg-card border rounded px-2 py-1" /> : i.stock}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{i.threshold}</td>
                    <td className="px-4 py-3"><Badge variant={variant}>{status}</Badge></td>
                    <td className="px-4 py-3"><ProgressBar value={pct} accent={variant} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {editing === i.id ? (
                          <>
                            <button onClick={() => save(i.id)} className="w-8 h-8 rounded-lg bg-success/15 text-success grid place-items-center" style={{ background: "color-mix(in oklab, var(--success) 15%, transparent)", color: "var(--success)" }}><Save className="w-4 h-4" /></button>
                            <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg hover:bg-accent grid place-items-center"><X className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(i)} className="w-8 h-8 rounded-lg hover:bg-accent grid place-items-center"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => restock(i)} disabled={restocking === i.id} className="px-2 h-8 rounded-lg gradient-brand text-white text-xs font-medium disabled:opacity-60">
                              {restocking === i.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Restock"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function StockTransfers() {
  const { push } = useToast();
  const [list, setList] = useState<Transfer[]>(initialTransfers);
  const [liveMeds, setLiveMeds] = useState<{ name: string }[]>(medicines);
  const [tab, setTab] = useState<"out" | "in">("out");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [form, setForm] = useState({ from: pharmacies[0].id, to: pharmacies[1].id, medicine: medicines[0].name, qty: "", urgency: "medium", reason: "" });

  // Load live redistribution suggestions + live medicines on mount
  useEffect(() => {
    // 1. Redistribution suggestions from DB
    fetch(`${BACKEND_URL}/api/redistribution`)
      .then(r => r.json())
      .then((data: any) => {
        if (data.suggestions && data.suggestions.length > 0) {
          const mapped: Transfer[] = data.suggestions.map((s: any, i: number) => ({
            id: "db" + i,
            from: s.fromId,
            to: s.toId,
            medicine: s.medicine,
            qty: s.quantity,
            urgency: s.urgency === "URGENT" ? "high" : "medium" as any,
            reason: `Auto: surplus at ${s.fromName}, shortage at ${s.toName}`,
            status: "pending" as const,
            date: new Date().toISOString().slice(0, 10),
          }));
          setList(mapped);
        }
      })
      .catch(() => { /* backend offline — keep static initialTransfers */ });

    // 2. Live medicines for dropdown
    fetch(`${BACKEND_URL}/api/all-generics`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setLiveMeds(data.map(m => ({ name: m.generic || m.brand })));
          setForm(f => ({ ...f, medicine: data[0].generic || data[0].brand }));
        }
      })
      .catch(() => { /* fallback to static */ });
  }, []);

  function submit() {
    if (!form.qty) return push("error", "Quantity required");
    const t: Transfer = { id: "t" + Date.now(), from: tab === "out" ? form.from : form.to, to: tab === "out" ? form.to : form.from, medicine: form.medicine, qty: parseInt(form.qty), urgency: form.urgency as any, reason: form.reason || "—", status: "pending", date: new Date().toISOString().slice(0, 10) };
    setList(l => [t, ...l]);
    push("success", "Transfer request created");
    setForm({ ...form, qty: "", reason: "" });
  }
  const filtered = list.filter(t => filter === "all" || t.status === filter);
  return (
    <div className="space-y-6">
      <SectionHeader title="Transfer stock between stores" />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="flex p-1 bg-muted rounded-lg text-xs mb-4">
            <button onClick={() => setTab("out")} className={cn("flex-1 py-2 rounded-md font-medium", tab === "out" && "bg-card shadow")}>Send Stock Out</button>
            <button onClick={() => setTab("in")} className={cn("flex-1 py-2 rounded-md font-medium", tab === "in" && "bg-card shadow")}>Request Stock In</button>
          </div>
          <div className="space-y-3">
            <Select label={tab === "out" ? "From (you)" : "To (you)"} v={form.from} on={v => setForm({ ...form, from: v })} options={pharmacies.map(p => ({ v: p.id, l: p.name }))} />
            <Select label={tab === "out" ? "To" : "From"} v={form.to} on={v => setForm({ ...form, to: v })} options={pharmacies.map(p => ({ v: p.id, l: p.name }))} />
            <Select label="Medicine" v={form.medicine} on={v => setForm({ ...form, medicine: v })} options={liveMeds.map(m => ({ v: m.name, l: m.name }))} />
            <Input label="Quantity" v={form.qty} on={v => setForm({ ...form, qty: v })} type="number" />
            <Select label="Urgency" v={form.urgency} on={v => setForm({ ...form, urgency: v })} options={[{ v: "low", l: "Low" }, { v: "medium", l: "Medium" }, { v: "high", l: "High" }]} />
            <Input label="Reason" v={form.reason} on={v => setForm({ ...form, reason: v })} />
            <button onClick={submit} className="w-full py-2 rounded-lg gradient-brand text-white font-medium">Create transfer</button>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h3 className="font-display font-semibold">Transfer requests</h3>
            <div className="flex gap-1 p-1 bg-muted rounded-lg text-xs">
              {(["all", "pending", "approved", "rejected"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1.5 rounded-md font-medium capitalize", filter === f && "bg-card shadow")}>{f}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filtered.map(t => (
              <div key={t.id} className="p-3 rounded-xl border bg-card/40 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{t.medicine} <span className="text-muted-foreground">×{t.qty}</span></div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <span className="truncate max-w-[140px]">{pharmacies.find(p => p.id === t.from)?.name}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="truncate max-w-[140px]">{pharmacies.find(p => p.id === t.to)?.name}</span>
                  </div>
                </div>
                <Badge variant={t.urgency === "high" ? "danger" : t.urgency === "medium" ? "amber" : "info"}>{t.urgency}</Badge>
                <Badge variant={t.status === "approved" ? "success" : t.status === "pending" ? "amber" : "danger"}>{t.status}</Badge>
                {t.status === "pending" && (
                  <div className="flex gap-1">
                    <button onClick={() => { setList(l => l.map(x => x.id === t.id ? { ...x, status: "approved" } : x)); push("success", "Approved"); }} className="px-2 py-1 text-xs rounded-md text-white" style={{ background: "var(--success)" }}>Approve</button>
                    <button onClick={() => { setList(l => l.map(x => x.id === t.id ? { ...x, status: "rejected" } : x)); push("info", "Rejected"); }} className="px-2 py-1 text-xs rounded-md text-white" style={{ background: "var(--danger)" }}>Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function AutoRedistribute() {
  const { push } = useToast();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [distData, setDistData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/redistribution`)
      .then(r => r.json())
      .then((data: any) => {
        if (data.suggestions) {
          setSuggestions(data.suggestions.map((s: any, i: number) => ({
            id: i + 1,
            from: s.fromName,
            to: s.toName,
            medicine: s.medicine,
            qty: s.quantity,
            gain: `+${Math.round((s.quantity / s.threshold) * 100)}% coverage`,
          })));
          // Build distribution comparison chart from suggestions
          const byPharmacy: Record<string, { before: number; after: number }> = {};
          data.suggestions.forEach((s: any) => {
            const fn = s.fromName.split(" - ")[0];
            const tn = s.toName.split(" - ")[0];
            if (!byPharmacy[fn]) byPharmacy[fn] = { before: s.surplus, after: s.surplus - s.quantity };
            if (!byPharmacy[tn]) byPharmacy[tn] = { before: s.current, after: s.current + s.quantity };
          });
          setDistData(Object.entries(byPharmacy).map(([name, v]) => ({ name, ...v })));
        }
      })
      .catch(() => {
        // Fallback static distData
        setDistData([
          { name: "Apollo", before: 240, after: 200 },
          { name: "MedPlus", before: 280, after: 200 },
          { name: "Jan Aus.", before: 60, after: 100 },
        ]);
      });
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader title="AI-balanced inventory" subtitle="Automated transfers to even out coverage"
        action={<button onClick={() => push("success", "Auto-optimization queued")} className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium flex items-center gap-2"><Wand2 className="w-4 h-4" />Auto-optimize</button>} />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {suggestions.length === 0 && <p className="text-sm text-muted-foreground">Loading redistribution data…</p>}
          {suggestions.map(s => (
            <Card key={s.id}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-display font-semibold">{s.medicine}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><span>{s.from}</span><ArrowRight className="w-3 h-3" /><span>{s.to}</span></div>
                </div>
                <div className="text-right">
                  <div className="text-sm">Qty: <b>{s.qty}</b></div>
                  <div className="text-xs text-success">{s.gain}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => push("success", "Approved transfer")} className="flex-1 py-1.5 rounded-lg gradient-brand text-white text-xs font-medium">Approve</button>
                <button onClick={() => push("info", "Modify mode")} className="flex-1 py-1.5 rounded-lg border hover:bg-accent text-xs font-medium">Modify</button>
              </div>
            </Card>
          ))}
        </div>
        <Card>
          <h3 className="font-display font-semibold mb-3">Distribution comparison</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={distData}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "color-mix(in oklab, var(--foreground) 5%, transparent)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="before" fill="var(--amber)" name="Before" radius={[6, 6, 0, 0]} />
                <Bar dataKey="after" fill="var(--brand)" name="After" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function Analytics() {
  const [topMeds, setTopMeds] = useState(medicines.slice(0, 6).map(m => ({ name: m.generic, demand: 50 })));
  const [liveTrend, setLiveTrend] = useState<any[]>(trendData);
  const [adoption, setAdoption] = useState([
    { name: "Generic", value: 62, color: "var(--brand)" },
    { name: "Brand",   value: 38, color: "var(--amber)" },
  ]);
  const [inventoryHealth, setInventoryHealth] = useState<any[]>(
    pharmacies.map(p => ({ name: p.name.split(" - ")[0] || p.name, health: 70 }))
  );

  useEffect(() => {
    // Live medicines demand (price savings as proxy)
    fetch(`${BACKEND_URL}/api/all-generics`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0)
          setTopMeds(data.slice(0, 6).map(m => ({ name: m.generic || m.brand, demand: m.brandPrice - m.genericPrice })));
      }).catch(() => {});

    // Live 7-day trend
    fetch(`${BACKEND_URL}/api/live-trend-data`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length) setLiveTrend(d); }).catch(() => {});

    // Live generic vs brand adoption
    fetch(`${BACKEND_URL}/api/adoption-stats`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length) setAdoption(d); }).catch(() => {});

    // Compute inventory health per pharmacy from stock-alerts
    fetch(`${BACKEND_URL}/api/stock-alerts`)
      .then(r => r.json())
      .then((d: any) => {
        if (!d.alerts) return;
        const byPharmacy: Record<string, { total: number; sum: number }> = {};
        d.alerts.forEach((a: any) => {
          const name = (a.pharmacy || "Unknown").split(" - ")[0];
          if (!byPharmacy[name]) byPharmacy[name] = { total: 0, sum: 0 };
          byPharmacy[name].total++;
          byPharmacy[name].sum += Math.min(100, (a.stock / a.threshold) * 100);
        });
        const health = Object.entries(byPharmacy).map(([name, v]) => ({
          name,
          health: Math.round(v.sum / v.total),
        }));
        if (health.length > 0) setInventoryHealth(health);
      }).catch(() => {});
  }, []);


  return (
    <div className="space-y-6">
      <SectionHeader title="Performance analytics" />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-display font-semibold mb-3">Disease trend</h3>
          <div className="h-60">
            <ResponsiveContainer>
              <LineChart data={liveTrend}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="flu"     stroke="var(--brand)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="dengue"  stroke="var(--amber)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="malaria" stroke="var(--teal)"  strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="font-display font-semibold mb-3">Inventory health by pharmacy</h3>
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={inventoryHealth} layout="vertical">
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke={axisColor} fontSize={11} />
                <YAxis dataKey="name" type="category" stroke={axisColor} fontSize={11} width={90} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "color-mix(in oklab, var(--foreground) 5%, transparent)" }} />
                <Bar dataKey="health" fill="var(--teal)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="font-display font-semibold mb-3">Top demanded medicines</h3>
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={topMeds}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "color-mix(in oklab, var(--foreground) 5%, transparent)" }} />
                <Bar dataKey="demand" fill="var(--brand)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="font-display font-semibold mb-3">Generic vs Brand adoption</h3>
          <div className="h-60">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={adoption} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={4}>
                  {adoption.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Input({ label, v, on, type = "text" }: { label: string; v: string; on: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <input type={type} value={v} onChange={e => on(e.target.value)} className="w-full bg-card border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40" />
    </label>
  );
}
function Select({ label, v, on, options }: { label: string; v: string; on: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label className="block">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <select value={v} onChange={e => on(e.target.value)} className="w-full bg-card border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
