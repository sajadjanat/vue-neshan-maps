import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
export default defineConfig({plugins:[vue()],test:{environment:'jsdom',include:['tests/neshan-sdk.integration.ts'],testTimeout:10000,hookTimeout:30000,clearMocks:true}})
