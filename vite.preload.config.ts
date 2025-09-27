import { defineConfig } from 'vite';
import native from 'vite-plugin-native'

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['registry-js'],
    },
  },
  plugins: [
    native({
      // Enable Webpack
      webpack: {},
    })
  ]
});
