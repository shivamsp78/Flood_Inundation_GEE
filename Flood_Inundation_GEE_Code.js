// 1. Define Bhagalpur district geometry (example: from a FeatureCollection or define manually)
// Replace this with actual Bhagalpur district geometry if you have one
var bhagalpur = ee.FeatureCollection('FAO/GAUL/2015/level2')  // Example dataset with districts
                  .filter(ee.Filter.eq('ADM2_NAME', 'Bhagalpur'))
                  .geometry();

// Center the map on Bhagalpur district
Map.centerObject(bhagalpur, 9);

// 2. Define Analysis Period for Before and After Flood Dates
var afterStart = '2025-07-25';
var afterEnd   = '2025-08-10';

var beforeStart  = '2025-03-10';
var beforeEnd    = '2025-03-25';

// 3. Speckle Noise Reduction Function
function reduceSpeckleNoise(image) {
  return image.focalMedian(100, 'square', 'meters')
              .copyProperties(image, image.propertyNames());
}

// 4. Load Sentinel-1 Data (Before Flood)
var s1Before = ee.ImageCollection("COPERNICUS/S1_GRD")
  .filterBounds(bhagalpur)                                        // Spatial filter
  .filterDate(beforeStart, beforeEnd)                             // Before flood dates
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .select('VV')
  .map(reduceSpeckleNoise)
  .min();

// Add 'before flood' SAR image to map
Map.addLayer(s1Before.clip(bhagalpur), {min: -25, max: 0}, 'Before Flood (VV)');

// 5. Load Sentinel-1 Data (After Flood)
var s1After = ee.ImageCollection("COPERNICUS/S1_GRD")
  .filterBounds(bhagalpur)
  .filterDate(afterStart, afterEnd)                               // After flood dates
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .select('VV')
  .map(reduceSpeckleNoise)
  .min();

// Add 'after flood' SAR image to map 
Map.addLayer(s1After.clip(bhagalpur), {min: -25, max: 0}, 'After Flood (VV)');

// 6. Calculate Change Detection (Before - After)
var floodChange = s1Before.subtract(s1After).rename('FloodChange');

// Add change detection result to map
Map.addLayer(floodChange.clip(bhagalpur), {min: 0, max: 10, palette: ['white', 'blue']}, 'Flood Change Magnitude');

// 7. Plot Histogram of Change Values
print(ui.Chart.image.histogram(floodChange, bhagalpur, 30)
      .setOptions({title: 'Flood Change Histogram', hAxis: {title: 'Backscatter Change (dB)'}}));

// 8. Apply Threshold to Detect Flooded Areas
var floodThreshold = floodChange.gt(5);  // Areas with >5 dB change
Map.addLayer(floodThreshold.clip(bhagalpur), {palette: ['blue']}, 'Flood Threshold Mask');

// 9. Mask Flooded Areas
var floodOnlyMask = floodThreshold.updateMask(floodThreshold);
var floodPixelArea = floodOnlyMask.multiply(ee.Image.pixelArea().divide(1e6)); // km²

// 10. Calculate Flooded Area (km²)
var totalFloodArea = floodPixelArea.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: bhagalpur,
  scale: 100,
  maxPixels: 1e13
}).values().get(0);

print('Estimated Flooded Area (km²):', ee.Number(totalFloodArea).round());

// 11. Visualization Settings
var floodVis = {min: 0, max: 1, palette: ['white', 'darkblue']};
Map.addLayer(floodOnlyMask.clip(bhagalpur), floodVis, 'Detected Flooded Areas');


// Export before flood image
Export.image.toDrive({
  image: s1Before.clip(bhagalpur),
  description: 'Bhagalpur_BeforeFlood_VV',
  folder: 'EarthEngineExports',  // Your Drive folder name
  fileNamePrefix: 'Bhagalpur_BeforeFlood_VV',
  region: bhagalpur,
  scale: 10,
  maxPixels: 1e13
});

// Export after flood image
Export.image.toDrive({
  image: s1After.clip(bhagalpur),
  description: 'Bhagalpur_AfterFlood_VV',
  folder: 'EarthEngineExports',
  fileNamePrefix: 'Bhagalpur_AfterFlood_VV',
  region: bhagalpur,
  scale: 10,
  maxPixels: 1e13
});

// Export flood change image (change detection)
Export.image.toDrive({
  image: floodChange.clip(bhagalpur),
  description: 'Bhagalpur_FloodChange',
  folder: 'EarthEngineExports',
  fileNamePrefix: 'Bhagalpur_FloodChange',
  region: bhagalpur,
  scale: 10,
  maxPixels: 1e13
});

// Export flood mask (detected flooded areas)
Export.image.toDrive({
  image: floodOnlyMask.clip(bhagalpur),
  description: 'Bhagalpur_FloodMask',
  folder: 'EarthEngineExports',
  fileNamePrefix: 'Bhagalpur_FloodMask',
  region: bhagalpur,
  scale: 10,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF'
});
