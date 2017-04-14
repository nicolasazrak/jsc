import * as fs from 'fs';
import * as path from 'path';


export default function resolveFileName(from, to) {
  const divisor = '/';

  if (!to.includes(divisor)) {
    try {
      const packageDefinition = JSON.parse(fs.readFileSync(`node_modules/${to}/package.json`).toString());
      return {
        absolutePath: `./node_modules/${to}/${packageDefinition.main || 'index.js'}`,
        clientAlias: `./node_modules/${to}`,
      };
    } catch (e) {
      if (e.code === 'ENOENT') {
        throw new Error(`Missing module ${to}. You might need to add it to your package.json`);
      }
      throw e;
    }
  }

  if (to[to.length - 1] === divisor) {
    to = `${to}index.js`; // eslint-disable-line
  }

  if (path.extname(to) === '') {
    to = `${to}.js`; // eslint-disable-line
  }

  if (to[0] !== '.') {
    return {
      absolutePath: `./node_modules/${to}`,
      clientAlias: `./node_modules/${to}`,
    };
  }

  return {
    absolutePath: `./${path.join(path.dirname(from), to)}`,
    clientAlias: `./${path.join(path.dirname(from), to)}`,
  };
};