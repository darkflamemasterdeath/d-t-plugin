import { defineConfig } from 'tsdown'

/** Transpile src/ into lib/ without bundling host packages. */
export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  dts: false,
  clean: true,
  fixedExtension: false,
  deps: {
    neverBundle: true,
  },
})
