# ROTA Uganda MVP

A Next.js + TypeScript interactive prototype for crop rotation decision support for Ugandan smallholder farmers.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## What works
- Ten selectable farming zones from the project brief.
- Eleven selectable crops from the supplied crop table.
- Farmer priority selection: water, soil, erosion, or income.
- Optional farmer-reported rainfall trend.
- Three ranked rotation suggestions with an explanation and indicative metrics.
- Responsive layout for desktop and mobile.

## Important data integrity notes
- NASA POWER and other external datasets are intentionally not connected in this version.
- The crop water, nitrogen, drought, erosion and suitability values are prototype reference values supplied in the project brief/code. They need validation with Ugandan agronomists and authoritative datasets before field use.
- The Karamoja (300 mm/year) and Lake Masaka (1,200 mm/year) rainfall figures are project-provided context, not verified location-specific measurements in this application.
- “More income” is explicitly a resilience/soil-support proxy because no verified local market prices, input costs or district-level crop returns are included.
- Crop-family rotation penalties are a simplified first-pass heuristic, not a disease-specific rotation plan. Add crop-specific pest, disease, variety, season and soil constraints before deployment.

## Recommended next engineering steps
1. Replace the provisional crop table with verified Uganda-specific crop/soil/season data.
2. Add finer geospatial matching within zones.
3. Add crop-family and crop-specific pest/disease rotation constraints.
4. Add local market prices and input costs before showing profitability estimates.
5. Add source, date, spatial resolution and confidence labels to every data-derived insight.
