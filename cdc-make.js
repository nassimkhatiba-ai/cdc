#!/usr/bin/env node
// cdc-make — thin wrapper kept for back-compat with PAPER.md / README examples.
// Prefer:  cdc make <spec> --name <name>
const { compileOpenAPI } = require('./lib/compile-openapi');

const argv = process.argv.slice(2);
const src = argv.find((a) => !a.startsWith('--'));
const flag = (n, d) => {
  const i = argv.indexOf('--' + n);
  return i === -1 ? d : argv[i + 1];
};
const name = flag('name');
const outRoot = flag('out', 'cdc');
const baseUrl = flag('base-url');

if (!src || !name) {
  console.error('usage: node cdc-make.js <spec-url-or-path> --name <name> [--out cdc] [--base-url URL]');
  console.error('   or: cdc make <spec-url-or-path> --name <name>');
  process.exit(1);
}

compileOpenAPI({ src, name, outRoot, baseUrl })
  .then(({ stats }) => {
    console.log(JSON.stringify(stats));
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
