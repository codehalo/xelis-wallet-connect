import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { libInjectCss } from 'vite-plugin-lib-inject-css';

export default defineConfig({
  build: {
    lib: {
      // Entry point of your library
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'XelisWalletConnect',
      // Generated file names
      fileName: 'xelis-wallet-connect',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        // Forces the CSS file to be named wallet-ui.css
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'wallet-ui.[ext]'; // Or 'wallet-ui.css'
          }
          return '[name].[ext]';
        },
      },
    },
  },
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
      // rollupTypes: true
    }),
    libInjectCss(),
  ],
  optimizeDeps: {
    exclude: ['@xelis/xswd-connect']
  }
})