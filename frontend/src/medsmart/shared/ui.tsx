import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({ className, children, glass = true }: { className?: string; children: ReactNode; glass?: boolean }) {
  return (
    <div className={cn(glass ? "glass" : "bg-card border", "rounded-2xl p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, icon, accent = "brand", delta }: { label: string; value: string | number; icon?: ReactNode; accent?: "brand" | "teal" | "amber" | "danger" | "info" | "success"; delta?: string; }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 relative overflow-hidden group">
      <div className={cn("absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl", `bg-${accent}`)} />
      <div className="flex items-start justify-between relative">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-3xl font-display font-bold mt-2">{value}</div>
          {delta && <div className={cn("text-xs mt-1", `text-${accent}`)}>{delta}</div>}
        </div>
        {icon && <div className={cn("w-10 h-10 rounded-xl grid place-items-center", `bg-${accent}/15 text-${accent}`)} style={{ backgroundColor: `color-mix(in oklab, var(--${accent}) 15%, transparent)`, color: `var(--${accent})` }}>{icon}</div>}
      </div>
    </motion.div>
  );
}

export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "brand" | "teal" | "amber" | "danger" | "info" | "success" | "outline" }) {
  const styles: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    brand: "text-primary-foreground",
    teal: "text-primary-foreground",
    amber: "text-primary-foreground",
    danger: "text-primary-foreground",
    info: "text-primary-foreground",
    success: "text-primary-foreground",
    outline: "border bg-transparent text-foreground",
  };
  const bg = variant !== "default" && variant !== "outline" ? { backgroundColor: `var(--${variant})` } : {};
  return <span style={bg} className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium", styles[variant])}>{children}</span>;
}

export function ProgressBar({ value, accent = "brand" }: { value: number; accent?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, value)}%` }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, var(--${accent}), var(--teal))` }} />
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-display font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
