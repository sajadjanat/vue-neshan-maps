# Changelog

## 2.1.0

- Added an optional Nuxt 4 module at `vuejs-neshan-map-leaflet/nuxt`: automatic component registration, composable/style auto-imports, CSS and public web-key config.
- Added `vuejs-neshan-map-leaflet/nuxt/plugin` for manual Nuxt plugin registration; existing Vue plugin and both map engines remain available.
- Added a runnable Nuxt 4 application and installed-tarball tests for module/plugin builds, declarations and SSR.
- Redesigned the English and Persian README, added task-based feature and Nuxt guides, and replaced screenshots with real maps in separate English and Persian interfaces.
- Nuxt remains an optional peer dependency. Existing Vue integrations do not need to install Nuxt or change their map code.
- The existing vendor SDK dependency advisory remains; see the documented limitations.

## 2.0.1

- Added full English and Persian guides with real MapLibre/Leaflet screenshots and language navigation.
- Expanded API documentation, engine comparison, coordinate conventions, troubleshooting, migration and vendor limitations.
- Added complete Vue examples for dragging, styles, native access, GeoJSON, slots, diagnostics, geolocation and Nuxt setup.
- Included both guides, API reference, examples and images in the npm package.
- Added a manually triggered GitHub Actions workflow for npm trusted publishing, restricted to release tags contained in master.
- No map runtime behavior changed from 2.0.0.

## 2.0.0

- Added an SSR-safe, lazy `NeshanMapLibre` component using official SDK 5.24.4; retained the Leaflet component and public API.
- Added real traffic and POI style toggles, traffic refresh, diagnostics, native MapLibre access and `useNeshanMapLibre`.
- Ported coordinate/zoom models, stable draggable markers/popups, line/polygon/circle/GeoJSON overlays, picking, fitting, resize, slots and geolocation handling to MapLibre.
- Restored custom layers and live-layer visibility after style changes; prevented conflicting concurrent vendor API keys.
- Sanitized style/control attributions as a mitigation for the current vendor dependency advisory; see README security limitations.
- Added a dual-engine playground and MapLibre regression tests.

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
