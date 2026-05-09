# Dynamic Map Component

Implementation guide for `src/features/maps/components/dynamic-map/`.

## Approaches

Two implementations exist side by side. Choose based on interaction requirements:

### Source + Layer (`index.tsx`)

Uses Mapbox GL sources and layers to render GeoJSON data as circle layers.

- Click-based popups
- Color-coded points by severity via `circle-color` expressions
- Better performance for large datasets (rendered by the GPU, not DOM nodes)

### Markers (`markers-version.tsx`)

Uses individual `<Marker>` React components.

- Hover-based popups (consistent with the live incident map)
- Easier to customise individual markers with React components
- Simpler to animate and style
- Better for smaller datasets

To switch to the markers version, replace the content of `index.tsx` with `markers-version.tsx`.

## Data Source

The component accepts GeoJSON. Do **not** pass a Mapbox Tileset URL — tooltips require direct property access, which tilesets do not expose at runtime.

```tsx
// Pass GeoJSON directly
const data: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: incidents.map((i) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [i.longitude, i.latitude] },
    properties: { name: i.title, description: i.description, severity: i.severity, type: i.type },
  })),
}
```

### Loading from the API

```tsx
const { data: incidents } = trpc.incidents.list.useQuery()
// then map incidents → GeoJSON as above
```

## Required Data Shape

```ts
interface IncidentPoint {
  name: string
  description: string
  type: string
  severity: "High" | "Medium" | "Low"
}
```

## Customising Appearance

Edit `layerStyle` in `index.tsx`:

```tsx
const layerStyle: CircleLayer = {
  id: "incidents",
  type: "circle",
  paint: {
    "circle-radius": 10,
    "circle-color": [
      "match", ["get", "severity"],
      "High", "#ef4444",
      "Medium", "#f97316",
      "Low", "#22c55e",
      "#94a3b8",
    ],
    "circle-stroke-width": 2,
    "circle-stroke-color": "#ffffff",
  },
}
```

## Popup Content

Popup content is JSX rendered on click (Source + Layer) or hover (Markers). Edit the inline JSX in the respective file to show different fields from `feature.properties`.
