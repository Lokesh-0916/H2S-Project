import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, LayoutDashboard, Stethoscope, TrendingUp, Sparkles, Package, ArrowLeftRight, Shuffle, BarChart3, Bell, Sun, Moon, MapPin, LogOut, Settings, User as UserIcon, Heart, ShoppingBag, Search, Menu, X } from "lucide-react";
import { useApp } from "./AppContext";
import { alerts } from "./data";
import { cn } from "@/lib/utils";

const storeNav = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "disease", label: "Disease Monitor", icon: Stethoscope },
  { id: "forecast", label: "Demand Forecast", icon: TrendingUp },
  { id: "ai", label: "AI Suggestions", icon: Sparkles },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "transfers", label: "Stock Transfers", icon: ArrowLeftRight },
  { id: "redistribute", label: "Auto Redistribute", icon: Shuffle },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];
const patientNav = [
  { id: "dashboard", label: "My Dashboard", icon: LayoutDashboard },
  { id: "alerts", label: "Health Alerts", icon: Heart },
  { id: "search", label: "Medicine Search", icon: Search },
  { id: "history", label: "Purchase History", icon: ShoppingBag },
];

const titles: Record<string, { t: string; s: string }> = {
  dashboard: { t: "Dashboard", s: "Live overview of operations and demand" },
  disease: { t: "Disease Monitor", s: "Track outbreaks and growth in your region" },
  forecast: { t: "Demand Forecast", s: "Predict required stock for the coming weeks" },
  ai: { t: "AI Suggestions", s: "Smart restock recommendations powered by AI" },
  inventory: { t: "Inventory", s: "Manage stock levels and thresholds" },
  transfers: { t: "Stock Transfers", s: "Move stock between pharmacies" },
  redistribute: { t: "Auto Redistribution", s: "AI-balanced inventory across stores" },
  analytics: { t: "Analytics", s: "Performance and adoption insights" },
  alerts: { t: "Health Alerts", s: "Stay informed about local health activity" },
  search: { t: "Medicine Search", s: "Find generic alternatives and save more" },
  history: { t: "Purchase History", s: "Your purchases, savings and patterns" },
};

export default function Shell({ children }: { children: ReactNode }) {
  const { user, theme, toggleTheme, logout, section, setSection, updateProfile } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const nav = user?.role === "store" ? storeNav : patientNav;
  const title = titles[section] || { t: section, s: "" };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar — always fixed, never scrolls */}
      <aside className={cn(
        "fixed z-50 h-screen top-0 left-0 transition-all duration-300 border-r bg-card/60 backdrop-blur-xl flex flex-col overflow-hidden",
        collapsed ? "w-20" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 flex items-center gap-3 border-b">
          <div className="w-10 h-10 rounded-xl gradient-brand grid place-items-center shrink-0 shadow-glow">
            <Activity className="w-5 h-5 text-white" />
          </div>
          {!collapsed && <div className="min-w-0">
            <div className="font-display font-bold leading-tight">MedSmart</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{user?.role === "store" ? "Pharmacy Console" : "Patient Portal"}</div>
          </div>}
          <button onClick={() => setMobileOpen(false)} className="lg:hidden ml-auto"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin min-h-0">
          {nav.map(item => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button key={item.id} onClick={() => { setSection(item.id); setMobileOpen(false); }}
                className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition relative group",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
                {active && <motion.div layoutId="active-pill" className="absolute inset-0 rounded-lg gradient-brand opacity-20" />}
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r" style={{ background: "var(--brand)" }} />}
                <Icon className="w-4 h-4 shrink-0 relative" />
                {!collapsed && <span className="relative truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Profile mini-card — always pinned to sidebar bottom */}
        <div className="shrink-0 p-3 border-t relative">
          <button onClick={() => setShowProfile(s => !s)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition">
            <div className="w-9 h-9 rounded-full gradient-brand grid place-items-center text-white text-sm font-bold shrink-0">{user?.name?.[0]?.toUpperCase() || "U"}</div>
            {!collapsed && <div className="text-left min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
            </div>}
          </button>
          <AnimatePresence>
            {showProfile && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-full left-3 right-3 mb-2 glass-strong rounded-xl p-2 shadow-lg">
                <ProfileAction icon={<UserIcon className="w-4 h-4" />} label="View profile" onClick={() => { setProfileModal(true); setShowProfile(false); }} />
                <ProfileAction icon={<Settings className="w-4 h-4" />} label="Settings" onClick={() => setShowProfile(false)} />
                <ProfileAction icon={<LogOut className="w-4 h-4" />} label="Logout" danger onClick={() => { logout(); setShowProfile(false); }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={() => setCollapsed(c => !c)} className="hidden lg:flex shrink-0 items-center justify-center text-xs text-muted-foreground hover:text-foreground py-2 border-t">
          {collapsed ? "→" : "← Collapse"}
        </button>
      </aside>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden" />}

      {/* Main — offset by sidebar width so content is never hidden behind it */}
      <div className={cn("flex-1 min-w-0 flex flex-col transition-all duration-300 lg:ml-64", collapsed && "lg:ml-20")}>
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden"><Menu className="w-5 h-5" /></button>
            <div className="min-w-0 flex-1">
              <h1 className="font-display font-bold text-lg leading-tight truncate">{title.t}</h1>
              <div className="text-xs text-muted-foreground truncate">{title.s}</div>
            </div>
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs">
              <MapPin className="w-3.5 h-3.5 text-teal" />{user?.region || "Bengaluru Zone"}
            </div>
            <div className="relative">
              <button onClick={() => setShowAlerts(s => !s)} className="w-9 h-9 rounded-lg hover:bg-accent grid place-items-center relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger" />
              </button>
              <AnimatePresence>
                {showAlerts && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-12 w-80 glass-strong rounded-xl p-3 shadow-lg z-50">
                    <div className="text-sm font-semibold mb-2 px-1">Alerts</div>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {alerts.map(a => (
                        <div key={a.id} className="p-2.5 rounded-lg bg-card/60 border">
                          <div className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full mt-1.5" style={{ background: a.severity === "high" ? "var(--danger)" : a.severity === "medium" ? "var(--amber)" : "var(--info)" }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{a.title}</div>
                              <div className="text-xs text-muted-foreground">{a.message}</div>
                              <div className="text-[10px] text-muted-foreground mt-1">{a.time}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={toggleTheme} className="w-9 h-9 rounded-lg hover:bg-accent grid place-items-center">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {profileModal && <ProfileModal onClose={() => setProfileModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

function ProfileAction({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent transition", danger && "text-danger hover:bg-danger/10")}>
      {icon}{label}
    </button>
  );
}

function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, updateProfile } = useApp();
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [form, setForm] = useState({
    name:    user?.name    || "",
    email:   user?.email   || "",
    phone:   user?.phone   || "",
    gender:  user?.gender  || "",
    address: user?.address || "",
    age:     user?.age?.toString() || "",
  });

  const countryCodes = [
    { code: "+91",  flag: "🇮🇳", label: "India" },
    { code: "+1",   flag: "🇺🇸", label: "USA" },
    { code: "+44",  flag: "🇬🇧", label: "UK" },
    { code: "+61",  flag: "🇦🇺", label: "Australia" },
    { code: "+971", flag: "🇦🇪", label: "UAE" },
    { code: "+65",  flag: "🇸🇬", label: "Singapore" },
    { code: "+49",  flag: "🇩🇪", label: "Germany" },
    { code: "+33",  flag: "🇫🇷", label: "France" },
  ];

  async function handleSave() {
    setSaving(true);
    setSaveError("");

    if (!form.name.trim()) {
      setSaveError("Name cannot be empty.");
      setSaving(false);
      return;
    }
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) {
      setSaveError("Phone number must be exactly 10 digits (after the country code).");
      setSaving(false);
      return;
    }
    if (form.age && (isNaN(Number(form.age)) || Number(form.age) < 1 || Number(form.age) > 120)) {
      setSaveError("Age must be a valid number between 1 and 120.");
      setSaving(false);
      return;
    }

    try {
      if (user?.token) {
        const res = await fetch("http://localhost:3001/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
          body: JSON.stringify({
            name: form.name, phone: form.phone, gender: form.gender,
            address: form.address, age: form.age ? Number(form.age) : undefined,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          setSaveError(d.error || "Save failed — please try again.");
          setSaving(false);
          return;
        }
      }
      updateProfile({ name: form.name, phone: form.phone, gender: form.gender, address: form.address, age: form.age ? Number(form.age) : undefined });
      setEdit(false);
    } catch {
      updateProfile({ name: form.name, phone: form.phone, gender: form.gender, address: form.address, age: form.age ? Number(form.age) : undefined });
      setEdit(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="glass-strong rounded-2xl w-full max-w-lg p-6 shadow-glow">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl gradient-brand grid place-items-center text-white text-2xl font-bold">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="flex-1">
            <div className="font-display font-bold text-xl">{form.name}</div>
            <div className="text-xs text-muted-foreground">{user?.role === "store" ? user?.pharmacyName : "Patient Profile"}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-accent grid place-items-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Name */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</div>
            {edit ? (
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full mt-1 bg-card border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40" />
            ) : (
              <div className="text-sm font-medium mt-1">{form.name || <span className="text-muted-foreground italic">Not set</span>}</div>
            )}
          </div>

          {/* Email — always read-only */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</div>
            <div className="text-sm font-medium mt-1">{form.email || <span className="text-muted-foreground italic">Not set</span>}</div>
          </div>

          {/* Phone — full width so country picker + input never collapse */}
          <div className="col-span-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone</div>
            {edit ? (
              <div className="flex gap-2 mt-1">
                <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                  className="bg-card border rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40 shrink-0">
                  {countryCodes.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="10-digit number" maxLength={10} inputMode="numeric"
                  className="flex-1 bg-card border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40" />
              </div>
            ) : (
              <div className="text-sm font-medium mt-1">
                {form.phone ? `${countryCode} ${form.phone}` : <span className="text-muted-foreground italic">Not set</span>}
              </div>
            )}
          </div>

          {/* Age — shares row with Gender */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Age</div>
            {edit ? (
              <input
                value={form.age}
                onChange={e => setForm({ ...form, age: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                placeholder="e.g. 25" inputMode="numeric" maxLength={3}
                className="w-full mt-1 bg-card border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40" />
            ) : (
              <div className="text-sm font-medium mt-1">{form.age || <span className="text-muted-foreground italic">Not set</span>}</div>
            )}
          </div>

          {/* Gender — dropdown */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Gender</div>
            {edit ? (
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                className="w-full mt-1 bg-card border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40">
                <option value="">Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            ) : (
              <div className="text-sm font-medium mt-1">{form.gender || <span className="text-muted-foreground italic">Not set</span>}</div>
            )}
          </div>

          {/* Address — full width */}
          <div className="col-span-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Address</div>
            {edit ? (
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full mt-1 bg-card border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40" />
            ) : (
              <div className="text-sm font-medium mt-1">{form.address || <span className="text-muted-foreground italic">Not set</span>}</div>
            )}
          </div>
        </div>

        {saveError && (
          <div className="mt-3 text-xs text-danger flex items-start gap-1.5">
            <span className="mt-0.5">⚠</span>
            <span>{saveError}</span>
          </div>
        )}

        <div className="flex gap-2 mt-6">
          {edit ? (
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg gradient-brand text-white font-medium disabled:opacity-60">
              {saving ? "Saving…" : "Save changes"}
            </button>
          ) : (
            <button onClick={() => setEdit(true)} className="flex-1 py-2 rounded-lg gradient-brand text-white font-medium">Edit profile</button>
          )}
          <button onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-accent">Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
