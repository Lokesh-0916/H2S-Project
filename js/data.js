// ======================================================
// MOCK DATA - Smart Healthcare Supply & Secure Retail
// ======================================================

const MOCK_DATA = {

  // --- Mock Store Accounts ---
  storeAccounts: [
    { id: 'PH001', name: 'MedPlus - Koramangala', pin: '1234', pharmacyId: 'PH001' },
    { id: 'PH002', name: 'Apollo Pharmacy - HSR',  pin: '5678', pharmacyId: 'PH002' },
    { id: 'PH003', name: 'Jan Aushadhi - Indiranagar', pin: '9012', pharmacyId: 'PH003' },
  ],

  // --- Generic Medicine Database ---
  genericMap: [
    { brand: "Crocin", generic: "Paracetamol", salt: "Paracetamol 500mg", brandPrice: 50, genericPrice: 15, brandMfr: "GSK", genericMfr: "Jan Aushadhi" },
    { brand: "Disprin", generic: "Aspirin", salt: "Aspirin 350mg", brandPrice: 40, genericPrice: 10, brandMfr: "Bayer", genericMfr: "Jan Aushadhi" },
    { brand: "Combiflam", generic: "Ibuprofen + Paracetamol", salt: "Ibuprofen 400mg + Paracetamol 325mg", brandPrice: 75, genericPrice: 22, brandMfr: "Sanofi", genericMfr: "Jan Aushadhi" },
    { brand: "Dolo 650", generic: "Paracetamol 650mg", salt: "Paracetamol 650mg", brandPrice: 65, genericPrice: 18, brandMfr: "Micro Labs", genericMfr: "Jan Aushadhi" },
    { brand: "Mox 500", generic: "Amoxicillin", salt: "Amoxicillin 500mg", brandPrice: 120, genericPrice: 35, brandMfr: "Ranbaxy", genericMfr: "Jan Aushadhi" },
    { brand: "Augmentin", generic: "Amoxicillin + Clavulanate", salt: "Amoxicillin 625mg", brandPrice: 240, genericPrice: 65, brandMfr: "GSK", genericMfr: "Jan Aushadhi" },
    { brand: "Cetrizine", generic: "Cetirizine HCl", salt: "Cetirizine 10mg", brandPrice: 55, genericPrice: 12, brandMfr: "UCB", genericMfr: "Jan Aushadhi" },
    { brand: "Allegra", generic: "Fexofenadine", salt: "Fexofenadine 120mg", brandPrice: 130, genericPrice: 38, brandMfr: "Sanofi", genericMfr: "Jan Aushadhi" },
    { brand: "Pantop 40", generic: "Pantoprazole", salt: "Pantoprazole 40mg", brandPrice: 95, genericPrice: 25, brandMfr: "Aristo", genericMfr: "Jan Aushadhi" },
    { brand: "Omez", generic: "Omeprazole", salt: "Omeprazole 20mg", brandPrice: 80, genericPrice: 18, brandMfr: "Dr. Reddy's", genericMfr: "Jan Aushadhi" },
    { brand: "Azithral", generic: "Azithromycin", salt: "Azithromycin 500mg", brandPrice: 160, genericPrice: 42, brandMfr: "Alembic", genericMfr: "Jan Aushadhi" },
    { brand: "Metformin SR", generic: "Metformin", salt: "Metformin 500mg SR", brandPrice: 90, genericPrice: 20, brandMfr: "Sun Pharma", genericMfr: "Jan Aushadhi" },
    { brand: "Ecosprin", generic: "Aspirin Low Dose", salt: "Aspirin 75mg", brandPrice: 45, genericPrice: 8, brandMfr: "USV", genericMfr: "Jan Aushadhi" },
    { brand: "Atorva 10", generic: "Atorvastatin", salt: "Atorvastatin 10mg", brandPrice: 110, genericPrice: 28, brandMfr: "Zydus", genericMfr: "Jan Aushadhi" },
    { brand: "Clavam 625", generic: "Co-Amoxiclav", salt: "Amoxicillin 500mg + Clavulanate 125mg", brandPrice: 195, genericPrice: 55, brandMfr: "Alkem", genericMfr: "Jan Aushadhi" },
  ],

  // --- Disease to Medicine Demand Mapping ---
  diseaseDemandMap: {
    "Dengue": {
      medicines: ["Paracetamol", "ORS Sachets", "Platelet Boosters", "Vitamin C"],
      demandMultiplier: 3.5,
      criticalStock: 500,
      icon: "🦟"
    },
    "Flu/Influenza": {
      medicines: ["Paracetamol", "Azithromycin", "Cetirizine", "Oseltamivir"],
      demandMultiplier: 2.8,
      criticalStock: 400,
      icon: "🤧"
    },
    "Malaria": {
      medicines: ["Chloroquine", "Artemether", "Paracetamol", "ORS Sachets"],
      demandMultiplier: 2.5,
      criticalStock: 300,
      icon: "🦠"
    },
    "COVID-19": {
      medicines: ["Paracetamol", "Azithromycin", "Vitamin D3", "Zinc", "Ivermectin"],
      demandMultiplier: 4.0,
      criticalStock: 600,
      icon: "😷"
    },
    "Cholera": {
      medicines: ["ORS Sachets", "Doxycycline", "Zinc", "IV Fluids"],
      demandMultiplier: 3.0,
      criticalStock: 450,
      icon: "💧"
    },
    "Typhoid": {
      medicines: ["Ciprofloxacin", "Azithromycin", "Paracetamol", "ORS Sachets"],
      demandMultiplier: 2.2,
      criticalStock: 250,
      icon: "🌡️"
    }
  },

  // --- Pharmacy Inventory ---
  pharmacies: [
    {
      id: "PH001",
      name: "MedPlus - Koramangala",
      location: "Bengaluru",
      lat: 12.9352, lng: 77.6245,
      inventory: [
        { medicine: "Paracetamol", stock: 850, threshold: 300, price: 15 },
        { medicine: "Azithromycin", stock: 120, threshold: 100, price: 42 },
        { medicine: "Cetirizine", stock: 45, threshold: 80, price: 12 },
        { medicine: "ORS Sachets", stock: 22, threshold: 200, price: 8 },
        { medicine: "Omeprazole", stock: 310, threshold: 150, price: 18 },
        { medicine: "Amoxicillin", stock: 200, threshold: 120, price: 35 },
      ]
    },
    {
      id: "PH002",
      name: "Apollo Pharmacy - HSR",
      location: "Bengaluru",
      lat: 12.9116, lng: 77.6389,
      inventory: [
        { medicine: "Paracetamol", stock: 50, threshold: 300, price: 15 },
        { medicine: "Azithromycin", stock: 30, threshold: 100, price: 42 },
        { medicine: "Cetirizine", stock: 280, threshold: 80, price: 12 },
        { medicine: "ORS Sachets", stock: 15, threshold: 200, price: 8 },
        { medicine: "Omeprazole", stock: 90, threshold: 150, price: 18 },
        { medicine: "Amoxicillin", stock: 65, threshold: 120, price: 35 },
      ]
    },
    {
      id: "PH003",
      name: "Jan Aushadhi - Indiranagar",
      location: "Bengaluru",
      lat: 12.9784, lng: 77.6408,
      inventory: [
        { medicine: "Paracetamol", stock: 1200, threshold: 300, price: 15 },
        { medicine: "Azithromycin", stock: 85, threshold: 100, price: 42 },
        { medicine: "Cetirizine", stock: 190, threshold: 80, price: 12 },
        { medicine: "ORS Sachets", stock: 350, threshold: 200, price: 8 },
        { medicine: "Omeprazole", stock: 25, threshold: 150, price: 18 },
        { medicine: "Amoxicillin", stock: 180, threshold: 120, price: 35 },
      ]
    }
  ],

  // --- Mock QR Codes ---
  qrCodes: {
    valid: [
      { code: "UPI://pay?pa=medplus@oksbi&pn=MedPlus&am=450&cu=INR&tn=Medicine", merchant: "MedPlus Pharmacy", amount: 450, upiId: "medplus@oksbi", verified: true },
      { code: "UPI://pay?pa=apollo@okaxis&pn=Apollo+Pharmacy&am=320&cu=INR&tn=Medicine", merchant: "Apollo Pharmacy", amount: 320, upiId: "apollo@okaxis", verified: true },
      { code: "UPI://pay?pa=janaushadhi@okicici&pn=Jan+Aushadhi&am=85&cu=INR&tn=Generic+Medicines", merchant: "Jan Aushadhi Store", amount: 85, upiId: "janaushadhi@okicici", verified: true },
    ],
    fraud: [
      { code: "UPI://pay?pa=med-p1us@fakebank&pn=MedPlus&am=450&cu=INR", alert: "Lookalike merchant ID detected", risk: "HIGH" },
      { code: "UPI://pay?pa=0000000@upi&pn=Unknown&am=99999", alert: "Invalid UPI merchant registration", risk: "CRITICAL" },
      { code: "UPI://pay?pa=apollo_pharma@ok&pn=Apollo&am=320", alert: "Unregistered merchant domain", risk: "HIGH" },
    ]
  },

  // --- Disease Trend History (Simulated) ---
  diseaseTrend: {
    labels: ["10 Apr", "11 Apr", "12 Apr", "13 Apr", "14 Apr", "15 Apr", "16 Apr"],
    datasets: {
      "Dengue":   [12, 18, 34, 52, 78, 110, 145],
      "Flu":      [30, 35, 38, 55, 72, 88, 102],
      "Malaria":  [5, 8, 10, 9, 14, 20, 28],
      "Typhoid":  [3, 3, 5, 7, 8, 10, 12],
    }
  },

  // --- Alerts Feed ---
  alerts: [
    { type: "critical", icon: "🚨", msg: "ORS Sachets critically low at Apollo HSR (15 units left)", time: "2 min ago" },
    { type: "warning",  icon: "⚠️",  msg: "Dengue cases rising in Koramangala — stock Paracetamol", time: "15 min ago" },
    { type: "info",     icon: "ℹ️",  msg: "Redistribution suggested: Transfer 400 Paracetamol from Jan Aushadhi to Apollo HSR", time: "1 hr ago" },
    { type: "fraud",    icon: "🔐", msg: "Fraudulent QR attempt blocked at MedPlus Koramangala", time: "3 hr ago" },
    { type: "success",  icon: "✅", msg: "Stock replenishment completed at MedPlus Koramangala", time: "5 hr ago" },
  ],

  // --- Summary Stats ---
  stats: {
    totalPharmacies: 3,
    criticalAlerts: 4,
    qrBlocked: 12,
    patientsSaved: 847,
    moneySaved: 124500
  },

  // --- Transfer Requests ---
  transferRequests: [
    {
      id: 'TR001',
      fromPharmacy: 'PH003',
      fromName: 'Jan Aushadhi - Indiranagar',
      toPharmacy: 'PH002',
      toName: 'Apollo Pharmacy - HSR',
      medicine: 'Paracetamol',
      quantity: 400,
      urgency: 'critical',
      status: 'pending',
      reason: 'Apollo HSR has only 50 units vs threshold of 300. Dengue outbreak in HSR area.',
      requestedBy: 'System (Auto)',
      requestedAt: '2026-04-18T08:30:00',
    },
    {
      id: 'TR002',
      fromPharmacy: 'PH003',
      fromName: 'Jan Aushadhi - Indiranagar',
      toPharmacy: 'PH002',
      toName: 'Apollo Pharmacy - HSR',
      medicine: 'ORS Sachets',
      quantity: 150,
      urgency: 'critical',
      status: 'pending',
      reason: 'ORS Sachets critically low at Apollo HSR (15 units). Cholera advisory in effect.',
      requestedBy: 'Apollo - HSR',
      requestedAt: '2026-04-18T09:15:00',
    },
    {
      id: 'TR003',
      fromPharmacy: 'PH002',
      fromName: 'Apollo Pharmacy - HSR',
      toPharmacy: 'PH001',
      toName: 'MedPlus - Koramangala',
      medicine: 'Cetirizine',
      quantity: 100,
      urgency: 'medium',
      status: 'approved',
      reason: 'Apollo HSR has surplus Cetirizine (280 units). MedPlus Koramangala running low (45 units).',
      requestedBy: 'MedPlus - Koramangala',
      requestedAt: '2026-04-18T07:00:00',
    },
    {
      id: 'TR004',
      fromPharmacy: 'PH001',
      fromName: 'MedPlus - Koramangala',
      toPharmacy: 'PH002',
      toName: 'Apollo Pharmacy - HSR',
      medicine: 'Amoxicillin',
      quantity: 80,
      urgency: 'low',
      status: 'rejected',
      reason: 'Preventive restock before monsoon season.',
      requestedBy: 'MedPlus - Koramangala',
      requestedAt: '2026-04-17T14:00:00',
    },
  ],

  // --- Weekly Purchase Trends (per pharmacy) ---
  purchaseTrends: {
    'PH001': {
      weeklyData: {
        'Paracetamol':  [120, 145, 180, 210, 265, 310, 380],
        'ORS Sachets':  [30, 35, 42, 58, 90, 145, 210],
        'Azithromycin': [18, 20, 24, 28, 35, 40, 48],
        'Cetirizine':   [25, 28, 32, 45, 60, 75, 95],
        'Omeprazole':   [40, 42, 45, 44, 46, 48, 50],
        'Amoxicillin':  [22, 25, 28, 30, 35, 38, 42],
      },
      labels: ['10 Apr', '11 Apr', '12 Apr', '13 Apr', '14 Apr', '15 Apr', '16 Apr'],
    },
    'PH002': {
      weeklyData: {
        'Paracetamol':  [90, 110, 135, 160, 200, 250, 320],
        'ORS Sachets':  [20, 25, 30, 45, 70, 110, 160],
        'Azithromycin': [12, 15, 18, 22, 28, 33, 40],
        'Cetirizine':   [15, 18, 20, 28, 38, 48, 60],
        'Omeprazole':   [28, 30, 32, 31, 33, 35, 37],
        'Amoxicillin':  [15, 17, 20, 22, 25, 28, 32],
      },
      labels: ['10 Apr', '11 Apr', '12 Apr', '13 Apr', '14 Apr', '15 Apr', '16 Apr'],
    },
    'PH003': {
      weeklyData: {
        'Paracetamol':  [150, 175, 220, 270, 340, 410, 495],
        'ORS Sachets':  [40, 48, 58, 75, 115, 175, 250],
        'Azithromycin': [22, 26, 30, 36, 44, 50, 58],
        'Cetirizine':   [30, 35, 40, 55, 72, 90, 115],
        'Omeprazole':   [50, 52, 55, 54, 58, 60, 62],
        'Amoxicillin':  [28, 32, 36, 40, 46, 52, 58],
      },
      labels: ['10 Apr', '11 Apr', '12 Apr', '13 Apr', '14 Apr', '15 Apr', '16 Apr'],
    },
  },

  // --- User Purchase History (Patient) ---
  userPurchaseHistory: [
    { date: '2026-04-16', medicine: 'Paracetamol 500mg', brand: 'Crocin', generic: true, price: 15, pharmacy: 'MedPlus - Koramangala', saved: 35 },
    { date: '2026-04-14', medicine: 'Cetirizine 10mg', brand: 'Cetrizine', generic: true, price: 12, pharmacy: 'Apollo Pharmacy - HSR', saved: 43 },
    { date: '2026-04-10', medicine: 'Omeprazole 20mg', brand: 'Omez', generic: true, price: 18, pharmacy: 'Jan Aushadhi - Indiranagar', saved: 62 },
    { date: '2026-04-05', medicine: 'Azithromycin 500mg', brand: 'Azithral', generic: false, price: 160, pharmacy: 'MedPlus - Koramangala', saved: 0 },
    { date: '2026-03-28', medicine: 'ORS Sachets', brand: 'Electrol', generic: true, price: 8, pharmacy: 'Apollo Pharmacy - HSR', saved: 22 },
  ],

  // --- Health Alerts for Users ---
  userHealthAlerts: [
    { type: 'warning', icon: '🦟', title: 'Dengue Alert — Your Area', msg: 'Dengue cases rising in Koramangala. Use mosquito repellent. Stay hydrated.', time: '2 hours ago', action: 'Stock Paracetamol & ORS' },
    { type: 'info', icon: '🤧', title: 'Flu Season Advisory', msg: 'Flu cases increasing. Wash hands frequently. Consider flu vaccination.', time: '1 day ago', action: 'Find Nearest Clinic' },
    { type: 'success', icon: '✅', title: 'Generic Savings Tip', msg: 'You saved ₹162 this month by choosing generic medicines. Great choice!', time: '3 days ago', action: 'Find More Generics' },
  ],
};
