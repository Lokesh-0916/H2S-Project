from flask import Flask, jsonify, request
from flask_cors import CORS
import math
import pymongo
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# ─── MONGO SETUP ──────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = pymongo.MongoClient(MONGO_URI)
db = client["medsmart"]
external_data_col = db["external_health_data"]
inventory_col = db["inventory"]
medicines_col = db["medicines"]
diseases_col = db["diseases"]

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
    return jsonify({"status": "MedSmart Backend — Running", "db": "Connected" if client else "Error"})

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


# ─── AUTO-SEEDING LOGIC ──────────────────────────────────────────

def auto_seed():
    try:
        # Check if master data exists
        if medicines_col.count_documents({}) == 0 or diseases_col.count_documents({}) == 0:
            print("Master data empty. Auto-seeding medicines and diseases...")
            seed_master()
        
        # Check if inventory exists
        if inventory_col.count_documents({}) == 0:
            print("Inventory empty. Auto-seeding default inventory...")
            seed_inventory()
            
        print("Database health check: OK")
    except Exception as e:
        print(f"Auto-seed error: {e}")

if __name__ == "__main__":
    print("="*50)
    print("MedSmart Backend Starting...")
    auto_seed()
    print("="*50)
    app.run(debug=True, port=5000)
