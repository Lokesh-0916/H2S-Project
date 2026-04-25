import type { Pharmacy, Medicine, InventoryItem, DiseaseReport, Transfer, Alert, Purchase } from "./types";

// IDs match DEMO_PINS in auth-server/data/storesList.js
// Chain PIN login: PH001=1234, PH002=5678, PH003=9012
export const pharmacies: Pharmacy[] = [
  { id: "PH002", name: "Apollo Pharmacy - HSR Layout, Bengaluru", type: "chain", city: "Bengaluru" },
  { id: "PH001", name: "MedPlus - Koramangala, Bengaluru",        type: "chain", city: "Bengaluru" },
  { id: "PH003", name: "Jan Aushadhi - Indiranagar, Bengaluru",   type: "chain", city: "Bengaluru" },
  { id: "ph5",   name: "Sunrise Medicals",                        type: "local", city: "Bengaluru" },
  { id: "ph6",   name: "Green Cross Pharmacy",                    type: "local", city: "Bengaluru" },
];

export const medicines: Medicine[] = [
  { id: "m1", name: "Paracetamol 500mg", brand: "Crocin", generic: "Paracetamol", category: "Analgesic", brandPrice: 35, genericPrice: 12, composition: "Paracetamol 500mg" },
  { id: "m2", name: "Azithromycin 500mg", brand: "Azithral", generic: "Azithromycin", category: "Antibiotic", brandPrice: 165, genericPrice: 58, composition: "Azithromycin 500mg" },
  { id: "m3", name: "Cetirizine 10mg", brand: "Zyrtec", generic: "Cetirizine", category: "Antihistamine", brandPrice: 78, genericPrice: 22, composition: "Cetirizine 10mg" },
  { id: "m4", name: "Pantoprazole 40mg", brand: "Pan-40", generic: "Pantoprazole", category: "Antacid", brandPrice: 142, genericPrice: 45, composition: "Pantoprazole 40mg" },
  { id: "m5", name: "Metformin 500mg", brand: "Glycomet", generic: "Metformin", category: "Diabetes", brandPrice: 88, genericPrice: 28, composition: "Metformin 500mg" },
  { id: "m6", name: "Amoxicillin 500mg", brand: "Mox", generic: "Amoxicillin", category: "Antibiotic", brandPrice: 124, genericPrice: 42, composition: "Amoxicillin 500mg" },
  { id: "m7", name: "Atorvastatin 10mg", brand: "Lipitor", generic: "Atorvastatin", category: "Cardiac", brandPrice: 198, genericPrice: 64, composition: "Atorvastatin 10mg" },
  { id: "m8", name: "Ibuprofen 400mg", brand: "Brufen", generic: "Ibuprofen", category: "Analgesic", brandPrice: 56, genericPrice: 18, composition: "Ibuprofen 400mg" },
];

export const initialInventory: InventoryItem[] = [
  { id: "i1", medicineId: "m1", name: "Paracetamol 500mg", stock: 24, threshold: 100 },
  { id: "i2", medicineId: "m2", name: "Azithromycin 500mg", stock: 18, threshold: 80 },
  { id: "i3", medicineId: "m3", name: "Cetirizine 10mg", stock: 142, threshold: 100 },
  { id: "i4", medicineId: "m4", name: "Pantoprazole 40mg", stock: 56, threshold: 80 },
  { id: "i5", medicineId: "m5", name: "Metformin 500mg", stock: 220, threshold: 100 },
  { id: "i6", medicineId: "m6", name: "Amoxicillin 500mg", stock: 12, threshold: 60 },
  { id: "i7", medicineId: "m7", name: "Atorvastatin 10mg", stock: 88, threshold: 60 },
  { id: "i8", medicineId: "m8", name: "Ibuprofen 400mg", stock: 175, threshold: 100 },
];

export const diseaseReports: DiseaseReport[] = [
  { id: "d1", disease: "Influenza A", cases: 124, growth: 18, severity: "high", source: "BBMP Health Bulletin", date: "2025-04-21" },
  { id: "d2", disease: "Dengue", cases: 67, growth: 9, severity: "medium", source: "Local Clinics", date: "2025-04-20" },
  { id: "d3", disease: "Viral Fever", cases: 215, growth: 22, severity: "high", source: "Pharmacy Reports", date: "2025-04-21" },
  { id: "d4", disease: "Gastroenteritis", cases: 41, growth: 4, severity: "low", source: "Hospital Network", date: "2025-04-19" },
];

export const trendData = [
  { day: "Mon", flu: 60, dengue: 30, viral: 90 },
  { day: "Tue", flu: 72, dengue: 35, viral: 110 },
  { day: "Wed", flu: 81, dengue: 40, viral: 130 },
  { day: "Thu", flu: 90, dengue: 48, viral: 155 },
  { day: "Fri", flu: 102, dengue: 55, viral: 178 },
  { day: "Sat", flu: 115, dengue: 62, viral: 195 },
  { day: "Sun", flu: 124, dengue: 67, viral: 215 },
];

export const demandDonut = [
  { name: "Antibiotics", value: 32, color: "var(--brand)" },
  { name: "Analgesics", value: 24, color: "var(--teal)" },
  { name: "Antacids", value: 18, color: "var(--amber)" },
  { name: "Diabetes", value: 14, color: "var(--info)" },
  { name: "Other", value: 12, color: "var(--success)" },
];

export const initialTransfers: Transfer[] = [
  { id: "t1", from: "PH002", to: "ph5",   medicine: "Azithromycin 500mg", qty: 40,  urgency: "high",   reason: "Critical low at destination", status: "pending",  date: "2025-04-21" },
  { id: "t2", from: "PH001", to: "ph6",   medicine: "Paracetamol 500mg",  qty: 100, urgency: "medium", reason: "Outbreak demand",             status: "approved", date: "2025-04-20" },
  { id: "t3", from: "PH003", to: "PH002", medicine: "Cetirizine 10mg",    qty: 60,  urgency: "low",    reason: "Surplus rebalance",           status: "rejected", date: "2025-04-18" },
];

export const alerts: Alert[] = [
  { id: "a1", title: "Influenza outbreak nearby", message: "Cases up 18% this week in Bengaluru East", severity: "high", time: "2h ago" },
  { id: "a2", title: "Generic alternative available", message: "Save ₹120 on your last prescription", severity: "low", time: "1d ago" },
  { id: "a3", title: "Dengue activity rising", message: "Use mosquito repellent and stay hydrated", severity: "medium", time: "3h ago" },
];

export const purchases: Purchase[] = [
  { id: "p1", date: "2025-04-18", medicine: "Paracetamol 500mg", type: "generic", price: 12, saved: 23, pharmacy: "Apollo - Indiranagar" },
  { id: "p2", date: "2025-04-12", medicine: "Pantoprazole 40mg", type: "generic", price: 45, saved: 97, pharmacy: "MedPlus - Koramangala" },
  { id: "p3", date: "2025-04-04", medicine: "Azithromycin 500mg", type: "brand", price: 165, saved: 0, pharmacy: "1mg - HSR" },
  { id: "p4", date: "2025-03-28", medicine: "Atorvastatin 10mg", type: "generic", price: 64, saved: 134, pharmacy: "Sunrise Medicals" },
  { id: "p5", date: "2025-03-20", medicine: "Metformin 500mg", type: "generic", price: 28, saved: 60, pharmacy: "Apollo - Indiranagar" },
];
