import { defineConfig } from 'vite';

// Some package managers nest peer dependencies. Resolve these packages to the
// application's React instance so hooks always use the same renderer.
export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});
