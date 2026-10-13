# Changelog

## 2.3.0

- New canonical npm identity `vue-neshan-maps`; historical `vuejs-neshan-map-leaflet` ships the identical compatibility build.
- Preserve Vue APIs, Nuxt module/manual plugin, all exports, CSS and Vazir fonts.
- Update bilingual README, docs, Nuxt example and demo snippets; add migration guides. Repository and demo URLs remain stable.

## 2.2.3

- Updated compatible dependencies, including Vue/server-renderer 3.5.44, DOMPurify 3.4.17 and Vitest 5.0.4. Package name, public APIs, Leaflet/MapLibre and Nuxt module/plugin support are preserved.
- Fixed the Nuxt example critical Git-tooling advisories with a scoped simple-git 4.0.2 override and argv-parser 2.0.1; refreshed its lockfile. The example audit decreased from 15 affected package nodes (2 critical) to 11 high and 0 critical.
- Added installed-consumer checks for the patched Git APIs/version and a full audit guard against new/critical advisories.
- Documented the two remaining unpatched upstream braces/node-forge advisories, consumer override scope and verified compatibility in Persian and English.

## 2.2.2

- Replaced README screenshots with ten real captures of the bilingual online demo: light, dark, clustering, weighted heatmap and 3D. Persian captures use the Persian interface and Vazir; English captures use English controls.
- Added a compact expandable feature gallery and refreshed advanced documentation images.
- Completed the GitHub repository description, demo website and discovery topics. No component API changes.

## 2.2.1

- Fixed a Leaflet v-model feedback loop when requested zoom is fractional or outside the map's limits; verified against the official SDK.
- Published a responsive Persian/English interactive playground on GitHub Pages, with self-hosted Vazir and live Neshan maps.
- Added adjustable clusters and weighted heatmaps, up to 10,000 sample points, cluster leaves/expansion, editable inline GeoJSON and 3D layer controls to the demo.
- Added map styles, draggable markers, shapes, point picking, geographic distance measurement, live diagnostics, localized error simulations and Vue/Nuxt code examples.
- Linked the demo from both READMEs and the npm homepage. Keys remain in page memory; public builds have no embedded account key by default.
- Added bounded GeoJSON editor validation and demo data checks. Existing package component APIs are unchanged.

## 2.2.0

- Added automatic GeoJSON clusters, configurable counts/colors/radius, click expansion and async cluster leaves/zoom methods.
- Added weighted heatmaps with an independent unclustered source; clusters and heatmap can coexist.
- Added declarative native sources/layers, scoped IDs, forward beforeId ordering, layer clicks and style restoration, including 3D extrusion.
- Added structured, redacted resource-error payloads for Neshan key, domain, service, quota, rate, network and decode failures; worker messages preserve numeric details and Retry-After.
- Updated geometry in place through setData, batched overlay watchers, and grouped polylines by dash pattern with feature-driven styles.
- Removed the vulnerable renderer bundled in official SDK 5.24.4. Retained its ISC Neshan adapter and replaced the renderer/worker with MapLibre GL JS 6.14.0. Included third-party licenses and reproducible worker build.
- Preserved Leaflet, Vue 3, Nuxt 4 module/plugin, existing shapes/events and Vazir font. Added bilingual advanced documentation and an interactive 1,000-point playground.
- Verified 51 unit/contract tests, pinned Leaflet SDK tests, installed-package/Nuxt checks and real Neshan map rendering. Quota branches use controlled responses rather than exhausting a real account.

## 2.1.0

- Bundled optional, self-hosted Vazir regular/bold WOFF2 fonts with the original SIL OFL license; added Vue/Nuxt usage instructions and Persian screenshots using Vazir.
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
