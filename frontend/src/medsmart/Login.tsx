import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Store, User as UserIcon, ArrowLeft, Lock, Mail, Phone, MapPin, Shield, Eye, EyeOff } from "lucide-react";
import { useApp } from "./AppContext";
import { useToast } from "./shared/Toast";
import { pharmacies } from "./data";
import { cn } from "@/lib/utils";
import ChatBot from "@/medsmart/shared/ChatBot";

type Mode = "landing" | "store" | "patient";
type StoreSub = "chain" | "local-login" | "local-register";
type PatientSub = "login" | "signup";

export default function Login() {
  const { login } = useApp();
  const { push } = useToast();
  const [mode, setMode] = useState<Mode>("landing");
  const [storeSub, setStoreSub] = useState<StoreSub>("chain");
  const [patientSub, setPatientSub] = useState<PatientSub>("login");

  // store chain
  const [pharmacyId, setPharmacyId] = useState(pharmacies[0].id);
  const [pin, setPin] = useState("");

  // franchise two-step selection
  const franchiseBrands = Array.from(new Set(pharmacies.filter(p => p.type === "chain").map(p => p.name.split(" - ")[0].trim())));
  const [selectedBrand, setSelectedBrand] = useState(franchiseBrands[0]);
  const brandBranches = pharmacies.filter(p => p.type === "chain" && p.name.startsWith(selectedBrand));

  // store local
  const [sEmail, setSEmail] = useState("");
  const [sPass, setSPass] = useState("");

  // store register
  const [reg, setReg] = useState({ name: "", owner: "", email: "", password: "", phone: "", license: "", address: "", city: "", pincode: "" });

  // patient
  const [pEmail, setPEmail] = useState("");
  const [pPass, setPPass] = useState("");
  const [pName, setPName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const passStrength = (() => {
    let s = 0;
    if (pPass.length >= 8) s++;
    if (/[A-Z]/.test(pPass)) s++;
    if (/[0-9]/.test(pPass)) s++;
    if (/[^A-Za-z0-9]/.test(pPass)) s++;
    return s;
  })();
  const strengthLabel = ["Too weak", "Weak", "Fair", "Good", "Strong"][passStrength];
  const strengthColor = ["var(--danger)", "var(--danger)", "var(--amber)", "var(--info)", "var(--success)"][passStrength];

  async function doStoreChain() {
    setError("");
    if (pin.length < 4) { setError("PIN must be at least 4 digits"); return; }
    const p = pharmacies.find(x => x.id === pharmacyId)!;
    
    try {
      const res = await fetch("http://localhost:3001/auth/store-login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: p.id, pin })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      
      login({ name: data.user.name || "Store Manager", email: data.user.email, role: "store", pharmacyName: p.name, region: "Bengaluru Zone", token: data.token });
      push("success", `Logged in to ${p.name}`);
    } catch (err) {
      setError("Auth server offline. Demo mode fallback.");
      setTimeout(() => {
        login({ name: "Store Manager", email: "manager@" + p.name.split(" ")[0].toLowerCase() + ".com", role: "store", pharmacyName: p.name, region: "Bengaluru Zone" });
        push("success", `Logged in to ${p.name}`);
      }, 1000);
    }
  }

  async function doStoreLocal() {
    setError("");
    if (!sEmail || !sPass) { setError("Email and password required"); return; }
    
    try {
      const res = await fetch("http://localhost:3001/auth/store-login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sEmail, password: sPass })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      
      login({ name: data.user.name || "Local Owner", email: sEmail, role: "store", pharmacyName: "Sunrise Medicals", region: "Bengaluru Zone", token: data.token });
      push("success", "Welcome back");
    } catch (err) {
      setError("Auth server offline. Demo mode fallback.");
      setTimeout(() => {
        login({ name: "Local Owner", email: sEmail, role: "store", pharmacyName: "Sunrise Medicals", region: "Bengaluru Zone" });
        push("success", "Welcome back");
      }, 1000);
    }
  }

  async function doRegister() {
    setError("");
    if (!reg.name || !reg.email || !reg.password || !reg.phone) { setError("Fill all required fields"); return; }
    
    try {
      const res = await fetch("http://localhost:3001/auth/store-register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName: reg.name, ownerName: reg.owner, email: reg.email, password: reg.password, phone: reg.phone, licenseNo: reg.license, address: reg.address, city: reg.city, pincode: reg.pincode })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      
      login({ name: reg.owner || reg.name, email: reg.email, role: "store", pharmacyName: reg.name, region: reg.city || "Bengaluru Zone", phone: reg.phone, address: reg.address, token: data.token });
      push("success", "Pharmacy registered");
    } catch (err) {
      setError("Auth server offline. Demo mode fallback.");
      setTimeout(() => {
        login({ name: reg.owner || reg.name, email: reg.email, role: "store", pharmacyName: reg.name, region: reg.city || "Bengaluru Zone", phone: reg.phone, address: reg.address });
        push("success", "Pharmacy registered");
      }, 1000);
    }
  }

  async function doPatientLogin() {
    setError("");
    if (!pEmail || !pPass) { setError("Email and password required"); return; }
    
    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pEmail, password: pPass })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      
      login({ name: data.user.name || pEmail.split("@")[0], email: pEmail, role: "patient", region: "Bengaluru Zone", token: data.token });
      push("success", "Welcome back!");
    } catch (err) {
      setError("Auth server offline. Demo mode fallback.");
      setTimeout(() => {
        login({ name: pEmail.split("@")[0], email: pEmail, role: "patient", region: "Bengaluru Zone" });
        push("success", "Welcome back!");
      }, 1000);
    }
  }

  async function doPatientSignup() {
    setError("");
    if (!pName || !pEmail || passStrength < 2) { setError("Name, email and a stronger password required"); return; }
    
    try {
      const res = await fetch("http://localhost:3001/auth/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pEmail, password: pPass, name: pName })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed"); return; }
      
      login({ name: data.user.name || pName, email: pEmail, role: "patient", region: "Bengaluru Zone", token: data.token });
      push("success", "Account created");
    } catch (err) {
      setError("Auth server offline. Demo mode fallback.");
      setTimeout(() => {
        login({ name: pName, email: pEmail, role: "patient", region: "Bengaluru Zone" });
        push("success", "Account created");
      }, 1000);
    }
  }

  return (
    <>
      <div className="min-h-screen relative overflow-hidden gradient-radial">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="relative z-10 grid lg:grid-cols-2 min-h-screen">
        {/* Brand */}
        <div className="hidden lg:flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl gradient-brand grid place-items-center shadow-glow">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-xl">PharmaLink</div>
              <div className="text-xs text-muted-foreground">Healthcare Supply Intelligence</div>
            </div>
          </div>
          <div className="space-y-6 max-w-lg">
            <h1 className="text-5xl font-display font-bold leading-tight">
              Smarter pharmacies.<br />
              <span style={{ background: "linear-gradient(90deg, var(--brand), var(--teal))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Healthier patients.</span>
            </h1>
            <p className="text-muted-foreground text-lg">Real-time disease intelligence, AI-powered demand forecasting and generic medicine discovery — all in one platform.</p>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[{ k: "120+", v: "Pharmacies" }, { k: "₹2.4Cr", v: "Saved by patients" }, { k: "98%", v: "Stockout prevention" }].map(s => (
                <div key={s.v} className="glass rounded-xl p-3">
                  <div className="font-display font-bold text-xl">{s.k}</div>
                  <div className="text-xs text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">© 2025 PharmaLink. Compliant with healthcare data standards.</div>
        </div>

        {/* Forms */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <motion.div layout className="w-full max-w-md glass-strong rounded-3xl p-8 shadow-glow">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-lg gradient-brand grid place-items-center"><Activity className="w-5 h-5 text-white" /></div>
              <span className="font-display font-bold text-lg">PharmaLink</span>
            </div>
            <AnimatePresence mode="wait">
              {mode === "landing" && (
                <motion.div key="landing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <h2 className="text-2xl font-display font-bold">Continue as</h2>
                  <p className="text-sm text-muted-foreground mt-1">Choose your role to access the right tools.</p>
                  <div className="space-y-3 mt-6">
                    <RoleCard icon={<Store className="w-6 h-6" />} title="Pharmacy / Store" desc="Manage inventory, forecast demand, transfer stock." onClick={() => setMode("store")} accent="brand" />
                    <RoleCard icon={<UserIcon className="w-6 h-6" />} title="Patient / User" desc="Find generics, track savings, get health alerts." onClick={() => setMode("patient")} accent="teal" />
                  </div>
                </motion.div>
              )}

              {mode === "store" && (
                <motion.div key="store" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <BackBtn onClick={() => { setMode("landing"); setError(""); }} />
                  <h2 className="text-2xl font-display font-bold mt-2">Pharmacy access</h2>
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-muted mt-5 text-xs">
                    {(["chain", "local-login", "local-register"] as StoreSub[]).map(s => (
                      <button key={s} onClick={() => { setStoreSub(s); setError(""); }} className={cn("py-2 rounded-md font-medium transition", storeSub === s ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                        {s === "chain" ? "Franchise" : s === "local-login" ? "Login" : "Register"}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 space-y-4">
                    {storeSub === "chain" && (
                      <>
                        <Field label="Select franchise">
                          <select
                            value={selectedBrand}
                            onChange={e => {
                              setSelectedBrand(e.target.value);
                              const first = pharmacies.find(p => p.type === "chain" && p.name.startsWith(e.target.value));
                              if (first) setPharmacyId(first.id);
                            }}
                            className="w-full bg-card border rounded-lg px-3 py-2.5 text-sm"
                          >
                            {franchiseBrands.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </Field>
                        <Field label="Select area / branch">
                          <select
                            value={pharmacyId}
                            onChange={e => setPharmacyId(e.target.value)}
                            className="w-full bg-card border rounded-lg px-3 py-2.5 text-sm"
                          >
                            {brandBranches.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name.includes(" - ") ? p.name.split(" - ").slice(1).join(" - ") : p.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Store PIN" icon={<Lock className="w-4 h-4" />}>
                          <input value={pin} onChange={e => setPin(e.target.value)} type="password" placeholder="••••" className="w-full bg-transparent outline-none text-sm" />
                        </Field>
                        <div className="text-[11px] text-muted-foreground px-1">
                          Demo PINs — Apollo: <b>5678</b> · MedPlus: <b>1234</b> · Jan Aushadhi: <b>9012</b>
                        </div>
                        <PrimaryBtn onClick={doStoreChain}>Sign in to store</PrimaryBtn>
                      </>
                    )}
                    {storeSub === "local-login" && (
                      <>
                        <Field label="Email" icon={<Mail className="w-4 h-4" />}><input value={sEmail} onChange={e => setSEmail(e.target.value)} className="w-full bg-transparent outline-none text-sm" placeholder="owner@pharmacy.com" /></Field>
                        <Field label="Password" icon={<Lock className="w-4 h-4" />}><input value={sPass} onChange={e => setSPass(e.target.value)} type="password" className="w-full bg-transparent outline-none text-sm" /></Field>
                        <PrimaryBtn onClick={doStoreLocal}>Sign in</PrimaryBtn>
                      </>
                    )}
                    {storeSub === "local-register" && (
                      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1 scrollbar-thin">
                        <div className="grid grid-cols-2 gap-3">
                          <SimpleField label="Pharmacy name" v={reg.name} on={v => setReg({ ...reg, name: v })} />
                          <SimpleField label="Owner" v={reg.owner} on={v => setReg({ ...reg, owner: v })} />
                          <SimpleField label="Email" v={reg.email} on={v => setReg({ ...reg, email: v })} />
                          <SimpleField label="Password" type="password" v={reg.password} on={v => setReg({ ...reg, password: v })} />
                          <SimpleField label="Phone" v={reg.phone} on={v => setReg({ ...reg, phone: v })} />
                          <SimpleField label="License #" v={reg.license} on={v => setReg({ ...reg, license: v })} />
                          <SimpleField label="City" v={reg.city} on={v => setReg({ ...reg, city: v })} />
                          <SimpleField label="Pincode" v={reg.pincode} on={v => setReg({ ...reg, pincode: v })} />
                        </div>
                        <SimpleField label="Address" v={reg.address} on={v => setReg({ ...reg, address: v })} />
                        <PrimaryBtn onClick={doRegister}>Register pharmacy</PrimaryBtn>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {mode === "patient" && (
                <motion.div key="patient" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <BackBtn onClick={() => { setMode("landing"); setError(""); }} />
                  <h2 className="text-2xl font-display font-bold mt-2">{patientSub === "login" ? "Welcome back" : "Create account"}</h2>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted mt-5 text-xs">
                    {(["login", "signup"] as PatientSub[]).map(s => (
                      <button key={s} onClick={() => { setPatientSub(s); setError(""); }} className={cn("py-2 rounded-md font-medium transition capitalize", patientSub === s ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>{s}</button>
                    ))}
                  </div>
                  <div className="mt-5 space-y-4">
                    {patientSub === "signup" && <Field label="Full name" icon={<UserIcon className="w-4 h-4" />}><input value={pName} onChange={e => setPName(e.target.value)} className="w-full bg-transparent outline-none text-sm" /></Field>}
                    <Field label="Email" icon={<Mail className="w-4 h-4" />}><input value={pEmail} onChange={e => setPEmail(e.target.value)} className="w-full bg-transparent outline-none text-sm" placeholder="you@email.com" /></Field>
                    <Field label="Password" icon={<Lock className="w-4 h-4" />}>
                      <input value={pPass} onChange={e => setPPass(e.target.value)} type={showPass ? "text" : "password"} className="w-full bg-transparent outline-none text-sm" />
                      <button type="button" onClick={() => setShowPass(s => !s)} className="text-muted-foreground hover:text-foreground">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </Field>
                    {patientSub === "signup" && pPass && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map(i => (
                            <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i < passStrength ? strengthColor : "var(--muted)" }} />
                          ))}
                        </div>
                        <div className="text-xs" style={{ color: strengthColor }}>{strengthLabel}</div>
                      </div>
                    )}
                    <PrimaryBtn onClick={patientSub === "login" ? doPatientLogin : doPatientSignup}>{patientSub === "login" ? "Sign in" : "Create account"}</PrimaryBtn>
                    <div className="flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">or continue with</span><div className="flex-1 h-px bg-border" /></div>
                    <div className="grid grid-cols-1 gap-3">
                      <SocialBtn onClick={() => { window.location.href = "http://localhost:3001/auth/google"; }} label="Google" color="#ea4335" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {error && <div className="mt-4 text-xs text-danger flex items-center gap-2"><Shield className="w-3.5 h-3.5" />{error}</div>}
          </motion.div>
        </div>
      </div>
      </div>

      {/* Gemini chatbot — public support on login page */}
      <ChatBot />
    </>
  );
}

function RoleCard({ icon, title, desc, onClick, accent }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void; accent: "brand" | "teal"; }) {
  return (
    <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }} onClick={onClick} className="w-full text-left glass rounded-xl p-4 flex items-center gap-4 group hover:shadow-glow transition">
      <div className="w-12 h-12 rounded-xl grid place-items-center" style={{ background: `linear-gradient(135deg, var(--${accent}), var(--teal))` }}>
        <span className="text-white">{icon}</span>
      </div>
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <div className="text-muted-foreground group-hover:text-foreground transition">→</div>
    </motion.button>
  );
}
function BackBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" />Back</button>;
}
function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-muted-foreground mb-1.5">{label}</div>
      <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-brand/40 transition">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {children}
      </div>
    </label>
  );
}
function SimpleField({ label, v, on, type = "text" }: { label: string; v: string; on: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <input type={type} value={v} onChange={e => on(e.target.value)} className="w-full bg-card border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40" />
    </label>
  );
}
function PrimaryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <motion.button whileTap={{ scale: 0.98 }} onClick={onClick} className="w-full py-2.5 rounded-lg font-medium gradient-brand text-white shadow-glow hover:opacity-95 transition">{children}</motion.button>;
}
function SocialBtn({ label, onClick }: { label: string; color?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="py-2.5 rounded-lg border bg-card hover:bg-accent text-sm flex items-center justify-center gap-2 transition">
      {label === "Google" && (
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
      )}
      {label}
    </button>
  );
}
