# Migrate to vue-neshan-maps

Version 2.3.0 introduces a clearer npm name. The GitHub repository and demo URL stay unchanged. The component API, configuration, events, types, SSR behavior and supported engines are unchanged.

## Existing applications

You can keep using `vuejs-neshan-map-leaflet`. Its 2.3.0 compatibility release ships the same implementation and all historical export paths. Older published versions remain available. No automatic migration or removal occurs.

## Switch to the new name

```bash
npm uninstall vuejs-neshan-map-leaflet
npm install vue-neshan-maps@^2.3.0
```

Replace the package prefix in imports and configuration:

| Previous | New |
| --- | --- |
| `vuejs-neshan-map-leaflet` | `vue-neshan-maps` |
| `vuejs-neshan-map-leaflet/style.css` | `vue-neshan-maps/style.css` |
| `vuejs-neshan-map-leaflet/dist/style.css` | `vue-neshan-maps/dist/style.css` |
| `vuejs-neshan-map-leaflet/fonts/vazir.css` | `vue-neshan-maps/fonts/vazir.css` |
| `vuejs-neshan-map-leaflet/nuxt` | `vue-neshan-maps/nuxt` |
| `vuejs-neshan-map-leaflet/nuxt/plugin` | `vue-neshan-maps/nuxt/plugin` |

Keep `NeshanMapLibre`, `NeshanMapLeaflet`, composables, props and events unchanged. In Nuxt, keep `neshanMap` and `runtimeConfig.public.neshanWebKey` unchanged. Use either the module or manual plugin as before; do not register both package identities. Clear `.nuxt` and restart the Nuxt development server after switching, then run your build and tests.

The compatibility package contains its own identical build rather than a dependency on the new name. Install only one identity per app to avoid duplicate renderer bundles and registrations. Internal build filenames retain their historical names; public imports use the export paths above.

The new npm package has independent version history and download statistics. Historical downloads and releases remain on the old package. Deprecation is not required to migrate and no versions are unpublished.

[Nuxt 4 setup](NUXT.md) · [فارسی](MIGRATION.fa.md)
