import { mkdirSync } from 'node:fs';
import { build } from 'esbuild';

async function run() {
  mkdirSync('public/vendor', { recursive: true });

  await build({
    entryPoints: ['../assumed/dist/assume.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    sourcemap: false,
    platform: 'browser',
    outfile: 'public/vendor/assumed.min.js',
  });

  await build({
    entryPoints: ['../primitiveprimer/dist/primitives/index.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    sourcemap: false,
    platform: 'browser',
    outfile: 'public/vendor/primitiveprimer.min.js',
  });

  console.log('Vendor bundles built to public/vendor');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
