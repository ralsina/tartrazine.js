import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

// Production build
const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/browser-exports.js',
  output: [
    // ESM module for modern bundlers
    {
      file: 'dist/tartrazine.js',
      format: 'es',
      sourcemap: true,
      exports: 'named'
    },
    // UMD for Node.js/CommonJS
    {
      file: 'dist/tartrazine.umd.cjs',
      format: 'umd',
      name: 'Tartrazine',
      sourcemap: true,
      exports: 'named'
    },
    // IIFE for browser script tags
    {
      file: 'dist/tartrazine.iife.js',
      format: 'iife',
      name: 'Tartrazine',
      sourcemap: true,
      exports: 'named'
    }
  ],
  plugins: [
    // Replace environment variables
    replace({
      'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
      preventAssignment: true
    }),
    // Resolve node_modules (for oniguruma-to-es, fast-xml-parser)
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    // Convert CommonJS to ESM
    commonjs()
  ]
};
