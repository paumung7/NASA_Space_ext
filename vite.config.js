import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: './',
  server: {
    host: true,
    // Allow access through the Codespaces forwarded domain
    allowedHosts: ['.app.github.dev'],
  },
  build: {
    rollupOptions: {
      plugins: [{
        name: 'space-explorer-service-worker',
        generateBundle(_options, bundle) {
          const assets = Object.keys(bundle).filter((file) => /\.(?:html|js|css)$/.test(file));
          const shell = ['./', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', ...assets.map((file) => `./${file}`)];
          const source = readFileSync(new URL('./src/service-worker.js', import.meta.url), 'utf8');
          const proxy = loadEnv(mode, process.cwd(), 'VITE_').VITE_APOD_PROXY_URL || '';
          const hash = createHash('sha256').update(source).update(JSON.stringify(shell)).update(proxy);
          for (const file of ['manifest.json', 'icons/icon-192.png', 'icons/icon-512.png']) hash.update(readFileSync(new URL(`./public/${file}`, import.meta.url)));
          for (const asset of Object.values(bundle)) hash.update(asset.type === 'asset' ? asset.source : asset.code);
          const config = `self.__CACHE_VERSION__=${JSON.stringify(hash.digest('hex').slice(0, 16))};self.__PRECACHE_MANIFEST__=${JSON.stringify(shell)}.map(url=>new URL(url,self.registration.scope).href);self.__APOD_PROXY_URL__=${JSON.stringify(proxy)};\n`;
          this.emitFile({ type: 'asset', fileName: 'service-worker.js', source: config + source });
        },
      }],
    },
  },
}));