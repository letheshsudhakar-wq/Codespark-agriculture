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


# rates: (N, P2O5, K2O) kg/ha.  Source ids refer to karnataka_fertilizer_recommendations.csv
POP = {
    ("paddy", "kharif"): (100, 50, 50, "REC-001"),
    ("paddy", "summer"): (120, 60, 60, "REC-002"),
    ("ragi", "rainfed"): (50, 40, 25, "REC-003"),
    ("ragi", "irrigated"): (100, 50, 50, "REC-004"),
    ("maize", None): (150, 75, 40, "REC-005"),
}
ALIASES = {"rice": "paddy", "finger millet": "ragi", "nachni": "ragi", "corn": "maize"}

def _soil_status(inp):
    out, missing, notes = {}, [], []
    # ---- nitrogen
    if inp.get("avail_n_kg_ha") is not None:
        if str(inp.get("avail_n_method", "")).lower() not in ("kmno4", "alkaline_kmno4", "alkaline permanganate"):
            notes.append("Nitrogen refused: method must be alkaline KMnO4 (available N). A value without method cannot be treated as available N.")
        else:
            out["nitrogen"] = dict(
                value=float(inp["avail_n_kg_ha"]),
                unit="kg N/ha",
                method="Alkaline KMnO4",
                interpretation="Measurement only; no verified status classification."
            )
    else:
        missing.append(("available nitrogen (alkaline KMnO4, kg/ha)", "Soil N supply decides whether the generic N rate should be adjusted."))
    # ---- phosphorus
    if inp.get("p_value") is not None:
        basis = str(inp.get("p_basis", "")).upper()
        meth = str(inp.get("p_method", "")).lower()

        if basis not in ("P", "P2O5") or meth not in ("olsen", "bray1", "bray-1"):
            notes.append("Phosphorus refused: provide basis (P or P2O5) and method (Olsen or Bray-1).")
        else:
            notes.append(
                f"Phosphorus measurement received: {inp['p_value']} ({basis}), "
                f"method {meth}. Original unit was not supplied; no conversion or classification performed."
            )
            if meth == "olsen" and inp.get("soil_ph") is not None:
                try:
                    if float(inp["soil_ph"]) < 5.5:
                        notes.append("Olsen P interpretation requires caution for acidic soil; consult the soil testing laboratory.")
                except (ValueError, TypeError):
                    notes.append("Invalid soil pH; Olsen P interpretation skipped.")
    else:
        missing.append(("available phosphorus (Olsen or Bray-1; state P or P2O5)", "Required for phosphorus assessment."))

    # ---- potassium
    if inp.get("k_value") is not None:
        basis = str(inp.get("k_basis", "")).upper()
        meth = str(inp.get("k_method", "")).lower()

        if basis not in ("K", "K2O") or meth not in ("nh4oac", "ammonium acetate"):
            notes.append("Potassium refused: provide basis (K or K2O) and neutral NH4OAc testing method.")
        else:
            notes.append(
                f"Potassium measurement received: {inp['k_value']} ({basis}), "
                f"method {meth}. Original unit was not supplied; no conversion or classification performed."
            )
    else:
        missing.append(("available potassium (NH4OAc; state K or K2O)", "Required for potassium assessment."))

    # ---- organic carbon
    if inp.get("oc_pct") is not None:
        oc_method = str(inp.get("oc_method", "")).lower().replace("_", "-")
        if oc_method not in ("walkley-black", "walkley black", "wb"):
            notes.append("Organic carbon refused: provide a verified Walkley-Black testing method before classification.")
        else:
            out["organic_carbon"] = dict(
                value=float(inp["oc_pct"]),
                unit="%",
                method="Walkley-Black",
                interpretation="Measurement only; no verified status classification."
            )

    if inp.get("om_pct") is not None and inp.get("oc_pct") is None:
        notes.append("Organic matter is not converted into organic carbon. Provide a laboratory organic-carbon result.")

    return out, missing, notes

def _validate_numeric_inputs(inp):
    import math

    errors = []
    fields = {
        "avail_n_kg_ha": (0, None),
        "p_value": (0, None),
        "k_value": (0, None),
        "oc_pct": (0, 100),
        "om_pct": (0, 100),
        "soil_ph": (0, 14),
    }

    for field, (minimum, maximum) in fields.items():
        value = inp.get(field)

        if value is None:
            continue

        if isinstance(value, bool):
            errors.append(f"{field}: boolean is not a valid measurement.")
            continue

        try:
            number = float(value)
        except (ValueError, TypeError):
            errors.append(f"{field}: must be numeric.")
            continue

        if not math.isfinite(number):
            errors.append(f"{field}: must be a finite number.")
            continue

        if number < minimum or (maximum is not None and number > maximum):
            errors.append(f"{field}: value is outside the permitted range.")

    return errors


def advise(inp):
    inp = dict(inp)
    r = dict(input_crop=None, tier_reached=None, outputs={}, missing_critical=[], refusals=[], messages=[])

    numeric_errors = _validate_numeric_inputs(inp)
    r["refusals"].extend(numeric_errors)

    for field in ("avail_n_kg_ha", "p_value", "k_value", "oc_pct", "om_pct", "soil_ph"):
        value = inp.get(field)
        if value is not None:
            try:
                number = float(value)
                if any(error.startswith(field + ":") for error in numeric_errors):
                    inp[field] = None
                else:
                    inp[field] = number
            except (ValueError, TypeError):
                inp[field] = None

    crop = ALIASES.get(str(inp.get("crop", "")).strip().lower(), str(inp.get("crop", "")).strip().lower())
    r["input_crop"] = crop
    if not crop:
        r["tier_reached"] = "TIER_0_REJECT"
        r["messages"].append("Please provide a crop name.")
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
    elif crop == "maize":
        key = ("maize", None)
    else:
        key = None
        r["missing_critical"].append((
            "verified crop-specific recommendation",
            f"No verified Karnataka package-of-practice record is currently available for {crop}. No fertilizer rate will be guessed."
        ))
    if key:
        n, p, k, rid = POP[key]
        r["outputs"]["generic_package_of_practice"] = dict(N_kg_ha=n, P2O5_kg_ha=p, K2O_kg_ha=k, record=rid,
            label="GENERIC crop-level rate; NOT personalised to soil", farmer_use_status="SOURCE VERIFICATION REQUIRED")
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
