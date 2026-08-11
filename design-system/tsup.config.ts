import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom'],
  injectStyle: false, // emit dist/index.css as a real stylesheet, not CSS-in-JS
});
