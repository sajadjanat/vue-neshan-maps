import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({ base: '/vue-neshan-maps/', envPrefix: 'PUBLIC_DEMO_', plugins: [vue()], build: { outDir: 'demo-dist' } })
