const fs = require('fs');
const path = require('path');


module.exports = function resolveFileName(from, to) {
  const divisor = '/';

  if (!to.includes(divisor)) {
    const packageDefinition = JSON.parse(fs.readFileSync(`node_modules/${to}/package.json`));
    return {
      absolutePath: `./node_modules/${to}/${packageDefinition.main || 'index.js'}`,
      clientAlias: `./node_modules/${to}`,
    };
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
