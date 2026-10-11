import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: { entry: 'src/index.ts', name: 'NeshanMapLeaflet', formats: ['es', 'cjs'], fileName: format => `vuejs-neshan-map-leaflet.${format === 'es' ? 'js' : 'cjs'}` },
    rollupOptions: { external: ['vue','@neshan-maps-platform/maplibre-sdk'], output: { exports: 'named' } },
  },
})
