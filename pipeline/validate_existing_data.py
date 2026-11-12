from pathlib import Path
import pandas as pd
import json

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
REPORTS = ROOT / "reports"
REPORTS.mkdir(exist_ok=True)

files = {
    "soil_raw": DATA / "karnataka_soil_raw.csv",
    "soil_cleaned": DATA / "karnataka_soil_cleaned.csv",
    "weather": DATA / "karnataka_weather_data.csv",
    "fertilizer_recommendations": DATA / "karnataka_fertilizer_recommendations.csv",
    "fertilizer_products": DATA / "fertilizer_products_reference.csv",
    "crop_suitability": DATA / "external/crop_suitability_unverified_nonkarnataka.csv",
}

report = {}

for name, path in files.items():
    if not path.exists():
        report[name] = {"status": "MISSING"}
        continue

    df = pd.read_csv(path)
    report[name] = {
        "status": "AVAILABLE",
        "rows": len(df),
        "columns": len(df.columns),
        "missing_cells": int(df.isna().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum()),
    }

    if name in ("soil_raw", "soil_cleaned"):
        report[name]["usable_soil_records"] = len(df)

    if name == "weather":
        report[name]["unique_coordinates"] = int(
            df[["latitude", "longitude"]].drop_duplicates().shape[0]
        )
        report[name]["date_range"] = [
            str(df["observation_date"].min()),
            str(df["observation_date"].max())
        ]

    if name == "fertilizer_recommendations":
        report[name]["lookup_only_records"] = int(
            (df["usable_as_ml_label"] == "lookup_only").sum()
        )

    if name == "crop_suitability":
        report[name]["ml_eligible"] = False
        report[name]["reason"] = (
            "Unverified provenance, non-Karnataka geography, "
            "and crop suitability labels rather than fertilizer labels."
        )

output = REPORTS / "existing_data_validation.json"
output.write_text(json.dumps(report, indent=4))

print(json.dumps(report, indent=4))
print(f"\nReport saved to: {output.relative_to(ROOT)}")
