#!/usr/bin/env node
const path = require('path');
const process = require('process');
const { JSC } = require('./jsc.js');


const argv = process.argv;
let entryPoint = argv[argv.length - 1];
const cwd = process.cwd();

if (!path.isAbsolute(entryPoint)) {
  entryPoint = path.join(cwd, entryPoint);
}

if (!entryPoint.includes(cwd)) {
  throw new Error('Entrypoint must be inside current working directory');
}


const runner = new JSC();
runner.createBundleFrom(`.${entryPoint.substring(cwd.length)}`);
