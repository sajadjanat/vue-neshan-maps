# Neshan adapter and patched renderer

`neshan-adapter.js` is an adapter-only fork of the public ISC-licensed `@neshan-maps-platform/maplibre-sdk@5.24.4` distribution. Its original source SHA-256 is recorded in the file header. The original bundled MapLibre core was removed entirely. Retained code covers Neshan vector decoding, the `nsh` tile protocol, RTL support and mandatory branding/attribution. Original notices: `licenses/NESHAN-SDK.txt`.

Changes: import MapLibre GL JS 6.14.0; configure a self-contained worker; use structured, redacted resource errors that survive worker serialization. This adaptation is community maintained and must be retested against real Neshan tiles when either upstream changes. It does not change the service API or claim official support.

`maplibre-worker.txt` is generated from the pinned MapLibre dependency by `scripts/build-worker.mjs` on every library build. It is committed for immediate development startup. The patched core and worker are bundled lazily into the published artifact, including CommonJS, so consumers need neither bundler-specific worker imports nor a hard-coded public assets path. The worker uses a blob URL and requires CSP `worker-src blob:`. Original MapLibre notice: `licenses/MAPLIBRE.txt`.

When upgrading: review the engine advisory/version, regenerate the worker, verify root `npm audit`, test protocol errors and source lifecycle, run installed-tarball Vue/Nuxt checks, then inspect a real Neshan map with traffic, POI, Persian labels, clusters, heatmap and custom layers. Do not silently switch back to the official SDK's bundled old renderer.
