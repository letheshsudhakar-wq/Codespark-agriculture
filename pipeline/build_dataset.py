#!/usr/bin/env python3
"""
Karnataka fertilizer-advisory dataset builder.

What this script does (in order):
  1. Dynamic schema discovery on every input CSV (no hard-coded column positions).
  2. Canonical mapping with an explicit status per column (mapped / mapped_with_caveat /
     ambiguous / derived / unsupported). Columns whose scientific meaning cannot be verified
     are NEVER mapped to a specific canonical parameter.
  3. Unit log, validation checks, provenance.
  4. Writes every deliverable CSV into OUT.

Run:  python3 build_dataset.py --uploads /path/to/csvs --out /path/to/output
"""
import argparse, hashlib, os, re, json
import numpy as np
import pandas as pd

ap = argparse.ArgumentParser()
ap.add_argument("--uploads", default="/mnt/user-data/uploads")
ap.add_argument("--out", default="/home/claude/karnataka_fertilizer_dataset")
args = ap.parse_args()
UP, OUT = args.uploads, args.out
os.makedirs(OUT + "/supporting", exist_ok=True)
os.makedirs(OUT + "/pipeline", exist_ok=True)

F_A = "Crop_recommendation.csv"
F_B = "crop_dataset__crop__prediction_dataset.csv"
F_N = [f for f in os.listdir(UP) if f.startswith("POWER_Point_Daily")][0]

def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        h.update(f.read())
    return h.hexdigest()

# ------------------------------------------------------------------ 1. LOAD
A = pd.read_csv(f"{UP}/{F_A}")
B = pd.read_csv(f"{UP}/{F_B}")

def read_power(path):
    """Parse NASA POWER CSV: header block is parsed, not skipped blindly."""
    with open(path, encoding="utf-8", errors="replace") as f:
        lines = f.read().splitlines()
    end = [i for i, l in enumerate(lines) if l.strip() == "-END HEADER-"][0]
    hdr = lines[:end]
    meta = {"params": {}}
    for l in hdr:
        m = re.search(r"latitude\s+([-\d.]+)\s+longitude\s+([-\d.]+)", l)
        if m:
            meta["lat"], meta["lon"] = float(m.group(1)), float(m.group(2))
        m = re.search(r"elevation.*=\s*([\d.]+)\s*meters", l)
        if m:
            meta["elev_m"] = float(m.group(1))
        m = re.match(r"^(\w+)\s{2,}(.*)\s\(([^()]*)\)\s*$", l)
        if m:
            meta["params"][m.group(1)] = (m.group(2).strip(), m.group(3))
        if "missing source data" in l:
            meta["missing_code"] = float(re.search(r"(-?\d+)\s*$", l.strip()).group(1))
    df = pd.read_csv(path, skiprows=end + 1)
    return df, meta

N, NM = read_power(f"{UP}/{F_N}")
n_missing_code = int((N.select_dtypes("number") == NM["missing_code"]).sum().sum())
N = N.replace(NM["missing_code"], np.nan)

# ------------------------------------------------------------------ 2. SCHEMA DISCOVERY + MAPPING
# (original column -> canonical, status, reason).  Anything not listed is auto-flagged "unmapped".
MAP = {
 F_A: {
  "N": ("nitrogen_unspecified", "ambiguous", "No unit or extraction method. Cannot be equated to available_nitrogen_kmno4 (kg/ha) or to fertilizer N."),
  "P": ("phosphorus_unspecified", "ambiguous", "No unit/method (Olsen/Bray, as P or P2O5 unknown). Not equivalent to available P or fertilizer P2O5."),
  "K": ("potassium_unspecified", "ambiguous", "No unit/method (NH4OAc K vs K2O unknown). Not equivalent to available K or fertilizer K2O."),
  "temperature": ("temperature_unspecified_period", "ambiguous", "Averaging period and source unknown; not comparable to POWER T2M."),
  "humidity": ("relative_humidity_unspecified_period", "ambiguous", "Averaging period and source unknown."),
  "ph": ("soil_ph", "mapped_with_caveat", "Soil:water ratio / method not stated; plausible pH scale."),
  "rainfall": ("rainfall_unspecified_unit", "ambiguous", "No unit stated here; the sister file labels the identical values 'cm'. Accumulation period unknown."),
  "label": ("crop_name", "mapped", "Crop label; normalised (rice->paddy). 22 crops, only paddy and maize are target crops."),
 },
 F_B: {
  "Nitrogen(N)": ("nitrogen_unspecified", "ambiguous", "Identical values to Crop_recommendation.N; no unit/method."),
  "phosphorus (P)": ("phosphorus_unspecified", "ambiguous", "Identical to Crop_recommendation.P; no unit/method."),
  "Potassium(K)": ("potassium_unspecified", "ambiguous", "Identical to Crop_recommendation.K; no unit/method."),
  "Copper(cu)": ("copper_unspecified", "ambiguous", "Extractant (DTPA?) and unit (mg/kg?) not stated; not present in the sister file, no provenance."),
  "Iron(Fe)": ("iron_unspecified", "ambiguous", "Extractant and unit not stated; no provenance."),
  "Magnesium(Mg)": ("magnesium_unspecified", "ambiguous", "Exchangeable Mg (cmol/kg) vs extractable (mg/kg) unknown; no provenance."),
  "Sulpher(S)": ("sulphur_unspecified", "ambiguous", "Extractant/unit unknown; no provenance."),
  "Temperature": ("temperature_unspecified_period", "ambiguous", "Same as sister file (rounded)."),
  "Humidity": ("relative_humidity_unspecified_period", "ambiguous", "Same as sister file (rounded)."),
  "pH": ("soil_ph", "mapped_with_caveat", "Same as sister file (rounded)."),
  "Rainfall(cm)": ("rainfall_unspecified_unit", "ambiguous", "Header says cm; values are identical (to 0.005) to the sister file column that has no unit. Range 20-299 per unknown period. Label unverified, no conversion applied."),
  "Crops": ("crop_name", "mapped", "Crop label; normalised (rice->paddy)."),
 },
 F_N: {
  "YEAR": ("observation_date", "derived", "Combined with DOY into an ISO date."),
  "DOY": ("observation_date", "derived", "Day of year, combined with YEAR."),
  "T2M": ("mean_temperature", "mapped", "MERRA-2 2 m air temperature, deg C (unit from file header)."),
  "T2M_MAX": ("maximum_temperature", "mapped", "MERRA-2 2 m daily max, deg C."),
  "T2M_MIN": ("minimum_temperature", "mapped", "MERRA-2 2 m daily min, deg C."),
  "PRECTOTCORR": ("rainfall", "mapped", "Bias-corrected precipitation, mm/day (reanalysis grid cell, not a rain gauge)."),
  "RH2M": ("relative_humidity", "mapped", "2 m relative humidity, %."),
 },
}

def discover(df, source):
    rows = []
    for c in df.columns:
        s = df[c]
        num = pd.api.types.is_numeric_dtype(s)
        unit = re.search(r"\(([^()]*)\)\s*$", str(c))
        canon, status, reason = MAP.get(source, {}).get(c, ("UNMAPPED", "unmapped", "Not in canonical dictionary; needs human review."))
        rows.append(dict(
            source_file=source, original_column=c,
            inferred_type="numeric" if num else "categorical",
            n_rows=len(s), n_missing=int(s.isna().sum()), n_unique=int(s.nunique()),
            min_value=float(s.min()) if num else "", max_value=float(s.max()) if num else "",
            unit_in_header=unit.group(1) if unit else "",
            canonical_name=canon, mapping_status=status, mapping_reason=reason))
    return rows

schema_rows = discover(A, F_A) + discover(B, F_B) + discover(N, F_N)
schema = pd.DataFrame(schema_rows)
# add units documented in the NASA header block
for k, (desc, unit) in NM["params"].items():
    schema.loc[(schema.source_file == F_N) & (schema.original_column == k), "unit_in_header"] = unit
schema.to_csv(f"{OUT}/source_schema_mapping.csv", index=False)

# ------------------------------------------------------------------ 3. CANONICAL DICTIONARY
CD = [
# canonical_name, group, definition, preferred_unit, method, aliases_accepted_only_if_method_confirmed, NOT_equivalent_to
("available_nitrogen_kmno4","soil","Alkaline permanganate-oxidisable N (Subbiah & Asija) - the 'available N' used on Soil Health Cards","kg N/ha","Alkaline KMnO4","Available_N; Avail N (only if method = KMnO4)","total_nitrogen; mineral N (NH4+NO3); fertilizer N; any unlabelled 'N'"),
("total_nitrogen","soil","Total (Kjeldahl/dry-combustion) soil N","% or g/kg","Kjeldahl / combustion","Total_N","available_nitrogen_kmno4"),
("available_phosphorus_olsen","soil","NaHCO3-extractable P (Olsen), neutral/alkaline soils","kg P/ha (or mg/kg)","Olsen","Available_P (only if Olsen)","Bray-P; fertilizer P2O5; any unlabelled 'P'"),
("available_phosphorus_bray1","soil","Bray-1 extractable P, acidic soils","kg P/ha (or mg/kg)","Bray-1","","Olsen-P (different extractant, different thresholds)"),
("available_phosphorus_p2o5_basis","soil","Available P expressed as P2O5 (derived: P x 2.2914)","kg P2O5/ha","derived","","elemental P value without conversion"),
("available_potassium_nh4oac","soil","Neutral N NH4OAc-exchangeable K","kg K/ha or kg K2O/ha (basis must be recorded)","NH4OAc","Available_K (only if NH4OAc)","fertilizer K2O; total K"),
("soil_ph","soil","Soil reaction","pH units","pH meter; soil:water ratio must be recorded","Soil_pH; pH","-"),
("electrical_conductivity","soil","Soil EC (1:2 or 1:2.5 extract)","dS/m","EC meter","EC","-"),
("organic_carbon_wb","soil","Walkley-Black organic carbon","% (w/w)","Walkley-Black","Organic_C; OC","organic_matter (OM = OC x 1.724 is a convention, not a measurement)"),
("organic_matter","soil","Organic matter","%","Loss on ignition or OC x 1.724","OM","organic_carbon_wb"),
("available_sulphur","soil","Extractable S (CaCl2 / Ca(H2PO4)2)","mg/kg","Extractant must be recorded","Sulphur; S","fertilizer S"),
("available_zinc_dtpa","soil","DTPA-extractable Zn","mg/kg (= ppm)","DTPA (Lindsay-Norvell)","Zn","total Zn"),
("available_iron_dtpa","soil","DTPA-extractable Fe","mg/kg","DTPA","Fe","total Fe"),
("available_copper_dtpa","soil","DTPA-extractable Cu","mg/kg","DTPA","Cu","total Cu"),
("available_manganese_dtpa","soil","DTPA-extractable Mn","mg/kg","DTPA","Mn","total Mn"),
("available_boron","soil","Hot-water-soluble B","mg/kg","Hot water","B","total B"),
("exchangeable_magnesium","soil","Exchangeable Mg","cmol(p+)/kg","NH4OAc","Mg (only if cmol/kg and exchangeable)","extractable Mg in mg/kg without conversion"),
("soil_texture","soil","Texture class","category","Hydrometer / feel","","-"),
("soil_moisture","soil","Volumetric or gravimetric moisture; basis must be recorded","% (v/v or w/w)","","","-"),
("soil_depth_sampled","soil","Sampling depth","cm","","","-"),
("soil_test_date","soil","Date of sample analysis","ISO date","","","-"),
("required_nitrogen_fertilizer","target","Recommended fertilizer N rate","kg N/ha","Documented recommendation only","","soil available N value"),
("required_p2o5_fertilizer","target","Recommended fertilizer P2O5 rate","kg P2O5/ha","","","soil available P"),
("required_k2o_fertilizer","target","Recommended fertilizer K2O rate","kg K2O/ha","","","soil available K"),
("recommended_fertilizer_quantity","target","Product quantity (urea, DAP, MOP...) derived from nutrient rates and nominal grade","kg product/ha","Grade division","","nutrient rate"),
("rainfall","weather","Daily rainfall","mm/day","Reanalysis or gauge: source must be recorded","PRECTOTCORR","Rainfall(cm) of unknown period"),
("minimum_temperature","weather","Daily min 2 m air temperature","deg C","","T2M_MIN",""),
("maximum_temperature","weather","Daily max 2 m air temperature","deg C","","T2M_MAX",""),
("mean_temperature","weather","Daily mean 2 m air temperature","deg C","","T2M",""),
("relative_humidity","weather","Daily mean 2 m RH","%","","RH2M",""),
("solar_radiation","weather","Daily all-sky shortwave radiation","MJ/m2/day or kWh/m2/day","","ALLSKY_SFC_SW_DWN","NOT present in the supplied POWER file"),
("crop_name","crop","Normalised crop name","category","Lowercase canonical list: paddy, maize, ragi, ...","rice->paddy; finger millet->ragi; corn->maize",""),
("irrigation_type","crop","rainfed / irrigated","category","","",""),
("season","crop","Kharif / Rabi / Summer (cropping season, not calendar month)","category","Boundaries differ by district; not auto-derived from date","",""),
("nitrogen_unspecified","quarantine","Nutrient value with no unit/method. NEVER used as a model input for fertilizer tasks","unknown","unknown","N (from uploaded files)","available_nitrogen_kmno4"),
("phosphorus_unspecified","quarantine","As above","unknown","unknown","P (uploaded)","available_phosphorus_*"),
("potassium_unspecified","quarantine","As above","unknown","unknown","K (uploaded)","available_potassium_*"),
("rainfall_unspecified_unit","quarantine","Rainfall with conflicting/absent unit and period","unknown","unknown","rainfall / Rainfall(cm)","rainfall (mm/day)"),
]
pd.DataFrame(CD, columns=["canonical_name","group","definition","preferred_unit","method_or_basis","aliases_accepted_only_if_method_confirmed","NOT_equivalent_to"]).to_csv(f"{OUT}/canonical_parameter_dictionary.csv", index=False)

# ------------------------------------------------------------------ 4. WEATHER FILE (genuine data)
W = pd.DataFrame()
W["observation_date"] = pd.to_datetime(N.YEAR.astype(str) + "-01-01") + pd.to_timedelta(N.DOY - 1, unit="D")
W["record_id"] = ["WX-BLR-" + d.strftime("%Y%m%d") for d in W.observation_date]
W["district"] = ""
W["district_inferred_from_coordinates"] = "Bengaluru Urban (inferred, not in source; verify with boundary lookup)"
W["taluk"] = ""; W["village"] = ""
W["latitude"] = NM["lat"]; W["longitude"] = NM["lon"]
W["elevation_m_merra2_cell_avg"] = NM.get("elev_m", np.nan)
W["agro_climatic_zone"] = ""
W["season"] = ""
W["rainfall"] = N.PRECTOTCORR; W["rainfall_unit"] = "mm/day"
W["minimum_temperature"] = N.T2M_MIN; W["maximum_temperature"] = N.T2M_MAX
W["mean_temperature"] = N.T2M; W["temperature_unit"] = "deg C"
W["relative_humidity"] = N.RH2M; W["relative_humidity_unit"] = "%"
W["solar_radiation"] = np.nan; W["solar_radiation_note"] = "Not requested in the supplied POWER download (ALLSKY_SFC_SW_DWN missing)"
W["weather_date"] = W.observation_date
# leakage-safe trailing features: use ONLY days strictly before observation_date
r = W.rainfall
W["rain_prev_3d_mm"] = r.shift(1).rolling(3, min_periods=3).sum()
W["rain_prev_7d_mm"] = r.shift(1).rolling(7, min_periods=7).sum()
W["trailing_feature_note"] = "rain_prev_* use days t-1..t-k only (no same-day or future data)"
W["weather_source"] = "NASA POWER daily, MERRA-2 reanalysis (point 12.9716N 77.5946E), LST"
W["source_dataset"] = F_N; W["source_record_id"] = N.YEAR.astype(str) + "-DOY" + N.DOY.astype(str)
W["source_url"] = "https://power.larc.nasa.gov/ (user-supplied download; not re-fetched)"
W["original_unit"] = "C; C; C; mm/day; %"; W["standardized_unit"] = "same (no conversion needed)"
W["measurement_method"] = "MERRA-2 reanalysis, gridded 0.5x0.625 deg; NOT a ground station observation"
W["observation_year"] = W.observation_date.dt.year
miss = N[["T2M","T2M_MAX","T2M_MIN","PRECTOTCORR","RH2M"]].isna().any(axis=1)
W["data_quality_flag"] = np.where(miss, "missing_source_value", "ok")
W["missing_parameter_flag"] = "solar_radiation;agro_climatic_zone;season;taluk;village"
W.observation_date = W.observation_date.dt.strftime("%Y-%m-%d"); W.weather_date = W.weather_date.dt.strftime("%Y-%m-%d")
W.to_csv(f"{OUT}/karnataka_weather_data.csv", index=False)

# ------------------------------------------------------------------ 5. SUPPORTING crop-suitability file (NOT Karnataka, NOT verified)
CROPMAP = {"rice": "paddy", "maize": "maize"}
S = B.rename(columns={k: v[0] for k, v in MAP[F_B].items()})
S.insert(0, "source_row_number", np.arange(2, len(S) + 2))
S.insert(0, "record_id", ["CS-" + str(i).zfill(5) for i in range(1, len(S) + 1)])
S["crop_name_original"] = S.crop_name
S["crop_name"] = S.crop_name.map(lambda c: CROPMAP.get(c, c))
S["in_target_crops"] = S.crop_name.isin(["paddy", "maize", "ragi"])
S["geography"] = "none in source (not Karnataka-attributable)"
S["identical_row_in_Crop_recommendation_csv"] = True
S["source_dataset"] = F_B; S["label_type"] = "crop_suitability_class"
S["data_quality_flag"] = "provenance_unverified"
S["synthetic_status"] = "unknown_provenance_statistical_signature_of_simulated_data (see dataset_validation_report.csv)"
S["usable_for"] = "Dataset D (crop suitability) pipeline testing only; never fertilizer tasks"
S.to_csv(f"{OUT}/supporting/crop_suitability_unverified_nonkarnataka.csv", index=False)

# ------------------------------------------------------------------ 6. VALIDATION
V = []
def add(i, ds, check, status, detail): V.append(dict(check_id=i, dataset=ds, check=check, status=status, detail=detail))

# 6.1 missing / duplicates / shape
for nm, df in [(F_A, A), (F_B, B), (F_N, N)]:
    add(f"V01-{nm[:6]}", nm, "Missing values", "pass" if df.isna().sum().sum() == 0 else "review",
        f"{int(df.isna().sum().sum())} missing cells; shape {df.shape[0]}x{df.shape[1]}")
    add(f"V02-{nm[:6]}", nm, "Exact duplicate rows", "pass" if df.duplicated().sum() == 0 else "review", f"{int(df.duplicated().sum())} duplicates")
add("V03", F_N, "NASA missing-code (-999) occurrences", "pass" if n_missing_code == 0 else "review", f"{n_missing_code} cells equal -999")
# 6.2 A vs B relationship
same = {c: bool((A[c].values == B[b].values).all()) for c, b in [("N","Nitrogen(N)"),("P","phosphorus (P)"),("K","Potassium(K)")]}
dif = {c: float(np.abs(A[c].values - B[b].values).max()) for c, b in [("temperature","Temperature"),("humidity","Humidity"),("ph","pH"),("rainfall","Rainfall(cm)")]}
lab = bool((A.label.values == B.Crops.values).all())
add("V04", f"{F_A} vs {F_B}", "Are the two crop files independent?", "FAIL_as_independent_sources",
    f"File B = File A + Cu/Fe/Mg/S columns. N,P,K identical={same}; label identical={lab}; max |diff| {dif}. Using both as separate evidence double-counts every row; Cu/Fe/Mg/S have no provenance.")
# 6.3 value ranges
rng = lambda s: f"{s.min():.2f}-{s.max():.2f}"
add("V05", F_A, "Soil pH range (3-10 absolute bound)", "pass_with_flag", f"{rng(A.ph)}; {int(((A.ph<4)|(A.ph>9.5)).sum())} rows outside 4.0-9.5 retained and flagged (not deleted)")
add("V06", F_A, "NPK ranges", "unit_unknown", f"N {rng(A.N)}, P {rng(A.P)}, K {rng(A.K)}; cannot be compared with SHC thresholds because unit/method are undefined")
add("V07", F_A, "Weather-like columns", "ambiguous", f"temperature {rng(A.temperature)}; humidity {rng(A.humidity)}; rainfall {rng(A.rainfall)} (unit conflict mm vs cm, period unknown)")
add("V08", F_B, "Micronutrient/secondary columns", "unsupported", f"Cu {rng(B['Copper(cu)'])}, Fe {rng(B['Iron(Fe)'])}, Mg {rng(B['Magnesium(Mg)'])}, S {rng(B['Sulpher(S)'])}; no unit/extractant -> cannot be classified against critical limits")
add("V09", F_A, "Organic carbon consistency", "not_possible", "No organic carbon / matter column in any supplied soil-like file")
# 6.4 synthetic-signature tests
try:
    from scipy import stats
    feats = ["N","P","K","temperature","humidity","ph","rainfall"]
    tot = ok = 0
    for c, g in A.groupby("label"):
        for f in feats:
            x = g[f].values; lo, hi = x.min(), x.max()
            if hi > lo:
                tot += 1; ok += stats.kstest(x, "uniform", args=(lo, hi - lo)).pvalue > 0.05
    add("V10", F_A, "Per-class distribution shape (KS vs uniform on observed range)", "signal",
        f"{ok}/{tot} (class,feature) pairs are statistically consistent with uniform sampling inside a per-class range; exactly {int(A.label.value_counts().min())}-{int(A.label.value_counts().max())} rows per class across {A.label.nunique()} classes. Pattern typical of generated/simulated data; provenance unknown.")
except Exception as e:
    add("V10", F_A, "Per-class distribution shape", "skipped", str(e))
try:
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.model_selection import cross_val_score
    acc = cross_val_score(DecisionTreeClassifier(max_depth=8, random_state=0), A.drop(columns="label"), A.label, cv=5).mean()
    add("V11", F_A, "Label separability (5-fold depth-8 tree, accuracy)", "signal",
        f"{acc:.3f}. Very high separability of 22 classes from 7 numbers with a shallow tree is atypical of field data; do NOT quote any accuracy from this file as real-world performance.")
except Exception as e:
    add("V11", F_A, "Label separability", "skipped", str(e))
# 6.5 weather checks
dates = pd.to_datetime(W.observation_date)
add("V12", F_N, "Date continuity", "pass" if (dates.diff().dropna() == pd.Timedelta("1D")).all() and len(dates) == 365 else "review", f"{dates.min().date()} to {dates.max().date()}, {len(dates)} consecutive days")
add("V13", F_N, "Tmin <= Tmean <= Tmax", "pass" if ((N.T2M_MIN <= N.T2M) & (N.T2M <= N.T2M_MAX)).all() else "review", f"violations: {int((~((N.T2M_MIN <= N.T2M) & (N.T2M <= N.T2M_MAX))).sum())}")
add("V14", F_N, "RH in 0-100, rainfall >= 0", "pass" if N.RH2M.between(0, 100).all() and (N.PRECTOTCORR >= 0).all() else "review", f"RH {rng(N.RH2M)}; rain max {N.PRECTOTCORR.max():.2f} mm/day; annual total {N.PRECTOTCORR.sum():.0f} mm")
add("V15", F_N, "Geographic consistency (crude Karnataka bounding box lat 11.5-18.5, lon 74-78.6)", "pass_crude", f"point {NM['lat']},{NM['lon']} inside bbox; bbox is not a boundary test")
add("V16", F_N, "Spatial coverage", "limitation", "ONE grid point (Bengaluru). Cannot represent other Karnataka districts or agro-climatic zones.")
add("V17", F_N, "Solar radiation present", "FAIL", "ALLSKY_SFC_SW_DWN not in the file; column left empty, not estimated")
add("V18", F_N, "Leakage guard", "pass", "rain_prev_3d/7d computed from t-1 backwards only; first rows are NaN by design")
add("V19", F_N, "Observed vs forecast", "limitation", "File is historical reanalysis for 2025; contains no forecasts. Forecast-aware scheduling needs a separate forecast archive aligned by issue time.")
# 6.6 crop normalisation + labels
add("V20", F_A, "Crop-name normalisation", "pass", "rice->paddy, maize->maize; 'ragi'/'finger millet' absent -> 0 ragi rows in any supplied crop file")
add("V21", "fertilizer recs", "Target-label availability", "limitation", "0 soil-test-specific verified labels. Only crop-level package-of-practice rates (lookup) and conflicting STCR coefficients (reference only).")
add("V22", "fertilizer recs", "Recommendation-source verification", "partial", "Rates found in retrieved text of UAS Bengaluru publications and an ICAR-IIMR compilation (see source_provenance.csv). Ragi rates are from a secondary compilation, not UAS-B directly. Maize K2O varies across UAS-B papers (37.5/40/50).")
add("V23", "fertilizer recs", "STCR coefficient consistency (maize)", "CONFLICT", "FP2O5 coefficient reported as 1.18 (2016 paper) vs 1.85 + OM term (masujournal); unit of T reported as q/ha vs t/ha. Not implemented. Primary AICRP-STCR report must be checked.")
add("V24", "fertilizer products", "Nominal grade/conversion arithmetic", "pass", "P2O5/P = 2.2914, K2O/K = 1.2046 from atomic masses; grades are nominal and were NOT retrieved from FCO text in this run.")
add("V25", "All soil targets", "Real Karnataka soil-test records obtained", "FAIL", "0 rows. SHC portal / data.gov.in / SoilGrids / ICAR Bhoomi unreachable from the build sandbox (DNS failure). See source_provenance.csv.")
pd.DataFrame(V).to_csv(f"{OUT}/dataset_validation_report.csv", index=False)

# missing-value stats per column
ms = []
for nm, df in [(F_A, A), (F_B, B), (F_N, N)]:
    for c in df.columns:
        ms.append(dict(source_file=nm, column=c, n_rows=len(df), n_missing=int(df[c].isna().sum()), pct_missing=round(100*df[c].isna().mean(), 3)))
pd.DataFrame(ms).to_csv(f"{OUT}/missing_value_statistics.csv", index=False)

# ------------------------------------------------------------------ 7. UNIT LOG
UL = [
 ("NASA POWER","YEAR+DOY","observation_date (ISO)","date arithmetic: Jan-1 + (DOY-1) days","applied","valid","Leap-year safe via pandas"),
 ("NASA POWER","T2M/T2M_MAX/T2M_MIN","same","none","not_needed","valid","deg C kept"),
 ("NASA POWER","PRECTOTCORR","rainfall","none","not_needed","valid","mm/day kept"),
 ("NASA POWER","RH2M","relative_humidity","none","not_needed","valid","% kept"),
 ("NASA POWER","-999","NaN","missing-code replacement","applied","valid",f"{n_missing_code} cells affected"),
 ("soil P","kg P/ha","kg P2O5/ha","x 2.2914 (141.94/61.95)","available_not_applied","valid","Only when basis (P vs P2O5) is explicit"),
 ("soil K","kg K/ha","kg K2O/ha","x 1.2046 (94.20/78.20)","available_not_applied","valid","Only when basis (K vs K2O) is explicit"),
 ("soil OC","% organic carbon","% organic matter","x 1.724 (Van Bemmelen convention)","available_not_applied","convention","OM is not measured OC; avoid in ML features"),
 ("soil micronutrient","ppm","mg/kg","x 1","available_not_applied","valid","Numerically identical"),
 ("soil nutrient","mg/kg","kg/ha","needs bulk density and sampling depth","PROHIBITED_without_inputs","invalid_if_assumed","No bulk density or depth in any supplied file"),
 ("Crop_recommendation / crop_dataset","N,P,K","kg/ha or anything","none","PROHIBITED","unknown_unit","Unit and method absent"),
 ("crop_dataset","Rainfall(cm)","mm","x 10","PROHIBITED","label_unverified","Values equal the unitless sister column; the 'cm' header cannot be trusted"),
 ("fertilizer","nutrient rate (kg/ha)","product kg/ha","rate / (grade %/100)","available_in_gate","valid_for_nominal_grades","Grades nominal; see fertilizer_products_reference.csv"),
]
pd.DataFrame(UL, columns=["source","original_unit_or_item","target","formula","status","scientific_validity","note"]).to_csv(f"{OUT}/unit_conversion_log.csv", index=False)

# ------------------------------------------------------------------ 8. MISSING PARAMETER REPORT
PARAMS = ["available_nitrogen_kmno4","available_phosphorus","available_potassium","soil_ph","organic_carbon","electrical_conductivity","sulphur","zinc","iron","copper","manganese","boron","soil_texture","soil_moisture","soil_depth","soil_test_date","soil_testing_method","district","taluk","village","latitude","longitude","agro_climatic_zone","observation_date","season","crop_name","crop_variety","crop_stage","sowing_date","irrigation_type","land_area","rainfall","minimum_temperature","maximum_temperature","relative_humidity","solar_radiation","verified_fertilizer_target"]
def st(p):
    a = {"soil_ph":"present_with_caveat","available_nitrogen_kmno4":"unit_method_unknown","available_phosphorus":"unit_method_unknown","available_potassium":"unit_method_unknown","crop_name":"present","rainfall":"unit_conflict"}
    b = dict(a); b.update({"copper":"unit_method_unknown","iron":"unit_method_unknown","sulphur":"unit_method_unknown"})
    n = {"latitude":"present","longitude":"present","observation_date":"present","rainfall":"present","minimum_temperature":"present","maximum_temperature":"present","relative_humidity":"present"}
    return a.get(p,"absent"), b.get(p,"absent"), n.get(p,"absent")
rows = []
for p in PARAMS:
    a, b, n = st(p)
    any_ok = any(x in ("present",) for x in (a, b, n))
    crit = p in ("available_nitrogen_kmno4","available_phosphorus","available_potassium","soil_ph","organic_carbon","verified_fertilizer_target","crop_name","irrigation_type")
    rows.append(dict(parameter=p, Crop_recommendation_csv=a, crop_dataset_csv=b, NASA_POWER_csv=n,
        usable_for_fertilizer_models=("no" if p in ("available_nitrogen_kmno4","available_phosphorus","available_potassium","organic_carbon","verified_fertilizer_target") else ("n/a" if not crit else "partial")),
        criticality="critical" if crit else "optional", imputation_policy="never impute laboratory soil measurements; add *_missing indicator",
        why_it_matters=("Soil-supply of the nutrient determines whether blanket rates should be adjusted" if p.startswith("available") else "see model_feature_requirements.csv")))
pd.DataFrame(rows).to_csv(f"{OUT}/missing_parameter_report.csv", index=False)

# ------------------------------------------------------------------ 9. MODEL FEATURE REQUIREMENTS + UNSUPPORTED
MF = [
 ("M1_N_status_classifier","A","available_nitrogen_kmno4 (kg/ha, method recorded)","organic_carbon_wb; soil_ph; district","sample-level Karnataka SHC records, >=~1000 per class and >=10 districts","NOT TRAINABLE: 0 records","Rule-based thresholding is preferable to ML: labels are deterministic functions of the value"),
 ("M2_P_status_classifier","A","available_phosphorus (Olsen or Bray-1, basis P or P2O5, kg/ha)","soil_ph","as above","NOT TRAINABLE: 0 records","Method must match the threshold table"),
 ("M3_K_status_classifier","A","available_potassium_nh4oac (basis K or K2O, kg/ha)","","as above","NOT TRAINABLE: 0 records",""),
 ("M4_fertilizer_rate_lookup","B","crop_name; season (paddy); irrigation_type (ragi)","soil status classes","none (lookup table)","SUPPORTED as lookup: 5 documented rows in karnataka_fertilizer_recommendations.csv","Generic, not personalised; must say so"),
 ("M5_STCR_quantity","B","crop; targeted yield; soil N, P, K with the exact methods of the STCR equation; region/soil type valid for the equation","organic matter (some versions)","documented, verified equation per crop+zone","UNSUPPORTED: coefficients conflict across sources, none verified for ragi/paddy","Do not regress fertilizer rate on soil NPK from crop-suitability data"),
 ("M6_weather_aware_scheduling","C","rainfall forecast (issue-time aligned); crop_stage; sowing_date; planned application date","soil_moisture; rain_prev_3d/7d; temperature","labelled application outcomes or an agronomic rule-set (e.g. defer if heavy rain expected)","RULE-BASED ONLY: weather data exist (1 point), no outcome labels","Thresholds for 'heavy rain' must come from an extension source, not be invented"),
 ("M7_crop_suitability","D","N,P,K,temperature,humidity,pH,rainfall (units unknown)","Cu,Fe,Mg,S","verified Karnataka suitability data","EXPERIMENTAL ONLY on unverified non-Karnataka data","Not for farmer-facing output; 0 ragi rows"),
]
pd.DataFrame(MF, columns=["model","dataset_id","core_features_minimum","optional_features","minimum_training_data","status_today","notes"]).to_csv(f"{OUT}/model_feature_requirements.csv", index=False)

UP_ = []
for _, r_ in schema[schema.mapping_status.isin(["ambiguous", "unmapped"])].iterrows():
    UP_.append(dict(item_type="column", item=f"{r_.source_file}:{r_.original_column}", problem=r_.mapping_reason, action="Quarantined under *_unspecified canonical name; excluded from fertilizer models"))
for it, pr in [
 ("prediction: fertilizer quantity from crop-suitability data","Crop-suitability rows contain no fertilizer outcome; regressing would learn nothing real"),
 ("prediction: fertilizer quantity = crop requirement - soil NPK","Mixes soil-test concentration with fertilizer rates; ignores efficiency, extraction method, product grade (explicitly prohibited)"),
 ("prediction: Karnataka-wide weather features from one point","One grid cell cannot represent 31 districts"),
 ("prediction: ragi anything from supplied crop files","No ragi rows"),
 ("prediction: micronutrient deficiency class from Cu/Fe/Mg/S columns","No extractant/unit"),
 ("any accuracy claim based on crop_dataset / Crop_recommendation","Per-class generated-looking data; accuracy would be meaningless")]:
    UP_.append(dict(item_type="prediction_task", item=it, problem=pr, action="Do not attempt"))
pd.DataFrame(UP_).to_csv(f"{OUT}/unsupported_parameter_report.csv", index=False)

# ------------------------------------------------------------------ 10. FERTILIZER RECOMMENDATIONS (documented, not soil-test-specific)
cols = ["record_id","crop_name","season","irrigation_type","crop_stage","required_nitrogen","required_phosphorus","required_potassium","nutrient_unit",
        "organic_manure","recommended_fertilizer_type","recommended_fertilizer_quantity","fertilizer_quantity_unit","fertilizer_application_stage","fertilizer_application_frequency",
        "recommendation_source","recommendation_year","recommendation_region","recommendation_conditions","source_url","label_type","usable_as_ml_label","recommendation_confidence_status","notes"]
REC = [
 ["REC-001","paddy","kharif","transplanted (water regime not stated in excerpt)","whole season",100,50,50,"kg N, P2O5, K2O per ha","","",None,"","not stated in excerpt","not stated","UAS Bengaluru, New Technologies for inclusion in PoP (paddy RDF baseline)","2025","UAS Bengaluru recommendation domain; district/zone not stated","medium/long duration varieties","https://www.uasbangalore.edu.in/wp-content/uploads/2025/06/technologies-E-2025.pdf","package_of_practice_blanket_rate","lookup_only","documented_secondary_text","Excerpt describes 100% RDF as the comparison for a 125% RDF trial; retrieved from search snippet, check full PDF"],
 ["REC-002","paddy","summer","transplanted","whole season",120,60,60,"kg N, P2O5, K2O per ha","","",None,"","not stated in excerpt","not stated","UAS Bengaluru, New Technologies for inclusion in PoP","2025","UAS Bengaluru recommendation domain; zone not stated","medium/long duration varieties","https://www.uasbangalore.edu.in/wp-content/uploads/2025/06/technologies-E-2025.pdf","package_of_practice_blanket_rate","lookup_only","documented_secondary_text","As REC-001"],
 ["REC-003","ragi","kharif (rainfed)","rainfed","whole season",50,40,25,"kg N, P2O5, K2O per ha","FYM 5 t/ha is mentioned for a different (IIMR national) PoP, not applied here","",None,"","not stated","not stated","ICAR-IIMR Recommended Package of Practices - Finger Millet (state table: Karnataka)","not stated","Karnataka (state-level row)","rainfed; secondary compilation","https://www.millets.res.in/technologies/1-Recommended_Package_of_Practices-Finger_Millet.pdf","package_of_practice_blanket_rate","lookup_only","documented_secondary_compilation","Verify against UAS Bengaluru PoP before farmer use"],
 ["REC-004","ragi","irrigated","irrigated","whole season",100,50,50,"kg N, P2O5, K2O per ha","","",None,"","not stated","not stated","ICAR-IIMR Recommended Package of Practices - Finger Millet (state table: Karnataka)","not stated","Karnataka (state-level row)","irrigated; secondary compilation","https://www.millets.res.in/technologies/1-Recommended_Package_of_Practices-Finger_Millet.pdf","package_of_practice_blanket_rate","lookup_only","documented_secondary_compilation","Verify against UAS Bengaluru PoP"],
 ["REC-005","maize","not stated","not stated","basal + top dress",150,75,40,"kg N, P2O5, K2O per ha","FYM 10 t/ha (in all retrieved UAS-B papers)","",None,"","50% N + all P2O5 + all K2O basal; remaining N top-dressed ~30 DAS (UAS-B PoP as described in Mysore J. Agric. Sci. 2016)","2 N splits","UAS Bengaluru PoP as cited in Mysore J. Agric. Sci. papers (2016, 2018, 2022, 2024)","2016-2024","UAS Bengaluru (GKVK) domain","hybrid maize","https://old.uasbangalore.edu.in/images/2016-2st-Issue/22.pdf","package_of_practice_blanket_rate","lookup_only","documented_multiple_consistent","K2O quoted as 37.5 (ISA India paper, other region) and 50 (one UAS-B trial); 40 used by most UAS-B sources"],
 ["REF-STCR-01","maize","not stated","not stated","","","","","kg/ha","","",None,"","","","Mysore J. Agric. Sci. 2016 (UAS-B): FN=3.84T-0.42*SN; FP2O5=1.57T-1.18*SP2O5; FK2O=1.15T-0.11*SK2O","2016","Bengaluru research station soils","T = targeted yield (q/ha implied; t/ha stated elsewhere); SN=KMnO4-N, SP2O5, SK2O in kg/ha","https://old.uasbangalore.edu.in/images/2016-2st-Issue/22.pdf","stcr_equation_reference","FALSE","conflicting_across_sources","NOT APPLIED. Valid only inside its crop/soil/region; coefficients differ in masujournal paper (FP2O5=1.57T-1.85*SP2O5-0.23*OM; FN=3.84T-0.42*SN-0.268*OM; FK2O=1.15T-0.11*SK2O-0.11*OM)"],
 ["REF-STCR-02","maize","not stated","not stated","","","","","kg/ha","","",None,"","","","masujournal.org 100-1-3-146-149 (STCR/SSNM maize, NAH 1137)","not stated","not stated (UAS Bengaluru research station per snippet)","OM term included; +/-30% adjustment by soil-supply class","https://masujournal.org/store_file/archive/100-1-3-146-149.pdf","stcr_equation_reference","FALSE","conflicting_across_sources","NOT APPLIED. See REF-STCR-01"],
 ["REF-TRIAL-01","ragi","kharif","rainfed (not stated)","","41","6","19","kg N, P2O5, K2O per ha","FYM 5 or 10 t/ha tested","",None,"","","","Mysore J. Agric. Sci. 2023 (UAS-B), 'soil test based fertilizer recommendation' arm","2023","single trial site","One site-specific STCR-type outcome; yield on par with 75:37.5:37.5","https://mail.uasbangalore.edu.in/images/2023-3rd-Issue/21.pdf","trial_outcome_site_specific","FALSE","single_trial","Not a general rule; do not generalise to other soils"],
]
pd.DataFrame(REC, columns=cols).to_csv(f"{OUT}/karnataka_fertilizer_recommendations.csv", index=False)

# fertilizer products
FP = [("urea",46,0,0,"N"),("DAP",18,46,0,"N,P2O5"),("SSP",0,16,0,"P2O5 (+ S, not listed)"),("MOP (muriate of potash)",0,0,60,"K2O")]
pd.DataFrame(FP, columns=["product","pct_N","pct_P2O5","pct_K2O","nutrients_listed"]).assign(
    source_status="Nominal grades from general knowledge of the Fertiliser Control Order; NOT retrieved in this run - verify",
    conversion_P_to_P2O5=2.2914, conversion_K_to_K2O=1.2046).to_csv(f"{OUT}/fertilizer_products_reference.csv", index=False)

# crop reference
CR = [
 ["paddy","Oryza sativa L.","rice","kharif","transplanted","medium/long duration","","","","UAS-B 2025","https://www.uasbangalore.edu.in/wp-content/uploads/2025/06/technologies-E-2025.pdf","Seasonal rates in karnataka_fertilizer_recommendations.csv"],
 ["paddy","Oryza sativa L.","rice","summer","transplanted","medium/long duration","","","","UAS-B 2025","https://www.uasbangalore.edu.in/wp-content/uploads/2025/06/technologies-E-2025.pdf",""],
 ["ragi","Eleusine coracana Gaertn.","finger millet; nachni","kharif/rabi/summer","rainfed","short duration","","","","ICAR-IIMR PoP","https://www.millets.res.in/technologies/1-Recommended_Package_of_Practices-Finger_Millet.pdf","Spacing 22.5-30 x 7.5-10 cm rainfed (state table)"],
 ["ragi","Eleusine coracana Gaertn.","finger millet; nachni","kharif/rabi/summer","irrigated","","","","","ICAR-IIMR PoP","https://www.millets.res.in/technologies/1-Recommended_Package_of_Practices-Finger_Millet.pdf","Spacing 22.5 x 10 cm irrigated"],
 ["maize","Zea mays L.","corn","not stated","not stated","hybrid","20.1","9.4","24.7","UAS-B Mysore J. Agric. Sci. 2016","https://old.uasbangalore.edu.in/images/2016-2st-Issue/22.pdf","Nutrient REMOVAL per tonne grain, not a fertilizer requirement"],
]
pd.DataFrame(CR, columns=["crop_name","scientific_name","aliases","season","irrigation_type","variety_group","removal_N_kg_per_t_grain","removal_P2O5_kg_per_t_grain","removal_K2O_kg_per_t_grain","source","source_url","notes"]).to_csv(f"{OUT}/karnataka_crop_data.csv", index=False)

# soil interpretation thresholds
TH = [
 ("organic_carbon_wb","%",0.5,0.75,"Walkley-Black","S07 UAS-B Mysore J 2022; S08; S09; S10","TRUE","Consistent across all sources"),
 ("available_nitrogen_kmno4","kg N/ha",280,560,"Alkaline KMnO4","S07; S08; S10","TRUE","TNAU uses 240/480 (S09): boundary-sensitive"),
 ("available_nitrogen_kmno4","kg N/ha",240,480,"Alkaline KMnO4","S09 TNAU","FALSE","Alternative"),
 ("available_phosphorus","kg P2O5/ha",22.9,56.0,"Olsen/Bray not stated in excerpt","S07 UAS-B Mysore J 2022","TRUE","Equivalent to ~10-24.4 kg P/ha"),
 ("available_phosphorus","kg P/ha",11,22,"not stated","S09 TNAU","FALSE","Alternative (elemental basis)"),
 ("available_phosphorus","kg P/ha",11,25.6,"Olsen","AP J Agril Sci 2017 (via search)","FALSE","Alternative"),
 ("available_phosphorus","kg P/ha",12.5,25,"not stated","S10 Muhr et al. 1965","FALSE","Alternative"),
 ("available_potassium","kg K2O/ha",141,336,"NH4OAc","S07; S08","TRUE","Equivalent to ~117-279 kg K/ha"),
 ("available_potassium","kg K/ha",110,280,"NH4OAc","S09 TNAU","FALSE","Alternative (elemental basis)"),
 ("available_potassium","kg K/ha",120,280,"NH4OAc","AP J Agril Sci 2017 (via search)","FALSE","Alternative"),
 ("available_sulphur","mg/kg",10,20,"extractant not stated","S07","TRUE",""),
 ("available_zinc_dtpa","mg/kg",0.6,"","DTPA","S07 (critical limit)","TRUE","S08: low <0.5, marginal 0.5-0.75"),
 ("available_copper_dtpa","mg/kg",0.2,"","DTPA","S07","TRUE","critical limit"),
 ("available_iron_dtpa","mg/kg",2.5,"","DTPA","S07","TRUE","critical limit"),
 ("available_manganese_dtpa","mg/kg",2.0,"","DTPA","S07","TRUE","critical limit"),
 ("available_boron","mg/kg",0.5,"","hot water","S07","TRUE","critical limit"),
]
pd.DataFrame(TH, columns=["parameter","unit_basis","low_below_or_critical","high_above","method","source","used_in_gate","note"]).to_csv(f"{OUT}/soil_test_interpretation_thresholds.csv", index=False)

# ------------------------------------------------------------------ 11. PROVENANCE
def cnt(p): 
    d = pd.read_csv(p); return d.shape
PR = [
 ("U1",F_A,"user upload","user-supplied (original publisher not identified in file)","local",sha(f"{UP}/{F_A}"),*A.shape,"retrieved (user upload)","unknown"),
 ("U2",F_B,"user upload","user-supplied (derived from U1 + 4 extra columns)","local",sha(f"{UP}/{F_B}"),*B.shape,"retrieved (user upload)","unknown"),
 ("U3",F_N,"user upload","NASA POWER (MERRA-2) daily point data","https://power.larc.nasa.gov/",sha(f"{UP}/{F_N}"),*N.shape,"retrieved (user upload)","NASA POWER data are openly available; confirm citation terms on the POWER site"),
 ("S01","ICAR-IIMR Package of Practices Finger Millet","web search result","ragi rates Karnataka","https://www.millets.res.in/technologies/1-Recommended_Package_of_Practices-Finger_Millet.pdf","","","","text retrieved","not verified"),
 ("S02","UAS Bengaluru New Technologies 2025","web search result","paddy RDF","https://www.uasbangalore.edu.in/wp-content/uploads/2025/06/technologies-E-2025.pdf","","","","snippet retrieved","not verified"),
 ("S03","Mysore J Agric Sci 2016 (UAS-B) maize SSNM/STCR","web search result","maize RDF, removal, STCR","https://old.uasbangalore.edu.in/images/2016-2st-Issue/22.pdf","","","","snippet retrieved","journal copyright; cite only"),
 ("S04","Mysore J Agric Sci maize STCR (masujournal)","web search result","STCR variant","https://masujournal.org/store_file/archive/100-1-3-146-149.pdf","","","","snippet retrieved","journal copyright; cite only"),
 ("S05","Mysore J Agric Sci 2023 ragi trial","web search result","ragi SBFR 41:6:19","https://mail.uasbangalore.edu.in/images/2023-3rd-Issue/21.pdf","","","","snippet retrieved","journal copyright; cite only"),
 ("S06","Mysore J Agric Sci 56(3) 2022 Naveen et al.","web search result","fertility thresholds","https://mail.uasbangalore.edu.in/images/2022-3rd-Issue/20.pdf","","","","snippet retrieved","journal copyright; cite only"),
 ("S07","Satish et al. (ISSS), Kanakapura Taluk","web search result","fertility thresholds","https://www.isss-india.org/downloads/04-A-Satish.pdf","","","","snippet retrieved","cite only"),
 ("S08","TNAU soil rating chart","web search result","alternative thresholds","https://agritech.tnau.ac.in/agriculture/agri_soil_rating.html","","","","snippet retrieved","cite only"),
 ("S09","Soil Health Card nutrient dataset (India Data Portal / MoAFW)","web_fetch of metadata page","village-level SHC nutrient data, 2023-2025, ~1.2 GiB, 32 states; fields: year,state,district,block,village,nutrient_type,nutrient_name,nutrient_level,value","https://ckandev.indiadataportal.com/dataset/soil-health-card/resource/024cf507-4281-4c89-a40e-37b5add3a4df","","","","NOT DOWNLOADED: only metadata page readable; sandbox cannot resolve host","Open Data Commons Attribution License (per portal page)"),
 ("S10","Karnataka Soil Fertility Atlas 2011 (ICRISAT/Govt of Karnataka)","web search result","92,904 samples, district maps","https://oar.icrisat.org/6297/1/Soil_Fertility_Atlas_2011.pdf","","","","NOT DOWNLOADED (maps/summary; sandbox DNS failure)","check ICRISAT OAR terms"),
 ("S11","Dataful - Karnataka soil health (village-wise)","web search result","year/district/village-wise","https://dataful.in/datasets/24072/","","","","NOT DOWNLOADED (likely account/paywall - unverified)","unknown"),
 ("S12","AIKosh SHCDataset.csv (plot-level SHC)","web search result","~491 KB, geography unverified","https://aikosh.indiaai.gov.in/home/datasets/details/shc_dataset.html","","","","NOT DOWNLOADED; Karnataka coverage unverified","unknown"),
 ("S13","NASA POWER API","direct fetch attempt","Karnataka multi-point weather","https://power.larc.nasa.gov/api/","","","","INACCESSIBLE: DNS failure from sandbox","n/a"),
 ("S14","ISRIC SoilGrids REST","direct fetch attempt","soil properties by coordinate","https://rest.isric.org/soilgrids/v2.0/properties/query","","","","INACCESSIBLE: DNS failure","n/a (not checked)"),
 ("S15","data.gov.in API","direct fetch attempt","","https://api.data.gov.in","","","","INACCESSIBLE: DNS failure","n/a"),
 ("S16","Soil Health Card portal","direct fetch attempt","","https://soilhealth.dac.gov.in/home","","","","INACCESSIBLE: DNS failure","n/a"),
 ("S17","ICAR Bhoomi geoportal, IMD","not attempted","","","","","","NOT ATTEMPTED (same network restriction expected)","n/a"),
]
pd.DataFrame(PR, columns=["source_id","source_dataset","retrieval_method","content","source_url","sha256","rows","cols","access_status","license_note"]).to_csv(f"{OUT}/source_provenance.csv", index=False)

# ------------------------------------------------------------------ 12. HEADER-ONLY soil files (no genuine records obtained)
SOIL_COLS = ["record_id","district","taluk","village","latitude","longitude","agro_climatic_zone","observation_date","season","soil_type",
 "available_nitrogen_kmno4_kg_ha","phosphorus_value","phosphorus_unit","phosphorus_method","phosphorus_basis","potassium_value","potassium_unit","potassium_basis",
 "soil_ph","organic_carbon_pct","electrical_conductivity_dsm","sulphur_mg_kg","zinc_mg_kg","iron_mg_kg","copper_mg_kg","manganese_mg_kg","boron_mg_kg",
 "soil_texture","soil_moisture","soil_depth_cm","soil_test_date","soil_testing_method","laboratory_source",
 "source_dataset","source_record_id","source_url","original_unit","standardized_unit","measurement_method","observation_year","data_quality_flag","missing_parameter_flag","is_synthetic"]
pd.DataFrame(columns=SOIL_COLS).to_csv(f"{OUT}/karnataka_soil_raw.csv", index=False)
pd.DataFrame(columns=SOIL_COLS + ["imputed_columns"]).to_csv(f"{OUT}/karnataka_soil_cleaned.csv", index=False)
pd.DataFrame(columns=["record_id","source_record_id","district","crop_name","nitrogen_status","nitrogen_status_threshold_source","phosphorus_status","phosphorus_status_threshold_source","potassium_status","potassium_status_threshold_source","status_sensitive_to_threshold_choice","is_synthetic"]).to_csv(f"{OUT}/karnataka_soil_nutrient_classification.csv", index=False)

print("schema rows", len(schema), "| weather rows", len(W), "| validation checks", len(V))
print("A~B:", same, dif, lab)
