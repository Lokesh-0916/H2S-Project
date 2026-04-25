export type Role = "store" | "patient";

export interface User {
  name: string;
  email: string;
  role: Role;
  pharmacyName?: string;
  region?: string;
  phone?: string;
  age?: number;
  gender?: string;
  address?: string;
  token?: string;   // JWT — used for authenticated API calls
}

export interface Pharmacy { id: string; name: string; type: "chain" | "local"; city: string; }
export interface Medicine {
  id: string; name: string; brand: string; generic: string;
  category: string; brandPrice: number; genericPrice: number; composition: string;
}
export interface InventoryItem {
  id: string; medicineId: string; name: string; stock: number; threshold: number;
}
export interface DiseaseReport {
  id: string; disease: string; cases: number; growth: number;
  severity: "low" | "medium" | "high"; source: string; date: string;
}
export interface Transfer {
  id: string; from: string; to: string; medicine: string; qty: number;
  urgency: "low" | "medium" | "high"; reason: string; status: "pending" | "approved" | "rejected"; date: string;
}
export interface Alert {
  id: string; title: string; message: string; severity: "low" | "medium" | "high"; time: string;
}
export interface Purchase {
  id: string; date: string; medicine: string; type: "brand" | "generic";
  price: number; saved: number; pharmacy: string;
}
