from flask import Flask, jsonify, request
from flask_cors import CORS
import math

app = Flask(__name__)
CORS(app)

# ─── MEDICINE DATABASE ─────────────────────────────────────────────
GENERIC_MAP = [
    {"brand": "Crocin",      "generic": "Paracetamol",              "salt": "Paracetamol 500mg",                    "brandPrice": 50,  "genericPrice": 15},
    {"brand": "Disprin",     "generic": "Aspirin",                  "salt": "Aspirin 350mg",                        "brandPrice": 40,  "genericPrice": 10},
    {"brand": "Combiflam",   "generic": "Ibuprofen + Paracetamol",  "salt": "Ibuprofen 400mg + Paracetamol 325mg",  "brandPrice": 75,  "genericPrice": 22},
    {"brand": "Dolo 650",    "generic": "Paracetamol 650mg",        "salt": "Paracetamol 650mg",                    "brandPrice": 65,  "genericPrice": 18},
    {"brand": "Mox 500",     "generic": "Amoxicillin",              "salt": "Amoxicillin 500mg",                    "brandPrice": 120, "genericPrice": 35},
    {"brand": "Augmentin",   "generic": "Amoxicillin + Clavulanate","salt": "Amoxicillin 625mg",                    "brandPrice": 240, "genericPrice": 65},
    {"brand": "Cetrizine",   "generic": "Cetirizine HCl",           "salt": "Cetirizine 10mg",                      "brandPrice": 55,  "genericPrice": 12},
    {"brand": "Allegra",     "generic": "Fexofenadine",             "salt": "Fexofenadine 120mg",                   "brandPrice": 130, "genericPrice": 38},
    {"brand": "Pantop 40",   "generic": "Pantoprazole",             "salt": "Pantoprazole 40mg",                    "brandPrice": 95,  "genericPrice": 25},
    {"brand": "Azithral",    "generic": "Azithromycin",             "salt": "Azithromycin 500mg",                   "brandPrice": 160, "genericPrice": 42},
]

DISEASE_DEMAND = {
    "Dengue":       {"medicines": ["Paracetamol", "ORS Sachets", "Platelet Boosters", "Vitamin C"], "multiplier": 3.5},
    "Flu/Influenza":{"medicines": ["Paracetamol", "Azithromycin", "Cetirizine", "Oseltamivir"],     "multiplier": 2.8},
    "Malaria":      {"medicines": ["Chloroquine", "Artemether", "Paracetamol", "ORS Sachets"],       "multiplier": 2.5},
    "COVID-19":     {"medicines": ["Paracetamol", "Azithromycin", "Vitamin D3", "Zinc"],             "multiplier": 4.0},
    "Cholera":      {"medicines": ["ORS Sachets", "Doxycycline", "Zinc", "IV Fluids"],              "multiplier": 3.0},
    "Typhoid":      {"medicines": ["Ciprofloxacin", "Azithromycin", "Paracetamol", "ORS Sachets"],  "multiplier": 2.2},
}

VALID_UPI_IDS = {"medplus@oksbi", "apollo@okaxis", "janaushadhi@okicici"}
FRAUD_PATTERNS = ["fakebank", "0000000", "med-p1us", "apollo_pharma@ok", "fake", "phish"]

# ─── ROUTES ───────────────────────────────────────────────────────

@app.route("/")
def home():
    return jsonify({"status": "MedSmart Backend — Running", "version": "1.0.0"})

@app.route("/api/generic-medicine", methods=["GET"])
def get_generic():
    brand = request.args.get("brand", "").strip().lower()
    match = next((m for m in GENERIC_MAP if m["brand"].lower() == brand or brand in m["brand"].lower()), None)
    if not match:
        return jsonify({"error": "Brand not found"}), 404
    savings = match["brandPrice"] - match["genericPrice"]
    pct = round((savings / match["brandPrice"]) * 100)
    return jsonify({**match, "savings": savings, "savingsPct": pct})

@app.route("/api/all-generics", methods=["GET"])
def all_generics():
    result = []
    for m in GENERIC_MAP:
        savings = m["brandPrice"] - m["genericPrice"]
        result.append({**m, "savings": savings, "savingsPct": round((savings/m["brandPrice"])*100)})
    return jsonify(result)

@app.route("/api/predict-demand", methods=["POST"])
def predict_demand():
    data = request.json
    disease = data.get("disease", "")
    cases = int(data.get("cases", 0))
    growth_rate = float(data.get("growthRate", 30)) / 100
    days = int(data.get("days", 7))

    if disease not in DISEASE_DEMAND:
        return jsonify({"error": f"Unknown disease: {disease}"}), 400

    predicted_cases = math.floor(cases * ((1 + growth_rate) ** days))
    dd = DISEASE_DEMAND[disease]
    base_units = math.ceil(predicted_cases * dd["multiplier"])

    predictions = []
    for i, med in enumerate(dd["medicines"]):
        units = math.ceil(base_units * (1 - i * 0.15))
        predictions.append({"medicine": med, "unitsNeeded": units, "priority": i + 1})

    risk = "HIGH" if predicted_cases > 300 else "MEDIUM" if predicted_cases > 150 else "LOW"
    return jsonify({
        "disease": disease,
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

    # Check fraud patterns
    for pattern in FRAUD_PATTERNS:
        if pattern in code.lower():
            return jsonify({
                "safe": False,
                "alert": f"Fraudulent pattern detected in QR code",
                "pattern": pattern,
                "risk": "CRITICAL"
            })

    # Parse UPI
    import re
    pa_match = re.search(r'pa=([^&]+)', code)
    am_match = re.search(r'am=([^&]+)', code)
    pn_match = re.search(r'pn=([^&]+)', code)

    if not pa_match:
        return jsonify({"safe": False, "alert": "Invalid QR format — missing merchant ID", "risk": "HIGH"})

    upi_id = pa_match.group(1)
    amount = int(am_match.group(1)) if am_match else 0
    merchant = pn_match.group(1).replace("+", " ") if pn_match else "Unknown"

    if amount > 10000:
        return jsonify({"safe": False, "alert": f"Suspicious amount: ₹{amount:,}", "risk": "HIGH", "upiId": upi_id, "merchant": merchant})

    if upi_id not in VALID_UPI_IDS:
        return jsonify({"safe": False, "alert": "Merchant not in verified pharmacy registry", "risk": "MEDIUM", "upiId": upi_id, "merchant": merchant})

    return jsonify({"safe": True, "upiId": upi_id, "merchant": merchant, "amount": amount, "risk": "LOW"})

@app.route("/api/stock-alerts", methods=["GET"])
def stock_alerts():
    alerts = [
        {"pharmacy": "Apollo HSR", "medicine": "ORS Sachets", "stock": 15, "threshold": 200, "severity": "CRITICAL"},
        {"pharmacy": "MedPlus Koramangala", "medicine": "Cetirizine", "stock": 45, "threshold": 80, "severity": "LOW"},
        {"pharmacy": "Apollo HSR", "medicine": "Paracetamol", "stock": 50, "threshold": 300, "severity": "CRITICAL"},
        {"pharmacy": "Jan Aushadhi", "medicine": "Omeprazole", "stock": 25, "threshold": 150, "severity": "LOW"},
    ]
    return jsonify({"alerts": alerts, "total": len(alerts)})

@app.route("/api/redistribution", methods=["GET"])
def redistribution():
    suggestions = [
        {"from": "Jan Aushadhi Indiranagar", "to": "Apollo HSR", "medicine": "Paracetamol", "quantity": 250, "urgency": "URGENT"},
        {"from": "Jan Aushadhi Indiranagar", "to": "Apollo HSR", "medicine": "ORS Sachets", "quantity": 150, "urgency": "URGENT"},
        {"from": "Apollo HSR", "to": "MedPlus Koramangala", "medicine": "Cetirizine", "quantity": 200, "urgency": "MODERATE"},
    ]
    return jsonify({"suggestions": suggestions})

if __name__ == "__main__":
    print("="*50)
    print("  MedSmart Backend Starting...")
    print("  http://localhost:5000")
    print("="*50)
    app.run(debug=True, port=5000)
