import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: { entry: 'src/index.ts', name: 'NeshanMapLeaflet', cssFileName: 'vuejs-neshan-map-leaflet', formats: ['es', 'cjs'], fileName: format => `vuejs-neshan-map-leaflet.${format === 'es' ? 'js' : 'cjs'}` },
    rollupOptions: { external: ['vue'], output: { exports: 'named' } },
  },
})
