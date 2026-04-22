# Dynamic Map with Tooltips - Implementation Guide

## Overview

I've successfully implemented tooltips for your dynamic map component. Here are the two approaches available:

## 🎯 Current Implementation (Source + Layer approach)

**File**: `index.tsx`

### Features:

- ✅ Click-based tooltips with interactive popups
- ✅ Color-coded data points based on severity
- ✅ Custom styling with CSS
- ✅ Responsive popup positioning
- ✅ Sample GeoJSON data structure

### How it works:

1. **Data Source**: Uses GeoJSON format with sample data points
2. **Interactions**: Click on any circle to show tooltip
3. **Styling**: Dynamic colors based on data properties
4. **Popup Content**: Shows name, description, type, and severity

## 🚀 Alternative Implementation (Markers approach)

**File**: `markers-version.tsx`

### Features:

- ✅ Hover-based tooltips (like your live incident map)
- ✅ Animated hover effects
- ✅ More detailed popup content
- ✅ Auto-hide on mouse leave
- ✅ Better visual feedback

### Advantages:

- More responsive interactions
- Easier to customize individual markers
- Better performance for fewer data points
- More consistent with your live incident map

## 🔄 How to Replace Your Current Data Source

Your current code uses a Mapbox Tileset URL which won't work for tooltips:

```tsx
// ❌ Current - Tileset URL (won't work for tooltips)
data = "https://console.mapbox.com/studio/tilesets/grace-noble.53le2kmj";

// ✅ New - GeoJSON data (works with tooltips)
data = { yourGeoJsonData };
```

### To use your real data:

1. **Option 1: Convert Tileset to GeoJSON**

   ```tsx
   // Fetch your tileset data and convert to GeoJSON
   const fetchMapData = async () => {
     const response = await fetch("your-api-endpoint");
     const data = await response.json();
     return convertToGeoJSON(data);
   };
   ```

2. **Option 2: Use TRPC query (like live incident map)**

   ```tsx
   const mapData = trpc.yourEndpoint.getMapData.useQuery();

   // Then map over data like in markers-version.tsx
   {mapData.data?.map((point) => (
     <Marker key={point.id} ...>
   ```

3. **Option 3: Use static GeoJSON**
   ```tsx
   const data = {
     type: "FeatureCollection",
     features: [
       {
         type: "Feature",
         geometry: {
           type: "Point",
           coordinates: [longitude, latitude],
         },
         properties: {
           name: "Location Name",
           description: "Description",
           // ... other properties for tooltip
         },
       },
     ],
   };
   ```

## 📋 Data Structure Requirements

For tooltips to work, your data needs these properties:

```tsx
interface DataPoint {
  name: string; // Main title in tooltip
  description: string; // Description text
  type: string; // Category/type badge
  severity: "High" | "Medium" | "Low"; // Color coding
  // Add any other properties you want in tooltips
}
```

## 🎨 Customization Options

### Colors and Styling

Edit the `layerStyle` object to change appearance:

```tsx
const layerStyle: CircleLayer = {
  paint: {
    "circle-radius": 10, // Size
    "circle-color": "#007cbf", // Color
    "circle-stroke-width": 2, // Border
  },
};
```

### Popup Content

Modify the popup JSX to show different information:

```tsx
<div className="p-3">
  <h3>{popupInfo.properties.yourProperty}</h3>
  <p>{popupInfo.properties.anotherProperty}</p>
  // Add more content as needed
</div>
```

## 🔧 Switch to Markers Version

To use the hover-based approach (recommended):

1. Replace `index.tsx` content with `markers-version.tsx`
2. Update the `dataPoints` array with your real data
3. Modify the data structure to match your needs

## 🚀 Quick Start

1. The current implementation is ready to use with sample data
2. Click on any colored circle to see the tooltip
3. Replace `sampleData` with your actual data source
4. Customize colors and content as needed

## 💡 Tips

- Use the markers version for better user experience
- Keep tooltip content concise and relevant
- Test on mobile devices for touch interactions
- Consider loading states for dynamic data

Your map now has full tooltip functionality! 🎉
