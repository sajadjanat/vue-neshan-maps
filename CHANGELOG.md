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
- Default Neshan Leaflet engine remains vendor-hosted 1.4.0; this release updates the Vue wrapper.
