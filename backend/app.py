from flask import Flask, jsonify, request
from flask_cors import CORS
import math
import pymongo
import requests
import os
import time
from datetime import datetime, timedelta
import xml.etree.ElementTree as ET
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {
    "origins": "*",
    "allow_headers": ["Content-Type", "Authorization"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "expose_headers": ["Authorization"],
}})

# ─── MONGO SETUP ──────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI")  # Set in .env — must be MongoDB Atlas URI
client = pymongo.MongoClient(MONGO_URI)
db = client["medsmart"]
external_data_col = db["external_health_data"]
inventory_col     = db["inventory"]
medicines_col     = db["medicines"]
diseases_col      = db["diseases"]
purchases_col     = db["purchases"]
patient_alerts_col= db["patient_alerts"]

# ─── LIVE DISEASE DATA CACHE ──────────────────────────────────────
LIVE_DISEASE_CACHE = {
    "ts": 0.0,
    "reports": [],
    "trend": [],
}
LIVE_DISEASE_TTL_SEC = 120  # refresh every 2 minutes max

# ─── MASTER DATA (Initial Lists for Seeding) ──────────────────────
GENERIC_MAP = [
    {"brand": "Crocin",      "generic": "Paracetamol",              "salt": "Paracetamol 500mg",                    "brandPrice": 50,  "genericPrice": 15, "category": "Analgesic",      "composition": "Paracetamol 500mg"},
    {"brand": "Disprin",     "generic": "Aspirin",                  "salt": "Aspirin 350mg",                        "brandPrice": 40,  "genericPrice": 10, "category": "Analgesic",      "composition": "Aspirin 350mg"},
    {"brand": "Combiflam",   "generic": "Ibuprofen + Paracetamol",  "salt": "Ibuprofen 400mg + Paracetamol 325mg",  "brandPrice": 75,  "genericPrice": 22, "category": "Analgesic",      "composition": "Ibuprofen 400mg + Paracetamol 325mg"},
    {"brand": "Dolo 650",    "generic": "Paracetamol 650mg",        "salt": "Paracetamol 650mg",                    "brandPrice": 65,  "genericPrice": 18, "category": "Analgesic",      "composition": "Paracetamol 650mg"},
    {"brand": "Mox 500",     "generic": "Amoxicillin",              "salt": "Amoxicillin 500mg",                    "brandPrice": 120, "genericPrice": 35, "category": "Antibiotic",     "composition": "Amoxicillin 500mg"},
    {"brand": "Augmentin",   "generic": "Amoxicillin + Clavulanate","salt": "Amoxicillin 625mg",                    "brandPrice": 240, "genericPrice": 65, "category": "Antibiotic",     "composition": "Amoxicillin 500mg + Clavulanate 125mg"},
    {"brand": "Cetrizine",   "generic": "Cetirizine HCl",           "salt": "Cetirizine 10mg",                      "brandPrice": 55,  "genericPrice": 12, "category": "Antihistamine",  "composition": "Cetirizine Hydrochloride 10mg"},
    {"brand": "Allegra",     "generic": "Fexofenadine",             "salt": "Fexofenadine 120mg",                   "brandPrice": 130, "genericPrice": 38, "category": "Antihistamine",  "composition": "Fexofenadine Hydrochloride 120mg"},
    {"brand": "Pantop 40",   "generic": "Pantoprazole",             "salt": "Pantoprazole 40mg",                    "brandPrice": 95,  "genericPrice": 25, "category": "Antacid",        "composition": "Pantoprazole Sodium 40mg"},
    {"brand": "Azithral",    "generic": "Azithromycin",             "salt": "Azithromycin 500mg",                   "brandPrice": 160, "genericPrice": 42, "category": "Antibiotic",     "composition": "Azithromycin 500mg"},
    {"brand": "Omez",        "generic": "Omeprazole",               "salt": "Omeprazole 20mg",                      "brandPrice": 80,  "genericPrice": 18, "category": "Antacid",        "composition": "Omeprazole 20mg"},
    {"brand": "Metformin",   "generic": "Metformin",                "salt": "Metformin 500mg",                      "brandPrice": 90,  "genericPrice": 20, "category": "Diabetes",       "composition": "Metformin Hydrochloride 500mg"},
    {"brand": "Ecosprin",    "generic": "Aspirin 75",               "salt": "Aspirin 75mg",                         "brandPrice": 45,  "genericPrice": 8,  "category": "Cardiac",        "composition": "Aspirin 75mg"},
    {"brand": "Atorva",      "generic": "Atorvastatin",             "salt": "Atorvastatin 10mg",                    "brandPrice": 110, "genericPrice": 28, "category": "Cardiac",        "composition": "Atorvastatin Calcium 10mg"},
    {"brand": "Clavam",      "generic": "Co-Amoxiclav",             "salt": "Amoxicillin + Clavulanate",            "brandPrice": 195, "genericPrice": 55, "category": "Antibiotic",     "composition": "Amoxicillin 875mg + Clavulanate 125mg"},
]

DISEASE_DEMAND = {
    "Dengue":       {"medicines": ["Paracetamol", "ORS Sachets", "Platelet Boosters", "Vitamin C"], "multiplier": 3.5},
    "Flu/Influenza":{"medicines": ["Paracetamol", "Azithromycin", "Cetirizine", "Oseltamivir"],     "multiplier": 2.8},
    "Malaria":      {"medicines": ["Chloroquine", "Artemether", "Paracetamol", "ORS Sachets"],       "multiplier": 2.5},
    "COVID-19":     {"medicines": ["Paracetamol", "Azithromycin", "Vitamin D3", "Zinc"],             "multiplier": 4.0},
    "Cholera":      {"medicines": ["ORS Sachets", "Doxycycline", "Zinc", "IV Fluids"],              "multiplier": 3.0},
    "Typhoid":      {"medicines": ["Ciprofloxacin", "Azithromycin", "Paracetamol", "ORS Sachets"],  "multiplier": 2.2},
}

INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
]

VALID_UPI_IDS = {"medplus@oksbi", "apollo@okaxis", "janaushadhi@okicici"}
FRAUD_PATTERNS = ["fakebank", "0000000", "med-p1us", "apollo_pharma@ok", "fake", "phish"]

# ─── ROUTES ───────────────────────────────────────────────────────

@app.route("/")
def home():
    return jsonify({"status": "PharmaLink Backend — Running", "db": "Connected" if client else "Error"})

@app.route("/api/sync", methods=["POST"])
def sync_data():
    try:
        import random
        # 1. WHO Data (Simulated for brevity)
        countries = ["India", "USA", "UK", "Canada", "Australia", "Japan", "Germany", "France", "Brazil", "South Africa"]
        who_processed = []
        for country in countries:
            who_processed.append({
                "country": country,
                "year": 2024,
                "value": random.uniform(65.0, 85.0)
            })
        
        # 2. India Gov Data (Comprehensive Outbreak Generation for ALL States)
        gov_data = []
        diseases = list(DISEASE_DEMAND.keys())
        for state in INDIAN_STATES:
            # Pick a random disease and case count for each state
            disease = random.choice(diseases)
            cases = random.randint(50, 2500)
            trend = random.choice(["Rising", "Stable", "Falling"])
            level = "HIGH" if cases > 1500 else "MEDIUM" if cases > 500 else "LOW"
            gov_data.append({
                "region": state, 
                "disease": disease, 
                "cases": cases, 
                "trend": trend, 
                "level": level
            })
        
        # 3. Simulated Chart Trend Data (For the top 4 diseases)
        labels = ["13 Apr", "14 Apr", "15 Apr", "16 Apr", "17 Apr", "18 Apr", "19 Apr"]
        trend_data = {"labels": labels, "datasets": {}}
        for disease in ["Dengue", "Flu", "Malaria", "Cholera"]:
            start = random.randint(50, 800)
            points = [start]
            for _ in range(6):
                points.append(points[-1] + random.randint(10, 200))
            trend_data["datasets"][disease] = points
        
        # Save to Mongo
        external_data_col.delete_many({}) # Refresh
        external_data_col.insert_one({"source": "WHO", "title": "Global Life Expectancy", "data": who_processed, "type": "stats"})
        external_data_col.insert_one({"source": "Gov.in", "title": "India-wide Outbreak Tracking", "data": gov_data, "type": "alerts"})
        external_data_col.insert_one({"source": "Gov.in", "title": "Outbreak Trends (7 Days)", "data": trend_data, "type": "chart_trends"})
        
        return jsonify({"status": "success", "message": f"Synced with WHO and Govt sources for {len(INDIAN_STATES)} regions."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/seed-master", methods=["POST"])
def seed_master():
    try:
        # Seed Medicines
        medicines_col.delete_many({})
        medicines_col.insert_many(GENERIC_MAP)
        
        # Seed Diseases
        diseases_col.delete_many({})
        disease_list = [{"name": k, **v} for k, v in DISEASE_DEMAND.items()]
        diseases_col.insert_many(disease_list)
        
        return jsonify({"status": "success", "message": "Master Data (Medicines & Diseases) seeded successfully."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/external-data", methods=["GET"])
def get_external_data():
    try:
        data = list(external_data_col.find({}, {"_id": 0}))
        return jsonify(data)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/generic-medicine", methods=["GET"])
def get_generic():
    brand = request.args.get("brand", "").strip().lower()
    # Query DB instead of hardcoded map
    match = medicines_col.find_one({
        "$or": [
            {"brand": {"$regex": brand, "$options": "i"}},
            {"generic": {"$regex": brand, "$options": "i"}}
        ]
    }, {"_id": 0})
    
    if not match:
        return jsonify({"error": "Brand not found"}), 404
    
    savings = match["brandPrice"] - match["genericPrice"]
    pct = round((savings / match["brandPrice"]) * 100)
    return jsonify({**match, "savings": savings, "savingsPct": pct})

@app.route("/api/all-generics", methods=["GET"])
def all_generics():
    try:
        result = []
        # Query DB
        meds = list(medicines_col.find({}, {"_id": 0}))
        for m in meds:
            savings = m["brandPrice"] - m["genericPrice"]
            result.append({**m, "savings": savings, "savingsPct": round((savings/m["brandPrice"])*100)})
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/diseases", methods=["GET"])
def get_all_diseases():
    try:
        data = list(diseases_col.find({}, {"_id": 0}))
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── INVENTORY ENDPOINTS ──────────────────────────────────────────

@app.route("/api/seed-inventory", methods=["POST"])
def seed_inventory():
    try:
        inventory_col.delete_many({})
        pharmacies = ["PH001", "PH002", "PH003"]
        import random
        # Use medicines from DB if available, else fallback to GENERIC_MAP
        meds = list(medicines_col.find({}, {"_id": 0}))
        if not meds: meds = GENERIC_MAP
        
        for ph in pharmacies:
            for med in meds:
                base_stock = random.randint(50, 500)
                inventory_col.insert_one({
                    "pharmacyId": ph,
                    "medicine": med["generic"],
                    "stock": base_stock,
                    "threshold": random.randint(50, 150),
                    "price": med["genericPrice"],
                    "sold": 0,
                    "transferred": 0
                })
        return jsonify({"status": "success", "message": "Inventory fully seeded using master data."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/inventory/<pharmacy_id>", methods=["GET"])
def get_inventory(pharmacy_id):
    try:
        items = list(inventory_col.find({"pharmacyId": pharmacy_id}, {"_id": 0}))
        return jsonify(items)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/inventory/sell", methods=["POST"])
def sell_inventory():
    try:
        data = request.json
        ph_id = data.get("pharmacyId")
        medicine = data.get("medicine")
        qty = int(data.get("quantity", 0))

        # Check stock first
        item = inventory_col.find_one({"pharmacyId": ph_id, "medicine": medicine})
        if not item:
            return jsonify({"status": "error", "message": "Item not found in inventory"}), 404
        
        if item["stock"] < qty:
            return jsonify({"status": "error", "message": f"Insufficient stock. Available: {item['stock']}"}), 400

        result = inventory_col.update_one(
            {"pharmacyId": ph_id, "medicine": medicine},
            {"$inc": {"stock": -qty, "sold": qty}}
        )
        return jsonify({"status": "success", "message": f"Sold {qty} units of {medicine}"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/inventory/transfer", methods=["POST"])
def transfer_inventory():
    try:
        data = request.json
        from_ph = data.get("fromPharmacy")
        to_ph = data.get("toPharmacy")
        medicine = data.get("medicine")
        qty = int(data.get("quantity", 0))

        # Check sender stock
        sender_item = inventory_col.find_one({"pharmacyId": from_ph, "medicine": medicine})
        if not sender_item:
            return jsonify({"status": "error", "message": f"Medicine {medicine} not found in sender inventory"}), 404
        
        if sender_item["stock"] < qty:
            return jsonify({"status": "error", "message": f"Insufficient stock for transfer. Available: {sender_item['stock']}"}), 400

        # Check if receiver has this medicine (if not, we should create the entry)
        receiver_item = inventory_col.find_one({"pharmacyId": to_ph, "medicine": medicine})
        
        # Deduct from sender
        inventory_col.update_one(
            {"pharmacyId": from_ph, "medicine": medicine},
            {"$inc": {"stock": -qty, "transferred": qty}}
        )
        
        # Add to receiver (UPSERT)
        if receiver_item:
            inventory_col.update_one(
                {"pharmacyId": to_ph, "medicine": medicine},
                {"$inc": {"stock": qty}}
            )
        else:
            # If receiver doesn't have this medicine yet, create it with price from sender
            inventory_col.insert_one({
                "pharmacyId": to_ph,
                "medicine": medicine,
                "stock": qty,
                "threshold": sender_item.get("threshold", 100),
                "price": sender_item.get("price", 0),
                "sold": 0,
                "transferred": 0
            })

        return jsonify({"status": "success", "message": f"Transferred {qty} units of {medicine} to {to_ph}"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/inventory/restock", methods=["POST"])
def restock_inventory():
    try:
        data = request.json
        ph_id = data.get("pharmacyId")
        medicine = data.get("medicine")
        qty = int(data.get("quantity", 0))

        result = inventory_col.update_one(
            {"pharmacyId": ph_id, "medicine": medicine},
            {"$inc": {"stock": qty}}
        )
        if result.modified_count == 0:
            return jsonify({"status": "error", "message": "Item not found"}), 404
        return jsonify({"status": "success", "message": f"Restocked {qty} units of {medicine}"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500



@app.route("/api/predict-demand", methods=["POST"])
def predict_demand():
    data = request.json
    disease_name = data.get("disease", "")
    cases = int(data.get("cases", 0))
    growth_rate = float(data.get("growthRate", 30)) / 100
    days = int(data.get("days", 7))

    # Query DB for disease demand profile
    dd = diseases_col.find_one({"name": disease_name}, {"_id": 0})
    if not dd:
        return jsonify({"error": f"Unknown disease: {disease_name}"}), 400

    predicted_cases = math.floor(cases * ((1 + growth_rate) ** days))
    base_units = math.ceil(predicted_cases * dd["multiplier"])

    predictions = []
    for i, med in enumerate(dd["medicines"]):
        units = math.ceil(base_units * (1 - i * 0.15))
        predictions.append({"medicine": med, "unitsNeeded": units, "priority": i + 1})

    risk = "HIGH" if predicted_cases > 300 else "MEDIUM" if predicted_cases > 150 else "LOW"
    return jsonify({
        "disease": disease_name,
        "currentCases": cases,
        "predictedCases": predicted_cases,
        "forecastDays": days,
        "riskLevel": risk,
        "predictions": predictions
    })

@app.route("/api/check-qr", methods=["POST"])
def check_qr():
    data = request.json
    code = data.get("qrCode", "").strip()

    if not code:
        return jsonify({"safe": False, "alert": "Empty QR code", "risk": "HIGH"})

    for pattern in FRAUD_PATTERNS:
        if pattern in code.lower():
            return jsonify({"safe": False, "alert": "Fraudulent pattern detected", "risk": "CRITICAL"})

    import re
    pa_match = re.search(r'pa=([^&]+)', code)
    am_match = re.search(r'am=([^&]+)', code)
    pn_match = re.search(r'pn=([^&]+)', code)

    if not pa_match:
        return jsonify({"safe": False, "alert": "Invalid QR format", "risk": "HIGH"})

    upi_id = pa_match.group(1)
    amount = int(am_match.group(1)) if am_match else 0
    merchant = pn_match.group(1).replace("+", " ") if pn_match else "Unknown"

    if amount > 10000:
        return jsonify({"safe": False, "alert": f"Suspicious amount: ₹{amount:,}", "risk": "HIGH", "upiId": upi_id, "merchant": merchant})

    if upi_id not in VALID_UPI_IDS:
        return jsonify({"safe": False, "alert": "Unverified Merchant", "risk": "MEDIUM", "upiId": upi_id, "merchant": merchant})

    return jsonify({"safe": True, "upiId": upi_id, "merchant": merchant, "amount": amount, "risk": "LOW"})

@app.route("/api/stock-alerts", methods=["GET"])
def stock_alerts():
    try:
        ph_names = {
            "PH001": "MedPlus - Koramangala",
            "PH002": "Apollo Pharmacy - HSR",
            "PH003": "Jan Aushadhi - Indiranagar"
        }

        # Query inventory for all items where stock is below threshold
        low_items = list(inventory_col.find(
            {"$expr": {"$lt": ["$stock", "$threshold"]}},
            {"_id": 0}
        ))

        alerts = []
        for item in low_items:
            ratio = item["stock"] / item["threshold"] if item["threshold"] > 0 else 1
            if ratio < 0.3:
                severity = "CRITICAL"
            elif ratio < 0.6:
                severity = "MEDIUM"
            else:
                severity = "LOW"

            alerts.append({
                "pharmacyId": item["pharmacyId"],
                "pharmacy":   ph_names.get(item["pharmacyId"], item["pharmacyId"]),
                "medicine":   item["medicine"],
                "stock":      item["stock"],
                "threshold":  item["threshold"],
                "severity":   severity
            })

        # Sort: CRITICAL first, then MEDIUM, then LOW
        order = {"CRITICAL": 0, "MEDIUM": 1, "LOW": 2}
        alerts.sort(key=lambda x: order.get(x["severity"], 3))

        return jsonify({"alerts": alerts, "total": len(alerts)})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/redistribution", methods=["GET"])
def redistribution():
    try:
        # 1. Fetch all inventory
        all_items = list(inventory_col.find({}, {"_id": 0}))
        
        # 2. Get all pharmacy names/IDs for labeling
        # For simplicity in this demo, we'll use a mapping or just the IDs
        ph_names = {
            "PH001": "MedPlus - Koramangala",
            "PH002": "Apollo Pharmacy - HSR",
            "PH003": "Jan Aushadhi - Indiranagar"
        }
        
        suggestions = []
        # Group by medicine
        meds = set(item["medicine"] for item in all_items)
        
        for med in meds:
            med_items = [i for i in all_items if i["medicine"] == med]
            
            # Find Surplus stores (stock > threshold * 1.2)
            surplus = [i for i in med_items if i["stock"] > i["threshold"] * 1.2]
            # Find Shortage stores (stock < threshold)
            shortage = [i for i in med_items if i["stock"] < i["threshold"]]
            
            # Simple matching: Send from biggest surplus to biggest shortage
            surplus.sort(key=lambda x: x["stock"] - x["threshold"], reverse=True)
            shortage.sort(key=lambda x: x["stock"] / x["threshold"])
            
            if surplus and shortage:
                s_ph = surplus[0]
                r_ph = shortage[0]
                
                # Recommended quantity: half of the surplus or enough to hit threshold
                can_give = s_ph["stock"] - s_ph["threshold"]
                needs = r_ph["threshold"] - r_ph["stock"]
                qty = min(can_give, needs)
                
                if qty > 0:
                    suggestions.append({
                        "fromId": s_ph["pharmacyId"],
                        "fromName": ph_names.get(s_ph["pharmacyId"], s_ph["pharmacyId"]),
                        "toId": r_ph["pharmacyId"],
                        "toName": ph_names.get(r_ph["pharmacyId"], r_ph["pharmacyId"]),
                        "medicine": med,
                        "quantity": int(qty),
                        "surplus": s_ph["stock"],
                        "current": r_ph["stock"],
                        "threshold": r_ph["threshold"],
                        "urgency": "URGENT" if r_ph["stock"] < r_ph["threshold"] * 0.3 else "MODERATE"
                    })
        
        return jsonify({"suggestions": suggestions})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ─── CHART & ANALYTICS ENDPOINTS ────────────────────────────────

@app.route("/api/trend-data", methods=["GET"])
def get_trend_data():
    """Returns 7-day outbreak trend formatted for recharts LineChart."""
    try:
        doc = external_data_col.find_one({"type": "chart_trends"}, {"_id": 0})
        if not doc:
            return jsonify([]), 200
        labels   = doc["data"]["labels"]
        datasets = doc["data"]["datasets"]
        result = []
        for i, label in enumerate(labels):
            point = {"day": label}
            for disease, values in datasets.items():
                point[disease.lower().replace("/", "_")] = values[i] if i < len(values) else 0
            result.append(point)
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/demand-distribution", methods=["GET"])
def demand_distribution():
    """Computes medicine category demand distribution from inventory."""
    try:
        CATEGORY_COLORS = {
            "Antibiotic":    "var(--brand)",
            "Analgesic":     "var(--teal)",
            "Antacid":       "var(--amber)",
            "Diabetes":      "var(--info)",
            "Antihistamine": "var(--success)",
            "Cardiac":       "#a78bfa",
        }
        # Group inventory sold by medicine category
        all_inv  = list(inventory_col.find({}, {"_id": 0, "medicine": 1, "sold": 1}))
        all_meds = {m["generic"]: m.get("category", "Other") for m in medicines_col.find({}, {"_id": 0})}

        cat_totals: dict = {}
        for item in all_inv:
            cat = all_meds.get(item["medicine"], "Other")
            cat_totals[cat] = cat_totals.get(cat, 0) + max(item.get("sold", 0), 1)

        total = sum(cat_totals.values()) or 1
        result = [
            {"name": cat, "value": round((v / total) * 100), "color": CATEGORY_COLORS.get(cat, "#94a3b8")}
            for cat, v in sorted(cat_totals.items(), key=lambda x: -x[1])
        ]
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/adoption-stats", methods=["GET"])
def adoption_stats():
    """Computes generic vs brand adoption ratio from purchase history."""
    try:
        total   = purchases_col.count_documents({})
        generic = purchases_col.count_documents({"type": "generic"})
        brand   = total - generic
        if total == 0:
            return jsonify([{"name": "Generic", "value": 62, "color": "var(--brand)"},
                            {"name": "Brand",   "value": 38, "color": "var(--amber)"}])
        return jsonify([
            {"name": "Generic", "value": round((generic / total) * 100), "color": "var(--brand)"},
            {"name": "Brand",   "value": round((brand   / total) * 100), "color": "var(--amber)"},
        ])
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/platform-stats", methods=["GET"])
def platform_stats():
    """Returns aggregate platform stats for the dashboard."""
    try:
        pharmacy_count = len(inventory_col.distinct("pharmacyId"))
        critical_alerts = inventory_col.count_documents(
            {"$expr": {"$lt": [{"$divide": ["$stock", "$threshold"]}, 0.3]}}
        )
        total_purchases = purchases_col.count_documents({})
        return jsonify({
            "pharmacies": pharmacy_count,
            "criticalAlerts": critical_alerts,
            "totalPurchases": total_purchases,
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ─── PATIENT ALERTS & DISEASE REPORTS ───────────────────────────

@app.route("/api/patient-alerts", methods=["GET"])
def get_patient_alerts():
    """Returns health alerts for patients (from patient_alerts collection)."""
    try:
        alerts = list(patient_alerts_col.find({}, {"_id": 0}).sort("severity", 1).limit(10))
        return jsonify(alerts)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/disease-reports", methods=["GET"])
def get_disease_reports():
    """Returns regional disease outbreak reports from external_health_data."""
    try:
        doc = external_data_col.find_one({"type": "alerts"}, {"_id": 0})
        if not doc:
            return jsonify([])
        import random
        regions = doc["data"][:8]  # Top 8 regions
        result = []
        for i, r in enumerate(regions):
            sev = "high" if r["level"] == "HIGH" else "medium" if r["level"] == "MEDIUM" else "low"
            result.append({
                "id": f"dr{i+1}",
                "disease": r["disease"],
                "cases": r["cases"],
                "growth": random.randint(4, 28),
                "severity": sev,
                "source": f"Gov.in — {r['region']}",
                "date": "2025-04-21",
                "trend": r["trend"]
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def _to_severity(score: int) -> str:
    if score >= 20000:
        return "high"
    if score >= 3000:
        return "medium"
    return "low"


def _fetch_live_disease_payload():
    """
    Fetches Bengaluru-zone, multi-disease live signals from news mentions.
    Note: this is outbreak/activity intelligence, not clinical case registry data.
    """
    disease_patterns = {
        "flu": ["influenza", "flu", "h1n1", "avian influenza"],
        "dengue": ["dengue"],
        "malaria": ["malaria"],
        "cholera": ["cholera"],
        "typhoid": ["typhoid"],
        "measles": ["measles"],
        "tb": ["tuberculosis", "tb "],
        "hepatitis": ["hepatitis"],
        "cold": ["common cold", "cold virus", "rhinovirus"],
        "covid": ["covid", "sars-cov-2", "coronavirus"],
    }

    display_name = {
        "covid": "COVID-19",
        "flu": "Influenza/Flu",
        "dengue": "Dengue",
        "malaria": "Malaria",
        "cholera": "Cholera",
        "typhoid": "Typhoid",
        "measles": "Measles",
        "tb": "Tuberculosis",
        "hepatitis": "Hepatitis",
        "cold": "Common Cold",
    }

    # --------- 1) Bengaluru-zone News RSS for multiple diseases ---------
    today = datetime.utcnow().date()
    days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    day_labels = [d.strftime("%d %b") for d in days]
    label_to_date = {d.strftime("%d %b"): d for d in days}

    # mentions[disease_key][label] = count
    mentions = {
        k: {label: 0 for label in day_labels}
        for k in disease_patterns.keys()
    }

    def _fetch_mentions_for_disease(d_key: str, terms: list[str]):
        # Geo-focus to Bengaluru/Karnataka for "zone" level signal
        geo = "(Bengaluru OR Bangalore OR Karnataka)"
        query = requests.utils.quote(f"({' OR '.join(terms)}) {geo} when:7d")
        url = f"https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"
        r = requests.get(url, timeout=12)
        r.raise_for_status()
        root = ET.fromstring(r.text)
        for item in root.findall(".//item"):
            pub = (item.findtext("pubDate") or "").strip()
            try:
                pub_dt = datetime.strptime(pub, "%a, %d %b %Y %H:%M:%S %Z").date()
            except Exception:
                continue
            label = pub_dt.strftime("%d %b")
            if label in mentions[d_key]:
                mentions[d_key][label] += 1

    for d_key, terms in disease_patterns.items():
        try:
            _fetch_mentions_for_disease(d_key, terms)
        except Exception:
            # Keep zeros if an upstream disease feed temporarily fails
            continue

    # --------- 2) Unified trend for frontend line chart ---------
    trend = []
    for d in days:
        label = d.strftime("%d %b")
        trend.append({
            "day": label,
            "covid": mentions["covid"][label],
            "flu": mentions["flu"][label],
            "dengue": mentions["dengue"][label],
            "malaria": mentions["malaria"][label],
            "cholera": mentions["cholera"][label],
            "typhoid": mentions["typhoid"][label],
            "cold": mentions["cold"][label],
        })

    # --------- 3) Unified reports cards ---------
    mention_scores = {
        k: sum(v.values())
        for k, v in mentions.items()
    }

    top_mention_diseases = sorted(mention_scores.items(), key=lambda x: x[1], reverse=True)[:8]
    reports = []
    for i, (d_key, score) in enumerate(top_mention_diseases, start=1):
        # "growth" as last-day mentions compared to avg previous 6 days
        last_day = mentions[d_key][day_labels[-1]]
        prev = [mentions[d_key][lbl] for lbl in day_labels[:-1]]
        prev_avg = (sum(prev) / len(prev)) if prev else 0
        growth_pct = int(((last_day - prev_avg) / (prev_avg or 1)) * 100)
        reports.append({
            "id": f"live-{d_key}-{i}",
            "disease": display_name.get(d_key, d_key.title()),
            "cases": int(score),
            "growth": growth_pct,
            "severity": "high" if score >= 12 else "medium" if score >= 5 else "low",
            "source": "Google News RSS — Bengaluru zone",
            "date": time.strftime("%Y-%m-%d"),
            "trend": "Rising" if growth_pct > 0 else "Stable",
        })

    return {"reports": reports, "trend": trend}


def _get_live_disease_data():
    now = time.time()
    if (
        LIVE_DISEASE_CACHE["reports"]
        and LIVE_DISEASE_CACHE["trend"]
        and now - LIVE_DISEASE_CACHE["ts"] < LIVE_DISEASE_TTL_SEC
    ):
        return LIVE_DISEASE_CACHE

    payload = _fetch_live_disease_payload()
    LIVE_DISEASE_CACHE["ts"] = now
    LIVE_DISEASE_CACHE["reports"] = payload["reports"]
    LIVE_DISEASE_CACHE["trend"] = payload["trend"]
    return LIVE_DISEASE_CACHE


@app.route("/api/live-disease-reports", methods=["GET"])
def live_disease_reports():
    """Returns real-world disease reports (live COVID-19 data)."""
    try:
        data = _get_live_disease_data()
        return jsonify(data["reports"])
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/live-trend-data", methods=["GET"])
def live_trend_data():
    """Returns live global 7-day trend data from disease.sh."""
    try:
        data = _get_live_disease_data()
        return jsonify(data["trend"])
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ─── PURCHASE HISTORY ────────────────────────────────────────────

def _user_id_from_token():
    """Extract userId from JWT Authorization header. Returns None if missing/invalid."""
    import jwt as pyjwt
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.split(" ", 1)[1]
    try:
        secret = os.getenv("JWT_SECRET", "pharmalink_secret_key_2024")
        payload = pyjwt.decode(token, secret, algorithms=["HS256"])
        return str(payload.get("userId") or payload.get("id") or "")
    except Exception:
        return None


@app.route("/api/purchases", methods=["GET"])
def get_purchases():
    """Returns purchase history for the logged-in user (from JWT)."""
    try:
        user_id = _user_id_from_token()
        # Fallback: allow explicit userId param for admin/demo
        if not user_id:
            user_id = request.args.get("userId")
        if not user_id:
            return jsonify([])   # No identity — return empty, not all records
        docs = list(purchases_col.find({"userId": user_id}, {"_id": 0}).sort("date", -1).limit(50))
        return jsonify(docs)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/purchases/record", methods=["POST"])
def record_purchase():
    """Records a new purchase. userId always comes from JWT."""
    try:
        user_id = _user_id_from_token()
        if not user_id:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
        data = request.json or {}
        import datetime
        purchase = {
            "userId":   user_id,
            "medicine": data.get("medicine"),
            "type":     data.get("type", "generic"),
            "price":    data.get("price", 0),
            "saved":    data.get("saved", 0),
            "pharmacy": data.get("pharmacy", "Unknown"),
            "date":     data.get("date", datetime.date.today().isoformat()),
        }
        purchases_col.insert_one(purchase)
        return jsonify({"status": "success", "message": "Purchase recorded"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ─── AI SUGGESTIONS ──────────────────────────────────────────────

@app.route("/api/ai-suggestions", methods=["GET"])
def ai_suggestions():
    """Generates restock recommendations from low-stock items + disease demand."""
    try:
        # 1. Get low-stock items
        low_items = list(inventory_col.find(
            {"$expr": {"$lt": ["$stock", "$threshold"]}},
            {"_id": 0}
        ))
        # 2. Get outbreak data to find disease-driven demand
        outbreak_doc = external_data_col.find_one({"type": "alerts"}, {"_id": 0})
        high_outbreak = []
        if outbreak_doc:
            high_outbreak = [r["disease"] for r in outbreak_doc["data"] if r["level"] == "HIGH"]

        # 3. Get disease demand profiles
        disease_profiles = {d["name"]: d for d in diseases_col.find({}, {"_id": 0})}

        # 4. Find medicines that are low AND in high-outbreak disease demand
        demanded = set()
        for disease in set(high_outbreak):
            if disease in disease_profiles:
                demanded.update(disease_profiles[disease].get("medicines", []))

        # 5. Build suggestions
        suggestions = []
        seen = set()
        for item in sorted(low_items, key=lambda x: x["stock"] / x["threshold"]):
            med = item["medicine"]
            if med in seen:
                continue
            seen.add(med)
            ratio    = item["stock"] / item["threshold"]
            urgency  = 95 if ratio < 0.3 else 82 if ratio < 0.6 else 65
            # Boost urgency if disease-driven
            if any(med.lower() in d.lower() or d.lower() in med.lower() for d in demanded):
                urgency = min(99, urgency + 10)
            qty_needed = item["threshold"] + 50 - item["stock"]
            reason = (
                f"Stock at {round(ratio*100)}% of threshold. "
                + (f"High disease demand detected ({', '.join(high_outbreak[:2])})." if demanded else "")
            )
            suggestions.append({
                "id": len(suggestions) + 1,
                "name": med,
                "urgency": urgency,
                "qty": int(qty_needed),
                "reason": reason,
                "pharmacyId": item["pharmacyId"]
            })
            if len(suggestions) >= 5:
                break

        # 6. Summary stats
        rising_diseases = [r["disease"] for r in (outbreak_doc["data"] if outbreak_doc else []) if r["trend"] == "Rising"]
        return jsonify({
            "suggestions": suggestions,
            "stats": {
                "trend": "Rising" if rising_diseases else "Stable",
                "velocity": f"+{len(rising_diseases)}% regions",
                "criticalItems": sum(1 for i in low_items if i["stock"] / i["threshold"] < 0.3),
                "confidence": 94
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ─── GEMINI CHATBOT ──────────────────────────────────────────────

# API key chaining — tries each key; moves to next on quota/rate errors
GEMINI_KEYS = [
    os.getenv("GEMINI_API_KEY", ""),
    os.getenv("GEMINI_API_KEY_1", ""),
    os.getenv("GEMINI_API_KEY_2", ""),
    os.getenv("GEMINI_API_KEY_3", ""),
]

PHARMALINK_PUBLIC_PROMPT = """You are PharmaLink's friendly customer support assistant.

PharmaLink is a Smart Healthcare Supply Intelligence platform connecting pharmacies and patients through:
- Real-time disease monitoring and outbreak tracking
- AI-powered medicine demand forecasting (ML-based)
- Pharmacy inventory management and stock transfers
- Generic medicine discovery (find cheaper alternatives to branded medicines)

FOR PHARMACIES: Disease Monitor, AI Demand Forecast, Inventory Management, Stock Transfers, Auto-Redistribution, Analytics.
FOR PATIENTS: Health Alerts, Medicine Search (generics), Purchase History.
AUTHENTICATION: Patients use email+password. Pharmacies use PIN (Apollo/MedPlus/Jan Aushadhi) or email. Google OAuth also available.

Answer questions about PharmaLink — its purpose, features, and how to use it. Be concise, helpful, and friendly.
For unrelated questions, politely redirect to PharmaLink topics."""

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.json or {}
        messages = data.get("messages", [])
        context  = data.get("context", "public")   # public | patient | store
        ud       = data.get("userData", {})

        if not messages:
            return jsonify({"error": "No messages provided"}), 400

        # ── Build context-aware system prompt ────────────────────
        if context == "patient":
            purchases = ud.get("purchases", [])
            alerts    = ud.get("alerts", [])
            pur_lines = "\n".join(
                f"- {p.get('medicine','')} ({p.get('type','')}) ₹{p.get('price',0)}, saved ₹{p.get('saved',0)} on {p.get('date','')}"
                for p in purchases[:10]
            ) or "No purchases yet."
            alt_lines = "\n".join(
                f"- {a.get('title','')}: {a.get('message','')} (severity: {a.get('severity','')})"
                for a in alerts[:5]
            ) or "No active alerts."
            system_prompt = f"""You are PharmaLink's personal health assistant.

PATIENT PROFILE:
- Name: {ud.get('name','User')}
- Email: {ud.get('email','')}
- Age: {ud.get('age','Not set')}
- Gender: {ud.get('gender','Not set')}
- Address: {ud.get('address','Not set')}

RECENT PURCHASE HISTORY:
{pur_lines}

HEALTH ALERTS:
{alt_lines}

Help the patient with their purchase history, generic medicine alternatives, health alerts, and platform navigation.
Always remind them to consult a doctor for medical decisions. Be warm, personalized, and concise."""

        elif context == "store":
            inventory = ud.get("inventory", [])
            alerts    = ud.get("alerts", [])
            inv_lines = "\n".join(
                f"- {i.get('medicine','')}: {i.get('stock',0)} units (threshold: {i.get('threshold',0)})"
                for i in inventory[:15]
            ) or "No inventory data."
            alt_lines = "\n".join(
                f"- {a.get('medicine','')} at {a.get('pharmacy','')}: {a.get('stock',0)} units ({a.get('severity','')})"
                for a in alerts[:5]
            ) or "No critical alerts."
            system_prompt = f"""You are PharmaLink's pharmacy operations assistant.

STORE INFO:
- Store Name: {ud.get('storeName','Your Store')}
- Store ID: {ud.get('storeId','')}

CURRENT INVENTORY (top items):
{inv_lines}

STOCK ALERTS:
{alt_lines}

Help the pharmacy manager with inventory decisions, demand forecasting, stock transfers, and platform navigation.
Be professional, data-driven, and give actionable recommendations."""

        else:
            system_prompt = PHARMALINK_PUBLIC_PROMPT

        # ── Format history for Gemini ────────────────────────────
        user_message = messages[-1].get("content", "") if messages else ""
        history_contents = []
        for m in messages[:-1]:
            history_contents.append({
                "role": "user" if m.get("role") == "user" else "model",
                "parts": [{"text": m.get("content", "")}]
            })

        # ── API key chaining (new google-genai SDK) ───────────────
        last_error = None
        keys = [k.strip() for k in GEMINI_KEYS if k and k.strip()]
        if not keys:
            return jsonify({
                "error": "Missing Gemini API key. Set GEMINI_API_KEY (or _1/_2/_3) in backend .env",
                "status": "missing_api_key"
            }), 500

        for key in GEMINI_KEYS:
            if not key or not key.strip():
                continue
            try:
                from google import genai as ggenai
                from google.genai import types as gtypes

                client = ggenai.Client(api_key=key)

                chat = client.chats.create(
                    model="gemini-2.0-flash",
                    config=gtypes.GenerateContentConfig(
                        system_instruction=system_prompt,
                    ),
                    history=[
                        gtypes.Content(
                            role=h["role"],
                            parts=[gtypes.Part(text=h["parts"][0]["text"])]
                        ) for h in history_contents
                    ]
                )
                response = chat.send_message(user_message)
                return jsonify({"reply": response.text, "status": "ok"})
            except Exception as e:
                err = str(e).lower()
                if any(x in err for x in ["quota", "rate", "429", "exhausted", "limit", "resource", "invalid", "key", "permission", "403", "400", "404"]):
                    last_error = str(e)
                    continue          # try next key
                return jsonify({"error": f"AI error: {str(e)}"}), 500

        # All keys exhausted
        return jsonify({
            "error": f"All API keys failed. Last error: {last_error}",
            "status": "quota_exceeded"
        }), 429

    except ImportError:
        return jsonify({"error": "Missing SDK. Run: pip install google-genai"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── AUTO-SEEDING LOGIC ──────────────────────────────────────────

def auto_seed():
    try:
        # Master medicines + diseases
        if medicines_col.count_documents({}) == 0 or diseases_col.count_documents({}) == 0:
            print("Master data empty. Auto-seeding medicines and diseases...")
            seed_master()

        # Inventory
        if inventory_col.count_documents({}) == 0:
            print("Inventory empty. Auto-seeding default inventory...")
            seed_inventory()

        # Patient alerts — seed from outbreak data
        if patient_alerts_col.count_documents({}) == 0:
            print("Patient alerts empty. Seeding from outbreak data...")
            outbreak = external_data_col.find_one({"type": "alerts"}, {"_id": 0})
            if outbreak:
                alerts_to_seed = []
                for r in outbreak["data"][:6]:
                    sev = "high" if r["level"] == "HIGH" else "medium" if r["level"] == "MEDIUM" else "low"
                    alerts_to_seed.append({
                        "id": f"a{len(alerts_to_seed)+1}",
                        "title": f"{r['disease']} outbreak — {r['region']}",
                        "message": f"{r['cases']} cases reported. Trend: {r['trend']}.",
                        "severity": sev,
                        "time": "Updated today"
                    })
                patient_alerts_col.insert_many(alerts_to_seed)
                print(f"Seeded {len(alerts_to_seed)} patient alerts")

        # NOTE: purchases are seeded via seed_users.py with real user IDs.
        # Do NOT auto-seed demo data here — it would pollute per-user history.
        if purchases_col.count_documents({}) == 0:
            print("WARNING: purchases collection is empty. Run seed_users.py to populate.")

        print("Database health check: OK")
    except Exception as e:
        print(f"Auto-seed error: {e}")

if __name__ == "__main__":
    print("="*50)
    print("PharmaLink Backend Starting...")
    auto_seed()
    print("="*50)
    app.run(debug=True, port=5000)
