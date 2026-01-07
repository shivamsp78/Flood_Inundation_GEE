# Sentinel-1 Flood Mapping

## Overview
This repository contains a Google Earth Engine (GEE) JavaScript code for detecting and mapping flood-affected areas in Bhagalpur district, Bihar, India, using Sentinel-1 SAR (VV polarization) data.

## Data Used
- Sentinel-1 GRD (VV polarization, IW mode)
- FAO GAUL 2015 administrative boundaries

## Methodology
1. Selection of Bhagalpur district boundary
2. Speckle noise reduction using focal median filtering
3. Generation of pre-flood and post-flood SAR composites
4. Change detection (Before – After)
5. Threshold-based flood extraction (>5 dB)
6. Flood area estimation in km²
7. Export of raster outputs to Google Drive

## Outputs
- Before Flood SAR Image (VV)
- After Flood SAR Image (VV)
- Flood Change Magnitude Map
- Binary Flood Mask
- Estimated Flooded Area (km²)

## How to Run
1. Open Google Earth Engine Code Editor
2. Paste the `.js` script
3. Click **Run**
4. Exported files will appear in Google Drive

## Author
Shivam Priyadarshi  
Department of Geography
