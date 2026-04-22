// ── Pre-seeded major pharmacy chains (PIN login) ──────────
const DEMO_PINS = [
  { id: 'PH001', name: 'MedPlus - Koramangala, Bengaluru',      pin: '1234', type: 'chain' },
  { id: 'PH002', name: 'Apollo Pharmacy - HSR Layout, Bengaluru', pin: '5678', type: 'chain' },
  { id: 'PH003', name: 'Jan Aushadhi - Indiranagar, Bengaluru',  pin: '9012', type: 'chain' },
];

// ── Full store list shown in dropdown ──────────────────────
const STORES_LIST = [
  // ─── Apollo Pharmacy ───
  { id: 'PH002',  name: 'Apollo Pharmacy - HSR Layout, Bengaluru',        type: 'chain',  loginMethod: 'pin',   group: 'Apollo Pharmacy' },
  { id: 'AP002',  name: 'Apollo Pharmacy - Koramangala, Bengaluru',        type: 'chain',  loginMethod: 'pin',   group: 'Apollo Pharmacy' },
  { id: 'AP003',  name: 'Apollo Pharmacy - Connaught Place, Delhi',        type: 'chain',  loginMethod: 'pin',   group: 'Apollo Pharmacy' },
  { id: 'AP004',  name: 'Apollo Pharmacy - Anna Nagar, Chennai',           type: 'chain',  loginMethod: 'pin',   group: 'Apollo Pharmacy' },
  { id: 'AP005',  name: 'Apollo Pharmacy - Banjara Hills, Hyderabad',      type: 'chain',  loginMethod: 'pin',   group: 'Apollo Pharmacy' },

  // ─── MedPlus ───
  { id: 'PH001',  name: 'MedPlus - Koramangala, Bengaluru',                type: 'chain',  loginMethod: 'pin',   group: 'MedPlus' },
  { id: 'MP002',  name: 'MedPlus - Jubilee Hills, Hyderabad',              type: 'chain',  loginMethod: 'pin',   group: 'MedPlus' },
  { id: 'MP003',  name: 'MedPlus - Salt Lake, Kolkata',                    type: 'chain',  loginMethod: 'pin',   group: 'MedPlus' },
  { id: 'MP004',  name: 'MedPlus - Vadapalani, Chennai',                   type: 'chain',  loginMethod: 'pin',   group: 'MedPlus' },
  { id: 'MP005',  name: 'MedPlus - Viman Nagar, Pune',                     type: 'chain',  loginMethod: 'pin',   group: 'MedPlus' },

  // ─── Jan Aushadhi ───
  { id: 'PH003',  name: 'Jan Aushadhi - Indiranagar, Bengaluru',           type: 'chain',  loginMethod: 'pin',   group: 'Jan Aushadhi' },
  { id: 'JA002',  name: 'Jan Aushadhi - Lajpat Nagar, Delhi',              type: 'chain',  loginMethod: 'pin',   group: 'Jan Aushadhi' },
  { id: 'JA003',  name: 'Jan Aushadhi - Andheri, Mumbai',                  type: 'chain',  loginMethod: 'pin',   group: 'Jan Aushadhi' },
  { id: 'JA004',  name: 'Jan Aushadhi - Alwarpet, Chennai',                type: 'chain',  loginMethod: 'pin',   group: 'Jan Aushadhi' },
  { id: 'JA005',  name: 'Jan Aushadhi - Sector 22, Chandigarh',            type: 'chain',  loginMethod: 'pin',   group: 'Jan Aushadhi' },

  // ─── Netmeds ───
  { id: 'NM001',  name: 'Netmeds Pharmacy - T. Nagar, Chennai',            type: 'chain',  loginMethod: 'pin',   group: 'Netmeds' },
  { id: 'NM002',  name: 'Netmeds Pharmacy - Whitefield, Bengaluru',        type: 'chain',  loginMethod: 'pin',   group: 'Netmeds' },

  // ─── 1mg ───
  { id: '1MG001', name: '1mg Store - Sector 62, Noida',                    type: 'chain',  loginMethod: 'pin',   group: '1mg' },
  { id: '1MG002', name: '1mg Store - Gurgaon Cyber Hub',                   type: 'chain',  loginMethod: 'pin',   group: '1mg' },

  // ─── PharmEasy ───
  { id: 'PE001',  name: 'PharmEasy Hub - Andheri, Mumbai',                 type: 'chain',  loginMethod: 'pin',   group: 'PharmEasy' },
  { id: 'PE002',  name: 'PharmEasy Hub - Electronic City, Bengaluru',      type: 'chain',  loginMethod: 'pin',   group: 'PharmEasy' },

  // ─── Wellness Forever ───
  { id: 'WF001',  name: 'Wellness Forever - Bandra, Mumbai',               type: 'chain',  loginMethod: 'pin',   group: 'Wellness Forever' },
  { id: 'WF002',  name: 'Wellness Forever - Kothrud, Pune',                type: 'chain',  loginMethod: 'pin',   group: 'Wellness Forever' },

  // ─── Healthkart ───
  { id: 'HK001',  name: 'Healthkart - Rajouri Garden, Delhi',              type: 'chain',  loginMethod: 'pin',   group: 'Healthkart' },
  { id: 'HK002',  name: 'Healthkart - Indiranagar, Bengaluru',             type: 'chain',  loginMethod: 'pin',   group: 'Healthkart' },

  // ─── Noble Plus Medical ───
  { id: 'NPM001', name: 'Noble Plus Medical - Nungambakkam, Chennai',      type: 'chain',  loginMethod: 'pin',   group: 'Noble Plus Medical' },

  // ─── Frank Ross Pharmacy ───
  { id: 'FR001',  name: 'Frank Ross Pharmacy - Park Street, Kolkata',      type: 'chain',  loginMethod: 'pin',   group: 'Frank Ross' },

  // ─── Fortis Pharmacy ───
  { id: 'FP001',  name: 'Fortis HealthSutra Pharmacy - Gurugram',          type: 'chain',  loginMethod: 'pin',   group: 'Fortis HealthSutra' },

  // ─── Manipal Pharmacy ───
  { id: 'MAN001', name: 'Manipal Hospital Pharmacy - Old Airport Rd, Blr', type: 'chain',  loginMethod: 'pin',   group: 'Manipal Pharmacy' },

  // ─── Sagar Drugs ───
  { id: 'SD001',  name: 'Sagar Drugs & Pharmaceuticals - Bengaluru',       type: 'chain',  loginMethod: 'pin',   group: 'Sagar Drugs' },

  // ─── Sparsh Pharmacy ───
  { id: 'SP001',  name: 'Sparsh Pharmacy - Yeshwanthpur, Bengaluru',       type: 'chain',  loginMethod: 'pin',   group: 'Sparsh Pharmacy' },

  // ─── Local / Independent (email+password after register) ───
  { id: 'LOCAL',  name: '+ Register My Local / Independent Pharmacy',      type: 'local',  loginMethod: 'register', group: '' },
];

// Add default PINs for non-demo chain entries (demo only)
STORES_LIST.forEach(store => {
  if (store.loginMethod === 'pin' && !DEMO_PINS.find(d => d.id === store.id)) {
    DEMO_PINS.push({ id: store.id, name: store.name, pin: '0000', type: 'chain' });
  }
});

module.exports = { STORES_LIST, DEMO_PINS };
