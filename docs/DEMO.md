# Interactive demo

[English demo](https://sajadjanat.github.io/vuejs-neshan-map-leaflet/?lang=en) · [فارسی](DEMO.fa.md) · [API](API.md)

The demo runs the actual package components against Neshan maps. Switch languages at any time; the map and current settings stay in place. Persian controls and HTML popups use the bundled Vazir font. Vector map labels use the Neshan style’s own glyphs.

## Connect

1. Create a **web key** in the [Neshan dashboard](https://platform.neshan.org/panel).
2. Allow `sajadjanat.github.io` in the key’s domain settings. Enable the MapLibre map, POI and traffic services you want to try.
3. Enter the key in **Connect to Neshan** and press **Load map**.

The key stays in memory for this page session. It is not saved to browser storage, added to the URL, included in exported code or sent to a demo backend. The Neshan connector sends it to Neshan to authorize map requests. Reloading the page clears a manually entered key. A service key cannot load the browser map.

## What to try

| Section | Try it |
| --- | --- |
| Map | Choose MapLibre or Leaflet; switch styles; toggle live traffic/POI; drag markers and open popups; pick a point; measure geographic segments; change zoom; fit places. |
| Data | Choose 100–10,000 deterministic sample points; tune cluster radius and auto expansion; click a cluster, fetch its leaves or expand it; combine clusters and weighted heatmaps; adjust heat radius/intensity/opacity; replace data and download GeoJSON. |
| Layers | Toggle the dashed connection, meter-radius circle and polygon; change 3D height/opacity; click native custom layers; edit and apply inline GeoJSON. |
| Code & errors | Copy a Vue example using the current map/data settings or a Nuxt 4 starter; simulate key, quota, rate, domain and service failures; inspect actual map failures. |
| Live map panel | See rendered traffic/POI/cluster feature counts, native source/layer counts and recent interaction events. Counts describe the current viewport, not the entire data set. |

Four scenario buttons quickly switch between places, clusters, density and 3D. All controls remain adjustable afterwards. Focus mode enlarges the map; press Escape to exit. On mobile, the map appears above the control panel.

The GeoJSON editor accepts inline Feature/FeatureCollection data up to 1 MB and 10,000 features. It does not fetch arbitrary URLs or execute feature text. GeoJSON coordinates are longitude, latitude; component coordinates below the map are latitude, longitude.

The location button asks the browser for permission only when clicked. Distance measurement joins geographic segments; it does not calculate a road route. Error simulations are explicitly labelled and do not send requests or consume quota. Actual key/quota errors depend on the Neshan account and network.

Leaflet retains markers and basic geometry, but live layers and advanced analysis controls require MapLibre. When testing style restoration, enable clusters, heatmap and a custom/3D layer, then change the map style in the Map tab.

## Run and deploy

```bash
npm ci
npm run dev
npm run build:demo
```

The `Deploy interactive demo` workflow builds `demo-dist` on master and publishes it through GitHub Pages. Relative assets support the repository subdirectory. Public CI builds do not embed an account key. For local development only, use ignored `.env.local` with `VITE_NESHAN_WEB_KEY`; do not commit credentials. The npm homepage and both READMEs link to the same deployed application.
