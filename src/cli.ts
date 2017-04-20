#!/usr/bin/env node
import 'source-map-support/register'
import * as path from 'path';
import JSC from './jsc.js';
import * as process from 'process';


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
runner.createBundleFrom(entryPoint);
