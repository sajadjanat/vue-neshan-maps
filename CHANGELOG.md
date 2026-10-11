# Changelog

## 2.0.0

- Rebuilt public API with TypeScript and generated declarations; Vue is a peer dependency.
- Added coordinate/zoom v-models, marker interaction, polylines, circles and GeoJSON.
- Added click picking, custom pin/loading/error slots, geolocation events and exposed map methods.
- Added an installable plugin and `useNeshanMap` composable.
- Added shared lazy SDK loading, timeout/retry, nonce and custom resource URLs.
- Fixed duplicate SDK requests, random container ID collisions, missing unmount cleanup and stale props.
- Added responsive container sizing, ResizeObserver and SSR-safe initialization.
- Text popups/tooltips avoid implicit HTML rendering.
- Added interactive playground, automated tests and CI.
- Switched from UMD to ESM/CommonJS exports. See README migration notes.
- Removed the example's embedded web key. Service keys are rejected by map initialization.
- Upgraded to documented Neshan Leaflet 1.9.4 / SDK 1.0.8; rejected incompatible preloaded globals.
- Changed styles in place using setMapType; preserved consumer layers and marker/popup identity through unrelated updates.
- Ignored obsolete traffic/POI options with warnings, following vendor documentation.
- Added polygons, tile loading/failure events, recovery warnings and independent overlay updates.
- Added official SDK integration tests and persistent marker dragging, distance measurement, radius and layer controls in the playground.
