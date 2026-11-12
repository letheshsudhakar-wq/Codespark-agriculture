#!/usr/bin/env python3
"""
Inference gate for the Karnataka fertilizer advisory.

The farmer never has to supply every soil parameter, but the system only returns what the supplied
inputs can scientifically support:

  TIER 0  REJECT        crop not supported / crop missing
  TIER 1  GENERIC       documented package-of-practice (PoP) blanket rate for the crop (not personalised)
  TIER 2  SOIL STATUS   nutrient status classes for each soil value supplied WITH its method and unit/basis
  TIER 3  PERSONALISED  fertilizer quantity from a verified soil-test equation -> currently UNSUPPORTED
                        (no verified equation/labels in the dataset). The gate says so and asks for a soil test.

Nothing is imputed. A soil value without method/basis is refused, not guessed.
"""
import json

F_P = 141.94 / 61.95   # P -> P2O5   (2.2914)
F_K = 94.20 / 78.20    # K -> K2O    (1.2046)

# rates: (N, P2O5, K2O) kg/ha.  Source ids refer to karnataka_fertilizer_recommendations.csv
POP = {
    ("paddy", "kharif"): (100, 50, 50, "REC-001"),
    ("paddy", "summer"): (120, 60, 60, "REC-002"),
    ("ragi", "rainfed"): (50, 40, 25, "REC-003"),
    ("ragi", "irrigated"): (100, 50, 50, "REC-004"),
    ("maize", None): (150, 75, 40, "REC-005"),
}
ALIASES = {"rice": "paddy", "finger millet": "ragi", "nachni": "ragi", "corn": "maize"}

PRIMARY = {"n": (280, 560), "p2o5": (22.9, 56.0), "k2o": (141, 336), "oc": (0.5, 0.75)}
ALTS = {  # alternative published tables, converted to the same basis, for boundary sensitivity
    "TNAU": {"n": (240, 480), "p2o5": (11 * F_P, 22 * F_P), "k2o": (110 * F_K, 280 * F_K)},
    "AP-J-Agril-Sci-2017": {"n": (280, 560), "p2o5": (11 * F_P, 25.6 * F_P), "k2o": (120 * F_K, 280 * F_K)},
}

def _cls(v, lo_hi):
    lo, hi = lo_hi
    return "low" if v < lo else ("medium" if v <= hi else "high")

def _soil_status(inp):
    out, missing, notes = {}, [], []
    # ---- nitrogen
    if inp.get("avail_n_kg_ha") is not None:
        if str(inp.get("avail_n_method", "")).lower() not in ("kmno4", "alkaline_kmno4", "alkaline permanganate"):
            notes.append("Nitrogen refused: method must be alkaline KMnO4 (available N). A value without method cannot be treated as available N.")
        else:
            v = float(inp["avail_n_kg_ha"])
            c = _cls(v, PRIMARY["n"])
            sens = sorted({k for k, t in ALTS.items() if _cls(v, t["n"]) != c})
            out["nitrogen"] = dict(value=v, unit="kg N/ha (KMnO4)", status=c, threshold_source="UAS-B/Karnataka 280-560", sensitive_to=sens)
    else:
        missing.append(("available nitrogen (alkaline KMnO4, kg/ha)", "Soil N supply decides whether the generic N rate should be adjusted."))
    # ---- phosphorus
    if inp.get("p_value") is not None:
        basis, meth = str(inp.get("p_basis", "")).upper(), str(inp.get("p_method", "")).lower()
        if basis not in ("P", "P2O5") or meth not in ("olsen", "bray1", "bray-1"):
            notes.append("Phosphorus refused: need basis (P or P2O5) and method (Olsen or Bray-1).")
        else:
            v = float(inp["p_value"]) * (F_P if basis == "P" else 1)
            c = _cls(v, PRIMARY["p2o5"])
            sens = sorted({k for k, t in ALTS.items() if _cls(v, t["p2o5"]) != c})
            if meth == "olsen" and inp.get("soil_ph") is not None and float(inp["soil_ph"]) < 5.5:
                notes.append("Olsen P is intended for neutral/alkaline soils; pH < 5.5 usually calls for Bray-1. Interpret with care.")
            out["phosphorus"] = dict(value=round(v, 2), unit="kg P2O5/ha (converted)" if basis == "P" else "kg P2O5/ha", status=c,
                                     threshold_source="UAS-B/Karnataka 22.9-56.0 as P2O5", sensitive_to=sens)
    else:
        missing.append(("available phosphorus (Olsen or Bray-1; state whether as P or P2O5)", "Controls whether the P2O5 rate is kept, raised or reduced."))
    # ---- potassium
    if inp.get("k_value") is not None:
        basis, meth = str(inp.get("k_basis", "")).upper(), str(inp.get("k_method", "")).lower()
        if basis not in ("K", "K2O") or meth not in ("nh4oac", "ammonium acetate"):
            notes.append("Potassium refused: need basis (K or K2O) and method (neutral NH4OAc).")
        else:
            v = float(inp["k_value"]) * (F_K if basis == "K" else 1)
            c = _cls(v, PRIMARY["k2o"])
            sens = sorted({k for k, t in ALTS.items() if _cls(v, t["k2o"]) != c})
            out["potassium"] = dict(value=round(v, 2), unit="kg K2O/ha", status=c, threshold_source="UAS-B/Karnataka 141-336 as K2O", sensitive_to=sens)
    else:
        missing.append(("available potassium (NH4OAc; state whether as K or K2O)", "Controls whether the K2O rate is kept, raised or reduced."))
    # ---- organic carbon (organic matter is NOT accepted)
    if inp.get("oc_pct") is not None:
        out["organic_carbon"] = dict(value=float(inp["oc_pct"]), unit="% (Walkley-Black)", status=_cls(float(inp["oc_pct"]), PRIMARY["oc"]), threshold_source="0.5-0.75 %")
    if inp.get("om_pct") is not None and inp.get("oc_pct") is None:
        notes.append("Organic matter given: not converted to organic carbon (the 1.724 factor is a convention). Provide Walkley-Black OC.")
    return out, missing, notes

def _products(n, p, k):
    dap = p / 0.46
    n_from_dap = dap * 0.18
    urea = max(n - n_from_dap, 0) / 0.46
    mop = k / 0.60
    return dict(urea_kg_ha=round(urea, 1), dap_kg_ha=round(dap, 1), mop_kg_ha=round(mop, 1),
                note="Arithmetic from nominal grades (urea 46% N; DAP 18-46-0; MOP 60% K2O); generic, not soil-test-adjusted")

def advise(inp):
    crop = ALIASES.get(str(inp.get("crop", "")).strip().lower(), str(inp.get("crop", "")).strip().lower())
    r = dict(input_crop=crop, tier_reached=None, outputs={}, missing_critical=[], refusals=[], messages=[])
    if crop not in ("paddy", "maize", "ragi"):
        r["tier_reached"] = "TIER_0_REJECT"
        r["messages"].append("Crop not supported (supported: paddy, maize, ragi). No recommendation produced.")
        return r
    # ---- tier 1
    key = None
    if crop == "paddy":
        s = str(inp.get("season", "")).lower()
        key = ("paddy", s) if s in ("kharif", "summer") else None
        if key is None:
            r["missing_critical"].append(("season (kharif or summer)", "Documented paddy rates differ by season (100:50:50 vs 120:60:60)."))
    elif crop == "ragi":
        i = str(inp.get("irrigation", "")).lower()
        key = ("ragi", i) if i in ("rainfed", "irrigated") else None
        if key is None:
            r["missing_critical"].append(("irrigation (rainfed or irrigated)", "Documented ragi rates differ by water regime (50:40:25 vs 100:50:50)."))
    else:
        key = ("maize", None)
    if key:
        n, p, k, rid = POP[key]
        r["outputs"]["generic_package_of_practice"] = dict(N_kg_ha=n, P2O5_kg_ha=p, K2O_kg_ha=k, record=rid,
            products=_products(n, p, k), label="GENERIC crop-level recommendation, NOT personalised to your soil")
        r["tier_reached"] = "TIER_1_GENERIC"
    # ---- tier 2
    status, missing, notes = _soil_status(inp)
    r["refusals"] += notes
    if status:
        r["outputs"]["soil_nutrient_status"] = status
        r["tier_reached"] = "TIER_2_SOIL_STATUS" if r["tier_reached"] else "TIER_2_SOIL_STATUS_ONLY"
        for nm, d in status.items():
            if d.get("sensitive_to"):
                r["messages"].append(f"{nm}: class '{d['status']}' is near a boundary; other published tables would classify it differently ({', '.join(d['sensitive_to'])}).")
    r["missing_critical"] += missing
    # ---- tier 3
    r["outputs"]["personalised_quantity"] = dict(supported=False,
        reason="No verified soil-test-based equation or labelled records exist in the dataset for this crop/region; published STCR coefficients conflict.",
        request="Get a laboratory Soil Health Card (N, P, K, pH, EC, OC) and consult the local Krishi Vigyan Kendra / UAS recommendation.")
    if r["tier_reached"] is None:
        r["tier_reached"] = "NEED_MORE_INFORMATION"
    return r

if __name__ == "__main__":
    tests = [
        ("ragi, nothing else", dict(crop="ragi")),
        ("ragi irrigated", dict(crop="Ragi", irrigation="irrigated")),
        ("maize + full SHC-style values", dict(crop="maize", avail_n_kg_ha=250, avail_n_method="KMnO4", p_value=12, p_basis="P", p_method="Olsen", k_value=300, k_basis="K2O", k_method="NH4OAc", oc_pct=0.45, soil_ph=6.8)),
        ("paddy kharif, N without method, P near boundary", dict(crop="rice", season="kharif", avail_n_kg_ha=300, p_value=23, p_basis="P2O5", p_method="Olsen")),
        ("sugarcane", dict(crop="sugarcane")),
        ("paddy with organic matter only", dict(crop="paddy", season="summer", om_pct=1.2)),
    ]
    for name, t in tests:
        print("=" * 90); print("CASE:", name); print("INPUT:", json.dumps(t)); print(json.dumps(advise(t), indent=2))
